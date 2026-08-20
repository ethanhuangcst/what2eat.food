"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/src/ui/app-header";
import { AppShell } from "@/src/ui/app-shell";
import { EggMark } from "@/src/ui/egg-mark";
import { FamilyFooter } from "@/src/ui/family-footer";
import { PickCard } from "@/src/ui/pick-card";
import { PlaceDetailsDialog } from "@/src/ui/place-details-dialog";
import { useLocale, useT } from "@/src/i18n/use-t";
import { htmlLang, type Locale } from "@/src/core/locales";
import { authJson } from "@/src/ui/auth-api";
import { DECIDE_PAGE_SIZE } from "@/src/core/short-list";
import { type PlaceCard, type PickDto } from "@/src/places-agent/types";

type SearchResult = {
  searchId: string;
  picks: PickDto[];
  total: number;
  from: number;
  to: number;
  updatedAt: string;
  skipped: { provider: string; reason_key: string }[];
  empty: boolean;
};

type PlaceDetailsPayload = {
  place: PlaceCard;
  pick: PickDto;
  saved: boolean;
  alternatives: PickDto[];
};

const MEAL_CONTEXT_KEYS = [
  "eat.meal.weekday_lunch",
  "eat.meal.weekend_dinner",
  "eat.meal.quick",
  "eat.meal.celebration",
  "eat.meal.family_dinner",
  "eat.meal.dating",
  "eat.meal.friends",
  "eat.meal.business",
  "eat.meal.solo",
  "eat.meal.brunch",
  "eat.meal.late_night",
] as const;

