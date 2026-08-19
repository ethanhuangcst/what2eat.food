"use client";

import Link from "next/link";
import { useT } from "@/src/i18n/use-t";
import { PublicShell } from "@/src/ui/public-shell";
import { LogoLink } from "@/src/ui/logo-link";
import { usePageTitle } from "@/src/ui/use-page-title";

type Props = { signedIn?: boolean };

export default function HomePageClient({ signedIn = false }: Props) {
  const t = useT();
  usePageTitle("eat.home.headline");
  const ctaHref = signedIn ? "/decide" : "/register";

  return (
    <PublicShell>
      <main id="content" className="home-main">
        <LogoLink href="/" className="logo logo-home" size={64} />
        <h1 data-testid="home-headline">{t("eat.home.headline")}</h1>
        <p className="lead">{t("eat.home.lead")}</p>
        <div className="mini-stack" aria-hidden="true">
          <article className="plate-card">
            <h2>{t("eat.sample.place_a")}</h2>
            <p className="card-meta">
              <span className="eta">12 min</span>
              <span className="price">$$</span>
            </p>
          </article>
          <article className="plate-card">
            <h2>{t("eat.sample.place_b")}</h2>
            <p className="card-meta">
              <span className="eta">8 min</span>
              <span className="price">$$</span>
            </p>
          </article>
        </div>
        <div className="cta-row">
          <Link href={ctaHref} className="btn" data-testid="home-cta">
            {t("eat.home.cta")}
          </Link>
          <Link href="/login" className="btn btn-quiet" data-testid="home-login">
            {t("eat.home.login")}
          </Link>
        </div>
        <p>
          <Link href="/register" data-testid="home-register">
            {t("eat.home.register")}
          </Link>
        </p>
      </main>
    </PublicShell>
  );
}
