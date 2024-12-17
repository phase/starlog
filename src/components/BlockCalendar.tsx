import type { StarredRepository } from "@/github/stars";
import React, { useMemo } from "react";
import LANGUAGE_COLORS from "@/assets/data/languageColors.json";
import { MonthSVG } from "./MonthSVG";
import {
  DAYS,
  MONTHS,
  getTopLanguagesForYear,
  getNicheLanguagesForYear,
  getMonthTotal,
  getYearTotal,
} from "@/utils/calendarUtils";

interface BlockCalendarProps {
  starredRepos: StarredRepository[];
}

export default function BlockCalendar({ starredRepos }: BlockCalendarProps) {
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

  const cellSize = 14;
  const gapSize = 2;

  return (
    <div className="space-y-8">
      {years.map((year) => (
        <div key={year} className="space-y-4">
          <div className="text-sm font-semibold mb-2">
            {year}{" "}
            <span className="font-normal text-gray-500">
              ({getYearTotal(calendarData, year)} stars)
            </span>
          </div>
          <div className="text-xs text-gray-500 mb-4">
            Top languages:{" "}
            {getTopLanguagesForYear(calendarData, year).map(
              ([lang, count], index) => (
                <span key={lang}>
                  {index > 0 && ", "}
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1"
                    style={{
                      backgroundColor:
                        LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default,
                    }}
                  ></span>
                  {lang} ({count})
                </span>
              ),
            )}
            {getNicheLanguagesForYear(calendarData, year).length >= 2 && (
              <div className="text-xs text-gray-500 mb-4">
                Niche languages:{" "}
                {getNicheLanguagesForYear(calendarData, year).map(
                  ([lang, count], index) => (
                    <span key={lang}>
                      {index > 0 && ", "}
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1"
                        style={{
                          backgroundColor:
                            LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default,
                        }}
                      ></span>
                      {lang} ({count})
                    </span>
                  ),
                )}
              </div>
            )}
          </div>
          <div className="flex">
            <div className="mr-2 text-gray-300">
              {DAYS.map((day, index) => (
                <div key={`day-${index}`} className="h-4 w-4 text-[10px]">
                  {day[0]}
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                      <span className="text-gray-400 ml-1">
                        (
                        {getMonthTotal(
                          calendarData,
                          parseInt(year),
                          monthIndex,
                        )}
                        )
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
