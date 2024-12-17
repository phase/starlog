import { parseArgs } from "util";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { fetchFollowedUsers } from "../following";
import { GraphQLClient } from "graphql-request";

async function main() {
  // Parse command line arguments
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      username: { type: "string", short: "u" },
      token: { type: "string", short: "t" },
      limit: { type: "string", short: "l" }, // max number of pages to fetch
      min: { type: "string", short: "m" }, // minimum stars to include user
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

  const client = new GraphQLClient("https://api.github.com/graphql", {
    headers: {
      Authorization: `Bearer ${values.token}`,
    },
  });

  try {
    const followedUsers = await fetchFollowedUsers(
      client,
      values.username,
      values.limit ? parseInt(values.limit) : undefined,
    );

    // Sort by star count and filter if minimum stars specified
    const sortedUsers = followedUsers
      .filter(
        (user) =>
          !values.min ||
          user.starredRepositories.totalCount >= parseInt(values.min),
      )
      .sort(
        (a, b) =>
          b.starredRepositories.totalCount - a.starredRepositories.totalCount,
      );

    // Create results object with metadata
    const results = {
      fetchedAt: new Date().toISOString(),
      totalUsers: sortedUsers.length,
      users: sortedUsers.map((user) => ({
        login: user.login,
        name: user.name,
        starCount: user.starredRepositories.totalCount,
        followers: user.followers.totalCount,
        url: `https://github.com/${user.login}`,
      })),
    };

    // Ensure directory exists
    const cacheDir = join(process.cwd(), "public", "cached");
    await mkdir(cacheDir, { recursive: true });

    // Write results
    const fileName = join(cacheDir, `${values.username}-following.json`);
    await writeFile(fileName, JSON.stringify(results, null, 2));

    console.log(`\nWrote ${results.totalUsers} results to ${fileName}`);

    // Log top 5 users
    console.log("\nTop 5 users by star count:");
    results.users.slice(0, 5).forEach((user) => {
      console.log(
        `${user.login} (${user.starCount} stars, ${user.followers} followers)`,
      );
    });
  } catch (error) {
    console.error("Failed to fetch followed users:", error);
    process.exit(1);
  }
}

// Check if being run directly with Bun
const isMain = typeof Bun !== "undefined" && import.meta.path === Bun.main;

if (isMain) {
  await main();
}
