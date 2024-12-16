"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthForm() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("githubToken");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("githubToken", token);
    localStorage.setItem("githubUsername", username);
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <div>
        <Label htmlFor="token">GitHub API Token</Label>
        <Input
          id="token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter your GitHub API token"
          required
        />
      </div>
      <div>
        <Label htmlFor="username">GitHub Username</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your GitHub username"
          required
        />
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
}
