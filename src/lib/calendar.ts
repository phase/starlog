import { type StarredRepository } from "@/github/stars";

export const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
export const MONTHS = [
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
export const NO_DATA_COLOR = "#f0f0f0";

export function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
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

export function hslToString(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function getMonthData(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];

  for (let i = 0; i <= firstDay.getDay(); i++) {
    days.push(null);
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d + 1));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export function getTopLanguagesForYear(
  calendarData: { [key: string]: StarredRepository[] },
  year: string,
): [string, number][] {
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
}

export function getNicheLanguagesForYear(
  calendarData: { [key: string]: StarredRepository[] },
  year: string,
): [string, number][] {
  const languageCounts: { [key: string]: number } = {};
  Object.entries(calendarData).forEach(([date, repos]) => {
    if (date.startsWith(year)) {
      repos.forEach((repo) => {
        const language = repo.node.primaryLanguage?.name || "Unknown";
        languageCounts[language] = (languageCounts[language] || 0) + 1;
      });
    }
  });

  const topLanguages = new Set(
    getTopLanguagesForYear(calendarData, year).map(([lang]) => lang),
  );

  return Object.entries(languageCounts)
    .filter(
      ([lang, count]) =>
        count > 5 &&
        count < 40 &&
        !topLanguages.has(lang) &&
        lang !== "Unknown",
    )
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);
}

export function getMonthTotal(
  calendarData: { [key: string]: StarredRepository[] },
  year: number,
  month: number,
): number {
  return Object.entries(calendarData)
    .filter(([date]) =>
      date.startsWith(`${year}-${(month + 1).toString().padStart(2, "0")}`),
    )
    .reduce((total, [, repos]) => total + repos.length, 0);
}

export function getYearTotal(
  calendarData: { [key: string]: StarredRepository[] },
  year: string,
): number {
  return Object.entries(calendarData)
    .filter(([date]) => date.startsWith(year))
    .reduce((total, [, repos]) => total + repos.length, 0);
}

export function getFavoriteUsersForYear(
  calendarData: { [key: string]: StarredRepository[] },
  year: string,
): [string, number][] {
  const userCounts: { [key: string]: number } = {};
  Object.entries(calendarData).forEach(([date, repos]) => {
    if (date.startsWith(year)) {
      repos.forEach((repo) => {
        const owner = repo.node.owner.login;
        userCounts[owner] = (userCounts[owner] || 0) + 1;
      });
    }
  });

  return Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

export function getOverallStats(calendarData: {
  [key: string]: StarredRepository[];
}): {
  totalStars: number;
  totalLanguages: number;
  topLanguages: [string, number][];
  topUsers: [string, number][];
} {
  const languageCounts: { [key: string]: number } = {};
  const userCounts: { [key: string]: number } = {};
  let totalStars = 0;

  Object.values(calendarData).forEach((repos) => {
    totalStars += repos.length;
    repos.forEach((repo) => {
      const language = repo.node.primaryLanguage?.name;
      if (language) {
        languageCounts[language] = (languageCounts[language] || 0) + 1;
      }
      const owner = repo.node.owner.login;
      userCounts[owner] = (userCounts[owner] || 0) + 1;
    });
  });

  const topLanguages = Object.entries(languageCounts)
    .filter(([language, count]) => count > 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);

  const topUsers = Object.entries(userCounts)
    .filter(([username, count]) => count > 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);

  return {
    totalStars,
    totalLanguages: Object.keys(languageCounts).length,
    topLanguages,
    topUsers,
  };
}
