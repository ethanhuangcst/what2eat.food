"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/src/ui/app-header";
import { AppShell } from "@/src/ui/app-shell";
import { FamilyFooter } from "@/src/ui/family-footer";
import { useT } from "@/src/i18n/use-t";
import { authJson } from "@/src/ui/auth-api";
import { type PickDto } from "@/src/places-agent/types";

type SavedRow = {
  id: string;
  provider: string;
  nativeId: string;
  snapshot: PickDto;
};

export default function SavedPageClient() {
  const t = useT();
  const [places, setPlaces] = useState<SavedRow[]>([]);

  async function load() {
    const data = await authJson<{ places: SavedRow[] }>("/api/saved");
    setPlaces(data.places);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function unsave(row: SavedRow) {
    await authJson("/api/saved", {
      method: "DELETE",
      body: JSON.stringify({ provider: row.provider, nativeId: row.nativeId }),
    });
    await load();
  }

  return (
    <AppShell>
      <AppHeader />
      <main id="content" data-testid="saved-page">
        <h1>{t("eat.saved.title")}</h1>
        {places.length === 0 ? (
          <p className="empty" data-testid="saved-empty">{t("eat.saved.empty")}</p>
        ) : (
          <div className="card-grid">
            {places.map((row) => (
              <article className="pick-card" key={row.id} data-testid="saved-card">
                <h3>{row.snapshot.name}</h3>
                <p>{row.snapshot.address}</p>
                <button type="button" className="btn btn-quiet" data-testid="saved-unsave" onClick={() => unsave(row)}>
                  {t("eat.saved.unsave")}
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
      <FamilyFooter variant="app" />
    </AppShell>
  );
}
