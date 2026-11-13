import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        )
        page = await browser.new_page()
        await page.goto('https://www.flipkart.com/search?q=iPhone+16', wait_until='domcontentloaded', timeout=60000)
        await page.wait_for_timeout(3000)
        content = await page.content()
        print('content length', len(content))
        print('has 1AtVbE', '._1AtVbE' in content)
        print('has _2kHMtA', '._2kHMtA' in content)
        print('has _4ddWXP', '._4ddWXP' in content)
        print('has _1YokD2', '._1YokD2' in content)
        print('snippet', content[:2000])
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
