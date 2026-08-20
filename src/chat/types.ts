import { type PlaceSource } from "@/src/places-agent/types";

export type ChatRole = "user" | "assistant";

export type ChatBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; items: string[] }
  | {
      type: "pick_ref";
      provider: string;
      nativeId: string;
      note?: string;
      name?: string;
      photoUrl?: string;
      rating?: number;
      category?: string;
      mapUrl?: string;
    }
  | { type: "link"; label: string; href: string };

export type HydratedPickRef = Extract<ChatBlock, { type: "pick_ref" }> & { name: string };

export type ChatTurn = {
  role: ChatRole;
  /** Plain text for agent history + a11y; always set. */
  content: string;
  blocks?: ChatBlock[];
  fallbackText?: string;
  key?: string;
};

export type ListChatPickRef = {
  name: string;
  nativeId: string;
  provider: string;
  photoUrl?: string;
  rating?: number;
  category?: string;
  sources?: PlaceSource[];
  mapUrl?: string;
};

export type ListChatContext = {
  searchId?: string;
  location?: string;
  mealContext?: string;
  budget?: string;
  picks?: ListChatPickRef[];
};

export type PlaceChatContext = {
  provider: string;
  nativeId: string;
  name: string;
  address?: string;
  category?: string;
  photoUrl?: string;
  rating?: number;
  sources?: PlaceSource[];
  mapUrl?: string;
};
