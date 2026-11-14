import { parseArgs } from "util";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

interface GitHubUser {
  login: string;
  name: string | null;
  starred_url: string;
  html_url: string;
}

interface ResultUser {
  login: string;
  name: string | null;
  starCount: number;
  url: string;
}

interface Results {
  fetchedAt: string;
  totalUsers: number;
  users: ResultUser[];
}

async function fetchWithAuth(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

async function fetchFollowedUsers(
  username: string,
  token: string,
  limit?: number,
): Promise<GitHubUser[]> {
  const perPage = 100;
  let page = 1;
  let allUsers: GitHubUser[] = [];

  while (true) {
    const url = `https://api.github.com/users/${username}/following?per_page=${perPage}&page=${page}`;
    const users: GitHubUser[] = await fetchWithAuth(url, token);

    if (users.length === 0) break;
    allUsers = [...allUsers, ...users];

    if (limit && page >= limit) break;
    page++;
  }

  return allUsers;
}

async function getStarredCount(
  username: string,
  token: string,
): Promise<number> {
  // We can use the starred endpoint with per_page=1 to just get the total count
  // from the Link header without fetching all starred repos
  const url = `https://api.github.com/users/${username}/starred?per_page=1`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Bun-Script",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`,
    );
  }

  // GitHub returns the total count in the Link header for pagination
  const linkHeader = response.headers.get("Link");
  if (!linkHeader) {
    // If there's no Link header, user has 0 or 1 starred repos
    const stars = await response.json();
    return stars.length;
  }

  // Extract the last page number from the Link header
  // Format: <url>; rel="last"
  const matches = linkHeader.match(/&page=(\d+)>; rel="last"/);
  if (!matches) {
    // If there's no "last" relation, user has 0 or 1 starred repos
    const stars = await response.json();
    return stars.length;
  }

  // The last page number multiplied by per_page gives us the total count
  return parseInt(matches[1]);
}

async function main() {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      username: { type: "string", short: "u" },
      token: { type: "string", short: "t" },
      limit: { type: "string", short: "l" },
      min: { type: "string", short: "m" },
    },
    strict: true,
    allowPositionals: true,
  });

  if (!values.username || !values.token) {
    console.error(
      "Usage: bun run following -u <username> -t <github-token> [-l <limit>] [-m <min-stars>]",
    );
    process.exit(1);
  }

  try {
    console.log("Fetching followed users...");
    const followedUsers = await fetchFollowedUsers(
      values.username,
      values.token,
      values.limit ? parseInt(values.limit) : undefined,
    );

    console.log(`Fetching star counts for ${followedUsers.length} users...`);

    // Fetch star counts with progress tracking
    const usersWithStars = await Promise.all(
      followedUsers.map(async (user, index) => {
        const starCount = await getStarredCount(user.login, values.token!);
        if ((index + 1) % 10 === 0) {
          console.log(`Progress: ${index + 1}/${followedUsers.length}`);
        }
        return {
          ...user,
          starCount,
        };
      }),
    );

    // Filter and sort users
    const sortedUsers = usersWithStars
      .filter(
        (user) => !values.min || user.starCount >= parseInt(values.min || "0"),
      )
      .sort((a, b) => b.starCount - a.starCount);

    // Create results object
    const results: Results = {
      fetchedAt: new Date().toISOString(),
      totalUsers: sortedUsers.length,
      users: sortedUsers.map((user) => ({
        login: user.login,
        name: user.name,
        starCount: user.starCount,
        url: user.html_url,
      })),
    };

    // Save results
    const cacheDir = join(process.cwd(), "public", "cached");
    await mkdir(cacheDir, { recursive: true });

    const fileName = join(cacheDir, `${values.username}-following.json`);
    await writeFile(fileName, JSON.stringify(results, null, 2));
    console.log(`\nWrote ${results.totalUsers} results to ${fileName}`);

    // Log top 5 users
    console.log("\nTop 5 users by star count:");
    results.users.slice(0, 5).forEach((user) => {
      console.log(`${user.login}: ${user.starCount} stars`);
    });
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Check if being run directly with Bun
const isMain = typeof Bun !== "undefined" && import.meta.path === Bun.main;

if (isMain) {
  await main();
}
