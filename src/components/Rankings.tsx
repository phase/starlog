import type { StarredRepository } from "@/github/stars";
import { useMemo } from "react";

interface StarredRepo {
  id: number;
  name: string;
  stargazers_count: number;
  owner: {
    login: string;
  };
}

interface RankingsProps {
  starredRepos: StarredRepository[];
}

export default function Rankings({ starredRepos }: RankingsProps) {
  // const topRepos = useMemo(() => {
  //   return [...starredRepos]
  //     .sort((a, b) => b.stargazers_count - a.stargazers_count)
  //     .slice(0, 5);
  // }, [starredRepos]);

  // const topUsers = useMemo(() => {
  //   const userCounts: { [key: string]: number } = {};
  //   starredRepos.forEach((repo) => {
  //     userCounts[repo.owner.login] = (userCounts[repo.owner.login] || 0) + 1;
  //   });
  //   return Object.entries(userCounts)
  //     .sort((a, b) => b[1] - a[1])
  //     .slice(0, 5);
  // }, [starredRepos]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Top 5 Starred Repositories
        </h3>
        <ul className="list-disc pl-5">
          {/* {topRepos.map((repo) => (
            <li key={repo.id}>
              {repo.name} ({repo.stargazers_count} stars)
            </li>
          ))} */}
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Top 5 Users You've Starred
        </h3>
        <ul className="list-disc pl-5">
          {/* {topUsers.map(([user, count]) => (
            <li key={user}>
              {user} ({count} repositories)
            </li>
          ))} */}
        </ul>
      </div>
    </div>
  );
}
