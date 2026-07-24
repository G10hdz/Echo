"""Regression check: Practice stays usable when the sentence API is slow/down."""

import argparse
import time

from playwright.sync_api import sync_playwright


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:5173")
    args = parser.parse_args()

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context()
        context.add_init_script(
            "localStorage.setItem('echo_onboarded', 'true')"
        )
        page = context.new_page()
        page.route("**/api/sentences**", lambda route: route.abort())

        started = time.perf_counter()
        page.goto(f"{args.url.rstrip('/')}/practice", wait_until="domcontentloaded")
        dom_ready = time.perf_counter()
        page.get_by_text("The weather is beautiful today", exact=True).wait_for(
            state="visible",
            timeout=1000,
        )
        navigation = dom_ready - started
        usable_after_dom = time.perf_counter() - dom_ready
        browser.close()

    print(
        f"Practice usable {usable_after_dom:.2f}s after DOM ready "
        f"(navigation {navigation:.2f}s) with sentence API unavailable"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
