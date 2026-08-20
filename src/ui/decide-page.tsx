"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/src/ui/app-header";
import { AppShell } from "@/src/ui/app-shell";
import { AgentChatPanel } from "@/src/ui/agent-chat-panel";
import { EggMark } from "@/src/ui/egg-mark";
import { FamilyFooter } from "@/src/ui/family-footer";
import { PickCard } from "@/src/ui/pick-card";
import { PlaceDetailsDialog } from "@/src/ui/place-details-dialog";
import { recordWent } from "@/src/ui/record-history";
import { useLocale, useT } from "@/src/i18n/use-t";
import { htmlLang, type Locale } from "@/src/core/locales";
import { pickMapUrl } from "@/src/core/map-links";
import { authJson } from "@/src/ui/auth-api";
import { DECIDE_SORT_MODES, type DecideSortMode } from "@/src/core/sort-picks";
import { DECIDE_PAGE_SIZE } from "@/src/core/short-list";
import { type PlaceCard, type PickDto } from "@/src/places-agent/types";
import {
  MEAL_CONTEXT_KEYS,
  type MealContextSelection,
  defaultMealContextSelection,
  formatMealContextDisplay,
  formatMealContextStorage,
  mealContextSelectionFromInput,
  parseMealContext,
} from "@/src/core/meal-contexts";

const SORT_I18N: Record<DecideSortMode, string> = {
  rank: "eat.decide.sort.rank",
  rating: "eat.decide.sort.rating",
  distance: "eat.decide.sort.distance",
  price: "eat.decide.sort.price",
};

type SearchResult = {
  searchId: string;
  picks: PickDto[];
  total: number;
  from: number;
  to: number;
  updatedAt: string;
  skipped: { provider: string; reason_key: string }[];
  partialBanner: { key: string; vars?: Record<string, string> } | null;
  empty: boolean;
  sort?: DecideSortMode;
};

type PlaceDetailsPayload = {
  place: PlaceCard;
  pick: PickDto;
  saved: boolean;
  alternatives: PickDto[];
};

