"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/src/ui/app-header";
import { AppShell } from "@/src/ui/app-shell";
import { FamilyFooter } from "@/src/ui/family-footer";
import { useT } from "@/src/i18n/use-t";
import { authJson } from "@/src/ui/auth-api";
import { pickMapUrl } from "@/src/core/map-links";
import { type PickDto } from "@/src/places-agent/types";

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

export default function DecidePageClient() {
  const t = useT();
  const [location, setLocation] = useState("Clerkenwell, London");
  const [mealContext, setMealContext] = useState("Weekend dinner");
  const [budget, setBudget] = useState("$$");
  const [craving, setCraving] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [page, setPage] = useState(1);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [dialogPick, setDialogPick] = useState<PickDto | null>(null);
  const [dialogSaved, setDialogSaved] = useState(false);

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
  }

  async function openDetails(pick: PickDto) {
    setDialogPick(pick);
    const details = await authJson<{ saved: boolean }>(
      `/api/places/${encodeURIComponent(pick.provider)}/${encodeURIComponent(pick.nativeId)}`,
    );
    setDialogSaved(details.saved);
  }

  async function toggleSave(pick: PickDto, saved: boolean) {
    if (saved) {
      await authJson("/api/saved", {
        method: "DELETE",
        body: JSON.stringify({ provider: pick.provider, nativeId: pick.nativeId }),
      });
      setDialogSaved(false);
    } else {
      await authJson("/api/saved", {
        method: "POST",
        body: JSON.stringify({
          provider: pick.provider,
          nativeId: pick.nativeId,
          snapshot: pick,
        }),
      });
      setDialogSaved(true);
    }
  }

  return (
    <AppShell>
      <AppHeader />
      <main id="content">
        <h1>{t("eat.decide.headline")}</h1>
        <section>
          <h2>{t("eat.decide.criteria_title")}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              search(1);
            }}
          >
            <div className="field">
              <label htmlFor="location">{t("eat.decide.location")}</label>
              <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} data-testid="decide-location" />
            </div>
            <div className="field">
              <label htmlFor="meal_context">{t("eat.decide.meal_context")}</label>
              <input id="meal_context" value={mealContext} onChange={(e) => setMealContext(e.target.value)} />
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
              <input id="craving" value={craving} onChange={(e) => setCraving(e.target.value)} />
            </div>
            <button className="btn" type="submit" data-testid="decide-submit">{t("eat.decide.submit")}</button>
          </form>
        </section>

        {errorKey ? <p className="error">{t(errorKey)}</p> : null}
        {result?.skipped?.length ? <p className="empty">{t("eat.decide.partial")}</p> : null}

        {result ? (
          <section data-testid="decide-results">
            <p data-testid="decide-summary">
              {t("eat.decide.showing", { from: result.from, to: result.to, total: result.total })}
            </p>
            {result.empty ? <p className="empty" data-testid="decide-empty">{t("eat.decide.empty")}</p> : null}
            <div className="card-grid">
              {result.picks.map((pick) => (
                <article className="pick-card" key={pick.id} data-testid="pick-card" data-native-id={pick.nativeId}>
                  {pick.photoUrl ? <img src={pick.photoUrl} alt="" /> : <div style={{ height: 120, background: "#eee" }} />}
                  <h3>{pick.name}</h3>
                  <div className="pick-meta">
                    <span className="badge" data-testid="pick-fit">{t(`eat.pick.fit_${pick.fit}`)}</span>
                    <span data-testid="pick-provider">{pick.provider}</span>
                    {pick.walkMinutes ? <span>{t("eat.pick.walk", { minutes: pick.walkMinutes })}</span> : null}
                  </div>
                  <div>
                    <button type="button" className="btn btn-quiet" data-testid="pick-details" onClick={() => openDetails(pick)}>
                      {t("eat.pick.details")}
                    </button>{" "}
                    <a
                      className="btn btn-quiet"
                      href={pickMapUrl(pick.sources) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      data-testid="pick-map"
                      onClick={(e) => {
                        const url = pickMapUrl(pick.sources);
                        if (!url) e.preventDefault();
                      }}
                    >
                      {t("eat.pick.open_map")}
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem" }}>
              <button type="button" className="btn btn-quiet" disabled={page <= 1} onClick={() => goPage(page - 1)}>Previous</button>
              <button type="button" className="btn btn-quiet" data-testid="decide-reshuffle" onClick={reshuffle}>{t("eat.decide.reshuffle")}</button>
              <button type="button" className="btn btn-quiet" disabled={!result || result.to >= result.total} onClick={() => goPage(page + 1)}>Next</button>
            </div>
          </section>
        ) : null}
      </main>
      <FamilyFooter variant="app" />

      {dialogPick ? (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" data-testid="place-dialog">
          <div className="dialog">
            <h2>{dialogPick.name}</h2>
            <p>{dialogPick.address}</p>
            <h3>{t("eat.place.why_title")}</h3>
            <ul>
              {dialogPick.whyKeys.map((k) => (
                <li key={k}>{t(k)}</li>
              ))}
            </ul>
            <p>{t("eat.place.menu_disclaimer")}</p>
            <button type="button" className="btn" data-testid="place-save" onClick={() => toggleSave(dialogPick, dialogSaved)}>
              {dialogSaved ? t("eat.place.unsave") : t("eat.place.save")}
            </button>{" "}
            <button type="button" className="btn btn-quiet" onClick={() => setDialogPick(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
