import { type PlaceSource } from "../places-agent/types";

export function pickMapUrl(sources: PlaceSource[]): string | null {
  for (const source of sources) {
    const links = source.deeplinks ?? {};
    for (const url of Object.values(links)) {
      if (url && !url.includes("key=") && !url.includes("api_key")) {
        return url;
      }
    }
  }
  return null;
}
