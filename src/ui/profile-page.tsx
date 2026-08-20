"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/src/ui/app-header";
import { AppShell } from "@/src/ui/app-shell";
import { FamilyFooter } from "@/src/ui/family-footer";
import { ChipField } from "@/src/ui/chip-field";
import { LocationField } from "@/src/ui/location-field";
import { RegisterPhotoBowl } from "@/src/ui/register-photo-bowl";
import { FieldWrap } from "@/src/ui/field-wrap";
import { formatProfileTime } from "@/src/ui/format-profile-time";
import { useLocale, useT } from "@/src/i18n/use-t";
import { htmlLang } from "@/src/core/locales";
import { usePageTitle } from "@/src/ui/use-page-title";
import { authJson } from "@/src/ui/auth-api";
import { notifySessionChanged } from "@/src/ui/session-events";
import { normalizeChipIds } from "@/src/core/chip-selection";

const LIKE_OPTIONS = [
  "eat.cuisine.cantonese",
  "eat.cuisine.japanese",
  "eat.cuisine.korean",
  "eat.cuisine.italian",
  "eat.cuisine.thai",
  "eat.cuisine.sichuan",
  "eat.cuisine.indian",
  "eat.cuisine.vietnamese",
  "eat.cuisine.mexican",
  "eat.cuisine.french",
  "eat.cuisine.seafood",
  "eat.cuisine.barbecue",
].map((labelKey) => ({ id: labelKey, labelKey, variant: "like" as const }));

const DISLIKE_OPTIONS = [
  "eat.cuisine.hotpot",
  "eat.cuisine.thai",
  "eat.cuisine.fast_food",
  "eat.cuisine.buffet",
].map((labelKey) => ({ id: labelKey, labelKey, variant: "dislike" as const }));

const CONSTRAINT_OPTIONS = [
  { id: "veg", labelKey: "eat.profile.veg", variant: "" as const },
  { id: "no_pork", labelKey: "eat.profile.no_pork", variant: "" as const },
  { id: "nut", labelKey: "eat.profile.nut", variant: "" as const },
];

const CONTEXT_OPTIONS = [
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
].map((labelKey) => ({ id: labelKey, labelKey, variant: "" as const }));

