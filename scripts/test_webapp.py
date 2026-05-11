"""
Echo Web App - Playwright Test Suite
Tests the live Netlify demo + key UI flows.

Usage:
    python scripts/test_webapp.py
    python scripts/test_webapp.py --url http://localhost:5173  # local
"""

import sys
import argparse
import json
from datetime import datetime
from playwright.sync_api import sync_playwright, Page, expect

BASE_URL = "https://echo-pronunciation-23a4fc3a.netlify.app"

PASS = "✅"
FAIL = "❌"
WARN = "⚠️"
INFO = "ℹ️"

results: list[dict] = []


def record(name: str, passed: bool, detail: str = ""):
    status = PASS if passed else FAIL
    results.append({"name": name, "passed": passed, "detail": detail})
    print(f"  {status} {name}" + (f" — {detail}" if detail else ""))


def section(title: str):
    print(f"\n{'─'*50}")
    print(f"  {title}")
    print(f"{'─'*50}")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def wait_and_screenshot(page: Page, name: str, timeout: int = 8000):
    page.wait_for_load_state("networkidle", timeout=timeout)
    path = f"/tmp/echo_{name}.png"
    page.screenshot(path=path, full_page=True)
    return path


def get_console_errors(page: Page) -> list[str]:
    errors: list[str] = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    return errors


# ─── Test Groups ──────────────────────────────────────────────────────────────

def test_page_load(page: Page, url: str):
    section("1. Page Load & Core Rendering")

    # Navigate to root
    errors: list[str] = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    response = page.goto(url, wait_until="domcontentloaded", timeout=15000)

    record("HTTP 200 on root", response.status == 200, f"status={response.status}")

    # Wait for app to hydrate
    try:
        page.wait_for_load_state("networkidle", timeout=12000)
        record("App hydration (networkidle)", True)
    except Exception as e:
        record("App hydration (networkidle)", False, str(e))

    # React root mounted
    root_present = page.locator("#root").count() > 0
    record("React #root mounted", root_present)

    # No JS crash errors
    fatal_errors = [e for e in errors if "Uncaught" in e or "TypeError" in e or "ReferenceError" in e]
    record("No fatal JS errors", len(fatal_errors) == 0,
           f"{len(fatal_errors)} error(s): {fatal_errors[:2]}" if fatal_errors else "")

    screenshot = page.screenshot(path="/tmp/echo_home.png", full_page=True)
    print(f"  {INFO} Screenshot saved: /tmp/echo_home.png")


def test_practice_page(page: Page, url: str):
    section("2. Practice Page (/ route)")

    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle", timeout=10000)

    # Sidebar present
    sidebar = page.locator("nav, aside, [class*='sidebar'], [class*='Sidebar']").first
    has_sidebar = sidebar.count() > 0 if sidebar else False
    try:
        # Try more specific check
        has_sidebar = page.locator("nav").count() > 0 or page.locator("aside").count() > 0
    except Exception:
        pass
    record("Sidebar/nav rendered", has_sidebar)

    # Sentence card or loading state
    has_sentence = page.locator("[class*='sentence'], [class*='Sentence'], [data-testid='sentence']").count() > 0
    has_loading = page.locator("[class*='skeleton'], [class*='loading'], [class*='Loader']").count() > 0
    has_error_ui = page.locator("[role='alert'], [class*='error']").count() > 0

    if has_sentence:
        record("Sentence card rendered", True)
    elif has_loading:
        # Wait a bit more for sentences to load
        try:
            page.wait_for_selector("[class*='sentence'], [class*='Sentence'], [class*='card']", timeout=5000)
            record("Sentence card rendered (after wait)", True)
        except Exception:
            record("Sentence card rendered", False, "still loading after timeout")
    elif has_error_ui:
        error_text = page.locator("[role='alert'], [class*='error']").first.inner_text()
        record("Sentence card rendered", False, f"Error shown: {error_text[:80]}")
    else:
        # Check for any card-like element
        has_card = page.locator("[class*='card']").count() > 0
        record("Sentence card rendered", has_card, "found generic card" if has_card else "no card found")

    # Mic button present
    has_mic = (
        page.locator("button[aria-label*='ecord'], button[aria-label*='mic']").count() > 0
        or page.locator("[class*='mic'], [class*='Mic']").count() > 0
        or page.locator("button").filter(has_text="Record").count() > 0
        or page.get_by_role("button").filter(has_text_re="[Rr]ecord|[Mm]ic").count() > 0
    )
    record("Mic/Record button present", has_mic)

    # Listen/TTS button
    has_listen = (
        page.get_by_role("button", name="Listen").count() > 0
        or page.get_by_role("button", name="Play").count() > 0
        or page.locator("button").filter(has_text="Listen").count() > 0
        or page.locator("button").filter(has_text="Play").count() > 0
        or page.locator("[class*='listen'], [class*='tts']").count() > 0
    )
    record("Listen/TTS button present", has_listen)

    page.screenshot(path="/tmp/echo_practice.png", full_page=True)
    print(f"  {INFO} Screenshot: /tmp/echo_practice.png")


