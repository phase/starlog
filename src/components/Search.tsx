"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LANGUAGE_COLORS from "@/assets/data/languageColors.json";
import type { StarredRepository } from "@/github/stars";

interface SearchProps {
  starredRepos: StarredRepository[];
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: any | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

export default function Search({ starredRepos }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  const searchRepos = useCallback(
    (term: string) => {
      return starredRepos.filter(
        (repo) =>
          repo.node.name.toLowerCase().includes(term.toLowerCase()) ||
          repo.node.owner.login.toLowerCase().includes(term.toLowerCase()) ||
          (repo.node.description &&
            repo.node.description.toLowerCase().includes(term.toLowerCase())) ||
          (repo.node.primaryLanguage &&
            //@ts-ignore
            repo.node.primaryLanguage.name
              .toLowerCase()
              .includes(term.toLowerCase())),
      );
    },
    [starredRepos],
  );

  const debouncedSearch = useRef(
    debounce((term: string) => setSearchTerm(term), 50),
  );

  const searchResults = useMemo(
    () => searchRepos(searchTerm),
    [searchRepos, searchTerm],
  );

  const displayedResults = showAll
    ? searchResults.slice(0, 20)
    : searchResults.slice(0, 3);

  return (
    <div className="w-full mb-2 min-h-56">
      <div className="flex items-center mb-2 gap-2">
        <Input
          type="text"
          placeholder="Search repositories..."
          onChange={(e) => debouncedSearch.current(e.target.value)}
          className="flex-grow"
        />
        {searchResults.length > 3 && (
          <Button onClick={() => setShowAll(!showAll)}>
            {showAll ? "Show Less" : "Show More"}
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {displayedResults.map((repo) => (
          <div key={repo.node.url} className="border p-1.5 rounded-lg text-xs">
            <div className="grid grid-cols-[1fr,auto] gap-2">
              <div className="overflow-hidden">
                <a
                  href={repo.node.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline font-semibold truncate block"
                >
                  {repo.node.owner.login}/{repo.node.name}
                </a>
                <p className="text-gray-600 truncate">
                  {repo.node.description}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end mb-1">
                  {(repo.node.primaryLanguage && (
                    <>
                      <span
                        className="w-2 h-2 rounded-full mr-1"
                        style={{
                          backgroundColor:
                            //@ts-ignore
                            LANGUAGE_COLORS[repo.node.primaryLanguage.name] ||
                            LANGUAGE_COLORS.default,
                        }}
                      ></span>
                      <span className="text-xs text-gray-500">
                        {repo.node.primaryLanguage.name}
                      </span>
                    </>
                  )) || <span className="text-xs text-gray-500">Unknown</span>}
                </div>
                <p className="text-xs text-gray-400">
                  Starred: {new Date(repo.starredAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {searchResults.length === 0 && searchTerm && (
        <p className="text-center text-gray-500 mt-2 mb-4">No results found</p>
      )}
    </div>
  );
}