export default function ProfilePageClient() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  usePageTitle("eat.profile.page_title");
  const timeLocale = htmlLang(locale);

  const [loaded, setLoaded] = useState(false);
  const [photoFieldError, setPhotoFieldError] = useState<string | null>(null);
  const [personalMsg, setPersonalMsg] = useState(false);
  const [tastesMsg, setTastesMsg] = useState(false);
  const [personalUpdatedAt, setPersonalUpdatedAt] = useState<string | undefined>();
  const [tastesUpdatedAt, setTastesUpdatedAt] = useState<string | undefined>();
  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    gender: "female",
    age: "",
    defaultLocation: "",
    defaultLat: null as number | null,
    defaultLng: null as number | null,
    photoUrl: null as string | null,
  });
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [mealContexts, setMealContexts] = useState<string[]>([]);
  const [spice, setSpice] = useState(1);
  const [partySize, setPartySize] = useState(2);
  const personalSavedRef = useRef<HTMLParagraphElement>(null);
  const tastesSavedRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (searchParams.get("photo_error") === "too_large") {
      setPhotoFieldError("eat.errors.photo_too_large");
      router.replace("/profile");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (personalMsg) {
      personalSavedRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [personalMsg]);

  useEffect(() => {
    if (tastesMsg) {
      tastesSavedRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [tastesMsg]);

  useEffect(() => {
    Promise.all([
      authJson<{
        name: string;
        email: string;
        gender?: string;
        age?: number;
        defaultLocation?: string;
        defaultLat?: number | null;
        defaultLng?: number | null;
        photoUrl?: string | null;
        updatedAt?: string;
      }>("/api/profile/personal"),
      authJson<{
        likes: string[];
        dislikes: string[];
        constraints: string[];
        mealContexts: string[];
        spiceLevel?: string;
        partySize?: number;
        updatedAt?: string;
      }>("/api/profile/tastes"),
    ])
      .then(([p, tastes]) => {
        setPersonal({
          name: p.name ?? "",
          email: p.email ?? "",
          gender: p.gender ?? "female",
          age: p.age != null ? String(p.age) : "",
          defaultLocation: p.defaultLocation ?? "",
          defaultLat: p.defaultLat ?? null,
          defaultLng: p.defaultLng ?? null,
          photoUrl: p.photoUrl ?? null,
        });
        setPersonalUpdatedAt(p.updatedAt);
        setLikes(normalizeChipIds(Array.isArray(tastes.likes) ? tastes.likes : [], LIKE_OPTIONS));
        setDislikes(
          normalizeChipIds(Array.isArray(tastes.dislikes) ? tastes.dislikes : [], DISLIKE_OPTIONS),
        );
        setConstraints(
          normalizeChipIds(Array.isArray(tastes.constraints) ? tastes.constraints : [], CONSTRAINT_OPTIONS),
        );
        setMealContexts(
          normalizeChipIds(Array.isArray(tastes.mealContexts) ? tastes.mealContexts : [], CONTEXT_OPTIONS),
        );
        setSpice(Number(tastes.spiceLevel ?? 1) || 1);
        setPartySize(tastes.partySize ?? 2);
        setTastesUpdatedAt(tastes.updatedAt);
      })
      .finally(() => setLoaded(true));
  }, []);

  async function savePersonal(e: React.FormEvent) {
    e.preventDefault();
    const updated = await authJson<{ updatedAt?: string }>("/api/profile/personal", {
      method: "PUT",
      body: JSON.stringify({
        name: personal.name,
        email: personal.email,
        gender: personal.gender,
        age: personal.age ? Number(personal.age) : undefined,
        defaultLocation: personal.defaultLocation,
        defaultLat: personal.defaultLat,
        defaultLng: personal.defaultLng,
        photoUrl: personal.photoUrl,
      }),
    });
    setPersonalUpdatedAt(updated.updatedAt);
    setPersonalMsg(true);
    notifySessionChanged();
  }

  async function saveTastes(e: React.FormEvent) {
    e.preventDefault();
    const updated = await authJson<{ updatedAt?: string }>("/api/profile/tastes", {
      method: "PUT",
      body: JSON.stringify({
        likes,
        dislikes,
        constraints,
        mealContexts,
        spiceLevel: String(spice),
        partySize,
      }),
    });
    setTastesUpdatedAt(updated.updatedAt);
    setTastesMsg(true);
  }

  if (!loaded) return null;

  return (
    <AppShell>
      <AppHeader />
      <main id="content" className="app-main app-main--profile" data-testid="profile-page">
        <h1 className="sr-only">{t("eat.profile.page_title")}</h1>

        <div className="profile-stack">
          <div className="register-card">
            <header className="register-card__head">
              <h2>{t("eat.profile.personal")}</h2>
              <p className="meta">{t("eat.profile.personal_updated", { time: formatProfileTime(personalUpdatedAt, timeLocale) })}</p>
            </header>
            <form className="register-card__form" onSubmit={savePersonal} data-testid="profile-personal-form">
              <div className="register-card__grid">
                <div className="register-card__fields">
                  <div className="field">
                    <label htmlFor="name">{t("eat.register.name")}</label>
                    <input
                      id="name"
                      value={personal.name}
                      onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                      required
                      data-testid="profile-name"
                    />
                  </div>
                  <div className="field">
                    <div className="field-label-row">
                      <label htmlFor="email">{t("eat.register.email")}</label>
                      <span className="field-label-note">{t("eat.register.email_hint")}</span>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={personal.email}
                      onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                      required
                      data-testid="profile-email"
                    />
                  </div>
                  <div className="field-row field-row--demographics">
                    <div className="field field--gender">
                      <label htmlFor="gender">{t("eat.register.gender")}</label>
                      <select
                        id="gender"
                        value={personal.gender}
                        onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                      >
                        <option value="male">{t("eat.register.gender_male")}</option>
                        <option value="female">{t("eat.register.gender_female")}</option>
                        <option value="other">{t("eat.register.gender_other")}</option>
                        <option value="skip">{t("eat.register.gender_skip")}</option>
                      </select>
                    </div>
                    <div className="field field--age">
                      <label htmlFor="age">{t("eat.register.age")}</label>
                      <input
                        id="age"
                        type="number"
                        min={13}
                        max={120}
                        value={personal.age}
                        onChange={(e) => setPersonal({ ...personal, age: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="field" data-location-field>
                    <label htmlFor="location">{t("eat.register.location")}</label>
                    <LocationField
                      value={personal.defaultLocation}
                      onChange={(v) =>
                        setPersonal({
                          ...personal,
                          defaultLocation: v,
                          defaultLat: null,
                          defaultLng: null,
                        })
                      }
                      onResolved={(label, lat, lng) =>
                        setPersonal({
                          ...personal,
                          defaultLocation: label,
                          defaultLat: lat,
                          defaultLng: lng,
                        })
                      }
                      required
                      testId="profile-location"
                      initialStatus={personal.defaultLocation ? "ok" : undefined}
                      action={
                        <Link className="btn btn-quiet location-with-action__reset" href="/reset-password" data-testid="profile-reset-password">
                          {t("eat.profile.reset_password")}
                        </Link>
                      }
                    />
                  </div>
                </div>
                <aside className="register-card__photo" aria-labelledby="photo-label">
                  <FieldWrap
                    field="photo"
                    errorKey={photoFieldError}
                    errorTestId="profile-photo-error"
                    label={
                      <p className="register-photo__eyebrow" id="photo-label">
                        {t("eat.register.photo")}
                      </p>
                    }
                  >
                    <RegisterPhotoBowl
                      photoUrl={personal.photoUrl}
                      onPhotoChange={(url) => {
                        setPersonal({ ...personal, photoUrl: url });
                        setPhotoFieldError(null);
                      }}
                      onPhotoError={(key) => setPhotoFieldError(key)}
                    />
                  </FieldWrap>
                </aside>
              </div>
              <div className="register-card__actions">
                <p
                  ref={personalSavedRef}
                  className="callout is-info"
                  data-personal-saved
                  role="status"
                  aria-live="polite"
                  hidden={!personalMsg}
                >
                  {t("eat.profile.personal_saved")}
                </p>
                <button className="btn register-card__submit" type="submit" data-testid="personal-save">
                  {t("eat.profile.personal_save")}
                </button>
              </div>
            </form>
          </div>

          <div className="register-card">
            <header className="register-card__head">
              <h2>{t("eat.profile.title")}</h2>
              <p className="meta">{t("eat.profile.updated", { time: formatProfileTime(tastesUpdatedAt, timeLocale) })}</p>
            </header>
            <form className="register-card__form" onSubmit={saveTastes} data-testid="profile-tastes-form">
              <div className="profile-tastes">
                <section className="profile-tastes__block" aria-labelledby="likes-heading">
                  <h3 id="likes-heading">{t("eat.profile.likes")}</h3>
                  <ChipField
                    options={LIKE_OPTIONS}
                    selected={likes}
                    onChange={setLikes}
                    addPlaceholderKey="eat.profile.add_cuisine_ph"
                    addLabelKey="eat.profile.add_cuisine"
                    testId="profile-likes"
                  />
                  <input type="hidden" data-testid="profile-likes-value" value={likes.join(", ")} readOnly />
                </section>
                <section className="profile-tastes__block" aria-labelledby="dislikes-heading">
                  <h3 id="dislikes-heading">{t("eat.profile.dislikes")}</h3>
                  <ChipField
                    options={DISLIKE_OPTIONS}
                    selected={dislikes}
                    onChange={setDislikes}
                    addPlaceholderKey="eat.profile.add_cuisine_ph"
                    addLabelKey="eat.profile.add_cuisine"
                  />
                </section>
                <div className="profile-tastes__pair profile-tastes__pair--compact">
                  <section className="profile-tastes__tile profile-tastes__tile--compact" aria-labelledby="spice-heading">
                    <h3 id="spice-heading">{t("eat.profile.spice")}</h3>
                    <div className="range-row range-row--compact">
                      <span className="meta">{t("eat.profile.spice_low")}</span>
                      <input
                        type="range"
                        min={0}
                        max={3}
                        value={spice}
                        onChange={(e) => setSpice(Number(e.target.value))}
                        aria-labelledby="spice-heading"
                      />
                      <span className="meta">{t("eat.profile.spice_high")}</span>
                    </div>
                  </section>
                  <section className="profile-tastes__tile profile-tastes__tile--compact" aria-labelledby="party-heading">
                    <h3 id="party-heading">{t("eat.profile.party")}</h3>
                    <div className="field field--party">
                      <input
                        id="party"
                        type="number"
                        min={1}
                        max={12}
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                        aria-labelledby="party-heading"
                      />
                    </div>
                  </section>
                </div>
                <div className="profile-tastes__pair profile-tastes__pair--chips">
                  <section className="profile-tastes__tile" aria-labelledby="constraints-heading">
                    <h3 id="constraints-heading">{t("eat.profile.constraints")}</h3>
                    <div className="profile-tastes__body">
                      <ChipField
                        options={CONSTRAINT_OPTIONS}
                        selected={constraints}
                        onChange={setConstraints}
                        addPlaceholderKey="eat.profile.add_constraint_ph"
                        addLabelKey="eat.profile.add_constraint"
                      />
                    </div>
                  </section>
                  <section className="profile-tastes__tile" aria-labelledby="contexts-heading">
                    <h3 id="contexts-heading">{t("eat.profile.contexts")}</h3>
                    <div className="profile-tastes__body">
                      <ChipField
                        options={CONTEXT_OPTIONS}
                        selected={mealContexts}
                        onChange={setMealContexts}
                        addPlaceholderKey="eat.profile.add_context_ph"
                        addLabelKey="eat.profile.add_context"
                      />
                    </div>
                  </section>
                </div>
              </div>
              <div className="register-card__actions">
                <p
                  ref={tastesSavedRef}
                  className="callout is-info"
                  data-profile-saved
                  role="status"
                  aria-live="polite"
                  hidden={!tastesMsg}
                >
                  {t("eat.profile.saved")}
                </p>
                <button className="btn register-card__submit" type="submit" data-testid="profile-save">
                  {t("eat.profile.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <FamilyFooter variant="app" />
    </AppShell>
  );
}
