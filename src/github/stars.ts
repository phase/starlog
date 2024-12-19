import { GraphQLClient } from "graphql-request";

export interface StarredRepository {
  starredAt: string;
  node: {
    name: string;
    owner: {
      login: string;
    };
    description: string | null;
    url: string;
    primaryLanguage: {
      name: string | null;
    } | null;
  };
}

interface StarredRepositoriesResponse {
  user: {
    starredRepositories: {
      totalCount: number;
      pageInfo: {
        endCursor: string | null;
        hasNextPage: boolean;
      };
      edges: StarredRepository[];
    };
  };
}

const STARRED_REPOS_QUERY = `
  query GetStarredRepositories($username: String!, $cursor: String) {
    user(login: $username) {
      starredRepositories(first: 100, after: $cursor, orderBy: { field: STARRED_AT, direction: DESC }) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          starredAt
          node {
            name
            owner {
              login
            }
            description
            url
            primaryLanguage {
              name
            }
          }
        }
      }
    }
  }
`;

export async function fetchStarredRepositoriesStream(
  consumer: (data: StarredRepository[]) => void,
  client: GraphQLClient,
  username: string,
  maxIterations?: number,
) {
  let hasNextPage = true;
  let cursor: string | null = null;
  let iterations = 0;

  try {
    while (hasNextPage && (!maxIterations || iterations < maxIterations)) {
      iterations++;
      console.log(`Fetching page ${iterations}...`);

      const data: StarredRepositoriesResponse =
        await client.request<StarredRepositoriesResponse>(STARRED_REPOS_QUERY, {
          username,
          cursor,
        });

      const { edges, pageInfo } = data.user.starredRepositories;

      console.log(`Got ${edges.length} repositories on this page`);

      // Add current page's repositories to total list
      consumer(edges);

      // Update pagination info
      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
    }

    const earlyStop = hasNextPage ? " (stopped early)" : "";
    console.log(`\nCompleted in ${iterations} iterations${earlyStop}`);
  } catch (error) {
    console.error("Error fetching starred repositories:", error);
    throw error;
  }
}

export default async function fetchStarredRepositories(
  client: GraphQLClient,
  username: string,
  maxIterations?: number,
): Promise<StarredRepository[]> {
  let hasNextPage = true;
  let cursor: string | null = null;
  const allStarredRepos: StarredRepository[] = [];
  let iterations = 0;

  try {
    while (hasNextPage && (!maxIterations || iterations < maxIterations)) {
      iterations++;
      console.log(`Fetching page ${iterations}...`);

      let data: StarredRepositoriesResponse | null = null;

      // fetch stars, and retry if it failes
      let retries = 5;
      while (data == null && retries > 0) {
        try {
          data = await client.request<StarredRepositoriesResponse>(
            STARRED_REPOS_QUERY,
            {
              username,
              cursor,
            },
          );
        } catch (error) {
          console.error("Error fetching starred repositories:", error);
          console.log(error);
          retries--;
        }
      }

      //@ts-ignore this is weird?
      const { edges, pageInfo } = data!.user.starredRepositories;

      console.log(`Got ${edges.length} repositories on this page`);

      // Add current page's repositories to total list
      allStarredRepos.push(...edges);

      // Update pagination info
      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
    }

    const earlyStop = hasNextPage ? " (stopped early)" : "";
    console.log(`\nCompleted in ${iterations} iterations${earlyStop}`);
    return allStarredRepos;
  } catch (error) {
    console.error("Error fetching starred repositories:", error);
    throw error;
  }
}

export async function fetchStars(
  consumer: (data: StarredRepository[]) => void,
  username: string,
  token?: string,
) {
  // first try fetching from localStorage username
  const cachedRepos = localStorage.getItem(username);
  if (cachedRepos) {
    const repos = JSON.parse(cachedRepos);
    if (repos && repos != null && repos != "null" && repos != '"null"') {
      consumer(repos);
    } else {
      console.log(`removing invalid cache for ${username}: ${repos}`);
      localStorage.removeItem(username);
    }
  } else {
    // then try to fetch from cached JSON
    const response = await fetch(`/cached/${username}.json`);

    if (response.ok) {
      const repos = await response.json();

      // break repos into chunks and append them
      // with a delay between so the dom doesn't get overloaded
      const chunkSize = 1600;
      for (let i = 0; i < repos.length; i += chunkSize) {
        const chunk = repos.slice(i, i + chunkSize);
        consumer(chunk);
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    } else {
      if (token && token !== "" && token !== "token") {
        // If no cached data, fetch from GitHub API
        const client = new GraphQLClient("https://api.github.com/graphql", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        fetchStarredRepositoriesStream(consumer, client, username);
      }
    }
  }
}
