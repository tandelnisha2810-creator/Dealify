import asyncio
from playwright.async_api import async_playwright

async def inspect_amazon():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            args=['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
        )
        page = await browser.new_page()
        await page.goto('https://www.amazon.in/s?k=iPhone+16', timeout=60000)
        await page.wait_for_load_state('domcontentloaded', timeout=60000)
        await page.wait_for_timeout(3000)
        title = await page.title()
        print('Title:', repr(title))
        selectors = [
            'div[data-component-type="s-search-result"]',
            'div[data-component-type="s-search-result"] .a-price-whole',
            '.s-result-item',
            'span.a-price-whole',
            'h2 a span'
        ]
        for sel in selectors:
            els = await page.query_selector_all(sel)
            print(sel, '=>', len(els))
        first = await page.query_selector('div[data-component-type="s-search-result"]')
        if first:
            txt = await first.inner_text()
            print('First result text start:', repr(txt[:200]))
        await browser.close()

asyncio.run(inspect_amazon())
