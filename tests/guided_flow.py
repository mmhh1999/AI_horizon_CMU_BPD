"""Guided five-step flow for mso-v2: the plain URL starts at County with a full-width map, and each step unlocks in order.

Usage:  python3 -m http.server 8795 --directory src/app &   then   .venv/bin/python tests/guided_flow.py [--shots DIR]
APP_URL overrides the address. Checks desktop (1440 px) and mobile (390 px). Exit code 1 on failure.
"""

import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = os.environ.get("APP_URL", "http://localhost:8795/")
shots = Path(sys.argv[sys.argv.index("--shots") + 1]) if "--shots" in sys.argv else None
fails = []


def check(cond, msg):
    print(("ok   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


def current(page):
    return page.get_attribute("#journey [aria-current=step]", "data-stage")


def enabled(page):
    return page.eval_on_selector_all("#journey [data-stage]", "bs => bs.filter(b => !b.disabled).map(b => b.dataset.stage)")


def widths(page):
    return page.evaluate("""() => Object.fromEntries(['.map-col', '.futures-col', '.why-col', '#map canvas'].map(s => [s, Math.round(document.querySelector(s).getBoundingClientRect().width)]))""")


def ranking(page):
    return page.eval_on_selector_all("#ranking [data-rank]", "bs => bs.map(b => b.dataset.rank)")


def settle(page, ms=900):
    page.wait_for_timeout(ms)


def run(pw, width, height, tag):
    print(f"\n-- {tag} ({width}px)")
    browser = pw.chromium.launch(channel="chrome", headless=True)
    page = browser.new_page(viewport={"width": width, "height": height})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    shot = lambda name: shots and (shots.mkdir(parents=True, exist_ok=True) or page.screenshot(path=str(shots / f"{tag}-{name}.png")))
    desktop = width > 1200

    page.goto(URL)
    page.wait_for_function("window.__hfMap && window.__hfMap.loaded()", timeout=30000)
    settle(page, 1200)
    w = widths(page)
    check(current(page) == "community" and page.locator("#countyInd").count() == 1, "plain URL opens Step 1 at the County level")
    check(enabled(page) == ["community"], f"steps 2–5 disabled until a neighborhood is chosen ({enabled(page)})")
    check(w[".futures-col"] == 0 and w[".why-col"] == 0 and w["#map canvas"] == w[".map-col"], f"county map is full width ({w})")
    zoom = page.evaluate("window.__hfMap.getZoom()")
    check(8 <= zoom <= 10.5, f"county map fitted on load (zoom {zoom:.2f})")
    shot("1-county")

    page.fill("#search", "Larimer")
    page.press("#search", "Enter")
    page.wait_for_selector("#environment", timeout=20000)
    settle(page, 1500)
    check(current(page) == "community", "neighborhood opens at Step 1 Community, not a later step")
    check(page.eval_on_selector(".profile", "d => d.open"), "'Who lives here' profile open by default")
    check(page.locator("#environment .env-panel").count() >= 2, "police and smell context panels shown")
    check(page.locator(".fcard").count() == 0, "no housing futures before a lot is picked")
    if desktop:
        w = widths(page)
        check(w["#map canvas"] == w[".map-col"] and w[".futures-col"] > 400, f"map resized with the panel ({w})")
    zoom = page.evaluate("window.__hfMap.getZoom()")
    check(zoom >= 13, f"map zoomed to Larimer (zoom {zoom:.2f})")
    shot("2-community")

    page.click("[data-go-stage=perspective]")
    settle(page, 500)
    check(current(page) == "perspective", "Next goes to Step 2 'Who are you planning for?'")
    check("Who are you planning for?" in page.inner_text("#perspective"), "Step 2 heading")
    check(page.locator("#perspective [data-role]").count() == 5, "five stakeholder tabs")
    check(page.locator("#perspective [data-w]").count() == 10, "10 weight sliders visible without a lot")
    before = page.input_value("#perspective [data-w=feasible]")
    page.click("#perspective [data-role=developer]")
    settle(page, 300)
    check(page.input_value("#perspective [data-w=feasible]") != before, "Developer lens changes the weights")
    shot("3-perspective")

    page.click("[data-go-stage=opportunity]")
    settle(page, 700)
    check(current(page) == "opportunity", "Next goes to Step 3 Opportunity")
    check(page.locator(".opp-card .opp-grid .opp").count() >= 5, "opportunity layer toggles")
    check("Developer" in page.inner_text(".planning-chip"), "the chosen lens carries into Step 3")
    shot("4-opportunity")

    page.click("#hoodExample")
    page.wait_for_selector("#ranking [data-rank]", timeout=20000)
    settle(page, 1500)
    check(current(page) == "futures", "picking a lot opens Step 4 Housing futures")
    above = page.evaluate("document.querySelector('#planningFor').getBoundingClientRect().top < document.querySelector('#ranking').getBoundingClientRect().top")
    check(above and page.locator("#planningFor .wstrip").count() == 1, "'Planning for' weights sit above the ranking")
    check(page.locator("#planningFor [data-role=developer].on").count() == 1, "Step 4 keeps the Developer lens")
    dev = ranking(page)
    page.click("#planningFor [data-role=community]")
    settle(page, 300)
    com = ranking(page)
    check(dev != com, f"switching lens reorders the ranking ({dev} -> {com})")
    shot("5-futures")

    page.click("#reviewTradeoffs")
    page.wait_for_selector("#detail .detail-head", timeout=10000)
    settle(page, 1200)
    check(current(page) == "tradeoffs", "Next goes to Step 5 Trade-offs")
    check(page.locator("#cost .cost-card").count() == 1 and page.locator("#why h2, #why h3").count() >= 1, "detail, cost explorer and why panel shown")
    check(page.get_attribute("#tradeSwitch .ts.on", "data-rank") == com[0], "Trade-offs opens on the #1 ranked type")
    check(not page.eval_on_selector("#solarMore", "d => d.open"), "winter-sun goal collapsed")
    check(page.locator(".axo-big path[stroke='#2F7FB8']").count() == 0, "solar mesh off by default")
    if desktop:
        w = widths(page)
        check(w[".why-col"] > 250 and w["#map canvas"] == w[".map-col"], f"three columns, map resized ({w})")
    shot("6-tradeoffs")

    page.click("#journey [data-stage=community]")
    settle(page, 900)
    check(current(page) == "community" and page.locator("#environment").count() == 1, "journey jumps back to Step 1")

    page.reload()
    page.wait_for_function("window.__hfMap && window.__hfMap.loaded()", timeout=30000)
    settle(page)
    check(current(page) == "community" and page.locator("#countyInd").count() == 1, "reload returns to County")
    check(not errors, f"no JavaScript errors ({errors[:3]})")
    browser.close()


with sync_playwright() as pw:
    run(pw, 1440, 900, "desktop")
    run(pw, 390, 844, "mobile")

print("\nFAILED" if fails else "\nGuided flow passed.")
sys.exit(1 if fails else 0)
