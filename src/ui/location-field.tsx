"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { useT } from "@/src/i18n/use-t";

type Status = "detecting" | "ok" | "failed";

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  testId?: string;
  showStatus?: boolean;
  initialStatus?: Status;
  action?: ReactNode;
};

const LOCATE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);

export function LocationField({
  id = "location",
  name = "location",
  value,
  onChange,
  required,
  testId,
  showStatus = true,
  initialStatus,
  action,
}: Props) {
  const t = useT();
  const listId = useId();
  const [status, setStatus] = useState<Status>(initialStatus ?? (value ? "ok" : "detecting"));
  const [loading, setLoading] = useState(false);

  const suggestions = t("eat.register.location_suggestions")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  useEffect(() => {
    if (initialStatus || value) return;
    if (!navigator.geolocation) {
      setStatus("failed");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus("ok");
        if (!value.trim()) {
          onChange(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
      },
      () => setStatus("failed"),
      { timeout: 8000 },
    );
  }, [initialStatus, onChange, value]);

  function detect() {
    if (!navigator.geolocation) {
      setStatus("failed");
      return;
    }
    setLoading(true);
    setStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        setStatus("ok");
        onChange(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => {
        setLoading(false);
        setStatus("failed");
      },
      { timeout: 8000 },
    );
  }

  const inputRow = (
    <div className="location-field">
      <input
        id={id}
        name={name}
        type="text"
        list={listId}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (e.target.value.trim()) setStatus("ok");
        }}
        placeholder={t("eat.register.location_placeholder")}
        required={required}
        data-testid={testId}
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <button
        type="button"
        className={`location-detect${loading ? " is-loading" : ""}`}
        aria-label={t("eat.register.location_use_current")}
        onClick={detect}
      >
        {LOCATE_ICON}
      </button>
    </div>
  );

  return (
    <>
      {showStatus ? (
        <>
          <p
            className={`hint location-status${status === "ok" ? " is-ok" : ""}`}
            role="status"
            hidden={status === "failed"}
          >
            {status === "detecting"
              ? t("eat.register.location_detecting")
              : status === "ok"
                ? t("eat.register.location_detected")
                : t("eat.register.location_failed")}
          </p>
          {status === "failed" ? (
            <p className="hint location-status" data-location-failed role="status">
              {t("eat.register.location_failed")}
            </p>
          ) : null}
        </>
      ) : null}
      {action ? (
        <div className="location-with-action">
          {inputRow}
          {action}
        </div>
      ) : (
        inputRow
      )}
    </>
  );
}
