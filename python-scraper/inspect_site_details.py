import asyncio
from playwright.async_api import async_playwright

async def inspect(url, selectors, sample=5):
    print(f'Inspecting {url}')
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        )
        context = await browser.new_context(ignore_https_errors=True)
        page = await context.new_page()
        await page.goto(url, wait_until='networkidle', timeout=90000)
        await page.wait_for_timeout(5000)
        print('title:', await page.title())
        print('body length:', len(await page.content()))
        for sel in selectors:
            elements = await page.query_selector_all(sel)
            print(sel, '=>', len(elements))
            for i, el in enumerate(elements[:sample]):
                try:
                    outer = await el.evaluate('node => node.outerHTML')
                except Exception as e:
                    outer = f'ERROR: {e}'
                print('  sample', i, outer[:500].replace('\n', ' '))
        await browser.close()
        print('browser closed')

async def main():
    tests = [
        ('https://www.flipkart.com/search?q=iPhone+16', ['._1AtVbE', 'a[title]', 'a._1fQZEK', 'a.s1Q9rs', 'img._396cs4', 'img._2r_T1I']),
        ('https://www.myntra.com/t-shirt', ['.product-base', '.product-brand', '.product-product', '.desktop-searchResults'] ),
        ('https://www.ajio.com/search/?text=t-shirt', ['.item', '.name', '.price .org-price', '.resultsContainer'] ),
        ('https://www.reliancedigital.in/search?q=t-shirt', ['.sp__product', '.sp__name', '.sp__price', '.sp__listing'])
    ]
    for url, selectors in tests:
        try:
            await inspect(url, selectors)
        except Exception as e:
            print('ERROR for', url, e)

if __name__ == '__main__':
    asyncio.run(main())
