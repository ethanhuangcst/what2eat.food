#!/usr/bin/env python3
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3020"
EMAIL = "mvp3.live@what2eat.food"
PASSWORD = "testpass123"
LOCATION = "Clerkenwell, London"


def ensure_user(page):
    page.goto(f"{BASE}/login/fresh")
    page.goto(f"{BASE}/register")
    page.wait_for_selector('[data-testid="auth-form-register"]')
    page.fill('[data-testid="field-name"]', "MVP Three")
    page.fill('[data-testid="field-email"]', EMAIL)
    page.fill('[data-testid="field-location"]', LOCATION)
    page.fill('[data-testid="field-password"]', PASSWORD)
    page.fill('[data-testid="field-confirm-password"]', PASSWORD)
    page.click('[data-testid="register-submit"]')
    page.wait_for_url("**/profile**", timeout=30000)


def login_or_register(page):
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("domcontentloaded")
    if page.locator('[data-testid="auth-form-login"]').count():
        page.fill('[data-testid="field-email"]', EMAIL)
        page.fill('[data-testid="field-password"]', PASSWORD)
        page.click('[data-testid="login-submit"]')
        try:
            page.wait_for_url("**/decide**", timeout=5000)
        except Exception:
            ensure_user(page)
    else:
        ensure_user(page)


def test_mvp3_live():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        login_or_register(page)
        page.goto(f"{BASE}/decide")
        page.wait_for_selector('[data-testid="decide-location"]')
        page.fill('[data-testid="decide-location"]', LOCATION)
        page.click('[data-testid="decide-submit"]')
        page.wait_for_selector('[data-testid="decide-results"]', timeout=90000)

        page.click('[data-testid="agent-chat-open"]')
        page.wait_for_selector('[data-testid="agent-chat-close"]')
        page.fill('[data-testid="agent-chat-input"]', "Any lighter options on this list?")
        page.click('[data-testid="agent-chat-send"]')
        page.wait_for_selector('[data-testid="chat-agent-msg"]', timeout=120000)
        assert page.locator('[data-testid="chat-agent-msg"]').count() > 0

        keys_before = page.evaluate(
            "() => Object.keys(localStorage).filter(k => k.startsWith('w2e.chat.'))"
        )
        assert len(keys_before) > 0
        page.reload()
        page.wait_for_selector('[data-testid="decide-results"]', timeout=90000)
        keys_after = page.evaluate(
            "() => Object.keys(localStorage).filter(k => k.startsWith('w2e.chat.'))"
        )
        assert len(keys_after) > 0

        page.locator('[data-testid="pick-card"]').first.locator('[data-testid="pick-details"]').click()
        page.wait_for_selector('[data-testid="place-dialog"]')
        page.fill('[data-testid="place-chat-input"]', "Is this place good for a late dinner?")
        page.click('[data-testid="place-chat-send"]')
        page.wait_for_selector('[data-testid="chat-agent-msg"]', timeout=120000)

        page.click('[data-testid="place-save"]')
        page.click('[data-testid="details-close"]')

        page.goto(f"{BASE}/saved")
        page.wait_for_selector('[data-testid="nav-history"]')
        page.click('[data-testid="nav-history"]')
        page.wait_for_selector('[data-testid="history-row"]')
        assert page.locator('[data-testid="history-went"]').count() > 0

        page.click('[data-testid="history-rerun"]')
        page.wait_for_selector('[data-testid="decide-location"]')
        assert page.input_value('[data-testid="decide-location"]')

        page.click('[data-testid="nav-logout"]')
        page.wait_for_url("**/")
        cleared = page.evaluate(
            "() => Object.keys(localStorage).filter(k => k.startsWith('w2e.chat.')).length"
        )
        assert cleared == 0

        browser.close()


if __name__ == "__main__":
    test_mvp3_live()
    print("mvp3 live journey ok")
