# Starlog

Dashboard for visualizing the repositories you've starred on GitHub.
Built with [Bun](https://bun.sh/), [Astro](https://astro.build/), React 19,
and GitHub's [GraphQL API](https://docs.github.com/en/graphql).

```shell
# Run locally
bun i
bun dev

# Run script to get *all* stars for an account
# This module will detect Bun is running it and write to disk.
# Stored in public/cached/<username>.json, it will be used if you run this site locally.
bun run stars
```
