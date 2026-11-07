import { GraphQLClient } from "graphql-request";

const FOLLOWING_QUERY = `
  query GetFollowedUsers($username: String!, $cursor: String) {
    user(login: $username) {
      following(first: 100, after: $cursor) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          login
          name
          starredRepositories {
            totalCount
          }
        }
      }
    }
  }
`;

interface FollowedUser {
  login: string;
  name: string | null;
  starredRepositories: {
    totalCount: number;
  };
}

interface FollowingResponse {
  user: {
    following: {
      pageInfo: {
        endCursor: string | null;
        hasNextPage: boolean;
      };
      nodes: FollowedUser[];
    };
  };
}

async function fetchFollowedUsers(
  client: GraphQLClient,
  username: string,
  maxIterations?: number,
): Promise<FollowedUser[]> {
  let hasNextPage = true;
  let cursor: string | null = null;
  const allFollowedUsers: FollowedUser[] = [];
  let iterations = 0;

  try {
    while (hasNextPage && (!maxIterations || iterations < maxIterations)) {
      iterations++;
      console.log(`Fetching following page ${iterations}...`);
      const data: FollowingResponse = await client.request(FOLLOWING_QUERY, {
        username,
        cursor,
      });
      const { nodes, pageInfo } = data.user.following;
      console.log(`Got ${nodes.length} users on this page`);
      allFollowedUsers.push(...nodes);
      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
    }

    return allFollowedUsers.sort(
      (a, b) =>
        b.starredRepositories.totalCount - a.starredRepositories.totalCount,
    );
  } catch (error) {
    console.error("Error fetching followed users:", error);
    throw error;
  }
}

export { fetchFollowedUsers };
