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

      const data: StarredRepositoriesResponse =
        await client.request<StarredRepositoriesResponse>(STARRED_REPOS_QUERY, {
          username,
          cursor,
        });

      const { edges, pageInfo } = data.user.starredRepositories;

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
