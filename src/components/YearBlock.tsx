import React from "react";
import type { StarredRepository } from "@/github/stars";
import LANGUAGE_COLORS from "@/assets/data/languageColors.json";
import { MonthSVG } from "./MonthSVG";
import {
  DAYS,
  MONTHS,
  getTopLanguagesForYear,
  getNicheLanguagesForYear,
  getMonthTotal,
  getYearTotal,
  getFavoriteUsersForYear,
} from "@/utils/calendarUtils";

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
  const cellSize = 14;
  const gapSize = 2;

  const nicheLanguages = getNicheLanguagesForYear(calendarData, year);

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold mb-2">
        {year}{" "}
        <span className="font-normal text-gray-500">
          ({getYearTotal(calendarData, year)} stars)
        </span>
      </div>
      <div>
        <div className="text-xs text-gray-500">
          Top languages:{" "}
          {getTopLanguagesForYear(calendarData, year).map(
            ([lang, count], index) => (
              <span key={lang}>
                {index > 0 && ", "}
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1"
                  style={{
                    backgroundColor:
                      //@ts-ignore
                      LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default,
                  }}
                ></span>
                {lang} ({count})
              </span>
            ),
          )}
        </div>
        {nicheLanguages.length > 0 && (
          <div className="text-xs text-gray-500">
            Niche languages:{" "}
            {nicheLanguages.map(([lang, count], index) => (
              <span key={lang}>
                {index > 0 && ", "}
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1"
                  style={{
                    backgroundColor:
                      //@ts-ignore
                      LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default,
                  }}
                ></span>
                {lang} ({count})
              </span>
            ))}
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
                  <span className="text-gray-400 ml-1">
                    ({getMonthTotal(calendarData, parseInt(year), monthIndex)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-500 mb-4">
        Favorite users:{" "}
        {getFavoriteUsersForYear(calendarData, year).map(
          ([user, count], index) => (
            <span key={user}>
              {index > 0 && ", "}
              <a
                href={`https://github.com/${user}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {user}
              </a>{" "}
              ({count})
            </span>
          ),
        )}
      </div>
    </div>
  );
};

export default React.memo(YearBlock);
