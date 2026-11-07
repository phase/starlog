"use client";

import { useEffect, useActionState, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtom } from "jotai";
import { appendRepoAtom, repoAtom, tokenAtom, usernameAtom } from "./state";
import { fetchStarsCancelable } from "@/github/stars";

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
  const [loadingUsername, setLoadingUsername] = useState<string | null>(null);
  const currentCancelRef = useRef<null | (() => void)>(null);

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
    if (repos.length === 0 && !username) {
      const username = "phase";
      setUsername(username);
      if (currentCancelRef.current) currentCancelRef.current();
      setLoadingUsername(username);
      const { cancel, promise } = fetchStarsCancelable((data) => {
        appendRepos(data);
      }, username, undefined);
      currentCancelRef.current = cancel;
      promise.finally(() => {
        setLoadingUsername((prev) => (prev === username ? null : prev));
      });
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
        if (currentCancelRef.current) currentCancelRef.current();
        setLoadingUsername(newUsername);
        const { cancel, promise } = fetchStarsCancelable((data) => {
          appendRepos(data);
        }, newUsername, newToken);
        currentCancelRef.current = cancel;
        // Do not await; allow UI to keep responding while pages stream in
        promise.finally(() => {
          setLoadingUsername((prev) => (prev === newUsername ? null : prev));
        });
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
    <form action={formAction} className="flex flex-row items-end gap-4">
      <div className="flex flex-row gap-2">
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
      <div className="flex items-end gap-3">
        <Button type="submit" className="h-[28px] px-3 self-end">Load Stars</Button>
        {loadingUsername && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground self-end" aria-live="polite">
            <Loader2 className="animate-spin" />
            <span className="text-xs">
              Loading stars for <span className="font-semibold">{loadingUsername}</span>…
            </span>
          </div>
        )}
      </div>
    </form>
  );
}
