"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BlockCalendar from "@/components/BlockCalendar";
import Rankings from "@/components/Rankings";
import { GraphQLClient } from "graphql-request";
import fetchStarredRepositories, {
  type StarredRepository,
} from "@/github/stars";

export default function Dashboard() {
  const [starredRepos, setStarredRepos] = useState<StarredRepository[]>([]);
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

      console.log("creating graphql client with token", token);

      const client = new GraphQLClient("https://api.github.com/graphql", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      try {
        const repos = await fetchStarredRepositories(client, username, 1);
        setStarredRepos((prev) => {
          return repos;
        });
        setLoading(false);
      } catch (err) {
        setError("Error fetching starred repositories");
        setLoading(false);
      }
    };

    fetchStarredRepos();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
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
