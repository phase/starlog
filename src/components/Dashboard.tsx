"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BlockCalendar from "@/components/BlockCalendar";
import { useAtomValue } from "jotai";
import { repoAtom } from "./state";
import Search from "./Search";

export default function Dashboard() {
  const starredRepos = useAtomValue(repoAtom);
  return (
    <>
      <div>
        <Search starredRepos={starredRepos} />
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Starred Repositories Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <BlockCalendar starredRepos={starredRepos} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
