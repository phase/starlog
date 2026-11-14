import type { StarredRepository } from "@/github/stars";
import React, { useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import "@/components/tooltipStyle.css";
import LANGUAGE_COLORS from "@/assets/data/languageColors.json";

interface StatsProps {
  starredRepos: StarredRepository[];
}

const EXCLUDED_DISPLAY_LANGUAGES = new Set(["Unknown", "Markdown"]);

function formatHourLabel(h: number) {
  const period = h < 12 ? "a" : "p";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${period}`;
}

interface CumulativeLanguageDatum {
  year: string;
  total: number;
  counts: Record<string, number>;
}

function getLanguageColor(language: string) {
  return (
    LANGUAGE_COLORS[language as keyof typeof LANGUAGE_COLORS] ||
    LANGUAGE_COLORS.default
  );
}

function buildAreaPath(
  upper: Array<[number, number]>,
  lower: Array<[number, number]>,
) {
  const upperPath = upper
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
  const lowerPath = lower
    .slice()
    .reverse()
    .map(([x, y]) => `L${x},${y}`)
    .join(" ");
  return `${upperPath} ${lowerPath} Z`;
}

function StarsOverTimeChart({
  data,
  languages,
}: {
  data: CumulativeLanguageDatum[];
  languages: string[];
}) {
  const [hoveredYear, setHoveredYear] = useState<string | null>(null);

  if (data.length === 0) {
    return <div className="text-sm text-muted-foreground">No yearly data</div>;
  }

  const width = 760;
  const height = 280;
  const left = 38;
  const right = 12;
  const top = 12;
  const bottom = 32;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxTotal = Math.max(...data.map(({ total }) => total), 1);
  const xAt = (index: number) =>
    data.length === 1
      ? left + plotWidth / 2
      : left + (index / (data.length - 1)) * plotWidth;
  const yAt = (value: number) => top + plotHeight - (value / maxTotal) * plotHeight;
  const cumulative = Array.from({ length: data.length }, () => 0);
  const areas = languages.map((language) => {
    const lowerValues = cumulative.slice();
    const upperValues = data.map(({ counts }, index) => {
      cumulative[index] += counts[language] || 0;
      return cumulative[index];
    });
    return {
      language,
      path: buildAreaPath(
        upperValues.map((value, index) => [xAt(index), yAt(value)]),
        lowerValues.map((value, index) => [xAt(index), yAt(value)]),
      ),
    };
  });
  const activeYear =
    data.find(({ year }) => year === hoveredYear) || data[data.length - 1];
  const activeItems = languages
    .map((language) => ({ language, count: activeYear.counts[language] || 0 }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) =>
    Math.round(maxTotal * ratio),
  );
  const hoverWidth = data.length === 1 ? plotWidth : plotWidth / (data.length - 1);
  const activeIndex = data.findIndex(({ year }) => year === activeYear.year);
  const activeX = xAt(activeIndex);

  return (
    <div className="rounded-lg border p-3">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto min-w-[620px] w-full"
          role="img"
          aria-label="Cumulative stars for the ranked languages over time"
          onMouseLeave={() => setHoveredYear(null)}
        >
          {yTicks.map((tick) => {
            const y = yAt(tick);
            return (
              <g key={`year-tick-${tick}`}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth="0.75"
                />
                <text
                  x={left - 5}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="10"
                  fill="hsl(var(--muted-foreground))"
                >
                  {tick}
                </text>
              </g>
            );
          })}
          {areas.map(({ language, path }) => (
            <path
              key={language}
              d={path}
              fill={getLanguageColor(language)}
              fillOpacity="0.82"
              stroke={getLanguageColor(language)}
              strokeWidth="0.75"
            />
          ))}
          <line
            x1={activeX}
            x2={activeX}
            y1={top}
            y2={top + plotHeight}
            stroke="hsl(var(--foreground))"
            strokeWidth="1"
            strokeDasharray="3 3"
            pointerEvents="none"
          />
          <circle
            cx={activeX}
            cy={yAt(activeYear.total)}
            r="3"
            fill="hsl(var(--foreground))"
            pointerEvents="none"
          />
          {data.map(({ year, total }, index) => {
            const x = xAt(index);
            const hoverStart = Math.max(left, x - hoverWidth / 2);
            const hoverEnd = Math.min(width - right, x + hoverWidth / 2);
            return (
              <g key={year}>
                <rect
                  x={hoverStart}
                  y={top}
                  width={hoverEnd - hoverStart}
                  height={plotHeight}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${year}: ${total} cumulative stars`}
                  onMouseEnter={() => setHoveredYear(year)}
                  onFocus={() => setHoveredYear(year)}
                />
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="hsl(var(--muted-foreground))"
                >
                  {year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 border-t pt-3">
        <div className="mb-2 text-sm">
          <span className="font-semibold">{activeYear.year}</span>
          <span className="text-muted-foreground">
            {" "}· {activeYear.total} cumulative ranked-language stars
          </span>
        </div>
        <ol className="grid grid-flow-col grid-cols-3 grid-rows-4 gap-x-1 sm:gap-x-6">
          {activeItems.slice(0, 12).map(({ language, count }, index) => (
            <li
              key={`${activeYear.year}-${language}`}
              className="flex min-w-0 items-center gap-1 text-xs tabular-nums"
              title={`${index + 1}. ${language} (${count})`}
            >
              <span className="w-4 shrink-0 text-right text-[10px]">
                {index + 1}.
              </span>
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: getLanguageColor(language) }}
              />
              <span className="min-w-0 truncate">{language}</span>
              <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:inline">
                ({count})
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function Stats({ starredRepos }: StatsProps) {
  const yearlyLanguageCounts: Record<string, Record<string, number>> = {};
  const globalLanguageCounts: Record<string, number> = {};
  starredRepos.forEach((repo) => {
    const [ym] = repo.starredAt.split("T");
    const year = ym.slice(0, 4);
    const language = repo.node.primaryLanguage?.name || "Unknown";
    if (!yearlyLanguageCounts[year]) yearlyLanguageCounts[year] = {};
    yearlyLanguageCounts[year][language] =
      (yearlyLanguageCounts[year][language] || 0) + 1;
    globalLanguageCounts[language] = (globalLanguageCounts[language] || 0) + 1;
  });

  const MAX_LEGEND_LANGUAGES = 12;
  const topLanguages = Object.entries(globalLanguageCounts)
    .filter(([language]) => !EXCLUDED_DISPLAY_LANGUAGES.has(language))
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_LEGEND_LANGUAGES)
    .map(([lang]) => lang);
  const selectedLanguages = new Set(topLanguages);

  const cumulativeCounts: Record<string, number> = {};
  let cumulativeTotal = 0;
  const cumulativeYearlyData: CumulativeLanguageDatum[] = Object.entries(
    yearlyLanguageCounts,
  )
    .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
    .map(([year, languageCounts]) => {
      const yearCounts: Record<string, number> = {};
      for (const [language, count] of Object.entries(languageCounts)) {
        if (selectedLanguages.has(language)) {
          yearCounts[language] = count;
        }
      }
      for (const [language, count] of Object.entries(yearCounts)) {
        cumulativeCounts[language] = (cumulativeCounts[language] || 0) + count;
      }
      cumulativeTotal += Object.values(yearCounts).reduce(
        (sum, count) => sum + count,
        0,
      );
      return {
        year,
        total: cumulativeTotal,
        counts: { ...cumulativeCounts },
      };
    });
  const yearlyLanguages = topLanguages.filter((language) =>
    cumulativeYearlyData.some(({ counts }) => (counts[language] || 0) > 0),
  );
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Hour-of-day heatmap 7x24 (rows=Sun..Sat, cols=0..23)
  const heat: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  const heatLangCounts: Array<Array<Record<string, number>>> = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({} as Record<string, number>)),
  );
  starredRepos.forEach((repo) => {
    const d = new Date(repo.starredAt);
    const wd = d.getDay();
    const h = d.getHours();
    heat[wd][h] += 1;
    const language = repo.node.primaryLanguage?.name || "Unknown";
    heatLangCounts[wd][h][language] = (heatLangCounts[wd][h][language] || 0) + 1;
  });
  const maxHeat = heat.reduce((m, row) => Math.max(m, ...row), 1);

  const getCellTopLanguageColor = (wd: number, h: number): string => {
    const langMap = heatLangCounts[wd][h];
    let top: string | null = null;
    let topCount = -1;
    for (const [lang, count] of Object.entries(langMap)) {
      if (count > topCount) {
        top = lang;
        topCount = count;
      }
    }
    if (!top) {
      return "hsl(var(--muted))";
    }
    // @ts-ignore
    return LANGUAGE_COLORS[top] || LANGUAGE_COLORS.default;
  };

  const getHourSummary = (wd: number, h: number) => {
    const langMap = heatLangCounts[wd][h];
    const total = Object.values(langMap).reduce((a, b) => a + b, 0);
    const items = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .map(([language, count]) => ({ language, count, pct: total ? Math.round((count / total) * 100) : 0 }));
    return { wd, h, total, items };
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 font-semibold">Stars over time</div>
        <StarsOverTimeChart
          data={cumulativeYearlyData}
          languages={yearlyLanguages}
        />
      </div>

      {/* Hour-of-day heatmap (Sun..Sat x 0..23) */}
      <div>
        <div className="mb-2 font-semibold">Stars by Hour and Weekday</div>
        <div className="border rounded-lg p-3 overflow-x-auto">
          <Tooltip.Provider delayDuration={150}>
            <div className="min-w-[720px]">
              <div className="grid" style={{ gridTemplateColumns: `repeat(25, minmax(0, 1fr))`, gap: "4px" }}>
                {/* Corner cell */}
                <div />
                {/* Hour labels */}
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={`h-${h}`} className="text-[10px] text-muted-foreground text-center">
                    {formatHourLabel(h)}
                  </div>
                ))}
                {heat.map((row, wd) => (
                  <React.Fragment key={`row-${wd}`}>
                    <div className="text-[10px] text-muted-foreground flex items-center">
                      {WEEKDAYS[wd]}
                    </div>
                    {row.map((val, h) => {
                      const summary = getHourSummary(wd, h);
                      return (
                        <Tooltip.Root key={`cell-${wd}-${h}`}>
                          <Tooltip.Trigger asChild>
                            <div
                              className="h-4 rounded cursor-pointer"
                              style={{
                                backgroundColor: getCellTopLanguageColor(wd, h),
                                opacity: val === 0 ? 1 : Math.max(0.12, val / maxHeat),
                              }}
                              aria-label={`${WEEKDAYS[wd]} @ ${formatHourLabel(h)} — ${val}`}
                            />
                          </Tooltip.Trigger>
                          <Tooltip.Content
                            className="TooltipContent border"
                            side="top"
                            align="center"
                            style={{
                              backgroundColor: "hsl(var(--popover))",
                              color: "hsl(var(--popover-foreground))",
                              borderColor: "hsl(var(--border))",
                            }}
                          >
                            <div className="text-xs text-muted-foreground mb-1">
                              {WEEKDAYS[wd]} @ {formatHourLabel(h)} — Total: {summary.total}
                            </div>
                            {summary.items.length > 0 ? (
                              <ul className="space-y-1 text-sm">
                                {summary.items.map((item) => (
                                  <li key={`hs-${wd}-${h}-${item.language}`} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="inline-block w-3 h-3 rounded"
                                        style={{
                                          // @ts-ignore
                                          backgroundColor: LANGUAGE_COLORS[item.language] || LANGUAGE_COLORS.default,
                                        }}
                                      ></span>
                                      <span>{item.language}</span>
                                    </div>
                                    <div className="tabular-nums text-muted-foreground">{item.count} ({item.pct}%)</div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-sm text-muted-foreground">No stars</div>
                            )}
                            <Tooltip.Arrow
                              className="TooltipArrow"
                              style={{ fill: "hsl(var(--popover))" }}
                            />
                          </Tooltip.Content>
                        </Tooltip.Root>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </Tooltip.Provider>
        </div>
      </div>

    </div>
  );
}
