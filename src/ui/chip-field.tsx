"use client";

import { useState } from "react";
import { useT } from "@/src/i18n/use-t";

type ChipOption = { id: string; labelKey: string; variant?: "like" | "dislike" | "" };

type Props = {
  options: ChipOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  addPlaceholderKey: string;
  addLabelKey?: string;
  testId?: string;
};

export function ChipField({ options, selected, onChange, addPlaceholderKey, addLabelKey, testId }: Props) {
  const t = useT();
  const [draft, setDraft] = useState("");

  function toggle(labelKey: string) {
    const label = t(labelKey);
    if (selected.includes(label)) {
      onChange(selected.filter((v) => v !== label));
    } else {
      onChange([...selected, label]);
    }
  }

  function addCustom() {
    const trimmed = draft.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    onChange([...selected, trimmed]);
    setDraft("");
  }

  const presetLabels = new Set(options.map((o) => t(o.labelKey)));

  return (
    <div className="chip-add" data-testid={testId}>
      {addLabelKey ? <span className="sr-only">{t(addLabelKey)}</span> : null}
      <div className="chip-row">
        {options.map((opt) => {
          const label = t(opt.labelKey);
          const pressed = selected.includes(label);
          const cls = [
            "chip",
            "chip-toggle",
            opt.variant === "like" ? "chip-like" : "",
            opt.variant === "dislike" ? "chip-dislike" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={opt.labelKey}
              type="button"
              className={cls}
              aria-pressed={pressed}
              onClick={() => toggle(opt.labelKey)}
            >
              {label}
            </button>
          );
        })}
        {selected
          .filter((v) => !presetLabels.has(v))
          .map((custom) => (
            <button
              key={custom}
              type="button"
              className="chip chip-toggle is-custom"
              aria-pressed
              onClick={() => onChange(selected.filter((v) => v !== custom))}
            >
              {custom}
            </button>
          ))}
      </div>
      <div className="chip-add-row">
        <input
          type="text"
          maxLength={40}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t(addPlaceholderKey)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button type="button" className="btn btn-quiet" onClick={addCustom}>
          {t("eat.profile.add")}
        </button>
      </div>
    </div>
  );
}
