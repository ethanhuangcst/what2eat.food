import { authJson } from "@/src/ui/auth-api";
import { type PickDto } from "@/src/places-agent/types";

export async function recordWent(input: {
  pick: PickDto;
  area?: string;
  mealContext?: string;
  searchId?: string;
}): Promise<void> {
  try {
    await authJson("/api/history", {
      method: "POST",
      body: JSON.stringify({
        provider: input.pick.provider,
        nativeId: input.pick.nativeId,
        placeSnapshot: input.pick,
        area: input.area,
        mealContext: input.mealContext,
        searchId: input.searchId,
      }),
    });
  } catch {
    /* history is best-effort */
  }
}