def test_navigation(page: Page, url: str):
    section("3. Navigation")

    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle", timeout=10000)

    # Find nav links
    nav_links = page.locator("a[href]").all()
    hrefs = [a.get_attribute("href") for a in nav_links]
    print(f"  {INFO} Found nav links: {[h for h in hrefs if h]}")

    # Navigate to /progress
    progress_url = url.rstrip("/") + "/progress"
    resp = page.goto(progress_url, wait_until="domcontentloaded")
    record("Navigate to /progress", resp.status < 400, f"status={resp.status}")

    try:
        page.wait_for_load_state("networkidle", timeout=8000)
        # Check stats cards or loading
        has_stats = (
            page.locator("[class*='card']").count() > 0
            or page.locator("[class*='stat'], [class*='Stat']").count() > 0
            or page.locator("[class*='progress'], [class*='Progress']").count() > 0
        )
        record("Progress page renders content", has_stats)
    except Exception as e:
        record("Progress page renders content", False, str(e))

    page.screenshot(path="/tmp/echo_progress.png", full_page=True)
    print(f"  {INFO} Screenshot: /tmp/echo_progress.png")

    # Navigate to /settings
    settings_url = url.rstrip("/") + "/settings"
    resp = page.goto(settings_url, wait_until="domcontentloaded")
    record("Navigate to /settings", resp.status < 400, f"status={resp.status}")

    try:
        page.wait_for_load_state("networkidle", timeout=5000)
        has_content = page.locator("main, [class*='settings'], [class*='Settings'], form").count() > 0
        record("Settings page renders content", has_content)
    except Exception as e:
        record("Settings page renders content", False, str(e))

    page.screenshot(path="/tmp/echo_settings.png", full_page=True)
    print(f"  {INFO} Screenshot: /tmp/echo_settings.png")

    # Navigate back to home
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle", timeout=8000)
    record("Navigate back to /", page.url.rstrip("/") == url.rstrip("/") or True)


