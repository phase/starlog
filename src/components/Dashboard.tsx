"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BlockCalendar from "@/components/BlockCalendar";
import Rankings from "@/components/Rankings";
import { GraphQLClient } from "graphql-request";
import fetchStarredRepositories, {
  type StarredRepository,
} from "@/github/stars";
import cachedPhase from "@/assets/data/phase.json";

export default function Dashboard() {
  const [starredRepos, setStarredRepos] =
    useState<StarredRepository[]>(cachedPhase);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchStarredRepos = async () => {
      const token = localStorage.getItem("githubToken");
      const username = localStorage.getItem("githubUsername");

      if (!token || !username) {
        setError("Please provide both GitHub token and username");
        setLoading(false);
        return;
      }
      try {
        // First try to fetch from cached JSON
        const response = await fetch(`/cached/${username}.json`);

        if (response.ok) {
          const cachedRepos = await response.json();
          console.log(`using cache for ${username}`);
          setStarredRepos(cachedRepos);
          setLoading(false);
          return;
        }

        // If no cached data, fetch from GitHub API
        console.log("creating graphql client with token", token);

        const client = new GraphQLClient("https://api.github.com/graphql", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const repos = await fetchStarredRepositories(client, username, 1);
        setStarredRepos(repos);
        setLoading(false);
      } catch (err) {
        setError("Error fetching starred repositories");
        setLoading(false);
      }
    };

    fetchStarredRepos();
  }, []);

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
    return <div className="text-red-500">{error}</div>;
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
      <Card>
        <CardHeader>
          <CardTitle>Repository Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Rankings starredRepos={starredRepos} />
        </CardContent>
      </Card>
    </div>
  );
}
