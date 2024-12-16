import type { StarredRepository } from "@/github/stars";
import { useMemo } from "react";

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

const LANGUAGE_COLORS: { [key: string]: string } = {
  JavaScript: "#f1e05a",
  TypeScript: "#2b7489",
  Python: "#3572A5",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  Swift: "#ffac45",
  Kotlin: "#F18E33",
  PHP: "#4F5D95",
  Scala: "#c22d40",
  Haskell: "#5e5086",
  Lua: "#000080",
  Shell: "#89e051",
  PowerShell: "#012456",
  Perl: "#0298c3",
  R: "#198CE7",
  MATLAB: "#e16737",
  Dart: "#00B4AB",
  Elixir: "#6e4a7e",
  Clojure: "#db5855",
  Erlang: "#B83998",
  Julia: "#a270ba",
  Groovy: "#e69f56",
  Assembly: "#6E4C13",
  ObjectiveC: "#438eff",
  "Vim script": "#199f4b",
  OCaml: "#3be133",
  Fortran: "#4d41b1",
  COBOL: "#7f7f7f",
  Lisp: "#3fb68b",
  "F#": "#b845fc",
  Crystal: "#000100",
  Prolog: "#74283c",
  Elm: "#60B5CC",
  Racket: "#3c5caa",
  Zig: "#ec915c",
  Haxe: "#df7900",
  Nim: "#37775b",
  Raku: "#0000fb",
  Vala: "#fbe5cd",
  Nix: "#7e7eff",
  Reason: "#ff5847",
  Idris: "#b30000",
  Scheme: "#1e4aec",
  Ada: "#02f88c",
  Forth: "#341708",
  Tcl: "#e4cc98",
  Apex: "#1797c0",
  SAS: "#B34936",
  ActionScript: "#882B0F",
  Smalltalk: "#596706",
  D: "#ba595e",
  Solidity: "#AA6746",
  Cuda: "#3A4E3A",
  default: "#cccccc",
};

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

  const getColor = (repos: StarredRepository[]): string => {
    const languageCounts = getLanguagesForDay(repos);
    const mostPopularLanguage = getMostPopularLanguage(languageCounts);
    return LANGUAGE_COLORS[mostPopularLanguage] || LANGUAGE_COLORS.default;
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
      .slice(0, 7);
  };

  const formatTooltip = (
    dateString: string,
    repos: StarredRepository[],
  ): string => {
    const languageCounts = getLanguagesForDay(repos);
    const languageList = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([lang, count]) => `${lang}: ${count}`)
      .join("\n");
    return `${dateString}\nTotal stars: ${repos.length}\nLanguages:\n${languageList}`;
  };

  return (
    <div className="space-y-8">
      {years.map((year) => (
        <div key={year} className="space-y-4">
          <div>
            <div className="text-sm font-semibold">{year}</div>
            <div className="text-xs text-gray-500 mt-1">
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
                <div key={day} className="h-4 w-4 text-[10px] text-gray-400">
                  {day[0]}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap">
              {MONTHS.map((month, monthIndex) => (
                <div key={month} className="mr-4 mb-4">
                  <div className="flex">
                    {getMonthData(parseInt(year), monthIndex).map(
                      (week, weekIndex) => (
                        <div key={weekIndex} className="mr-1">
                          {week.map((date) => {
                            const dateString = date.toISOString().split("T")[0];
                            const repos = calendarData[dateString] || [];
                            return (
                              <div
                                key={dateString}
                                className="w-4 h-4 rounded-sm"
                                style={{
                                  backgroundColor:
                                    date.getMonth() === monthIndex
                                      ? getColor(repos)
                                      : "transparent",
                                }}
                                title={formatTooltip(dateString, repos)}
                              />
                            );
                          })}
                        </div>
                      ),
                    )}
                  </div>
                  <div className="text-xs text-center mt-1">{month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