function formatTime(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(htmlLang(locale), { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function DecidePageClient() {
  const t = useT();
  const locale = useLocale();
  const [location, setLocation] = useState("Clerkenwell, London");
  const [mealContext, setMealContext] = useState("Weekend dinner");
  const [budget, setBudget] = useState("$$");
  const [craving, setCraving] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [page, setPage] = useState(1);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [dialogData, setDialogData] = useState<PlaceDetailsPayload | null>(null);

  const mealOptions = useMemo(() => MEAL_CONTEXT_KEYS.map((key) => t(key)), [t]);

  useEffect(() => {
    authJson<{ defaultLocation?: string }>("/api/profile/personal")
      .then((p) => {
        if (p.defaultLocation) setLocation(p.defaultLocation);
      })
      .catch(() => undefined);
  }, []);

  async function search(nextPage = 1) {
    setErrorKey(null);
    try {
      const body = { location, mealContext, budget, craving, page: nextPage };
      const data = await authJson<SearchResult>("/api/decide/search", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult(data);
      setPage(nextPage);
    } catch {
      setErrorKey("errors.provider_failed");
    }
  }

  async function goPage(next: number) {
    if (!result) return;
    const data = await authJson<SearchResult>("/api/decide/reshuffle", {
      method: "POST",
      body: JSON.stringify({ searchId: result.searchId, page: next, mode: "page" }),
    });
    setResult(data);
    setPage(next);
  }

  async function reshuffle() {
    if (!result) return;
    const data = await authJson<SearchResult>("/api/decide/reshuffle", {
      method: "POST",
      body: JSON.stringify({ searchId: result.searchId, mode: "reshuffle" }),
    });
    setResult(data);
    setPage(1);
  }

  async function openDetails(pick: PickDto) {
    const details = await authJson<PlaceDetailsPayload>(
      `/api/places/${encodeURIComponent(pick.provider)}/${encodeURIComponent(pick.nativeId)}`,
    );
    setDialogData(details);
  }

  async function toggleSave() {
    if (!dialogData) return;
    const { pick, saved } = dialogData;
    if (saved) {
      await authJson("/api/saved", {
        method: "DELETE",
        body: JSON.stringify({ provider: pick.provider, nativeId: pick.nativeId }),
      });
      setDialogData({ ...dialogData, saved: false });
    } else {
      await authJson("/api/saved", {
        method: "POST",
        body: JSON.stringify({
          provider: pick.provider,
          nativeId: pick.nativeId,
          snapshot: pick,
        }),
      });
      setDialogData({ ...dialogData, saved: true });
    }
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / DECIDE_PAGE_SIZE)) : 1;

  return (
    <AppShell>
      <AppHeader />
      <main id="content" className="app-main">
        <div className="decide-head">
          <h1>{t("eat.decide.headline")}</h1>
          <p className="meta">{t("eat.decide.results")}</p>
        </div>

        <section className="decide-criteria" aria-labelledby="criteria-title">
          <h2 id="criteria-title" className="decide-section-title">
            {t("eat.decide.criteria_title")}
          </h2>
          <form
            className="decide-form"
            onSubmit={(e) => {
              e.preventDefault();
              search(1);
            }}
          >
            <div className="field">
              <label htmlFor="location">{t("eat.decide.location")}</label>
              <input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                data-testid="decide-location"
              />
            </div>
            <div className="field field--meal-context">
              <label htmlFor="meal_context">{t("eat.decide.meal_context")}</label>
              <input
                id="meal_context"
                list="meal-contexts"
                autoComplete="off"
                value={mealContext}
                onChange={(e) => setMealContext(e.target.value)}
                placeholder={t("eat.decide.meal_context_ph")}
              />
              <datalist id="meal-contexts">
                {mealOptions.map((label) => (
                  <option key={label} value={label} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label htmlFor="budget">{t("eat.decide.budget")}</label>
              <select id="budget" value={budget} onChange={(e) => setBudget(e.target.value)} data-testid="decide-budget">
                <option value="$">$</option>
                <option value="$$">$$</option>
                <option value="$$$">$$$</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="craving">{t("eat.decide.craving")}</label>
              <input
                id="craving"
                value={craving}
                onChange={(e) => setCraving(e.target.value)}
                placeholder={t("eat.decide.craving_ph")}
              />
            </div>
            <button className="btn" type="submit" data-testid="decide-submit">
              {t("eat.decide.submit")}
            </button>
          </form>
        </section>

        {errorKey ? <p className="error">{t(errorKey)}</p> : null}

        {result ? (
          <section className="decide-results" aria-labelledby="results-title" data-testid="decide-results">
            {!result.empty ? (
              <div className="decide-results__head" data-toolbar>
                <div className="decide-results__title-row">
                  <h2 id="results-title" className="decide-section-title decide-results__title">
                    {t("eat.decide.results_title_updated", { time: formatTime(result.updatedAt, locale) })}
                  </h2>
                  <button
                    type="button"
                    className="btn-reshuffle"
                    title={t("eat.decide.reshuffle_hint")}
                    data-testid="decide-reshuffle"
                    onClick={reshuffle}
                  >
                    <svg className="btn-reshuffle__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M4 7h9.5a3.5 3.5 0 0 1 0 7H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M7 4 4 7l3 3M16 13h-9.5a3.5 3.5 0 0 1 0-7H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="m13 16 3-3-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{t("eat.decide.reshuffle")}</span>
                  </button>
                </div>
                <p className="meta decide-results__summary" data-testid="decide-summary">
                  {t("eat.decide.results_summary", {
                    shown: String(result.from),
                    end: String(result.to),
                    total: String(result.total),
                  })}
                </p>
              </div>
            ) : null}

            {result.skipped?.length ? (
              <div className="alert-banner is-info" role="status" data-partial>
                {t("eat.decide.partial_banner")}
              </div>
            ) : null}

            {result.empty ? (
              <div className="empty-state" data-empty data-testid="decide-empty">
                <EggMark size={72} />
                <h3>{t("eat.decide.empty_title")}</h3>
                <p>{t("eat.decide.empty_body")}</p>
                <p>
                  <Link className="btn" href="/profile">
                    {t("eat.decide.empty_action")}
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <div className="pick-grid" data-results data-decide-pages>
                  {result.picks.map((pick) => (
                    <PickCard key={pick.id} pick={pick} onDetails={openDetails} />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <nav className="decide-pagination" aria-label={t("eat.a11y.page_list")} data-decide-pagination>
                    <button
                      type="button"
                      className="btn btn-quiet decide-pagination__nav"
                      disabled={page <= 1}
                      onClick={() => goPage(page - 1)}
                    >
                      {t("eat.pagination.prev")}
                    </button>
                    <div className="decide-pagination__pages" role="group" aria-label={t("eat.a11y.page_list")}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`decide-pagination__num${num === page ? " is-active" : ""}`}
                          aria-current={num === page ? "page" : undefined}
                          onClick={() => goPage(num)}
                        >
                          {t("eat.pagination.page_num", { page: String(num) })}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn btn-quiet decide-pagination__nav"
                      disabled={page >= totalPages}
                      onClick={() => goPage(page + 1)}
                    >
                      {t("eat.pagination.next")}
                    </button>
                  </nav>
                ) : null}
              </>
            )}
          </section>
        ) : null}
      </main>
      <FamilyFooter variant="app" />

      {dialogData ? (
        <PlaceDetailsDialog
          place={dialogData.place}
          pick={dialogData.pick}
          alternatives={dialogData.alternatives}
          saved={dialogData.saved}
          variant="decide"
          updatedAt={result?.updatedAt}
          onClose={() => setDialogData(null)}
          onToggleSave={toggleSave}
          onUnsave={() => undefined}
          onSelectAlternative={(alt) => openDetails(alt)}
        />
      ) : null}
    </AppShell>
  );
}
