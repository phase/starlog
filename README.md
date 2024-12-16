# GitHub Stars

[Astro](https://astro.build) site for visualizing the repositories you've starred on GitHub.
Uses GitHub's GraphQL API, running clientside.

```shell
# Run locally
bun i
bun dev

# Run script to get *all* stars for an account
# This module will detect Bun is running it and write to disk.
# Stored in src/assets/cached/<username>.json, it will be used if you run this site locally.
bun run ./src/github/stars.ts
```
