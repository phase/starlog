import { atom } from "jotai";

const usernameAtom = atom<string>("");
const tokenAtom = atom<string>("");

export { usernameAtom, tokenAtom };
