import React from "react";
import type { StarredRepository } from "@/github/stars";
import LANGUAGE_COLORS from "@/assets/data/languageColors.json";
import { MonthSVG } from "./MonthSVG";
import {
  DAYS,
  MONTHS,
  getRankedLanguagesForYear,
  getMonthTotal,
  getYearTotal,
  getFavoriteUsersForYear,
} from "@/lib/calendar";

interface YearBlockProps {
  year: string;
  calendarData: { [key: string]: StarredRepository[] };
  monthlyMaxStars: { [key: string]: number };
}

const YearBlock: React.FC<YearBlockProps> = ({
  year,
  calendarData,
  monthlyMaxStars,
}) => {
  const empty = Object.keys(calendarData).length === 0;
  const cellSize = 14;
  const gapSize = 2;

  const rankedLanguages = getRankedLanguagesForYear(calendarData, year);

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold mb-2">
        {year}{" "}
        <span className="font-normal text-muted-foreground">
          ({getYearTotal(calendarData, year)} stars)
        </span>
      </div>
      {!empty && (
        <div className="text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Languages</p>
          <ol className="grid grid-flow-col grid-cols-3 grid-rows-4 gap-x-1 sm:gap-x-6">
            {rankedLanguages.map(([lang, count], index) => (
              <li
                key={lang}
                className="flex min-w-0 items-center gap-1 tabular-nums"
                title={`${index + 1}. ${lang} (${count})`}
              >
                <span className="w-4 shrink-0 text-right text-[10px]">
                  {index + 1}.
                </span>
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      LANGUAGE_COLORS[lang as keyof typeof LANGUAGE_COLORS] ||
                      LANGUAGE_COLORS.default,
                  }}
                />
                <span className="min-w-0 truncate">{lang}</span>
                <span className="hidden shrink-0 text-[10px] sm:inline">
                  ({count})
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="flex">
        <div className="mr-2 text-muted-foreground hidden sm:block">
          {DAYS.map((day, index) => (
            <div key={`day-${index}`} className="h-4 w-4 text-[10px]">
              {day[0]}
            </div>
          ))}
        </div>
        <div className="flex-1">
          <div className="grid xs:grid-cols-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {MONTHS.map((month, monthIndex) => (
              <div
                key={`${year}-${month}`}
                className="flex flex-col items-center"
              >
                <MonthSVG
                  year={parseInt(year)}
                  month={monthIndex}
                  calendarData={calendarData}
                  monthlyMaxStars={monthlyMaxStars}
                  cellSize={cellSize}
                  gapSize={gapSize}
                />
                <div className="text-xs text-center mt-1">
                  {month}
                  <span className="text-muted-foreground ml-1">
                    ({getMonthTotal(calendarData, parseInt(year), monthIndex)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {!empty && (
        <div className="text-xs text-muted-foreground mb-4">
          Favorite users:{" "}
          {getFavoriteUsersForYear(calendarData, year).map(
            ([user, count], index) => (
              <span key={user}>
                {index > 0 && ", "}
                <a
                  href={`https://github.com/${user}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {user}
                </a>{" "}
                ({count})
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(YearBlock);
