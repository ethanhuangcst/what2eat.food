"use client";

import { useT } from "@/src/i18n/use-t";
import { pickMapUrl } from "@/src/core/map-links";
import { type PickDto } from "@/src/places-agent/types";

type Props = {
  pick: PickDto;
  onDetails: (pick: PickDto) => void;
  onUnsave?: (pick: PickDto) => void;
  showMap?: boolean;
  testId?: string;
};

function fitBadgeClass(fit: PickDto["fit"]): string {
  if (fit === "strong") return "pick-badge pick-badge--strong";
  if (fit === "weak") return "pick-badge pick-badge--weak";
  return "pick-badge pick-badge--partial";
}

function warningKey(warning: string): string | null {
  if (warning === "long_travel") return "eat.alert.long_travel";
  if (warning === "price_unavailable") return "eat.card.price_unavailable";
  if (warning === "hours_unavailable") return "eat.card.hours_unavailable";
  return null;
}

export function PickCard({ pick, onDetails, onUnsave, showMap = true, testId = "pick-card" }: Props) {
  const t = useT();
  const mapUrl = pickMapUrl(pick.sources);
  const primaryProvider = pick.provider;

  return (
    <article className="pick-card" data-testid={testId} data-native-id={pick.nativeId}>
      <button
        type="button"
        className="pick-card__photo"
        aria-label={t("eat.card.open_details")}
        onClick={() => onDetails(pick)}
      >
        {pick.photoUrl ? (
          <img src={pick.photoUrl} alt="" width={480} height={280} loading="lazy" />
        ) : (
          <div style={{ height: 140, background: "color-mix(in srgb, var(--line) 40%, var(--plate))" }} />
        )}
      </button>
      <div className="pick-card__body">
        <header className="pick-card__head">
          <h3 className="pick-card__name">{pick.name}</h3>
          {pick.rating != null ? (
            <span className="pick-card__rating">{t("eat.card.rating", { score: String(pick.rating) })}</span>
          ) : (
            <span className="pick-card__rating pick-card__rating--missing">{t("eat.card.rating_missing")}</span>
          )}
        </header>
        <div className="pick-card__sources">
          {pick.sources.map((source) => (
            <span className="source-id" key={`${source.provider}:${source.native_id}`} data-testid={source.provider === primaryProvider ? "pick-provider" : undefined}>
              {source.provider}
            </span>
          ))}
        </div>
        {pick.category ? (
          <p className="pick-card__category">{t("eat.card.category", { type: pick.category })}</p>
        ) : null}
        <div className="pick-card__facts">
          {pick.address ? <p className="pick-card__address">{pick.address}</p> : null}
        </div>
        <div className="pick-card__match">
          <span className={fitBadgeClass(pick.fit)} data-testid="pick-fit">
            {t(`eat.match.fit.${pick.fit}`)}
          </span>
        </div>
        <div className="pick-card__status">
          {pick.walkMinutes != null ? (
            <p className="pick-card__distance meta">
              {t("eat.card.bff_distance", { minutes: String(pick.walkMinutes) })}
            </p>
          ) : (
            <p className="pick-card__distance meta">{t("eat.card.unknown_distance")}</p>
          )}
          {pick.warnings.map((warning) => {
            const key = warningKey(warning);
            return key ? (
              <p className="pick-card__warn" key={warning}>
                {t(key)}
              </p>
            ) : null;
          })}
        </div>
        <div className="pick-card__actions">
          <button type="button" className="pick-card__link" data-testid="pick-details" onClick={() => onDetails(pick)}>
            {t("eat.card.open_details")}
          </button>
          {onUnsave ? (
            <button
              type="button"
              className="pick-card__link pick-card__link--danger"
              data-testid="saved-unsave"
              onClick={() => onUnsave(pick)}
            >
              {t("eat.card.unsave")}
            </button>
          ) : null}
          {showMap && mapUrl ? (
            <a className="pick-card__link" href={mapUrl} target="_blank" rel="noreferrer" data-testid="pick-map">
              {t("eat.card.open_map")}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
