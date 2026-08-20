"use client";

import { useEffect } from "react";
import { useLocale, useT } from "@/src/i18n/use-t";
import { htmlLang, type Locale } from "@/src/core/locales";
import { pickMapUrl } from "@/src/core/map-links";
import { type PlaceCard, type PickDto } from "@/src/places-agent/types";
import { PlaceChatBlock } from "@/src/ui/place-chat-block";

type Props = {
  place: PlaceCard;
  pick: PickDto;
  alternatives?: PickDto[];
  saved: boolean;
  variant: "decide" | "saved";
  updatedAt?: string;
  onClose: () => void;
  onToggleSave: () => void;
  onUnsave: () => void;
  onSelectAlternative?: (pick: PickDto) => void;
  onOpenMap?: () => void;
};

function formatTime(iso: string | undefined, locale: Locale): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(htmlLang(locale), { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function PlaceDetailsDialog({
  place,
  pick,
  alternatives = [],
  saved,
  variant,
  updatedAt,
  onClose,
  onToggleSave,
  onUnsave,
  onSelectAlternative,
  onOpenMap,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const mapUrl = pickMapUrl(place.sources);
  const photo = place.photos?.[0] ?? pick.photoUrl;
  const rating = place.rating ?? place.tripadvisor?.rating ?? pick.rating;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="dialog-backdrop is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-title"
      data-testid="place-dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog dialog--place">
        <header className="place-dialog__bar">
          <h2 id="details-title" className="place-dialog__heading">
            {t("eat.details.dialog_title")}
          </h2>
          <button type="button" className="btn btn-quiet" data-testid="details-close" onClick={onClose}>
            {t("eat.common.close")}
          </button>
        </header>

        <section className="place-panel place-panel--facts" aria-labelledby="place-facts-title">
          <h3 id="place-facts-title" className="place-panel__title">
            {t("eat.details.section_place")}
          </h3>
          <div className="place-split">
            <div className="place-split__media">
              {photo ? (
                <img src={photo} alt="" width={420} height={320} loading="lazy" />
              ) : (
                <div className="place-split__media--empty" aria-hidden="true" />
              )}
            </div>
            <div className="place-split__info">
              <p className="place-split__name">{place.name}</p>
              <p className="place-split__meta">
                {rating != null ? (
                  <span className="place-split__rating">{t("eat.card.rating", { score: String(rating) })}</span>
                ) : null}
                {rating != null && place.category ? (
                  <span className="place-split__dot" aria-hidden="true">
                    ·
                  </span>
                ) : null}
                {place.category ? <span>{place.category}</span> : null}
                {pick.provider ? (
                  <>
                    <span className="place-split__dot" aria-hidden="true">
                      ·
                    </span>
                    <span className="source-id">{pick.provider}</span>
                  </>
                ) : null}
              </p>
              <dl className="place-facts-compact">
                {place.address ? (
                  <div className="place-facts-compact__row">
                    <dt>{t("eat.details.address")}</dt>
                    <dd>{place.address}</dd>
                  </div>
                ) : null}
                {place.phone ? (
                  <div className="place-facts-compact__row">
                    <dt>{t("eat.details.contact")}</dt>
                    <dd>{place.phone}</dd>
                  </div>
                ) : null}
                <div className="place-facts-compact__row">
                  <dt>{t("eat.details.hours")}</dt>
                  <dd className={place.hours ? undefined : "is-missing"}>
                    {place.hours ?? t("eat.card.hours_unavailable")}
                  </dd>
                </div>
                <div className="place-facts-compact__row">
                  <dt>{t("eat.details.price")}</dt>
                  <dd
                    className={
                      pick.priceLevel || place.price_level ? undefined : "is-missing"
                    }
                    data-testid="details-price"
                  >
                    <span>
                      {pick.priceLevel || place.price_level
                        ? t("eat.card.price", {
                            band: pick.priceLevel ?? place.price_level ?? "",
                          })
                        : t("eat.card.price_unavailable")}
                    </span>
                    {pick.pricePerPerson != null || place.price_per_person != null ? (
                      <span className="meta">
                        {" "}
                        {t("eat.card.price_per_person", {
                          amount: String(pick.pricePerPerson ?? place.price_per_person),
                        })}
                      </span>
                    ) : null}
                  </dd>
                </div>
              </dl>
              {updatedAt ? (
                <p className="place-split__updated meta-mono">
                  {t("eat.details.updated", { time: formatTime(updatedAt, locale) })}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="place-panel place-panel--why" aria-labelledby="place-why-title">
          <h3 id="place-why-title" className="place-panel__title">
            {t("eat.details.why_title")}
          </h3>
          <div className="place-why-stack">
            <div className="place-why-upper">
              <div className="place-why-block">
                <h4 className="place-why-block__label">{t("eat.why.reasons")}</h4>
                <ul className="place-why-list">
                  {pick.whyKeys.length ? (
                    pick.whyKeys.map((key) => <li key={key}>{t(key)}</li>)
                  ) : (
                    <li>{t("eat.details.confidence_short")}</li>
                  )}
                </ul>
              </div>
              {alternatives.length > 0 ? (
                <div className="place-why-block">
                  <h4 className="place-why-block__label">{t("eat.why.alts")}</h4>
                  <ul className="place-alt-list">
                    {alternatives.map((alt) => {
                      const distance =
                        alt.walkMinutes != null
                          ? t("eat.card.bff_distance", { minutes: String(alt.walkMinutes) })
                          : t("eat.card.unknown_distance");
                      return (
                        <li key={alt.id}>
                          <button
                            type="button"
                            className="place-alt-list__link"
                            data-testid="place-alt"
                            onClick={() => onSelectAlternative?.(alt)}
                          >
                            {t("eat.why.alt_line", {
                              name: alt.name,
                              fit: t(`eat.match.fit.${alt.fit}`),
                              distance,
                            })}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              <p className="place-why-note">{t("eat.details.why_note")}</p>
            </div>
            <PlaceChatBlock
              context={{
                provider: pick.provider,
                nativeId: pick.nativeId,
                name: place.name,
                address: place.address,
                category: place.category,
                photoUrl: place.photos?.[0] ?? pick.photoUrl,
                rating: place.rating ?? pick.rating,
                mapUrl: mapUrl ?? undefined,
              }}
            />
          </div>
        </section>

        <div className="dialog-actions">
          {mapUrl ? (
            <a
              className="btn"
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => onOpenMap?.()}
            >
              {t("eat.card.open_map")}
            </a>
          ) : null}
          {variant === "decide" ? (
            <button type="button" className="btn btn-quiet" data-testid="place-save" onClick={onToggleSave}>
              {saved ? t("eat.card.saved") : t("eat.card.save")}
            </button>
          ) : (
            <button type="button" className="btn btn-quiet" data-testid="details-unsave" onClick={onUnsave}>
              {t("eat.card.unsave")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
