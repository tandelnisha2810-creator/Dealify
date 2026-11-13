import asyncio
from playwright.async_api import async_playwright

async def inspect(url, selectors):
    print(f'Inspecting {url}')
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        )
        page = await browser.new_page()
        await page.goto(url, wait_until='domcontentloaded', timeout=60000)
        print('navigated')
        for sel in selectors:
            els = await page.query_selector_all(sel)
            print(sel, '=>', len(els))
        await browser.close()
        print('browser closed')

async def main():
    tests = [
        ('https://www.flipkart.com/search?q=iPhone+16', ['._1AtVbE', '._1AtVbE:not(._2rpwqI)', 'a[title]', '._30jeq3', '._3LWZlK', 'a._1fQZEK', 'a.s1Q9rs', 'img._396cs4', 'img._2r_T1I']),
        ('https://www.myntra.com/t-shirt', ['.product-base', '.product-brand', '.product-product', '.product-price .product-discountedPrice', '.product-ratingsContainer .product-ratings']),
        ('https://www.ajio.com/search/?text=t-shirt', ['.item', '.name', '.price .org-price', '.rating']),
        ('https://www.reliancedigital.in/search?q=t-shirt', ['.sp__product', '.sp__name', '.sp__price', '.sp__rating'])
    ]
    for url, selectors in tests:
        await inspect(url, selectors)

if __name__ == '__main__':
    asyncio.run(main())
