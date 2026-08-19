"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useT } from "@/src/i18n/use-t";
import { authJson } from "@/src/ui/auth-api";
import { PublicShell } from "@/src/ui/public-shell";
import { LogoLink } from "@/src/ui/logo-link";
import { usePageTitle } from "@/src/ui/use-page-title";

export default function ResetPasswordPageClient() {
  const t = useT();
  const locale = useLocale();
  usePageTitle("eat.reset.title");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await authJson("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email: fd.get("email"), locale }),
    });
    setSent(true);
  }

  return (
    <PublicShell>
      <main id="content" className="auth-main">
        <LogoLink href="/" />
        <h1>{t("eat.reset.title")}</h1>
        {sent ? (
          <p className="callout is-info" data-sent>
            {t("eat.reset.sent")}
          </p>
        ) : null}
        {!sent ? (
          <>
            <p className="lead" data-reset-lead>
              {t("eat.reset.lead")}
            </p>
            <form onSubmit={onSubmit} data-testid="auth-form-reset" data-reset-form noValidate>
              <div className="field">
                <label htmlFor="email">{t("eat.reset.email")}</label>
                <input id="email" name="email" type="email" autoComplete="email" required data-testid="field-email" />
              </div>
              <button className="btn" type="submit" data-testid="reset-submit">
                {t("eat.reset.submit")}
              </button>
            </form>
          </>
        ) : null}
        <p className="auth-links">
          <Link href="/login">{t("eat.reset.back")}</Link>
        </p>
      </main>
    </PublicShell>
  );
}
