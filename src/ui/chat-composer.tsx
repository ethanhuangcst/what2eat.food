"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/src/i18n/use-t";
import { type ChatBlock, type ChatTurn } from "@/src/chat/types";

function PickCard({ block }: { block: Extract<ChatBlock, { type: "pick_ref" }> }) {
  const t = useT();
  const name = block.name ?? `${block.provider}:${block.nativeId}`;
  const mapUrl = block.mapUrl;
  const meta =
    block.note ??
    [block.rating != null ? String(block.rating) : null, block.category].filter(Boolean).join(" · ");

  return (
    <li className="chat-pick-card" data-testid="chat-pick-card">
      {mapUrl ? (
        <a className="chat-pick-card__media" href={mapUrl} target="_blank" rel="noopener noreferrer">
          {block.photoUrl ? (
            <img src={block.photoUrl} alt="" width={80} height={60} loading="lazy" />
          ) : (
            <span className="chat-pick-card__ph" aria-hidden="true" />
          )}
        </a>
      ) : (
        <div className="chat-pick-card__media">
          {block.photoUrl ? (
            <img src={block.photoUrl} alt="" width={80} height={60} loading="lazy" />
          ) : (
            <span className="chat-pick-card__ph" aria-hidden="true" />
          )}
        </div>
      )}
      <div className="chat-pick-card__body">
        <h3 className="chat-pick-card__name">{name}</h3>
        {meta ? <p className="chat-pick-card__meta">{meta}</p> : null}
        {mapUrl ? (
          <a
            className="chat-pick-card__link"
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("eat.chat.open_maps")}
          </a>
        ) : null}
      </div>
    </li>
  );
}

function AssistantBlocks({ blocks }: { blocks: ChatBlock[] }) {
  const t = useT();
  const lead = blocks.filter((b) => b.type === "paragraph" || b.type === "heading" || b.type === "list");
  const picks = blocks.filter((b): b is Extract<ChatBlock, { type: "pick_ref" }> => b.type === "pick_ref");
  const links = blocks.filter((b): b is Extract<ChatBlock, { type: "link" }> => b.type === "link");

  return (
    <article className="bubble bubble--rich chat-rich" data-testid="chat-agent-msg">
      <p className="chat-rich__label kind">{t("eat.why.kind_model")}</p>
      {lead.map((b, i) => {
        if (b.type === "paragraph") {
          return (
            <p key={i} className="chat-rich__lead">
              {b.text}
            </p>
          );
        }
        if (b.type === "heading") {
          const Tag = b.level === 2 ? "h3" : "h4";
          return (
            <Tag key={i} className="chat-rich__lead">
              {b.text}
            </Tag>
          );
        }
        return (
          <ul key={i} className="chat-rich__list">
            {b.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        );
      })}
      {picks.length > 0 ? (
        <ul className="chat-rich__cards">
          {picks.map((p, i) => (
            <PickCard key={`${p.provider}:${p.nativeId}:${i}`} block={p} />
          ))}
        </ul>
      ) : null}
      {links.map((l, i) => (
        <p key={`link-${i}`}>
          <a href={l.href} target="_blank" rel="noopener noreferrer">
            {l.label}
          </a>
        </p>
      ))}
    </article>
  );
}

type Props = {
  variant?: "list" | "place";
  turns: ChatTurn[];
  inputId: string;
  placeholderKey: string;
  inputTestId: string;
  sendTestId: string;
  disabled?: boolean;
  /** When true, show pending bubble and keep send disabled. */
  pending?: boolean;
  onSend: (text: string) => void | Promise<void>;
};

function PendingBubble() {
  const t = useT();
  return (
    <p className="bubble is-pending" data-testid="chat-pending" role="status" aria-live="polite">
      <span className="chat-pending__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {t("eat.chat.pending")}
    </p>
  );
}

function Transcript({
  turns,
  className,
  pending,
}: {
  turns: ChatTurn[];
  className: string;
  pending?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns, pending]);

  return (
    <div ref={ref} className={className} data-transcript>
      {turns.map((turn, i) =>
        turn.role === "user" ? (
          <p key={i} className="bubble is-user" data-testid="chat-user-msg">
            {turn.content}
          </p>
        ) : turn.blocks && turn.blocks.length > 0 ? (
          <AssistantBlocks key={i} blocks={turn.blocks} />
        ) : (
          <p key={i} className="bubble" data-testid="chat-agent-msg">
            <LegacyAssistantText content={turn.content} />
          </p>
        ),
      )}
      {pending ? <PendingBubble /> : null}
    </div>
  );
}

function LegacyAssistantText({ content }: { content: string }) {
  const t = useT();
  return (
    <>
      <span className="kind">{t("eat.why.kind_model")}</span>
      <br />
      {content}
    </>
  );
}

function ComposerForm({
  inputId,
  placeholderKey,
  inputTestId,
  sendTestId,
  composerClassName,
  sendClassName,
  disabled,
  onSend,
}: {
  inputId: string;
  placeholderKey: string;
  inputTestId: string;
  sendTestId: string;
  composerClassName: string;
  sendClassName: string;
  disabled?: boolean;
  onSend: (text: string) => void | Promise<void>;
}) {
  const t = useT();
  return (
    <form
      className={composerClassName}
      data-chat-form
      onSubmit={async (e) => {
        e.preventDefault();
        if (disabled) return;
        const form = e.currentTarget;
        const input = form.elements.namedItem("chat-input") as HTMLInputElement | null;
        const text = input?.value.trim() ?? "";
        if (!text) return;
        await onSend(text);
        if (input) input.value = "";
      }}
    >
      <label className="sr-only" htmlFor={inputId}>
        {t(placeholderKey)}
      </label>
      <input
        id={inputId}
        name="chat-input"
        type="text"
        autoComplete="off"
        disabled={disabled}
        placeholder={t(placeholderKey)}
        data-testid={inputTestId}
      />
      <button type="submit" className={sendClassName} disabled={disabled} data-testid={sendTestId}>
        {t("eat.chat.send")}
      </button>
    </form>
  );
}

export function ChatComposer({
  variant = "list",
  turns,
  inputId,
  placeholderKey,
  inputTestId,
  sendTestId,
  disabled,
  pending,
  onSend,
}: Props) {
  const sendClassName = "btn";
  const showPending = Boolean(pending);

  if (variant === "place") {
    return (
      <>
        <Transcript turns={turns} className="transcript place-why-chat__transcript" pending={showPending} />
        <ComposerForm
          inputId={inputId}
          placeholderKey={placeholderKey}
          inputTestId={inputTestId}
          sendTestId={sendTestId}
          composerClassName="composer place-why-chat__composer"
          sendClassName={sendClassName}
          disabled={disabled || showPending}
          onSend={onSend}
        />
      </>
    );
  }

  return (
    <div className="chat" data-chat-root>
      <Transcript turns={turns} className="transcript" pending={showPending} />
      <ComposerForm
        inputId={inputId}
        placeholderKey={placeholderKey}
        inputTestId={inputTestId}
        sendTestId={sendTestId}
        composerClassName="composer"
        sendClassName={sendClassName}
        disabled={disabled || showPending}
        onSend={onSend}
      />
    </div>
  );
}
