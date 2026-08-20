"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/src/i18n/use-t";
import { authJson } from "@/src/ui/auth-api";
import { appendTurn, listChatKey, readTranscript, turnPlainContent } from "@/src/chat/local-storage";
import {
  CHAT_PANEL_MIN_H,
  CHAT_PANEL_MIN_W,
  nextChatPanelSize,
} from "@/src/chat/panel-size";
import { type ChatTurn, type ListChatContext } from "@/src/chat/types";
import { ChatComposer } from "@/src/ui/chat-composer";

type Props = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  context: ListChatContext;
};

export function AgentChatPanel({ open, onOpen, onClose, context }: Props) {
  const t = useT();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [size, setSize] = useState({ width: CHAT_PANEL_MIN_W, height: CHAT_PANEL_MIN_H });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const storageKey = context.searchId ? listChatKey(context.searchId) : null;

  useEffect(() => {
    if (!storageKey) {
      setTurns([]);
      return;
    }
    setTurns(readTranscript(storageKey));
  }, [storageKey, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      setSize(
        nextChatPanelSize({
          startWidth: drag.startW,
          startHeight: drag.startH,
          startClientX: drag.startX,
          startClientY: drag.startY,
          clientX: e.clientX,
          clientY: e.clientY,
          viewportW: window.innerWidth,
          viewportH: window.innerHeight,
        }),
      );
    }
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
    };
  }, [size.height, size.width]);

  const send = useCallback(
    async (text: string) => {
      if (!storageKey) return;
      const userTurn: ChatTurn = { role: "user", content: text };
      const withUser = appendTurn(storageKey, userTurn);
      setTurns(withUser);
      setBusy(true);
      try {
        const prior = withUser.map((m) => ({ role: m.role, content: turnPlainContent(m) }));
        const res = await authJson<{ reply: ChatTurn }>("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            scope: "list",
            messages: prior,
            context,
          }),
        });
        const next = appendTurn(storageKey, res.reply);
        setTurns(next);
      } catch {
        const errTurn: ChatTurn = { role: "assistant", content: t("errors.chat_failed"), key: "errors.chat_failed" };
        setTurns(appendTurn(storageKey, errTurn));
      } finally {
        setBusy(false);
      }
    },
    [context, storageKey, t],
  );

  return (
    <>
      <button
        type="button"
        className={`agent-chat-launch${open ? " is-hidden" : ""}`}
        aria-controls="agent-chat-panel"
        aria-expanded={open}
        data-testid="agent-chat-open"
        onClick={onOpen}
      >
        <span className="mark-host agent-chat-launch__mark">
          <img className="mark" src="/food-logo.png" alt="" width={28} height={28} />
        </span>
        <span>{t("eat.decide.chat_open")}</span>
      </button>

      <aside
        id="agent-chat-panel"
        className={`agent-chat${open ? " is-open" : ""}`}
        data-agent-chat
        aria-hidden={!open}
        aria-label={t("eat.a11y.chat_panel")}
        style={open ? { width: size.width, height: size.height } : undefined}
      >
        <div className="agent-chat__panel">
          <div
            className="agent-chat__resize"
            data-agent-chat-resize
            data-testid="agent-chat-resize"
            role="separator"
            aria-orientation="horizontal"
            tabIndex={0}
            aria-label={t("eat.a11y.chat_resize")}
            onPointerDown={onResizePointerDown}
          >
            <span className="agent-chat__resize-mark" aria-hidden="true" />
          </div>
          <header className="agent-chat__head">
            <div>
              <h2>{t("eat.decide.chat_title")}</h2>
              <p className="meta agent-chat__context">
                {t("eat.decide.chat_context", {
                  area: context.location ?? "",
                  meal: context.mealContext ?? "",
                  budget: context.budget ?? "",
                })}
              </p>
            </div>
            <button type="button" className="btn btn-quiet" data-testid="agent-chat-close" onClick={onClose}>
              {t("eat.common.close")}
            </button>
          </header>
          <div className="agent-chat__body">
            {open ? (
              <ChatComposer
                turns={turns}
                inputId="agent-chat-input"
                placeholderKey="eat.decide.chat_placeholder"
                inputTestId="agent-chat-input"
                sendTestId="agent-chat-send"
                disabled={busy || !storageKey}
                onSend={send}
              />
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
