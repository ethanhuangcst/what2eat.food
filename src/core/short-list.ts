import { type PickDto } from "../places-agent/types";

const PAGE_SIZE = 6;

export type SearchCachePayload = {
  picks: PickDto[];
  cursor: number;
  criteria: Record<string, unknown>;
  updatedAt: string;
};

export function paginatePicks(
  picks: PickDto[],
  page: number,
  pageSize = PAGE_SIZE,
): { slice: PickDto[]; from: number; to: number; total: number } {
  const total = picks.length;
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize + 1;
  const start = (safePage - 1) * pageSize;
  const slice = picks.slice(start, start + pageSize);
  const to = total === 0 ? 0 : Math.min(start + slice.length, total);
  return { slice, from: total === 0 ? 0 : from, to, total };
}

export function reshufflePicks(picks: PickDto[], cursor: number, count = PAGE_SIZE): {
  slice: PickDto[];
  nextCursor: number;
} {
  if (picks.length === 0) return { slice: [], nextCursor: 0 };
  const start = cursor % picks.length;
  const slice: PickDto[] = [];
  for (let i = 0; i < count; i += 1) {
    slice.push(picks[(start + i) % picks.length]);
  }
  return { slice, nextCursor: (start + count) % picks.length };
}
