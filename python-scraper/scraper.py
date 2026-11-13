import asyncio
from playwright.async_api import async_playwright
from typing import List, Dict, Any
import re
import logging
from urllib.parse import quote

logger = logging.getLogger(__name__)

class ProductScraper:
    def __init__(self):
        self.timeout = 30000  # 30 seconds
        self.chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"

    async def _launch_browser(self, playwright):
        """Launch browser with system Chrome"""
        return await playwright.chromium.launch(
            headless=True,
            executable_path=self.chrome_path,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor,AutomationControlled'
            ]
        )

    async def _create_context(self, browser):
        context = await browser.new_context(
            user_agent=self.user_agent,
            locale="en-US",
            viewport={"width": 1280, "height": 800},
            java_script_enabled=True,
            accept_downloads=False
        )
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => false});")
        await context.set_extra_http_headers({"accept-language": "en-US,en;q=0.9"})
        return context

    async def scrape_amazon(self, query: str) -> List[Dict[str, Any]]:
        """Scrape Amazon for products"""
        products = []
        try:
            async with async_playwright() as p:
                browser = await self._launch_browser(p)
                page = await browser.new_page()

                search_url = f"https://www.amazon.in/s?k={quote(query)}"
                logger.info(f"Amazon: Searching {search_url}")

                await page.goto(search_url, timeout=self.timeout)
                await page.wait_for_load_state('networkidle', timeout=self.timeout)

                # Wait for product results
                await page.wait_for_selector('.s-result-item', timeout=10000)

                # Extract products
                product_elements = await page.query_selector_all('.s-result-item[data-component-type="s-search-result"]:not(.AdHolder)')

                for i, element in enumerate(product_elements[:5]):
                    try:
                        # Title
                        title_elem = await element.query_selector('h2 a span')
                        title = await title_elem.inner_text() if title_elem else ""

                        # Price
                        price_elem = await element.query_selector('.a-price-whole')
                        price = ""
                        if price_elem:
                            price = await price_elem.inner_text()
                            price = f"₹{price}"

                        # Rating
                        rating_elem = await element.query_selector('.a-icon-star-small .a-icon-alt')
                        rating = await rating_elem.inner_text() if rating_elem else None

                        # Link
                        link_elem = await element.query_selector('h2 a')
                        link = ""
                        if link_elem:
                            href = await link_elem.get_attribute('href')
                            link = f"https://www.amazon.in{href}" if href else ""

                        # Image
                        img_elem = await element.query_selector('.s-image')
                        image = await img_elem.get_attribute('src') if img_elem else None

                        if title and price:
                            products.append({
                                'platform': 'Amazon',
                                'title': title.strip(),
                                'price': price,
                                'rating': rating,
                                'link': link,
                                'image': image
                            })

                    except Exception as e:
                        logger.warning(f"Amazon: Error extracting product {i+1}: {e}")
                        continue

        except Exception as e:
            logger.error(f"Amazon scraping failed: {e}")

        logger.info(f"Amazon: Found {len(products)} products")
        return products

    async def scrape_flipkart(self, query: str) -> List[Dict[str, Any]]:
        """Scrape Flipkart for products"""
        products = []
        try:
            async with async_playwright() as p:
                browser = await self._launch_browser(p)
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                )
                page = await context.new_page()

                search_url = f"https://www.flipkart.com/search?q={quote(query)}"
                logger.info(f"Flipkart: Searching {search_url}")

                await page.goto(search_url, timeout=self.timeout)
                await page.wait_for_load_state('networkidle', timeout=self.timeout)

                # Wait for product results
                await page.wait_for_selector('._1AtVbE', timeout=10000)

                # Extract products
                product_elements = await page.query_selector_all('._1AtVbE:not(._2rpwqI)')

                for i, element in enumerate(product_elements[:5]):
                    try:
                        # Title
                        title_elem = await element.query_selector('a[title]')
                        title = await title_elem.get_attribute('title') if title_elem else ""

                        if not title:
                            title_elem = await element.query_selector('.IRpwTa')
                            title = await title_elem.inner_text() if title_elem else ""

                        # Price
                        price_elem = await element.query_selector('._30jeq3')
                        price = await price_elem.inner_text() if price_elem else ""

                        # Rating
                        rating_elem = await element.query_selector('._3LWZlK')
                        rating = await rating_elem.inner_text() if rating_elem else None

                        # Link
                        link_elem = await element.query_selector('a._1fQZEK, a.s1Q9rs')
                        link = ""
                        if link_elem:
                            href = await link_elem.get_attribute('href')
                            link = f"https://www.flipkart.com{href}" if href else ""

                        # Image
                        img_elem = await element.query_selector('img._396cs4, img._2r_T1I')
                        image = await img_elem.get_attribute('src') if img_elem else None

                        if title and price:
                            products.append({
                                'platform': 'Flipkart',
                                'title': title.strip(),
                                'price': price,
                                'rating': rating,
                                'link': link,
                                'image': image
                            })

                    except Exception as e:
                        logger.warning(f"Flipkart: Error extracting product {i+1}: {e}")
                        continue

        except Exception as e:
            logger.error(f"Flipkart scraping failed: {e}")

        logger.info(f"Flipkart: Found {len(products)} products")
        return products

    async def scrape_myntra(self, query: str) -> List[Dict[str, Any]]:
        """Scrape Myntra for products"""
        products = []
        try:
            async with async_playwright() as p:
                browser = await self._launch_browser(p)
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                )
                page = await context.new_page()

                search_url = f"https://www.myntra.com/{quote(query).replace('%20', '-') }"
                logger.info(f"Myntra: Searching {search_url}")

                await page.goto(search_url, timeout=self.timeout)
                await page.wait_for_load_state('networkidle', timeout=self.timeout)

                # Wait for product results
                await page.wait_for_selector('.product-base', timeout=10000)

                # Extract products
                product_elements = await page.query_selector_all('.product-base')

                for i, element in enumerate(product_elements[:5]):
                    try:
                        # Title
                        title_elem = await element.query_selector('.product-brand')
                        brand = await title_elem.inner_text() if title_elem else ""

                        title_elem = await element.query_selector('.product-product')
                        product_name = await title_elem.inner_text() if title_elem else ""

                        title = f"{brand} {product_name}".strip()

                        # Price
                        price_elem = await element.query_selector('.product-price .product-discountedPrice')
                        price = await price_elem.inner_text() if price_elem else ""

                        # Rating
                        rating_elem = await element.query_selector('.product-ratingsContainer .product-ratings')
                        rating = await rating_elem.inner_text() if rating_elem else None

                        # Link
                        link_elem = await element.query_selector('a')
                        link = ""
                        if link_elem:
                            href = await link_elem.get_attribute('href')
                            link = f"https://www.myntra.com{href}" if href else ""

                        # Image
                        img_elem = await element.query_selector('img')
                        image = await img_elem.get_attribute('src') if img_elem else None

                        if title and price:
                            products.append({
                                'platform': 'Myntra',
                                'title': title,
                                'price': price,
                                'rating': rating,
                                'link': link,
                                'image': image
                            })

                    except Exception as e:
                        logger.warning(f"Myntra: Error extracting product {i+1}: {e}")
                        continue

        except Exception as e:
            logger.error(f"Myntra scraping failed: {e}")

        logger.info(f"Myntra: Found {len(products)} products")
        return products

    async def scrape_ajio(self, query: str) -> List[Dict[str, Any]]:
        """Scrape Ajio for products"""
        products = []
        try:
            async with async_playwright() as p:
                browser = await self._launch_browser(p)
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                )
                page = await context.new_page()

                search_url = f"https://www.ajio.com/search/?text={quote(query)}"
                logger.info(f"Ajio: Searching {search_url}")

                await page.goto(search_url, timeout=self.timeout)
                await page.wait_for_load_state('networkidle', timeout=self.timeout)

                # Wait for product results
                await page.wait_for_selector('.item', timeout=10000)

                # Extract products
                product_elements = await page.query_selector_all('.item')

                for i, element in enumerate(product_elements[:5]):
                    try:
                        # Title
                        title_elem = await element.query_selector('.name')
                        title = await title_elem.inner_text() if title_elem else ""

                        # Price
                        price_elem = await element.query_selector('.price .org-price')
                        price = await price_elem.inner_text() if price_elem else ""

                        # Rating
                        rating_elem = await element.query_selector('.rating')
                        rating = await rating_elem.inner_text() if rating_elem else None

                        # Link
                        link_elem = await element.query_selector('a')
                        link = ""
                        if link_elem:
                            href = await link_elem.get_attribute('href')
                            link = f"https://www.ajio.com{href}" if href else ""

                        # Image
                        img_elem = await element.query_selector('img')
                        image = await img_elem.get_attribute('src') if img_elem else None

                        if title and price:
                            products.append({
                                'platform': 'Ajio',
                                'title': title.strip(),
                                'price': price,
                                'rating': rating,
                                'link': link,
                                'image': image
                            })

                    except Exception as e:
                        logger.warning(f"Ajio: Error extracting product {i+1}: {e}")
                        continue

        except Exception as e:
            logger.error(f"Ajio scraping failed: {e}")

        logger.info(f"Ajio: Found {len(products)} products")
        return products

    async def scrape_reliance(self, query: str) -> List[Dict[str, Any]]:
        """Scrape Reliance Digital for products"""
        products = []
        try:
            async with async_playwright() as p:
                browser = await self._launch_browser(p)
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                )
                page = await context.new_page()

                search_url = f"https://www.reliancedigital.in/search?q={quote(query)}"
                logger.info(f"Reliance: Searching {search_url}")

                await page.goto(search_url, timeout=self.timeout)
                await page.wait_for_load_state('networkidle', timeout=self.timeout)

                # Wait for product results
                await page.wait_for_selector('.sp__product', timeout=10000)

                # Extract products
                product_elements = await page.query_selector_all('.sp__product')

                for i, element in enumerate(product_elements[:5]):
                    try:
                        # Title
                        title_elem = await element.query_selector('.sp__name')
                        title = await title_elem.inner_text() if title_elem else ""

                        # Price
                        price_elem = await element.query_selector('.sp__price')
                        price = await price_elem.inner_text() if price_elem else ""

                        # Rating
                        rating_elem = await element.query_selector('.sp__rating')
                        rating = await rating_elem.inner_text() if rating_elem else None

                        # Link
                        link_elem = await element.query_selector('a')
                        link = ""
                        if link_elem:
                            href = await link_elem.get_attribute('href')
                            link = f"https://www.reliancedigital.in{href}" if href else ""

                        # Image
                        img_elem = await element.query_selector('img')
                        image = await img_elem.get_attribute('src') if img_elem else None

                        if title and price:
                            products.append({
                                'platform': 'Reliance Digital',
                                'title': title.strip(),
                                'price': price,
                                'rating': rating,
                                'link': link,
                                'image': image
                            })

                    except Exception as e:
                        logger.warning(f"Reliance: Error extracting product {i+1}: {e}")
                        continue

        except Exception as e:
            logger.error(f"Reliance scraping failed: {e}")

        logger.info(f"Reliance: Found {len(products)} products")
        return products

# Global scraper instance
scraper = ProductScraper()

async def scrape_all_platforms(query: str) -> Dict[str, List[Dict[str, Any]]]:
    """Scrape all platforms in parallel"""
    tasks = [
        scraper.scrape_amazon(query),
        scraper.scrape_flipkart(query),
        scraper.scrape_myntra(query),
        scraper.scrape_ajio(query),
        scraper.scrape_reliance(query)
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    platforms = ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Reliance Digital']
    scraped_data = {}

    for platform, result in zip(platforms, results):
        if isinstance(result, Exception):
            logger.error(f"{platform} scraping failed: {result}")
            scraped_data[platform] = []
        else:
            scraped_data[platform] = result

    return scraped_data