#!/usr/bin/env python3
from playwright.sync_api import sync_playwright


BASE = "http://localhost:3020"
EMAIL = "mvp2.live@what2eat.food"
PASSWORD = "testpass123"
LOCATION = "Clerkenwell, London"
# Fallback pin when geocode is flaky (London Clerkenwell)
NEAR_LAT = 51.523
NEAR_LNG = -0.105


def ensure_user(page):
    page.goto(f"{BASE}/login/fresh")
    page.goto(f"{BASE}/register")
    page.wait_for_selector('[data-testid="auth-form-register"]')
    page.fill('[data-testid="field-name"]', "MVP Two")
    page.fill('[data-testid="field-email"]', EMAIL)
    page.fill('[data-testid="field-location"]', LOCATION)
    page.fill('[data-testid="field-password"]', PASSWORD)
    page.fill('[data-testid="field-confirm-password"]', PASSWORD)
    page.click('[data-testid="register-submit"]')
    page.wait_for_url("**/profile**", timeout=30000)


def test_mvp2_live():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

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

        page.goto(f"{BASE}/decide")
        page.wait_for_selector('[data-testid="decide-location"]')
        page.fill('[data-testid="decide-location"]', LOCATION)
        page.click('[data-testid="decide-submit"]')
        page.wait_for_selector('[data-testid="decide-results"]', timeout=90000)

        cards = page.locator('[data-testid="pick-card"]')
        count = cards.count()
        assert count > 0, "Expected live restaurant cards"

        native_id = cards.first.get_attribute("data-native-id") or ""
        assert native_id, "Card must expose native id"
        assert not native_id.startswith("fixture_"), f"fixture id forbidden: {native_id}"

        provider = cards.first.locator('[data-testid="pick-provider"]').inner_text()
        assert provider in ("GOOGLE_MAPS", "AMAP", "TRIPADVISOR"), provider

        cards.first.locator('[data-testid="pick-details"]').click()
        page.wait_for_selector('[data-testid="place-dialog"]')
        page.click('[data-testid="place-save"]')
        page.click('[data-testid="details-close"]')

        page.goto(f"{BASE}/saved")
        page.wait_for_selector('[data-testid="saved-card"]')
        page.click('[data-testid="saved-unsave"]')
        page.wait_for_selector('[data-testid="saved-empty"]')

        browser.close()


if __name__ == "__main__":
    test_mvp2_live()
    print("mvp2 live journey ok")
