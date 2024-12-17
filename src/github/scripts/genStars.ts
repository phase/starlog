import { GraphQLClient } from "graphql-request";
import { parseArgs } from "util";
import fetchStarredRepositories from "../stars";

// CLI usage:
// bun run stars -u <username> -t <token> -l <limit>
async function main() {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      username: { type: "string", short: "u" },
      token: { type: "string", short: "t" },
      limit: { type: "string", short: "l" }, // max number of pages to fetch
    },
    strict: true,
    allowPositionals: true,
  });
  const username = values.username ?? "phase";
  const client = new GraphQLClient("https://api.github.com/graphql", {
    headers: {
      Authorization: `Bearer ${values.token}`,
    },
  });

  try {
    const starredRepos = await fetchStarredRepositories(client, username);
    console.log(`Total starred repositories: ${starredRepos.length}`);
    const fileName = `public/cached/${username}.json`;
    const fs = require("fs");
    fs.writeFileSync(
      fileName,
      JSON.stringify(starredRepos, null, values.limit),
    );
    console.log(`\nWrote full results to ${fileName}`);
  } catch (error) {
    console.error("Failed to fetch starred repositories", error);
  }
}

/// is this being run with `bun run`?
const isMain = typeof Bun !== "undefined" && import.meta.path === Bun.main;

if (isMain) {
  await main();
}
