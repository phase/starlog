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
  shouldContinue?: () => boolean,
) {
  let hasNextPage = true;
  let cursor: string | null = null;
  let iterations = 0;

  try {
    while (hasNextPage && (!maxIterations || iterations < maxIterations)) {
      if (shouldContinue && !shouldContinue()) {
        console.log("fetchStarredRepositoriesStream: stopped due to staleness");
        break;
      }
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
      if (!shouldContinue || shouldContinue()) {
        consumer(edges);
      } else {
        break;
      }

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

/**
 * Fetch newest starred repositories and stop once we overlap with any cached repo.
 * Only emits repositories that are not already present in existingRepoKeys.
 */
async function fetchNewStarsUntilOverlap(
  consumer: (data: StarredRepository[]) => void,
  client: GraphQLClient,
  username: string,
  existingRepoKeys: Set<string>,
  maxIterations?: number,
  shouldContinue?: () => boolean,
): Promise<StarredRepository[]> {
  let hasNextPage = true;
  let cursor: string | null = null;
  let iterations = 0;
  const emittedKeys = new Set<string>();
  const newlyFetched: StarredRepository[] = [];

  const toKey = (r: StarredRepository) => r.node.url || `${r.node.owner.login}/${r.node.name}`;

  try {
    while (hasNextPage && (!maxIterations || iterations < maxIterations)) {
      if (shouldContinue && !shouldContinue()) {
        console.log("fetchNewStarsUntilOverlap: stopped due to staleness");
        break;
      }
      iterations++;
      const data: StarredRepositoriesResponse = await client.request<StarredRepositoriesResponse>(
        STARRED_REPOS_QUERY,
        { username, cursor },
      );

      const { edges, pageInfo } = data.user.starredRepositories;

      // Filter out anything that exists in the cache or already emitted
      const pageNew = edges.filter((e) => {
        const key = toKey(e);
        return !existingRepoKeys.has(key) && !emittedKeys.has(key);
      });

      if (pageNew.length > 0) {
        if (shouldContinue && !shouldContinue()) {
          console.log("fetchNewStarsUntilOverlap: consumer skipped due to staleness");
          break;
        }
        consumer(pageNew);
        pageNew.forEach((e) => emittedKeys.add(toKey(e)));
        newlyFetched.push(...pageNew);
      }

      const pageHadOverlap = edges.length !== pageNew.length; // at least one duplicate with cache
      if (pageHadOverlap) {
        // We hit the boundary of the cache; no need to page further
        break;
      }

      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
    }

    return newlyFetched;
  } catch (error) {
    console.error("Error fetching starred repositories until overlap:", error);
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
  options?: { shouldContinue?: () => boolean; maxIterations?: number },
) {
  // Assemble cached baseline (from localStorage or static JSON)
  let baseline: StarredRepository[] | null = null;
  const local = localStorage.getItem(username);
  if (local && local !== "null" && local !== '"null"') {
    try {
      baseline = JSON.parse(local);
    } catch {
      baseline = null;
    }
  }

  if (!baseline) {
    try {
      const response = await fetch(`/cached/${username}.json`);
      if (response.ok) {
        baseline = await response.json();
      }
    } catch {
      // ignore
    }
  }

  // Stream the baseline first if we have it (chunked to keep UI responsive)
  if (baseline && Array.isArray(baseline) && baseline.length > 0) {
    const chunkSize = 1600;
    for (let i = 0; i < baseline.length; i += chunkSize) {
      const chunk = baseline.slice(i, i + chunkSize);
      consumer(chunk);
      // Let the UI breathe a bit
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  // If we have a token, try to fetch only the new stars until we overlap with the cache
  if (token && token !== "" && token !== "token") {
    const client = new GraphQLClient("https://api.github.com/graphql", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (baseline && Array.isArray(baseline) && baseline.length > 0) {
      // Build a set of repo keys from the baseline for deduplication and overlap detection
      const existingKeys = new Set<string>();
      for (const r of baseline) {
        // Prefer URL as the unique key
        const url = (r as any)?.node?.url;
        if (url && typeof url === "string") {
          existingKeys.add(url);
        } else {
          existingKeys.add(`${r.node.owner.login}/${r.node.name}`);
        }
      }

      const newlyFetched = await fetchNewStarsUntilOverlap(
        consumer,
        client,
        username,
        existingKeys,
        options?.maxIterations,
        options?.shouldContinue,
      );

      // Update localStorage with merged, de-duplicated results
      try {
        const merged = [...newlyFetched, ...baseline];
        // Ensure no duplicates in merged (by URL)
        const seen = new Set<string>();
        const deduped: StarredRepository[] = [];
        for (const r of merged) {
          const key = (r as any)?.node?.url || `${r.node.owner.login}/${r.node.name}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(r);
          }
        }
        // Sort newest first by starredAt
        deduped.sort((a, b) => new Date(b.starredAt).getTime() - new Date(a.starredAt).getTime());
        localStorage.setItem(username, JSON.stringify(deduped));
      } catch (e) {
        console.warn("Failed to update merged cache in localStorage:", e);
      }
    } else {
      // No baseline cache; fall back to streaming all from API
      await fetchStarredRepositoriesStream(
        consumer,
        client,
        username,
        options?.maxIterations,
        options?.shouldContinue,
      );
    }
  }
}

export function fetchStarsCancelable(
  consumer: (data: StarredRepository[]) => void,
  username: string,
  token?: string,
  options?: { shouldContinue?: () => boolean; maxIterations?: number },
) {
  let isActive = true;
  const mergedShouldContinue = () => isActive && (options?.shouldContinue ? options.shouldContinue() : true);
  const promise = fetchStars(consumer, username, token, { ...options, shouldContinue: mergedShouldContinue });
  return {
    cancel: () => {
      isActive = false;
    },
    promise,
  } as const;
}
