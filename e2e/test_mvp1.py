#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "http://localhost:3020"
EMAIL = "mvp1.test@what2eat.food"
PASSWORD = "testpass123"
AVATAR = ROOT / "e2e" / "fixtures" / "avatar.png"


def reset_user():
    subprocess.run(
        [
            "psql",
            "postgresql://what2eat:what2eat@localhost:5435/what2eat",
            "-c",
            f'DELETE FROM "User" WHERE email=\'{EMAIL}\';',
        ],
        cwd=ROOT,
        check=False,
        capture_output=True,
    )


def test_mvp1_journey():
    reset_user()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto(f"{BASE}/login/fresh")
        page.wait_for_load_state("domcontentloaded")

        page.goto(BASE)
        page.wait_for_selector('[data-testid="home-headline"]')
        page.click('[data-testid="home-register"]')
        page.wait_for_selector('[data-testid="auth-form-register"]')

        page.fill('[data-testid="field-name"]', "MVP One")
        page.fill('[data-testid="field-email"]', EMAIL)
        page.locator("#age").fill("30")
        page.fill('[data-testid="field-location"]', "Clerkenwell, London")
        page.fill('[data-testid="field-password"]', PASSWORD)
        page.fill('[data-testid="field-confirm-password"]', PASSWORD)
        page.locator("#photo").set_input_files(str(AVATAR))
        page.wait_for_selector(".register-photo__frame.has-photo img.register-photo__img")
        page.click('[data-testid="register-submit"]')
        page.wait_for_url("**/profile")
        assert "password=" not in page.url
        page.wait_for_selector('[data-testid="profile-tastes-form"]')
        page.wait_for_function(
            '() => document.querySelector(\'[data-testid="profile-likes"]\') != null'
        )

        page.locator('[data-testid="profile-likes"] button', has_text="Italian").click()
        page.fill('[data-testid="profile-likes"] input', "ramen")
        page.locator('[data-testid="profile-likes"] .btn').click()
        page.click('[data-testid="profile-save"]')
        page.wait_for_selector('[data-profile-saved]:not([hidden])')

        page.click('[data-testid="nav-logout"]')
        page.wait_for_url("**/")

        page.goto(f"{BASE}/login")
        page.wait_for_selector('[data-testid="auth-form-login"]')
        page.fill('[data-testid="field-email"]', EMAIL)
        page.fill('[data-testid="field-password"]', PASSWORD)
        with page.expect_response(lambda r: "/api/auth/login" in r.url and r.request.method == "POST", timeout=15000) as resp_info:
            page.locator('[data-testid="login-submit"]').click()
        assert resp_info.value.status == 200, resp_info.value.text()
        assert "password=" not in page.url
        page.wait_for_selector('[data-testid="decide-location"]', timeout=30000)
        page.wait_for_selector('[data-testid="header-avatar"] img')

        page.goto(f"{BASE}/profile")
        page.wait_for_selector('[data-testid="profile-likes"]')
        page.wait_for_function(
            '() => { const v = document.querySelector(\'[data-testid="profile-likes-value"]\')?.value || ""; return v.includes("Italian") && v.includes("ramen"); }',
            timeout=15000,
        )

        page.goto(BASE)
        page.click('[data-testid="locale-HK"]')
        page.wait_for_selector('[data-testid="home-headline"]')
        footer = page.locator('[data-testid="family-footer"]')
        assert footer.is_visible()

        mobile = browser.new_page(viewport={"width": 390, "height": 844})
        mobile.goto(BASE)
        mobile.wait_for_selector('[data-testid="home-headline"]')
        assert mobile.locator('[data-testid="family-footer"]').is_visible()

        browser.close()


if __name__ == "__main__":
    test_mvp1_journey()
    print("mvp1 journey ok")
