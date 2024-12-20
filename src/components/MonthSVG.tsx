import React, { type JSX } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { StarredRepository } from "@/github/stars";
import LANGUAGE_COLORS from "@/assets/data/languageColors.json";
import {
  hexToHSL,
  NO_DATA_COLOR,
  getMonthData,
  hslToString,
} from "@/lib/calendar";

interface MonthSVGProps {
  year: number;
  month: number;
  calendarData: { [key: string]: StarredRepository[] };
  monthlyMaxStars: { [key: string]: number };
  cellSize: number;
  gapSize: number;
}

const formatTooltipContent = (
  dateString: string,
  repos: StarredRepository[],
): JSX.Element => {
  const formattedDate = new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-2 max-w-xs">
      <div className="font-bold mb-1">{formattedDate}</div>
      <div className="mb-2">{repos.length} stars</div>
      <ul className="space-y-1 text-sm">
        {repos.map((repo, index) => (
          <li key={index} className="flex items-center">
            <span
              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
              style={{
                backgroundColor:
                  //@ts-ignore
                  LANGUAGE_COLORS[
                    repo.node.primaryLanguage?.name || "default"
                  ] || LANGUAGE_COLORS.default,
              }}
            ></span>
            <a
              href={repo.node.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-blue-500 hover:underline"
            >
              {repo.node.owner.login}/{repo.node.name}
            </a>
            <span className="text-gray-500 ml-1">
              ({repo.node.primaryLanguage?.name || "Unknown"})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const getColor = (
  repos: StarredRepository[],
  date: Date,
  monthlyMaxStars: { [key: string]: number },
): string => {
  if (repos.length === 0) {
    return NO_DATA_COLOR;
  }

  const languageCounts: { [key: string]: number } = {};
  repos.forEach((repo) => {
    const language = repo.node.primaryLanguage?.name || "Unknown";
    languageCounts[language] = (languageCounts[language] || 0) + 1;
  });

  const mostPopularLanguage = Object.entries(languageCounts).sort(
    (a, b) => b[1] - a[1],
  )[0][0];
  const baseColor =
    //@ts-ignore
    LANGUAGE_COLORS[mostPopularLanguage] || LANGUAGE_COLORS.default;
  const [h, s, l] = hexToHSL(baseColor);

  const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  const maxStars = monthlyMaxStars[yearMonth] || 1;
  const starCount = repos.length;

  const lightnessAdjustment = Math.max(
    0,
    Math.min(20, (1 - starCount / maxStars) * 20),
  );
  const adjustedLightness = Math.min(100, l + lightnessAdjustment);

  return hslToString(h, s, adjustedLightness);
};

export const MonthSVG: React.FC<MonthSVGProps> = ({
  year,
  month,
  calendarData,
  monthlyMaxStars,
  cellSize,
  gapSize,
}) => {
  const days = getMonthData(year, month);
  const width = Math.ceil(days.length / 7) * (cellSize + gapSize) - gapSize;
  const height = 7 * (cellSize + gapSize) - gapSize;

  return (
    <svg width={width} height={height} className="mb-1">
      {days.map((date, index) => {
        if (date === null) {
          return (
            <rect
              key={`empty-${index}`}
              x={Math.floor(index / 7) * (cellSize + gapSize)}
              y={(index % 7) * (cellSize + gapSize)}
              width={cellSize}
              height={cellSize}
              fill="transparent"
            />
          );
        }

        const dateString = date.toISOString().split("T")[0];
        const repos = calendarData[dateString] || [];

        if (repos.length === 0) {
          return (
            <rect
              key={dateString}
              x={Math.floor(index / 7) * (cellSize + gapSize)}
              y={(index % 7) * (cellSize + gapSize)}
              width={cellSize}
              height={cellSize}
              fill={NO_DATA_COLOR}
              rx={2}
              ry={2}
            />
          );
        }

        return (
          <Tooltip.Provider
            key={dateString}
            delayDuration={0}
            skipDelayDuration={0}
          >
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <rect
                  x={Math.floor(index / 7) * (cellSize + gapSize)}
                  y={(index % 7) * (cellSize + gapSize)}
                  width={cellSize}
                  height={cellSize}
                  fill={getColor(repos, date, monthlyMaxStars)}
                  rx={2}
                  ry={2}
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
    </svg>
  );
};
