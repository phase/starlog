import type { StarredRepository } from "@/github/stars";
import { useMemo } from "react";
import LANGUAGE_COLORS from "@/assets/data/languageColors.json";
import * as Tooltip from "@radix-ui/react-tooltip";
import "./tooltipStyle.css";

interface BlockCalendarProps {
  starredRepos: StarredRepository[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const NO_DATA_COLOR = "#f0f0f0"; // Lighter grey for days without data

function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

function hslToString(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
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

  const getLanguagesForDay = (
    repos: StarredRepository[],
  ): { [key: string]: number } => {
    const languageCounts: { [key: string]: number } = {};
    repos.forEach((repo) => {
      const language = repo.node.primaryLanguage?.name || "Unknown";
      languageCounts[language] = (languageCounts[language] || 0) + 1;
    });
    return languageCounts;
  };

  const getMostPopularLanguage = (languageCounts: {
    [key: string]: number;
  }): string => {
    const sortedLanguages = Object.entries(languageCounts).sort(
      (a, b) => b[1] - a[1],
    );
    return sortedLanguages.length > 0 ? sortedLanguages[0][0] : "Unknown";
  };

  const getColor = (repos: StarredRepository[], date: Date): string => {
    if (repos.length === 0) {
      return NO_DATA_COLOR;
    }

    const languageCounts = getLanguagesForDay(repos);
    const mostPopularLanguage = getMostPopularLanguage(languageCounts);
    const baseColor =
      LANGUAGE_COLORS[mostPopularLanguage] || LANGUAGE_COLORS.default;

    // const [h, s, l] = hexToHSL(baseColor);

    // const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    // const maxStars = monthlyMaxStars[yearMonth] || 1;
    // const starCount = repos.length;

    // // Adjust lightness based on star count relative to month's maximum
    // // Reduce the maximum lightness adjustment to 20% instead of 50%
    // const lightnessAdjustment = Math.max(
    //   0,
    //   Math.min(20, (1 - starCount / maxStars) * 20),
    // );
    // const adjustedLightness = Math.min(100, l + lightnessAdjustment);

    // return hslToString(h, s, adjustedLightness);

    return baseColor;
  };

  const getMonthData = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      if (currentWeek.length === 0 && date.getDay() !== 0) {
        for (let i = 0; i < date.getDay(); i++) {
          currentWeek.push(new Date(year, month, day - date.getDay() + i));
        }
      }
      currentWeek.push(date);
      if (date.getDay() === 6 || day === lastDay.getDate()) {
        while (currentWeek.length < 7) {
          currentWeek.push(new Date(year, month, day + 1));
          day++;
        }
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    return weeks;
  };

  const getTopLanguagesForYear = (year: string): [string, number][] => {
    const languageCounts: { [key: string]: number } = {};
    Object.entries(calendarData).forEach(([date, repos]) => {
      if (date.startsWith(year)) {
        repos.forEach((repo) => {
          const language = repo.node.primaryLanguage?.name || "Unknown";
          languageCounts[language] = (languageCounts[language] || 0) + 1;
        });
      }
    });
    return Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const formatTooltipContent = (
    dateString: string,
    repos: StarredRepository[],
  ): JSX.Element => {
    const languageCounts = getLanguagesForDay(repos);
    const sortedLanguages = Object.entries(languageCounts).sort(
      (a, b) => b[1] - a[1],
    );
    const formattedDate = new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <div className="p-2 max-w-xs">
        <div className="font-bold mb-1">{formattedDate}</div>
        <div className="mb-2">Total stars: {repos.length}</div>
        <ul className="space-y-1">
          {sortedLanguages.map(([lang, count]) => (
            <li key={lang} className="flex items-center">
              <span
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor:
                    LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default,
                }}
              ></span>
              {lang}: {count}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const getMonthTotal = (year: number, month: number): number => {
    return Object.entries(calendarData)
      .filter(([date]) =>
        date.startsWith(`${year}-${(month + 1).toString().padStart(2, "0")}`),
      )
      .reduce((total, [, repos]) => total + repos.length, 0);
  };

  const getYearTotal = (year: string): number => {
    return Object.entries(calendarData)
      .filter(([date]) => date.startsWith(year))
      .reduce((total, [, repos]) => total + repos.length, 0);
  };

  return (
    <div className="space-y-8">
      {years.map((year) => (
        <div key={year} className="space-y-4">
          <div>
            <div className="text-sm font-semibold">
              {year}{" "}
              <span className="font-normal text-stone-500">
                ({getYearTotal(year)} stars)
              </span>
            </div>
            <div className="text-xs text-stone-500 mt-1">
              Top languages:{" "}
              {getTopLanguagesForYear(year).map(([lang, count], index) => (
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
              ))}
            </div>
          </div>
          <div className="flex items-start">
            <div className="mr-2">
              {DAYS.map((day) => (
                <div key={day} className="h-4 w-4 text-[10px] text-stone-400">
                  {day[0]}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap">
              {MONTHS.map((month, monthIndex) => (
                <div key={`${year}-${month}`} className="mr-4 mb-4">
                  <div className="flex">
                    {getMonthData(parseInt(year), monthIndex).map(
                      (week, weekIndex) => (
                        <div
                          key={`${year}-${month}-${weekIndex}`}
                          className="mr-1"
                        >
                          {week.map((date, dayIndex) => {
                            const dateString = date.toISOString().split("T")[0];
                            const repos = calendarData[dateString] || [];
                            return (
                              <Tooltip.Provider
                                key={`${dateString}-${dayIndex}`}
                                delayDuration={0}
                                skipDelayDuration={0}
                              >
                                <Tooltip.Root delayDuration={0}>
                                  <Tooltip.Trigger asChild>
                                    <div
                                      className="w-4 h-4 rounded-sm cursor-pointer"
                                      style={{
                                        backgroundColor:
                                          date.getMonth() === monthIndex
                                            ? getColor(repos, date)
                                            : "transparent",
                                      }}
                                    />
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Content
                                      className="bg-white border border-gray-200 rounded-md shadow-md z-50"
                                      sideOffset={5}
                                    >
                                      {formatTooltipContent(dateString, repos)}
                                      <Tooltip.Arrow className="fill-white" />
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              </Tooltip.Provider>
                            );
                          })}
                        </div>
                      ),
                    )}
                  </div>
                  <div className="text-xs text-center mt-1">
                    {month}
                    <span className="text-stone-400 ml-1">
                      ({getMonthTotal(parseInt(year), monthIndex)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
