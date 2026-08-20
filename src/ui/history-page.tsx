"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/src/ui/app-header";
import { AppShell } from "@/src/ui/app-shell";
import { FamilyFooter } from "@/src/ui/family-footer";
import { useLocale, useT } from "@/src/i18n/use-t";
import { authJson } from "@/src/ui/auth-api";
import { type PickDto } from "@/src/places-agent/types";
import {
  formatMealContextDisplay,
  formatMealContextStorage,
  parseMealContext,
} from "@/src/core/meal-contexts";

type HistoryRow = {
  id: string;
  placeSnapshot: PickDto;
  area: string | null;
  mealContext: string | null;
  outcome: string;
  decidedAt: string;
};

function mealContextLabelForRow(mealContext: string | null, locale: ReturnType<typeof useLocale>): string | null {
  if (!mealContext) return null;
  return formatMealContextDisplay(parseMealContext(mealContext), locale);
}

function rerunHref(row: HistoryRow): string {
  const params = new URLSearchParams();
  if (row.area) params.set("location", row.area);
  if (row.mealContext) {
    params.set("meal", formatMealContextStorage(parseMealContext(row.mealContext)));
  }
  const q = params.toString();
  return q ? `/decide?${q}` : "/decide";
}

export default function HistoryPageClient() {
  const t = useT();
  const locale = useLocale();
  const [rows, setRows] = useState<HistoryRow[]>([]);

  useEffect(() => {
    authJson<{ decisions: HistoryRow[] }>("/api/history")
      .then((data) => setRows(data.decisions))
      .catch(() => setRows([]));
  }, []);

  return (
    <AppShell>
      <AppHeader />
      <main id="content" className="app-main" data-testid="history-page">
        <div className="toolbar">
          <h1>{t("eat.history.title")}</h1>
          <Link href="/saved">{t("eat.nav.saved")}</Link>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state" data-empty data-testid="history-empty">
            <h2>{t("eat.history.empty")}</h2>
            <p>
              <Link className="btn" href="/decide">
                {t("eat.nav.decide")}
              </Link>
            </p>
          </div>
        ) : (
          <section className="panel" data-results>
            {rows.map((row) => (
              <div key={row.id} className="history-row" data-testid="history-row">
                <div>
                  <h2>{row.placeSnapshot.name}</h2>
                  <p className="meta">
                    {[row.area, mealContextLabelForRow(row.mealContext, locale)].filter(Boolean).join(" · ")}
                  </p>
                  <span className="chip" data-testid="history-went">
                    {t("eat.history.went")}
                  </span>
                </div>
                <Link className="btn btn-quiet" href={rerunHref(row)} data-testid="history-rerun">
                  {t("eat.history.rerun")}
                </Link>
              </div>
            ))}
          </section>
        )}
      </main>
      <FamilyFooter variant="app" />
    </AppShell>
  );
}
