"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BlockCalendar from "@/components/BlockCalendar";
import { GraphQLClient } from "graphql-request";
import fetchStarredRepositories, {
  type StarredRepository,
} from "@/github/stars";
import cachedPhase from "@/assets/data/phase.json";
import { useAtomValue } from "jotai";
import { tokenAtom, usernameAtom } from "./state";

export default function Dashboard() {
  const token = useAtomValue(tokenAtom);
  const username = useAtomValue(usernameAtom);

  const [starredRepos, setStarredRepos] = useState<StarredRepository[]>(
    cachedPhase ?? [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStarredRepos = async () => {
      if (!token || !username) {
        setError("Please provide both GitHub token and username");
        setLoading(false);
        return;
      }

      try {
        // first try fetching from localStorage cache
        const cachedRepos = localStorage.getItem(username);
        if (cachedRepos) {
          const repos = JSON.parse(cachedRepos);
          if (repos && repos != null && repos != "null" && repos != '"null"') {
            setError(null);
            setStarredRepos(repos);
            setLoading(false);
            return;
          } else {
            console.log(`removing invalid cache for ${username}: ${repos}`);
            localStorage.removeItem(username);
          }
        }

        // then try to fetch from cached JSON
        const response = await fetch(`/cached/${username}.json`);

        if (response.ok) {
          const repos = await response.json();
          setError(null);
          setStarredRepos(repos);
          setLoading(false);

          // set localStorage cache
          localStorage.setItem(username, JSON.stringify(repos));
          return;
        }

        if (token !== "" && token !== "token") {
          // If no cached data, fetch from GitHub API
          console.log("creating graphql client with token", token);

          const client = new GraphQLClient("https://api.github.com/graphql", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const repos = await fetchStarredRepositories(client, username, 1);

          setError(null);
          setStarredRepos(repos);
          setLoading(false);

          // set localStorage cache
          localStorage.setItem(username, JSON.stringify(repos));
        } else {
          console.log(`token: ${token}. username: ${username}`);
          setError(null);
          setError("Please provide a GitHub token");
          setLoading(false);
        }
      } catch (err) {
        setError("Error fetching starred repositories");
        setLoading(false);
      }
    };

    fetchStarredRepos();
  }, [username, token, setLoading, setError, setStarredRepos]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Example GitHub Stars Calendar Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <BlockCalendar starredRepos={cachedPhase} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="text-red-500">{error}</div>
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Example GitHub Stars Calendar Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <BlockCalendar starredRepos={cachedPhase} />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
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
  );
}
