"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BlockCalendar from "@/components/BlockCalendar";
import { useAtomValue } from "jotai";
import { repoAtom } from "./state";
import Search from "./Search";
import { useMemo, useState } from "react";
import type { StarredRepository } from "@/github/stars";
import Summary from "./Summary";
import Stats from "./Stats";

export default function Dashboard() {
  const starredRepos = useAtomValue(repoAtom);
  const [activeTab, setActiveTab] = useState<"calendar" | "stats" | "summary">(
    "calendar",
  );

  const calendarData = useMemo(() => {
    const data: { [key: string]: StarredRepository[] } = {};
    starredRepos.forEach((repo) => {
      const date = repo.starredAt.split("T")[0];
      if (!data[date]) data[date] = [];
      data[date].push(repo);
    });
    return data;
  }, [starredRepos]);
  return (
    <>
      <div>
        <Search starredRepos={starredRepos} />
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-end justify-between">
              <CardTitle>Starred Repositories</CardTitle>
              <div className="flex gap-2 border-b">
                <button
                  className={`${
                    activeTab === "calendar"
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground"
                  } px-2 py-1 text-sm`}
                  onClick={() => setActiveTab("calendar")}
                >
                  Calendar
                </button>
                <button
                  className={`${
                    activeTab === "stats"
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground"
                  } px-2 py-1 text-sm`}
                  onClick={() => setActiveTab("stats")}
                >
                  Stats
                </button>
                <button
                  className={`${
                    activeTab === "summary"
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground"
                  } px-2 py-1 text-sm`}
                  onClick={() => setActiveTab("summary")}
                >
                  Summary
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "calendar" && (
              <BlockCalendar starredRepos={starredRepos} />
            )}
            {activeTab === "stats" && (
              <Stats calendarData={calendarData} starredRepos={starredRepos} />
            )}
            {activeTab === "summary" && (
              <Summary calendarData={calendarData} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
