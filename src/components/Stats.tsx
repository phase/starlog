import type { StarredRepository } from "@/github/stars";
import React, { useMemo, useState } from "react";
import LANGUAGE_COLORS from "@/assets/data/languageColors.json";

interface StatsProps {
  calendarData: { [key: string]: StarredRepository[] };
  starredRepos: StarredRepository[];
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${year}-${month}`;
}

function formatHourLabel(h: number) {
  const period = h < 12 ? "a" : "p";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${period}`;
}

export default function Stats({ calendarData, starredRepos }: StatsProps) {
  // Monthly totals and language breakdowns
  const monthlyLanguageCounts: Record<string, Record<string, number>> = {};
  const globalLanguageCounts: Record<string, number> = {};
  starredRepos.forEach((repo) => {
    const [ym] = repo.starredAt.split("T");
    const monthKey = ym.slice(0, 7); // YYYY-MM
    const language = repo.node.primaryLanguage?.name || "Unknown";
    if (!monthlyLanguageCounts[monthKey]) monthlyLanguageCounts[monthKey] = {};
    monthlyLanguageCounts[monthKey][language] =
      (monthlyLanguageCounts[monthKey][language] || 0) + 1;
    globalLanguageCounts[language] = (globalLanguageCounts[language] || 0) + 1;
  });

  // Aggregate into quarters (YYYY-Qn)
  type QuarterKey = `${string}-Q${1 | 2 | 3 | 4}`;
  const quarterLanguageCounts: Record<QuarterKey, Record<string, number>> = {} as any;
  Object.entries(monthlyLanguageCounts).forEach(([ym, langMap]) => {
    const year = ym.slice(0, 4);
    const month = parseInt(ym.slice(5, 7), 10);
    const q: 1 | 2 | 3 | 4 = month <= 3 ? 1 : month <= 6 ? 2 : month <= 9 ? 3 : 4;
    const qKey = `${year}-Q${q}` as QuarterKey;
    if (!quarterLanguageCounts[qKey]) quarterLanguageCounts[qKey] = {};
    Object.entries(langMap).forEach(([language, count]) => {
      quarterLanguageCounts[qKey][language] =
        (quarterLanguageCounts[qKey][language] || 0) + count;
    });
  });

  const quarterTotals: Array<{ key: QuarterKey; year: number; quarter: number; total: number }> = Object.entries(
    quarterLanguageCounts,
  )
    .map(([key, langMap]) => ({
      key: key as QuarterKey,
      year: parseInt(key.slice(0, 4), 10),
      quarter: parseInt(key.slice(6, 7), 10),
      total: Object.values(langMap).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => (a.year === b.year ? a.quarter - b.quarter : a.year - b.year));

  const maxQuarterly = quarterTotals.reduce((m, { total }) => Math.max(m, total), 0) || 1;

  const MAX_LEGEND_LANGUAGES = 12;
  const topLanguages = Object.entries(globalLanguageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_LEGEND_LANGUAGES)
    .map(([lang]) => lang);
  const selectedLanguages = new Set(topLanguages);

  const stackedQuarterlyData = quarterTotals.map(({ key }) => {
    const langMap = quarterLanguageCounts[key] || {};
    const parts: Array<{ language: string; count: number }> = [];
    let otherCount = 0;
    Object.entries(langMap).forEach(([language, count]) => {
      if (selectedLanguages.has(language)) {
        parts.push({ language, count });
      } else {
        otherCount += count;
      }
    });
    if (otherCount > 0) parts.push({ language: "Other", count: otherCount });
    // Order by count descending for nicer stacking
    parts.sort((a, b) => b.count - a.count);
    const total = parts.reduce((a, b) => a + b.count, 0);
    return { key, total, parts };
  });

  const latestQuarters = stackedQuarterlyData.slice(-80);
  const [hovered, setHovered] = useState<(typeof latestQuarters)[number] | null>(
    latestQuarters[latestQuarters.length - 1] || null,
  );
  const hoveredSummary = useMemo(() => {
    if (!hovered) return null;
    const total = hovered.total;
    const items = hovered.parts.map((p) => ({
      language: p.language,
      count: p.count,
      pct: total ? Math.round((p.count / total) * 100) : 0,
    }));
    return { key: hovered.key, total, items };
  }, [hovered]);

  // Yearly totals for quick view
  const yearlyCountsMap: Record<string, number> = {};
  starredRepos.forEach((repo) => {
    const year = repo.starredAt.slice(0, 4);
    yearlyCountsMap[year] = (yearlyCountsMap[year] || 0) + 1;
  });
  const yearlyCounts = Object.entries(yearlyCountsMap)
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([year, count]) => ({ year, count }));

  // Weekday distribution (Sun..Sat)
  const weekdayCounts = Array.from({ length: 7 }, () => 0);
  starredRepos.forEach((repo) => {
    const d = new Date(repo.starredAt);
    const wd = d.getDay(); // 0=Sun .. 6=Sat
    weekdayCounts[wd] += 1;
  });
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

  const [hoveredHour, setHoveredHour] = useState<{ wd: number; h: number } | null>(null);
  const hoveredHourSummary = useMemo(() => {
    if (!hoveredHour) return null;
    const { wd, h } = hoveredHour;
    const langMap = heatLangCounts[wd][h];
    const total = Object.values(langMap).reduce((a, b) => a + b, 0);
    const items = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .map(([language, count]) => ({ language, count, pct: total ? Math.round((count / total) * 100) : 0 }));
    return { wd, h, total, items };
  }, [hoveredHour, heatLangCounts]);

  return (
    <div className="space-y-8">
      {/* Stacked bars per quarter by language */}
      <div>
        <div className="mb-2 font-semibold">Stars per Quarter by Language</div>
        <div className="border rounded-lg p-3">
          <div className="grid grid-cols-1 gap-4">
            {/* Chart area */}
            <div className="h-80 flex">
              {/* Scroll area with SVG chart */}
              <div className="relative flex-1">
                <div className="absolute inset-0 overflow-x-auto">
                  {(() => {
                    const barWidth = 12;
                    const barGap = 1;
                    const leftAxis = 36;
                    const rightPad = 12;
                    const topPad = 10;
                    const bottomLabels = 80;
                    const outerHeight = 320; // h-80
                    const innerHeight = outerHeight - bottomLabels - topPad;
                    const yScale = innerHeight / (maxQuarterly || 1);
                    const width = leftAxis + latestQuarters.length * (barWidth + barGap) + rightPad;
                    const height = outerHeight;
                    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * maxQuarterly));
                    return (
                      <svg width={width} height={height}>
                        {/* Y grid + axis */}
                        <g>
                          {ticks.map((t, i) => {
                            const y = topPad + innerHeight - t * yScale;
                            return (
                              <g key={`yt-${i}`}>
                                <line x1={leftAxis} y1={y} x2={width - rightPad} y2={y} stroke="hsl(var(--border))" strokeWidth={i === ticks.length - 1 ? 1 : 0.5} />
                                <text x={leftAxis - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
                                  {t}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                        {/* Bars */}
                        <g>
                          {latestQuarters.map(({ key, total, parts }, idx) => {
                            const x = leftAxis + idx * (barWidth + barGap);
                            let yCursor = topPad + innerHeight;
                            const isActive = hovered?.key === key;
                            return (
                              <g key={key} onMouseEnter={() => setHovered({ key, total, parts })}>
                                {parts.map((p) => {
                                  const h = p.count * yScale;
                                  yCursor -= h;
                                  const color =
                                    // @ts-ignore
                                    LANGUAGE_COLORS[p.language] || LANGUAGE_COLORS.default;
                                  return (
                                    <rect key={`${key}-${p.language}`} x={x} y={yCursor} width={barWidth} height={h} fill={color} />
                                  );
                                })}
                                {isActive && (
                                  <rect x={x - 0.5} y={topPad} width={barWidth + 1} height={innerHeight} fill="none" stroke="hsl(var(--primary))" />
                                )}
                                {/* Label: vertical, year only on Q1 */}
                                {(() => {
                                  const [yearStr, qStr] = key.split("-Q");
                                  const qNum = parseInt(qStr, 10);
                                  const labelText = qNum === 1 ? `${yearStr} Q1` : `Q${qNum}`;
                                  return (
                                    <g transform={`translate(${x + barWidth / 2}, ${topPad + innerHeight + 28})`}>
                                      <text
                                        textAnchor="middle"
                                        fontSize="9"
                                        fill="hsl(var(--muted-foreground))"
                                        style={{ writingMode: "vertical-rl" as any }}
                                      >
                                        {labelText}
                                      </text>
                                    </g>
                                  );
                                })()}
                              </g>
                            );
                          })}
                        </g>
                      </svg>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Hover summary below chart */}
            <div className="border rounded-lg p-3 overflow-auto">
              <div className="text-xs text-muted-foreground mb-1">Quarter summary</div>
              {hoveredSummary ? (
                <div>
                  <div className="text-sm font-semibold mb-1">{hoveredSummary.key}</div>
                  <div className="text-sm mb-2">Total: <span className="font-semibold">{hoveredSummary.total}</span></div>
                  <ul className="space-y-1 text-sm">
                    {hoveredSummary.items.map((item) => (
                      <li key={`${hoveredSummary.key}-${item.language}`} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded"
                            style={{
                              //@ts-ignore
                              backgroundColor: LANGUAGE_COLORS[item.language] || LANGUAGE_COLORS.default,
                            }}
                          ></span>
                          <span>{item.language}</span>
                        </div>
                        <div className="tabular-nums text-muted-foreground">{item.count} ({item.pct}%)</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Hover a bar to see details</div>
              )}
            </div>
          </div>
        </div>
        {/* Legend removed in favor of hover summary */}
      </div>

      {/* Removed Weekday distribution in favor of hour x weekday heatmap */}

      {/* Hour-of-day heatmap (Sun..Sat x 0..23) */}
      <div>
        <div className="mb-2 font-semibold">Stars by Hour and Weekday</div>
        <div className="border rounded-lg p-3 overflow-x-auto">
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
                  {row.map((val, h) => (
                    <div
                      key={`cell-${wd}-${h}`}
                      className="h-4 rounded cursor-pointer"
                      style={{
                        backgroundColor: "hsl(var(--primary))",
                        opacity: Math.max(0.12, val / maxHeat),
                      }}
                      title={`${WEEKDAYS[wd]} @ ${h}:00 — ${val}`}
                      onMouseEnter={() => setHoveredHour({ wd, h })}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        {/* Hover summary for hour/day */}
        <div className="mt-3 border rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Hour summary</div>
          {hoveredHourSummary ? (
            <div>
              <div className="text-sm font-semibold mb-1">
                {WEEKDAYS[hoveredHourSummary.wd]} @ {formatHourLabel(hoveredHourSummary.h)} — Total: {hoveredHourSummary.total}
              </div>
              <ul className="space-y-1 text-sm">
                {hoveredHourSummary.items.map((item) => (
                  <li key={`hs-${hoveredHourSummary.wd}-${hoveredHourSummary.h}-${item.language}`} className="flex items-center justify-between gap-2">
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
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Hover a cell to see language breakdown</div>
          )}
        </div>
      </div>

      {/* Yearly totals */}
      <div>
        <div className="mb-2 font-semibold">Stars per Year</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {yearlyCounts.map(({ year, count }) => (
            <div key={year} className="rounded-lg border p-3 text-center">
              <div className="text-xs text-muted-foreground">{year}</div>
              <div className="text-lg font-semibold">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