const MEAL_CONTEXT_OPTIONS = MEAL_CONTEXT_KEYS;

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
  const searchParams = useSearchParams();
  const [location, setLocation] = useState("Clerkenwell, London");
  const [mealSelection, setMealSelection] = useState<MealContextSelection>(defaultMealContextSelection);
  const [budget, setBudget] = useState("$$");
  const [craving, setCraving] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [page, setPage] = useState(1);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [dialogData, setDialogData] = useState<PlaceDetailsPayload | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [profilePin, setProfilePin] = useState<{ lat: number; lng: number; location: string } | null>(
    null,
  );
  const [locationTouched, setLocationTouched] = useState(false);

  const mealOptions = useMemo(
    () => MEAL_CONTEXT_OPTIONS.map((key) => ({ key, label: t(key) })),
    [t],
  );
  const mealContextDisplay = formatMealContextDisplay(mealSelection, locale);
  const mealContextStorage = formatMealContextStorage(mealSelection);
  const mealContextForChat = mealContextDisplay;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/decide/current?page=1", { credentials: "include" });
      if (cancelled || res.status === 404) return;
      if (!res.ok) return;
      const data = (await res.json()) as SearchResult & {
        criteria?: {
          location?: string;
          mealContext?: string;
          budget?: string;
          craving?: string;
          lat?: number;
          lng?: number;
        };
      };
      if (cancelled) return;

      const criteria = data.criteria;
      if (criteria && !searchParams.get("location") && criteria.location) {
        setLocation(criteria.location);
      }
      if (criteria && !searchParams.get("meal") && criteria.mealContext) {
        setMealSelection(parseMealContext(criteria.mealContext));
      }
      if (criteria && !searchParams.get("budget") && criteria.budget) {
        setBudget(criteria.budget);
      }
      if (criteria?.craving !== undefined && !searchParams.get("craving")) {
        setCraving(criteria.craving);
      }
      if (
        criteria?.location &&
        criteria.lat != null &&
        criteria.lng != null &&
        !searchParams.get("location")
      ) {
        setProfilePin({
          location: criteria.location,
          lat: criteria.lat,
          lng: criteria.lng,
        });
      }

      const { criteria: _criteria, ...searchResult } = data;
      setResult(searchResult);
      setPage(1);
    })();
    return () => {
      cancelled = true;
    };
    // Hydrate once on mount; URL searchParams effect handles history rerun overrides.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only hydrate
  }, []);

  useEffect(() => {
    const loc = searchParams.get("location");
    const meal = searchParams.get("meal");
    const bud = searchParams.get("budget");
    if (loc) setLocation(loc);
    if (meal) setMealSelection(parseMealContext(meal));
    if (bud) setBudget(bud);
    if (searchParams.get("open") === "chat") setChatOpen(true);
  }, [searchParams]);

  useEffect(() => {
    authJson<{ defaultLocation?: string; defaultLat?: number | null; defaultLng?: number | null }>(
      "/api/profile/personal",
    )
      .then((p) => {
        if (p.defaultLocation && !searchParams.get("location")) {
          setLocation(p.defaultLocation);
          if (p.defaultLat != null && p.defaultLng != null) {
            setProfilePin({
              location: p.defaultLocation,
              lat: p.defaultLat,
              lng: p.defaultLng,
            });
          }
        }
      })
      .catch(() => undefined);
  }, [searchParams]);

  async function search(nextPage = 1) {
    setErrorKey(null);
    setSearching(true);
    try {
      const body: Record<string, unknown> = {
        location,
        mealContext: mealContextStorage,
        budget,
        craving,
        page: nextPage,
      };
      if (
        !locationTouched &&
        profilePin &&
        profilePin.location === location &&
        profilePin.lat != null &&
        profilePin.lng != null
      ) {
        body.lat = profilePin.lat;
        body.lng = profilePin.lng;
      }
      const data = await authJson<SearchResult>("/api/decide/search", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult(data);
      setPage(nextPage);
    } catch {
      setErrorKey("errors.provider_failed");
    } finally {
      setSearching(false);
    }
  }

  async function goPage(next: number) {
    if (!result || searching) return;
    setSearching(true);
    setErrorKey(null);
    try {
      const data = await authJson<SearchResult>("/api/decide/reshuffle", {
        method: "POST",
        body: JSON.stringify({ searchId: result.searchId, page: next, mode: "page" }),
      });
      setResult(data);
      setPage(next);
    } catch {
      setErrorKey("errors.provider_failed");
    } finally {
      setSearching(false);
    }
  }

  async function reshuffle() {
    if (!result || searching) return;
    setSearching(true);
    setErrorKey(null);
    try {
      const data = await authJson<SearchResult>("/api/decide/reshuffle", {
        method: "POST",
        body: JSON.stringify({ searchId: result.searchId, mode: "reshuffle" }),
      });
      setResult(data);
      setPage(1);
    } catch {
      setErrorKey("errors.provider_failed");
    } finally {
      setSearching(false);
    }
  }

  async function changeSort(nextSort: DecideSortMode) {
    if (!result || searching || result.sort === nextSort) return;
    setSearching(true);
    setErrorKey(null);
    try {
      const data = await authJson<SearchResult>("/api/decide/sort", {
        method: "POST",
        body: JSON.stringify({ searchId: result.searchId, sort: nextSort, page: 1 }),
      });
      setResult(data);
      setPage(1);
    } catch {
      setErrorKey("errors.provider_failed");
    } finally {
      setSearching(false);
    }
  }

  async function openDetails(pick: PickDto) {
    setChatOpen(false);
    const details = await authJson<PlaceDetailsPayload>(
      `/api/places/${encodeURIComponent(pick.provider)}/${encodeURIComponent(pick.nativeId)}`,
    );
    setDialogData(details);
  }

  function historyContext(pick: PickDto) {
    return {
      pick,
      area: location,
      mealContext: mealContextStorage,
      searchId: result?.searchId,
    };
  }

  async function noteWent(pick: PickDto) {
    await recordWent(historyContext(pick));
  }

  async function savePlace() {
    if (!dialogData) return;
    const { pick, saved } = dialogData;
    try {
      if (!saved) {
        await authJson("/api/saved", {
          method: "POST",
          body: JSON.stringify({
            provider: pick.provider,
            nativeId: pick.nativeId,
            snapshot: pick,
            area: location,
            mealContext: mealContextStorage,
          }),
        });
        setDialogData({ ...dialogData, saved: true });
      } else {
        await recordWent(historyContext(pick));
      }
    } catch {
      setErrorKey("errors.validation");
    }
  }

  const listChatContext = {
    searchId: result?.searchId,
    location,
    mealContext: mealContextForChat,
    budget,
    picks: result?.picks.map((p) => ({
      name: p.name,
      nativeId: p.nativeId,
      provider: p.provider,
      photoUrl: p.photoUrl,
      rating: p.rating,
      category: p.category,
      mapUrl: pickMapUrl(p.sources) ?? undefined,
    })),
  };

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
            aria-busy={searching}
            onSubmit={(e) => {
              e.preventDefault();
              if (!searching) search(1);
            }}
          >
            <div className="field">
              <label htmlFor="location">{t("eat.decide.location")}</label>
              <input
                id="location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setLocationTouched(true);
                }}
                disabled={searching}
                data-testid="decide-location"
              />
            </div>
            <div className="field field--meal-context">
              <label htmlFor="meal_context">{t("eat.decide.meal_context")}</label>
              <input
                id="meal_context"
                list="meal-contexts"
                autoComplete="off"
                value={mealContextDisplay}
                onChange={(e) =>
                  setMealSelection(mealContextSelectionFromInput(e.target.value, locale))
                }
                placeholder={t("eat.decide.meal_context_ph")}
                disabled={searching}
                data-testid="decide-meal-context"
              />
              <datalist id="meal-contexts">
                {mealOptions.map(({ key, label }) => (
                  <option key={key} value={label} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label htmlFor="budget">{t("eat.decide.budget")}</label>
              <select
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                disabled={searching}
                data-testid="decide-budget"
              >
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
                disabled={searching}
              />
            </div>
            <div className="field decide-form__submit">
              <span className="decide-form__submit-spacer" aria-hidden="true" />
              <button
                className={`btn${searching ? " is-loading" : ""}`}
                type="submit"
                disabled={searching}
                aria-busy={searching}
                data-testid="decide-submit"
              >
                {searching ? t("eat.decide.searching") : t("eat.decide.submit")}
              </button>
            </div>
          </form>
        </section>

        {errorKey ? <p className="error">{t(errorKey)}</p> : null}

        {searching ? (
          <section
            className="decide-results is-loading"
            aria-labelledby="searching-title"
            data-testid="decide-searching"
          >
            <h2 id="searching-title" className="sr-only">
              {t("eat.decide.searching")}
            </h2>
            <p className="decide-search-status" role="status" aria-live="polite">
              {t("eat.decide.search_status")}
            </p>
            <div className="pick-grid" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <article key={i} className="pick-card pick-card--skeleton">
                  <div className="pick-card__photo" />
                  <div className="pick-card__body">
                    <header className="pick-card__head">
                      <span className="pick-card__name">&nbsp;</span>
                      <span className="pick-card__rating">&nbsp;</span>
                    </header>
                    <p className="pick-card__address">&nbsp;</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {result && !searching ? (
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
                    disabled={searching}
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
                <div className="decide-results__sort-row">
                  <label className="decide-sort" htmlFor="decide-sort">
                    <span className="decide-sort__label">{t("eat.decide.sort_label")}</span>
                    <select
                      id="decide-sort"
                      className="decide-sort__select"
                      value={result.sort ?? "rank"}
                      disabled={searching}
                      aria-label={t("eat.a11y.sort")}
                      data-testid="decide-sort"
                      onChange={(e) => changeSort(e.target.value as DecideSortMode)}
                    >
                      {DECIDE_SORT_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {t(SORT_I18N[mode])}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ) : null}

            {result.partialBanner ? (
              <div className="alert-banner is-info" role="status" data-partial>
                {t(result.partialBanner.key, result.partialBanner.vars ?? {})}
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
                    <PickCard
                      key={pick.id}
                      pick={pick}
                      onDetails={openDetails}
                      onOpenMap={() => noteWent(pick)}
                    />
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

      <AgentChatPanel
        open={chatOpen}
        onOpen={() => setChatOpen(true)}
        onClose={() => setChatOpen(false)}
        context={listChatContext}
      />

      {dialogData ? (
        <PlaceDetailsDialog
          place={dialogData.place}
          pick={dialogData.pick}
          alternatives={dialogData.alternatives}
          saved={dialogData.saved}
          variant="decide"
          updatedAt={result?.updatedAt}
          onClose={() => setDialogData(null)}
          onToggleSave={savePlace}
          onUnsave={() => undefined}
          onSelectAlternative={(alt) => openDetails(alt)}
          onOpenMap={() => noteWent(dialogData.pick)}
        />
      ) : null}
    </AppShell>
  );
}
