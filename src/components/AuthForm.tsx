"use client";

import { useEffect, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtom } from "jotai";
import { tokenAtom, usernameAtom } from "./state";

interface FormState {
  token: string;
  username: string;
}

export default function AuthForm() {
  const [token, setToken] = useAtom(tokenAtom);
  const [username, setUsername] = useAtom(usernameAtom);

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
