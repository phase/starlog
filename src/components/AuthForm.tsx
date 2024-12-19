"use client";

import { useEffect, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtom } from "jotai";
import { appendRepoAtom, repoAtom, tokenAtom, usernameAtom } from "./state";
import { fetchStars, type StarredRepository } from "@/github/stars";

interface FormState {
  token: string;
  username: string;
}

export default function AuthForm() {
  const [token, setToken] = useAtom(tokenAtom);
  const [username, setUsername] = useAtom(usernameAtom);
  const [repos, setRepos] = useAtom(repoAtom);
  const [_, appendRepos] = useAtom(appendRepoAtom);
  const running = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("githubToken");
    const storedUsername = localStorage.getItem("githubUsername");

    if (storedToken && storedToken !== "" && storedToken !== "null") {
      setToken(storedToken);
    }
    if (storedUsername && storedUsername !== "" && storedUsername !== "null") {
      setUsername(storedUsername);
    }

    // if there are no repos (like on first load), fetch my stars
    if (repos.length === 0) {
      setUsername("phase");
      fetchStars(appendRepos, "phase", undefined);
    }
  }, []);

  const handleSubmit = async (
    previousState: FormState | undefined,
    formData: FormData,
  ): Promise<FormState> => {
    const newToken = formData.get("tokenInput") as string;
    const newUsername = formData.get("usernameInput") as string;

    if ((newToken && newUsername) || newUsername === "phase") {
      localStorage.setItem("githubToken", newToken);
      localStorage.setItem("githubUsername", newUsername);
      setToken(newToken);
      setUsername(newUsername);
      console.log(`fetching username: ${newUsername}`);

      setRepos([]);
      try {
        await fetchStars(appendRepos, newUsername, newToken);
      } catch (err) {
        console.log(err);
      }
    }

    return { token, username };
  };

  const [formState, formAction, pending] = useActionState(handleSubmit, {
    token: token,
    username: username,
  });

  return (
    <form action={formAction} className="flex flex-row space-x-4">
      <div className="flex flex-row space-x-2">
        <div>
          <Label htmlFor="tokenInput" className="text-xs">
            GitHub API Token
          </Label>
          <Input
            name="tokenInput"
            type="password"
            defaultValue={token}
            placeholder="Enter your GitHub API token"
            required
          />
        </div>
        <div>
          <Label htmlFor="usernameInput" className="text-xs">
            Username
          </Label>
          <Input
            name="usernameInput"
            type="text"
            defaultValue={username}
            placeholder="Enter your GitHub username"
            required
          />
        </div>
      </div>
      <Button type="submit" className="mt-6" disabled={pending}>
        Scrape Stars
      </Button>
    </form>
  );
}
