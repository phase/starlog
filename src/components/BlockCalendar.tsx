import LANGUAGE_COLORS from "@/assets/data/languageColors.json";
import type { StarredRepository } from "@/github/stars";
import { getOverallStats } from "@/utils/calendarUtils";
import { useMemo } from "react";
import YearBlock from "./YearBlock";

interface BlockCalendarProps {
  starredRepos: StarredRepository[];
}

export default function BlockCalendar({ starredRepos }: BlockCalendarProps) {
  if (starredRepos.length === 0) {
    return <YearBlock year="2024" calendarData={{}} monthlyMaxStars={{}} />;
  }

  const calendarData = useMemo(() => {
    const data: { [key: string]: StarredRepository[] } = {};
    starredRepos.forEach((repo) => {
      const date = repo.starredAt.split("T")[0];
      if (!data[date]) {
        data[date] = [];
      }
      data[date].push(repo);
    });
    return data;
  }, [starredRepos]);

  const years = useMemo(() => {
    const yearsSet = new Set(
      Object.keys(calendarData).map((date) => date.split("-")[0]),
    );
    return Array.from(yearsSet).sort().reverse();
  }, [calendarData]);

  const monthlyMaxStars = useMemo(() => {
    const maxStars: { [key: string]: number } = {};
    Object.entries(calendarData).forEach(([date, repos]) => {
      const [year, month] = date.split("-");
      const key = `${year}-${month}`;
      maxStars[key] = Math.max(maxStars[key] || 0, repos.length);
    });
    return maxStars;
  }, [calendarData]);

  const overallStats = useMemo(
    () => getOverallStats(calendarData),
    [calendarData],
  );

  const yearBlocks = useMemo(
    () =>
      years.map((year) => {
        const yearData = Object.fromEntries(
          Object.entries(calendarData).filter(([date]) =>
            date.startsWith(year),
          ),
        );

        return (
          <YearBlock
            key={year}
            year={year}
            calendarData={yearData}
            monthlyMaxStars={monthlyMaxStars}
          />
        );
      }),
    [years, calendarData, monthlyMaxStars],
  );

  return (
    <div className="space-y-8">
      {yearBlocks}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-semibold mb-2">Summary</h2>
        <p className="text-sm mb-2">
          Starred{" "}
          <span className="font-semibold">{overallStats.totalStars}</span>{" "}
          repositories made with{" "}
          <span className="font-semibold">{overallStats.totalLanguages}</span>{" "}
          languages.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-4">
          <div>
            <div className="text-sm md:mb-4">
              <p className="mb-1 font-semibold">Favorite Languages</p>
              <ul className="list-disc list-inside">
                {overallStats.topLanguages
                  .slice(0, overallStats.topLanguages.length / 2)
                  .map(([lang, count]) => (
                    <li key={lang} className="flex items-center">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{
                          backgroundColor:
                            //@ts-ignore
                            LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default,
                        }}
                      ></span>
                      {lang}
                      <span className="text-gray-400 ml-1">({count})</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
          <div>
            <div className="text-sm mb-4">
              <p className="mb-1 font-semibold hidden sm:inline-block">
                &nbsp;
              </p>
              <ul className="list-disc list-inside">
                {overallStats.topLanguages
                  .slice(
                    overallStats.topLanguages.length / 2,
                    overallStats.topLanguages.length,
                  )
                  .map(([lang, count]) => (
                    <li key={lang} className="flex items-center">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{
                          backgroundColor:
                            //@ts-ignore
                            LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default,
                        }}
                      ></span>
                      {lang}
                      <span className="text-gray-400 ml-1">({count})</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
          <div>
            <div className="text-sm">
              <p className="mb-1 font-semibold">Favorite Users</p>
              <ul className="list-disc list-inside">
                {overallStats.topUsers
                  .slice(0, overallStats.topUsers.length / 2)
                  .map(([user, count]) => (
                    <li key={user}>
                      <a
                        href={`https://github.com/${user}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {user}
                      </a>
                      <span className="text-gray-400 ml-1">({count})</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
          <div>
            <div className="text-sm">
              <p className="mb-1 font-semibold hidden sm:inline-block">
                &nbsp;
              </p>
              <ul className="list-disc list-inside">
                {overallStats.topUsers
                  .slice(
                    overallStats.topUsers.length / 2,
                    overallStats.topUsers.length,
                  )
                  .map(([user, count]) => (
                    <li key={user}>
                      <a
                        href={`https://github.com/${user}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {user}
                      </a>
                      <span className="text-gray-400 ml-1">({count})</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
