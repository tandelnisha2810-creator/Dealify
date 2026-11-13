import asyncio
from playwright.async_api import async_playwright

async def main():
    print('starting')
    async with async_playwright() as p:
        print('got playwright')
        browser = await p.chromium.launch(
            headless=True,
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        )
        print('launched')
        page = await browser.new_page()
        print('new page')
        await page.goto('https://www.flipkart.com/search?q=iPhone+16', wait_until='domcontentloaded', timeout=60000)
        print('navigated')
        await page.wait_for_timeout(2000)
        print('waited')
        await browser.close()
        print('closed')

if __name__ == '__main__':
    asyncio.run(main())
