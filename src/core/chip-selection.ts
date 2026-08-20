import { catalogs } from "../i18n/catalog";
import { LOCALES } from "./locales";

export type ChipOptionDef = { id: string; labelKey: string };

export function chipKeyFromLabel(label: string, options: ChipOptionDef[]): string | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  for (const opt of options) {
    if (opt.id === trimmed) return opt.id;
    for (const loc of LOCALES) {
      if (catalogs[loc][opt.labelKey] === trimmed) return opt.id;
    }
  }
  return null;
}

export function normalizeChipIds(values: string[], options: ChipOptionDef[]): string[] {
  const ids = new Set(options.map((o) => o.id));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    let normalized = v;
    if (!ids.has(v)) {
      const matched = chipKeyFromLabel(v, options);
      if (matched) normalized = matched;
    }
    if (!seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  }
  return out;
}

export function isPresetChipId(id: string, options: ChipOptionDef[]): boolean {
  return options.some((o) => o.id === id);
}
