import LANGUAGE_COLORS from "@/assets/data/languageColors.json";
import type { StarredRepository } from "@/github/stars";
import { getOverallStats } from "@/lib/calendar";

interface SummaryProps {
  calendarData: { [key: string]: StarredRepository[] };
}

export default function Summary({ calendarData }: SummaryProps) {
  const overallStats = getOverallStats(calendarData);

  return (
    <div className="mt-2">
      <p className="text-sm mb-4">
        Starred <span className="font-semibold">{overallStats.totalStars}</span> repositories made with
        <span className="font-semibold ml-1">{overallStats.totalLanguages}</span> languages.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="text-sm">
          <p className="mb-1 font-semibold">Favorite Languages</p>
          <ul className="list-decimal ml-5 md:columns-2 [column-fill:balance]">
            {overallStats.topLanguages
              .slice(0, 500)
                .map(([lang, count]) => (
                <li key={lang} className="flex items-center break-inside-avoid">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2"
                      style={{
                        //@ts-ignore
                        backgroundColor: LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default,
                      }}
                    ></span>
                    {lang}
                    <span className="text-muted-foreground ml-1">({count})</span>
                  </li>
                ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-1 font-semibold">Favorite Users</p>
          <ul className="list-decimal ml-5 md:columns-2 [column-fill:balance]">
              {overallStats.topUsers
                .slice(0, 500)
                .map(([user, count]) => (
                  <li key={user} className="break-inside-avoid">
                    <a
                      href={`https://github.com/${user}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {user}
                    </a>
                    <span className="text-muted-foreground ml-1">({count})</span>
                  </li>
                ))}
          </ul>
        </div>
      </div>
    </div>
  );
}


