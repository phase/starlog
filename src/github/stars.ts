import { GraphQLClient } from "graphql-request";

/// is this being run with `bun run`?
const isMain = typeof Bun !== "undefined" && import.meta.path === Bun.main;

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

// Example usage
async function main() {
  const username = "phase";
  console.log("Starting...");
  const client = new GraphQLClient("https://api.github.com/graphql", {
    headers: {
      Authorization: `Bearer GAAA`,
    },
  });

  try {
    // Only fetch first 2 pages
    const starredRepos = await fetchStarredRepositories(client, username);

    console.log(`Total starred repositories: ${starredRepos.length}`);

    // Optional: Log some details about the first few repositories
    starredRepos.slice(0, 5).forEach((repo) => {
      console.log(`
        Name: ${repo.node.name}
        Owner: ${repo.node.owner.login}
        Starred At: ${repo.starredAt}
      `);
    });

    // Write full results to file
    const fileName = `public/cached/${username}.json`;
    const fs = require("fs");
    fs.writeFileSync(fileName, JSON.stringify(starredRepos, null, 2));
    console.log(`\nWrote full results to ${fileName}`);
  } catch (error) {
    console.error("Failed to fetch starred repositories", error);
  }
}

if (isMain) {
  await main();
} else {
  // this file is being imported from another script
}
