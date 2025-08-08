import type { StarredRepository } from "@/github/stars";
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
    <div className="space-y-8">{yearBlocks}</div>
  );
}
