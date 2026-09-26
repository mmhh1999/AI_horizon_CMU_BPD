"""Headless smoke test of the demo path: County > City > Larimer needs > example lot > futures > Why not.

Usage:  (cd src/app && python3 -m http.server 8791) &   then   python tests/smoke_app.py [--shots DIR]
Needs `pip install playwright` and a local Chrome (uses channel="chrome"). Exit code 1 on failure.
"""

import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = "http://localhost:8791/"
shots = Path(sys.argv[sys.argv.index("--shots") + 1]) if "--shots" in sys.argv else None
fails, errors = [], []


def check(cond, msg):
    print(("ok   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


def shot(page, name):
    if shots:
        shots.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(shots / f"{name}.png"), full_page=False)


with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome", headless=True)
    page = browser.new_page(viewport={"width": 1600, "height": 1000})
    page.on("console", lambda m: m.type == "error" and errors.append(m.text))
    page.on("pageerror", lambda e: errors.append(str(e)))

    t0 = time.time()
    page.goto(URL)
    page.wait_for_selector("#countyInd", timeout=20000)
    page.wait_for_function("document.querySelector('#legend') && !document.querySelector('#legend').hidden", timeout=20000)
    check(True, f"county overview loaded in {time.time() - t0:.1f}s")
    page.wait_for_function("window.__hfMap && window.__hfMap.loaded() && window.__hfMap.queryRenderedFeatures({layers: ['muni-fill']}).length > 50", timeout=20000)
    check(True, "county choropleth rendered")
    shot(page, "1-county")

    page.click("[data-go=city]")
    page.wait_for_selector("#hoodInd", timeout=10000)
    check("90 neighborhoods" in page.inner_text("#parcelCard"), "City panel shows 90 neighborhoods")
    page.select_option("#hoodInd", "vacant")
    page.wait_for_timeout(1800)
    shot(page, "2-city")

    t1 = time.time()
    page.fill("#search", "Larimer")
    page.press("#search", "Enter")
    page.wait_for_function("document.querySelector('.needs-card h2')?.textContent.startsWith('What does')", timeout=20000)
    load_s = time.time() - t1
    h2 = page.inner_text(".needs-card h2")
    check(h2 == "What does Larimer need?", f"needs panel title: {h2!r} (loaded in {load_s:.1f}s)")
    n_needs = page.locator(".need").count()
    check(n_needs >= 3, f"{n_needs} needs flagged for Larimer")
    check("Community safety context" in page.inner_text(".safety"), "safety shown as context sentence")
    check("score" not in page.inner_text(".needs").lower(), "no safety score wording in needs list")
    page.wait_for_timeout(1200)
    shot(page, "3-larimer-needs")

    page.click("#tryExample")
    page.wait_for_selector(".fcard", timeout=20000)
    cards = page.locator(".fcard").count()
    check(cards >= 3, f"{cards} housing-future cards for the first example lot")
    check("City of Pittsburgh" in page.inner_text("#parcelCard"), "parcel card shows public owner")
    check(page.locator(".tags .tag").count() >= 1, "opportunity tags on the parcel card")
    page.wait_for_timeout(1200)
    shot(page, "4-parcel")

    page.locator(".fcard .whynot").first.click()
    page.wait_for_selector(".drawer", timeout=10000)
    check(page.locator(".cons li, .drawer p").count() >= 1, "Why-not drawer opens")
    shot(page, "5-why")

    sugg = page.locator(".tp.on").count()
    check(1 <= sugg <= 4, f"type picker: {sugg} types preselected from needs")
    presets = page.eval_on_selector_all("#setSelect option", "os => os.map(o => o.value)")
    page.click("#tryExample")
    page.click("#tryExample")
    page.wait_for_selector(".fcard", timeout=20000)
    for key in presets:
        page.select_option("#setSelect", key)
        page.wait_for_timeout(250)
        n = page.locator(".fcard").count()
        check(n >= 2, f"preset {key!r} on the garage lot: {n} cards")
        if key == "gentle":
            shot(page, "6-gentle-garage")
    before = page.locator(".fcard").count()
    page.locator(".tp:not(.on):not([disabled])").first.click()
    page.wait_for_timeout(250)
    check(page.locator(".fcard").count() == min(before + 1, 4), "adding a type adds a card")
    check(page.input_value("#setSelect") == "custom", "custom mix selected after toggling a type")

    page.click("#tryExample")
    page.wait_for_timeout(1500)
    check(page.locator(".fcard").count() >= 1 or page.locator(".oos").count() == 1, "cycled through all examples")

    extra = [e for e in errors if "tiles.openfreemap" not in e and "Failed to load resource" not in e]
    check(not extra, f"no JavaScript errors ({len(extra)})" + ("".join("\n     " + e[:200] for e in extra[:5])))
    browser.close()

print("\nFAILED" if fails else "\nSmoke test passed.")
sys.exit(1 if fails else 0)
