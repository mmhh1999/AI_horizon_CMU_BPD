"""Check the guided County > neighborhood > parcel > trade-offs flow on mso-v1.

Run while serving src/app locally: python tests/guided_flow.py
Optional: set SHOTS_DIR to save desktop and mobile screenshots.
"""

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


URL = os.environ.get("APP_URL", "http://127.0.0.1:8791/")
SHOTS = Path(os.environ["SHOTS_DIR"]) if os.environ.get("SHOTS_DIR") else None


def shot(page, name):
    if SHOTS:
        SHOTS.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SHOTS / f"{name}.png"))


with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome", headless=True)
    errors = []
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL)
    page.locator("#countyInd").wait_for()
    community_widths = page.evaluate("""({
        workspace: document.querySelector('.ws').getBoundingClientRect().width,
        mapSection: document.querySelector('#sec-explore').getBoundingClientRect().width,
        mapCanvas: document.querySelector('#map canvas').getBoundingClientRect().width,
    })""")
    assert community_widths["mapSection"] / community_widths["workspace"] >= 0.98, "Community map uses the full workspace"
    assert abs(community_widths["mapCanvas"] - community_widths["mapSection"]) <= 2, "map canvas fills its Community container"
    page.locator("#legend").wait_for()
    community_boxes = page.evaluate("""({
        map: document.querySelector('.map-wrap').getBoundingClientRect(),
        legend: document.querySelector('#legend').getBoundingClientRect(),
    })""")
    assert community_boxes["legend"]["top"] >= community_boxes["map"]["bottom"] - 1, "Community legend does not cover the map"
    assert page.locator('.rail [data-nav="explore"]').is_visible()
    assert page.locator('.rail [data-nav="sources"]').is_visible()
    assert not page.locator('.rail [data-nav="needs"]').is_visible(), "Needs waits for a neighborhood"
    assert not page.locator('.rail [data-nav="futures"]').is_visible(), "Futures waits for a parcel"
    assert not page.locator('.rail [data-nav="why"]').is_visible(), "Why not waits for trade-off review"
    assert not page.locator("#why").is_visible(), "explanation waits for a chosen lot"

    page.locator("#search").fill("Larimer")
    page.locator("#search").press("Enter")
    page.locator(".needs-card h2", has_text="What does Larimer need?").wait_for()
    assert page.locator('#journey [data-stage="opportunity"]').get_attribute("aria-current") == "step"
    assert page.locator('.rail [data-nav="needs"]').is_visible()
    assert page.locator("details.profile").get_attribute("open") is not None, "Who lives here starts expanded"
    assert not page.locator('.rail [data-nav="futures"]').is_visible()
    assert not page.locator('.rail [data-nav="why"]').is_visible()
    assert not page.locator("#why").is_visible()

    page.locator("#tryExample").click()
    page.locator(".fcard").first.wait_for()
    page.wait_for_function("window.__hfMap?.getZoom() >= 15", timeout=10000)
    assert page.locator(".fcard").count() == 3, "show three suggested futures by default"
    assert page.locator('#journey [data-stage="futures"]').get_attribute("aria-current") == "step"
    assert page.locator(".role-tabs").count() >= 1, "stakeholder personas visible on futures step"
    assert page.locator("#priorities .sl").count() == 10, "priority sliders visible with personas"
    assert "on" in page.locator('.rail [data-nav="futures"]').get_attribute("class").split()
    assert page.locator('.rail [data-nav="needs"]').is_visible()
    assert page.locator('.rail [data-nav="futures"]').is_visible()
    assert not page.locator('.rail [data-nav="why"]').is_visible()
    assert not page.locator("#detail").is_visible()
    assert not page.locator("#why").is_visible()
    assert page.locator("#typeOptions").get_attribute("open") is None
    map_ratio = page.evaluate("document.querySelector('#sec-explore').getBoundingClientRect().width / document.querySelector('.ws').getBoundingClientRect().width")
    assert map_ratio >= 0.36, "map remains prominent while choosing futures"
    shot(page, "desktop-futures")

    page.locator("#reviewTradeoffs").click()
    assert page.locator('#journey [data-stage="tradeoffs"]').get_attribute("aria-current") == "step"
    assert "on" in page.locator('.rail [data-nav="why"]').get_attribute("class").split()
    assert page.locator('.rail [data-nav="why"]').is_visible()
    assert page.locator("#detail").is_visible()
    assert page.locator("#priorities").is_visible()
    assert page.locator("#why").is_visible()
    assert page.locator(".perf-more").get_attribute("open") is None
    page.locator(".fcard").last.click()
    assert page.locator('#journey [data-stage="tradeoffs"]').get_attribute("aria-current") == "step"
    assert page.locator("#detail").is_visible()
    shot(page, "desktop-tradeoffs")
    page.locator(".perf-more summary").click()
    assert page.locator(".ptile").count() >= 4
    page.locator('#journey [data-stage="futures"]').click()
    assert not page.locator("#detail").is_visible()
    assert "on" in page.locator('.rail [data-nav="futures"]').get_attribute("class").split()
    page.locator(".fcard .whynot").first.click()
    assert page.locator(".drawer").is_visible(), "Why not opens the explanation"

    mobile = browser.new_page(viewport={"width": 390, "height": 844})
    mobile.on("pageerror", lambda error: errors.append(str(error)))
    mobile.goto(URL)
    mobile.locator("#countyInd").wait_for()
    mobile.locator("#tryExample").click()
    mobile.locator(".fcard").first.wait_for()
    mobile.wait_for_function("window.__hfMap?.getZoom() >= 15", timeout=10000)
    size = mobile.evaluate("({ viewport: innerWidth, page: document.documentElement.scrollWidth })")
    assert size["page"] <= size["viewport"] + 1, "mobile page has no horizontal overflow"
    last_step = mobile.locator('#journey [data-stage="tradeoffs"]').bounding_box()
    assert last_step and last_step["x"] + last_step["width"] <= size["viewport"], "all four steps fit"
    shot(mobile, "mobile-futures")
    mobile.locator("#reviewTradeoffs").click()
    assert mobile.locator("#why").is_visible()
    size = mobile.evaluate("({ viewport: innerWidth, page: document.documentElement.scrollWidth })")
    assert size["page"] <= size["viewport"] + 1, "trade-offs have no horizontal overflow"
    shot(mobile, "mobile-tradeoffs")

    assert not errors, f"JavaScript errors: {errors}"
    browser.close()

print("Guided flow passed.")
