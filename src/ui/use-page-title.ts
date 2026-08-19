"use client";

import { useEffect } from "react";
import { useT } from "@/src/i18n/use-t";

export function usePageTitle(titleKey: string) {
  const t = useT();

  useEffect(() => {
    document.title = `${t(titleKey)} — what2eat.food`;
    document.body.dataset.titleKey = titleKey;
    return () => {
      delete document.body.dataset.titleKey;
    };
  }, [titleKey, t]);
}
