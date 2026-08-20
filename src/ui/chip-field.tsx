"use client";

import { useState } from "react";
import { useT } from "@/src/i18n/use-t";
import { isPresetChipId } from "@/src/core/chip-selection";

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

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((v) => v !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  function addCustom() {
    const trimmed = draft.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    onChange([...selected, trimmed]);
    setDraft("");
  }

  return (
    <div className="chip-add" data-testid={testId}>
      {addLabelKey ? <span className="sr-only">{t(addLabelKey)}</span> : null}
      <div className="chip-row">
        {options.map((opt) => {
          const label = t(opt.labelKey);
          const pressed = selected.includes(opt.id);
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
              key={opt.id}
              type="button"
              className={cls}
              aria-pressed={pressed}
              onClick={() => toggle(opt.id)}
            >
              {label}
            </button>
          );
        })}
        {selected
          .filter((v) => !isPresetChipId(v, options))
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
