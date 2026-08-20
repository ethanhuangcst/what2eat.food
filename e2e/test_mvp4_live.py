#!/usr/bin/env python3
"""MVP-4 live journey: sort, reshuffle, chat UX, price, location draft."""

import re
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3020"
EMAIL = "mvp4.live@what2eat.food"
PASSWORD = "testpass123"
LOCATION = "Clerkenwell, London"
DRAFT_LOCATION = "Shoreditch, London"


def ensure_user(page):
    page.goto(f"{BASE}/login/fresh")
    page.goto(f"{BASE}/register")
    page.wait_for_selector('[data-testid="auth-form-register"]')
    page.fill('[data-testid="field-name"]', "MVP Four")
    page.fill('[data-testid="field-email"]', EMAIL)
    page.fill('[data-testid="field-location"]', LOCATION)
    page.fill('[data-testid="field-password"]', PASSWORD)
    page.fill('[data-testid="field-confirm-password"]', PASSWORD)
    page.click('[data-testid="register-submit"]')
    page.wait_for_url("**/profile**", timeout=30000)


def sign_in(page):
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


def card_ratings(page):
    ratings = []
    for el in page.locator('[data-testid="pick-card"] .pick-card__rating').all():
        text = (el.inner_text() or "").strip()
        if not text or "rating" in text.lower():
            ratings.append(None)
            continue
        match = re.search(r"(\d+(?:\.\d+)?)", text)
        ratings.append(float(match.group(1)) if match else None)
    return ratings


def assert_ratings_descending(ratings):
    numeric = [r for r in ratings if r is not None]
    if len(numeric) < 2:
        return
    for i in range(len(numeric) - 1):
        assert numeric[i] >= numeric[i + 1], f"Ratings not descending: {numeric}"


def run_decide_search(page):
    page.goto(f"{BASE}/decide")
    page.wait_for_selector('[data-testid="decide-location"]')
    page.fill('[data-testid="decide-location"]', LOCATION)
    page.click('[data-testid="decide-submit"]')
    page.wait_for_selector('[data-testid="decide-results"]', timeout=90000)
    page.wait_for_selector('[data-testid="pick-card"]', timeout=90000)


def test_mvp4_live():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        sign_in(page)
        run_decide_search(page)

        # decide-09: every card exposes pick-price (band or unavailable)
        price_nodes = page.locator('[data-testid="pick-price"]')
        assert price_nodes.count() >= 1, "pick-price must render on cards"
        assert price_nodes.count() == page.locator('[data-testid="pick-card"]').count()

        sort = page.locator('[data-testid="decide-sort"]')
        assert sort.count() == 1, "Sort control must be visible"
        assert sort.input_value() == "rank", "Default sort must be rank"

        first_ids = [
            el.get_attribute("data-native-id")
            for el in page.locator('[data-testid="pick-card"]').all()
        ]
        assert any(first_ids), "Expected live pick cards"

        sort.select_option("rating")
        page.wait_for_function(
            """() => {
              const el = document.querySelector('[data-testid="decide-sort"]');
              return el && el.value === 'rating';
            }""",
            timeout=30000,
        )
        page.wait_for_selector('[data-testid="pick-card"]', timeout=30000)
        assert_ratings_descending(card_ratings(page))

        page.click('[data-testid="decide-reshuffle"]')
        page.wait_for_selector('[data-testid="decide-results"]', timeout=90000)
        page.wait_for_function(
            """() => document.querySelector('[data-testid="decide-sort"]')?.value === 'rank'""",
            timeout=30000,
        )

        updated_after = page.locator("#results-title").inner_text()
        assert updated_after, "Results title must show last-updated time after reshuffle"

        second_ids = [
            el.get_attribute("data-native-id")
            for el in page.locator('[data-testid="pick-card"]').all()
        ]
        assert any(second_ids), "Reshuffle must return live pick cards"

        # decide-10: location draft survives locale switch
        page.fill('[data-testid="decide-location"]', DRAFT_LOCATION)
        page.click('[data-testid="locale-CN"]')
        page.wait_for_timeout(800)
        page.wait_for_selector('[data-testid="decide-location"]', timeout=15000)
        assert page.input_value('[data-testid="decide-location"]') == DRAFT_LOCATION, (
            "Location draft must survive locale switch"
        )
        page.click('[data-testid="locale-EN"]')
        page.wait_for_timeout(800)

        # chat-02: list chat opens with NW resize grip + sticky composer
        page.click('[data-testid="agent-chat-open"]')
        page.wait_for_selector('[data-testid="agent-chat-resize"]', timeout=10000)
        page.wait_for_selector('[data-testid="agent-chat-input"]', timeout=10000)
        page.wait_for_selector('[data-testid="agent-chat-send"]', timeout=10000)
        box = page.locator("[data-agent-chat]").bounding_box()
        assert box is not None and box["width"] >= 350 and box["height"] >= 400

        # chat-05: resize then persist via localStorage key
        grip = page.locator('[data-testid="agent-chat-resize"]')
        gbox = grip.bounding_box()
        assert gbox is not None
        page.mouse.move(gbox["x"] + gbox["width"] / 2, gbox["y"] + gbox["height"] / 2)
        page.mouse.down()
        page.mouse.move(gbox["x"] - 80, gbox["y"] - 60)
        page.mouse.up()
        stored = page.evaluate("() => localStorage.getItem('w2e.chat.panelSize')")
        assert stored and "width" in stored, "Panel size must persist to localStorage"

        # chat-04: pending while waiting; chat-03: agent reply
        page.fill('[data-testid="agent-chat-input"]', "Which of these is quieter for a group?")
        page.click('[data-testid="agent-chat-send"]')
        page.wait_for_selector('[data-testid="chat-pending"]', timeout=5000)
        page.wait_for_selector('[data-testid="chat-agent-msg"]', timeout=90000)
        assert page.locator('[data-testid="chat-pending"]').count() == 0

        browser.close()


if __name__ == "__main__":
    test_mvp4_live()
    print("mvp4 live journey ok")
