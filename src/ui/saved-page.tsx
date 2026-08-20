"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/src/ui/app-header";
import { AppShell } from "@/src/ui/app-shell";
import { EggMark } from "@/src/ui/egg-mark";
import { FamilyFooter } from "@/src/ui/family-footer";
import { PickCard } from "@/src/ui/pick-card";
import { PlaceDetailsDialog } from "@/src/ui/place-details-dialog";
import { useT } from "@/src/i18n/use-t";
import { authJson } from "@/src/ui/auth-api";
import { type PlaceCard, type PickDto } from "@/src/places-agent/types";

type SavedRow = {
  id: string;
  provider: string;
  nativeId: string;
  snapshot: PickDto;
};

type PlaceDetailsPayload = {
  place: PlaceCard;
  pick: PickDto;
  saved: boolean;
  alternatives: PickDto[];
};

export default function SavedPageClient() {
  const t = useT();
  const [places, setPlaces] = useState<SavedRow[]>([]);
  const [dialogData, setDialogData] = useState<PlaceDetailsPayload | null>(null);

  async function load() {
    const data = await authJson<{ places: SavedRow[] }>("/api/saved");
    setPlaces(data.places);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function unsaveRow(row: SavedRow) {
    await authJson("/api/saved", {
      method: "DELETE",
      body: JSON.stringify({ provider: row.provider, nativeId: row.nativeId }),
    });
    if (dialogData?.pick.nativeId === row.nativeId) setDialogData(null);
    await load();
  }

  async function openDetails(pick: PickDto) {
    const details = await authJson<PlaceDetailsPayload>(
      `/api/places/${encodeURIComponent(pick.provider)}/${encodeURIComponent(pick.nativeId)}`,
    );
    setDialogData({ ...details, saved: true });
  }

  return (
    <AppShell>
      <AppHeader />
      <main id="content" className="app-main" data-testid="saved-page">
        <div className="toolbar">
          <h1>{t("eat.saved.title")}</h1>
        </div>

        {places.length === 0 ? (
          <div className="empty-state" data-empty data-testid="saved-empty">
            <EggMark size={72} />
            <h2>{t("eat.saved.empty")}</h2>
            <p>
              <Link className="btn" href="/decide">
                {t("eat.home.cta")}
              </Link>
            </p>
          </div>
        ) : (
          <div className="pick-grid" data-results data-saved-list>
            {places.map((row) => (
              <PickCard
                key={row.id}
                pick={row.snapshot}
                testId="saved-card"
                showMap={false}
                onDetails={() => openDetails(row.snapshot)}
                onUnsave={() => unsaveRow(row)}
              />
            ))}
          </div>
        )}
      </main>
      <FamilyFooter variant="app" />

      {dialogData ? (
        <PlaceDetailsDialog
          place={dialogData.place}
          pick={dialogData.pick}
          alternatives={dialogData.alternatives}
          saved
          variant="saved"
          onClose={() => setDialogData(null)}
          onToggleSave={() => undefined}
          onSelectAlternative={(alt) => openDetails(alt)}
          onUnsave={async () => {
            await authJson("/api/saved", {
              method: "DELETE",
              body: JSON.stringify({
                provider: dialogData.pick.provider,
                nativeId: dialogData.pick.nativeId,
              }),
            });
            setDialogData(null);
            await load();
          }}
        />
      ) : null}
    </AppShell>
  );
}
