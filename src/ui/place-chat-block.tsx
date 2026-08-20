"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/src/i18n/use-t";
import { authJson } from "@/src/ui/auth-api";
import { appendTurn, placeChatKey, readTranscript, turnPlainContent } from "@/src/chat/local-storage";
import { type ChatTurn, type PlaceChatContext } from "@/src/chat/types";
import { ChatComposer } from "@/src/ui/chat-composer";

type Props = {
  context: PlaceChatContext;
};

export function PlaceChatBlock({ context }: Props) {
  const t = useT();
  const storageKey = placeChatKey(context.provider, context.nativeId);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTurns(readTranscript(storageKey));
  }, [storageKey]);

  const send = useCallback(
    async (text: string) => {
      const userTurn: ChatTurn = { role: "user", content: text };
      const withUser = appendTurn(storageKey, userTurn);
      setTurns(withUser);
      setBusy(true);
      try {
        const prior = withUser.map((m) => ({ role: m.role, content: turnPlainContent(m) }));
        const res = await authJson<{ reply: ChatTurn }>("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            scope: "place",
            messages: prior,
            context,
          }),
        });
        setTurns(appendTurn(storageKey, res.reply));
      } catch {
        setTurns(
          appendTurn(storageKey, {
            role: "assistant",
            content: t("errors.chat_failed"),
            key: "errors.chat_failed",
          }),
        );
      } finally {
        setBusy(false);
      }
    },
    [context, storageKey, t],
  );

  return (
    <div className="place-why-chat chat" data-chat-root>
      <h4 className="place-why-chat__label">{t("eat.details.chat_title")}</h4>
      <ChatComposer
        variant="place"
        turns={turns}
        inputId="place-chat-input"
        placeholderKey="eat.chat.placeholder"
        inputTestId="place-chat-input"
        sendTestId="place-chat-send"
        disabled={busy}
        onSend={send}
      />
    </div>
  );
}
