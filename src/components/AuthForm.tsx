"use client";

import { useEffect, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtom } from "jotai";
import { appendRepoAtom, repoAtom, tokenAtom, usernameAtom } from "./state";
import { GraphQLClient } from "graphql-request";
import { fetchStarredRepositoriesStream } from "@/github/stars";

interface FormState {
  token: string;
  username: string;
}

export default function AuthForm() {
  const [token, setToken] = useAtom(tokenAtom);
  const [username, setUsername] = useAtom(usernameAtom);
  const [repos, setRepos] = useAtom(repoAtom);
  const [_, appendRepos] = useAtom(appendRepoAtom);

  useEffect(() => {
    const storedToken = localStorage.getItem("githubToken");
    const storedUsername = localStorage.getItem("githubUsername");

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleSubmit = async (
    previousState: FormState | undefined,
    formData: FormData,
  ): Promise<FormState> => {
    const newToken = formData.get("tokenInput") as string;
    const newUsername = formData.get("usernameInput") as string;

    if (newToken && newUsername) {
      localStorage.setItem("githubToken", newToken);
      localStorage.setItem("githubUsername", newUsername);
      setToken(newToken);
      setUsername(newUsername);
      console.log(`fetching username: ${newUsername}`);

      setRepos([]);
      try {
        // first try fetching from localStorage cache
        const cachedRepos = localStorage.getItem(newUsername);
        if (cachedRepos) {
          const repos = JSON.parse(cachedRepos);
          if (repos && repos != null && repos != "null" && repos != '"null"') {
            appendRepos(repos);
          } else {
            console.log(`removing invalid cache for ${newUsername}: ${repos}`);
            localStorage.removeItem(newUsername);
          }
        } else {
          // then try to fetch from cached JSON
          const response = await fetch(`/cached/${newUsername}.json`);

          if (response.ok) {
            const repos = await response.json();

            // break repos into chunks and append them
            // with a delay between so the dom doesn't get overloaded
            const chunkSize = 1600;
            for (let i = 0; i < repos.length; i += chunkSize) {
              const chunk = repos.slice(i, i + chunkSize);
              appendRepos(chunk);
              await new Promise((resolve) => setTimeout(resolve, 150));
            }
          } else {
            if (token !== "" && token !== "token") {
              // If no cached data, fetch from GitHub API
              const client = new GraphQLClient(
                "https://api.github.com/graphql",
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              fetchStarredRepositoriesStream(appendRepos, client, newUsername);
            }
          }
        }
      } catch (err) {
        console.log(err);
      }
    }

    return { token, username };
  };

  const [formState, formAction] = useActionState(handleSubmit, {
    token: token,
    username: username,
  });

  return (
    <form action={formAction} className="flex flex-row space-x-4">
      <div className="flex flex-row space-x-2">
        <div>
          <Label htmlFor="tokenInput">GitHub API Token</Label>
          <Input
            name="tokenInput"
            type="password"
            defaultValue={token}
            placeholder="Enter your GitHub API token"
            required
          />
        </div>
        <div>
          <Label htmlFor="usernameInput">GitHub Username</Label>
          <Input
            name="usernameInput"
            type="text"
            defaultValue={username}
            placeholder="Enter your GitHub username"
            required
          />
        </div>
      </div>
      <Button type="submit" className="mt-6">
        Scrape Stars
      </Button>
    </form>
  );
}