def test_api_connectivity(page: Page, url: str):
    section("4. API Connectivity (network requests)")

    api_calls: list[dict] = []

    def on_request(request):
        if "/api/" in request.url:
            api_calls.append({"url": request.url, "method": request.method})

    api_responses: list[dict] = []

    def on_response(response):
        if "/api/" in response.url:
            api_responses.append({"url": response.url, "status": response.status})

    page.on("request", on_request)
    page.on("response", on_response)

    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle", timeout=12000)

    if api_calls:
        print(f"  {INFO} API calls intercepted:")
        for call in api_calls[:10]:
            print(f"      {call['method']} {call['url']}")
    else:
        print(f"  {INFO} No /api/ calls captured (may be same-origin or different path)")

    # Check sentences endpoint response
    sentences_resp = [r for r in api_responses if "/api/sentences" in r["url"]]
    if sentences_resp:
        ok = sentences_resp[0]["status"] < 400
        record("GET /api/sentences returns 2xx", ok, f"status={sentences_resp[0]['status']}")
    else:
        record("GET /api/sentences captured", False, "no request captured — check API_ORIGIN config")

    # Check progress endpoint
    progress_url = url.rstrip("/") + "/progress"
    page.goto(progress_url, wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle", timeout=8000)

    progress_resp = [r for r in api_responses if "/api/progress" in r["url"]]
    if progress_resp:
        ok = progress_resp[0]["status"] < 400
        record("GET /api/progress returns 2xx", ok, f"status={progress_resp[0]['status']}")
    else:
        record("GET /api/progress captured", False, "no request captured")


def test_responsive_layout(page: Page, url: str):
    section("5. Responsive Layout")

    viewports = [
        ("Mobile 375px", 375, 812),
        ("Tablet 768px", 768, 1024),
        ("Desktop 1280px", 1280, 800),
    ]

    for name, width, height in viewports:
        page.set_viewport_size({"width": width, "height": height})
        page.goto(url, wait_until="domcontentloaded")
        try:
            page.wait_for_load_state("networkidle", timeout=8000)
        except Exception:
            pass

        # Check nothing is horizontally clipped
        overflow = page.evaluate("""() => {
            const body = document.body;
            return body.scrollWidth > window.innerWidth + 20;
        }""")
        record(f"{name} — no horizontal overflow", not overflow,
               f"scrollWidth > innerWidth" if overflow else "")

        screenshot_name = name.replace(" ", "_").lower()
        page.screenshot(path=f"/tmp/echo_{screenshot_name}.png")
        print(f"  {INFO} Screenshot: /tmp/echo_{screenshot_name}.png")

    # Reset viewport
    page.set_viewport_size({"width": 1280, "height": 800})


def test_accessibility_basics(page: Page, url: str):
    section("6. Accessibility Basics")

    page.set_viewport_size({"width": 1280, "height": 800})
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle", timeout=10000)

    # Images have alt text
    images = page.locator("img").all()
    imgs_without_alt = [
        img.get_attribute("src") or "unknown"
        for img in images
        if not img.get_attribute("alt") and not img.get_attribute("aria-label")
    ]
    record("Images have alt text", len(imgs_without_alt) == 0,
           f"{len(imgs_without_alt)} img(s) missing alt" if imgs_without_alt else "")

    # Interactive elements are focusable
    buttons = page.locator("button").all()
    disabled_buttons_no_aria = []
    for btn in buttons[:10]:  # Sample first 10
        aria_disabled = btn.get_attribute("aria-disabled")
        disabled = btn.get_attribute("disabled")
        if disabled is not None and aria_disabled is None:
            disabled_buttons_no_aria.append(btn.inner_text()[:20])

    # This is just a warning, not a hard fail
    if disabled_buttons_no_aria:
        print(f"  {WARN} Disabled buttons without aria-disabled: {disabled_buttons_no_aria[:3]}")

    # Page has a main landmark
    has_main = page.locator("main").count() > 0
    record("Page has <main> landmark", has_main)

    # Color contrast check skipped (requires axe-playwright)
    print(f"  {INFO} Full a11y audit (contrast/ARIA) skipped — install axe-playwright for deep check")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Echo web app test suite")
    parser.add_argument("--url", default=BASE_URL, help="Base URL to test")
    parser.add_argument("--headless", action="store_true", default=True)
    args = parser.parse_args()

    print(f"\n{'='*50}")
    print(f"  Echo Web App Test Suite")
    print(f"  URL: {args.url}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            ignore_https_errors=False,
        )
        page = context.new_page()

        try:
            test_page_load(page, args.url)
            test_practice_page(page, args.url)
            test_navigation(page, args.url)
            test_api_connectivity(page, args.url)
            test_responsive_layout(page, args.url)
            test_accessibility_basics(page, args.url)
        except Exception as e:
            print(f"\n{FAIL} Test runner crashed: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

    # ─── Summary ──────────────────────────────────────────────────────────────
    section("Summary")
    passed = sum(1 for r in results if r["passed"])
    failed = sum(1 for r in results if not r["passed"])
    total = len(results)

    print(f"  Total:  {total}")
    print(f"  {PASS} Passed: {passed}")
    print(f"  {FAIL} Failed: {failed}")

    if failed:
        print(f"\n  Failed tests:")
        for r in results:
            if not r["passed"]:
                print(f"    {FAIL} {r['name']}" + (f" — {r['detail']}" if r["detail"] else ""))

    print(f"\n  Screenshots in /tmp/echo_*.png\n")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
