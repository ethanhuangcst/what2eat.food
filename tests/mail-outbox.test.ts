import { describe, expect, it, vi } from "vitest";
import { clearMailOutbox, getMailOutbox, resetMailContent, sendMail } from "../src/auth/mail";

describe("mail outbox", () => {
  it("should_capture_mail_when_feature_email_disabled", async () => {
    clearMailOutbox();
    const content = resetMailContent("EN", "test-token-abc");
    const ok = await sendMail({ to: "user@what2eat.food", ...content });
    expect(ok).toBe(true);
    expect(getMailOutbox()).toHaveLength(1);
    expect(getMailOutbox()[0]?.text).toContain("test-token-abc");
  });

  it("should_localize_reset_subject_for_cn", () => {
    const content = resetMailContent("CN", "token-cn");
    expect(content.subject).toContain("重置");
    expect(content.html).toContain("token-cn");
  });

  it("should_fallback_to_outbox_when_resend_fails_in_dev", async () => {
    clearMailOutbox();
    vi.stubEnv("FEATURE_EMAIL", "true");
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("NODE_ENV", "development");
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);

    const content = resetMailContent("EN", "fallback-token");
    const ok = await sendMail({ to: "dev@what2eat.food", ...content });
    expect(ok).toBe(true);
    expect(getMailOutbox()).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalled();

    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});
