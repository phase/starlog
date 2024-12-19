import type { StarredRepository } from "@/github/stars";
import cachedPhase from "@/assets/data/phase.json";
import { atom } from "jotai";

export const usernameAtom = atom<string>("");
export const tokenAtom = atom<string>("");

export const repoAtom = atom<StarredRepository[]>([]);
export const appendRepoAtom = atom(
  (get) => get(repoAtom),
  (get, set, newRepos: StarredRepository[]) => {
    set(repoAtom, (prev) =>
      [...prev, ...newRepos].sort((a, b) => {
        const dateA = new Date(a.starredAt);
        const dateB = new Date(b.starredAt);
        return isNaN(dateB.getTime())
          ? -1
          : isNaN(dateA.getTime())
            ? 1
            : dateB.getTime() - dateA.getTime();
      }),
    );
  },
);
