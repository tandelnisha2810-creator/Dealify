import asyncio
from playwright.async_api import async_playwright

async def inspect(url):
    print(f'Inspecting URL: {url}')
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        )
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            ignore_https_errors=True,
            locale='en-US'
        )
        page = await context.new_page()
        await page.goto(url, wait_until='domcontentloaded', timeout=90000)
        await page.wait_for_timeout(5000)
        print('final href:', page.url)
        print('title:', await page.title())
        print('body text length:', len(await page.inner_text('body')))
        print('body first 1000 chars:')
        body_text = await page.inner_text('body')
        print(body_text[:1000].replace('\n',' '))
        count = await page.evaluate('''() => {
            const all = Array.from(document.querySelectorAll('*'));
            return {
                nodeCount: all.length,
                hasData: all.filter(el => el.className && el.className.toString().includes('product')).length,
                raw: all.slice(0,20).map(el => ({tag: el.tagName, cls: el.className.toString().slice(0,100)}))
            };
        }''')
        print('DOM summary:', count)
        for cls in ['._1AtVbE', '.YFhlkz', '.s1Q9rs', '.sfwf6d', '.col', '.a-section', '.CXW8mj']:
            elements = await page.query_selector_all(cls)
            print(cls, '=>', len(elements))
        await browser.close()

async def main():
    urls = [
        'https://www.flipkart.com/search?q=iPhone+16',
        'https://www.ajio.com/search/?text=t-shirt',
        'https://www.reliancedigital.in/search?q=t-shirt'
    ]
    for url in urls:
        try:
            await inspect(url)
        except Exception as e:
            print('ERROR', url, e)

if __name__ == '__main__':
    asyncio.run(main())
