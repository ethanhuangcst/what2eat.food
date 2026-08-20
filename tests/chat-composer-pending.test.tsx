/** @vitest-environment jsdom */
import type { ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ChatComposer } from "@/src/ui/chat-composer";
import { LocaleProvider } from "@/src/i18n/locale-provider";

function wrap(ui: ReactElement) {
  return render(<LocaleProvider initialLocale="EN">{ui}</LocaleProvider>);
}

afterEach(() => cleanup());

describe("ChatComposer pending", () => {
  it("should_show_pending_bubble_when_pending", () => {
    wrap(
      <ChatComposer
        turns={[{ role: "user", content: "hi" }]}
        inputId="t"
        placeholderKey="eat.chat.placeholder"
        inputTestId="agent-chat-input"
        sendTestId="agent-chat-send"
        pending
        onSend={async () => undefined}
      />,
    );
    expect(screen.getByTestId("chat-pending")).toBeTruthy();
    expect((screen.getByTestId("agent-chat-send") as HTMLButtonElement).disabled).toBe(true);
  });

  it("should_hide_pending_when_not_pending", () => {
    wrap(
      <ChatComposer
        turns={[]}
        inputId="t2"
        placeholderKey="eat.chat.placeholder"
        inputTestId="agent-chat-input"
        sendTestId="agent-chat-send"
        pending={false}
        onSend={async () => undefined}
      />,
    );
    expect(screen.queryByTestId("chat-pending")).toBeNull();
  });
});
