// Real Ajio scraper
const { createBrowser, createPage, delay, retry } = require('./scraperUtils');

async function searchAjio(query) {
  const browser = await createBrowser();
  const page = await createPage(browser);
  try {
    console.log("Ajio: Opening search page for query:", query);
    await page.goto(`https://www.ajio.com/search/?text=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000, 4000);

    console.log("Ajio: Waiting for product list...");
    try {
      await page.waitForSelector('[class*="productCardImg"]', { timeout: 15000 });
    } catch (e) {
      console.log("Ajio: Product selector timeout, attempting extraction anyway...");
    }

    console.log("Ajio: Extracting products...");

    const products = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[class*="productCardImg"]')).slice(0, 5);
      if (items.length === 0) {
        return Array.from(document.querySelectorAll('a[href*="/p/"]')).slice(0, 5).map(el => ({
          title: el.textContent?.trim() || '',
          price: 0,
          rating: 0,
          image: el.querySelector('img')?.src || '',
          link: 'https://www.ajio.com' + el.getAttribute('href')
        }));
      }

      return items.map(item => {
        const linkEl = item.closest('a') || item.parentElement.querySelector('a');
        const titleEl = item.parentElement.querySelector('p') || item.querySelector('span');
        const priceEl = item.parentElement.querySelector('[class*="price"]');
        const ratingEl = item.parentElement.querySelector('[class*="rating"]');
        const imageEl = item.querySelector('img');

        return {
          title: titleEl ? titleEl.textContent.trim() : '',
          price: priceEl ? parseFloat(priceEl.textContent.replace(/[^\d]/g, '')) : 0,
          rating: ratingEl ? parseFloat(ratingEl.textContent.match(/[\d.]+/)?.[0] || 0) : 0,
          image: imageEl ? imageEl.src : '',
          link: linkEl ? ('https://www.ajio.com' + linkEl.getAttribute('href')) : ''
        };
      }).filter(p => p.title && p.price > 0);
    });

    console.log("Ajio: Found", products.length, "products");
    return products;
  } catch (error) {
    console.error('Ajio search error:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function scrapeAjioProduct(url) {
  const browser = await createBrowser();
  const page = await createPage(browser);
  try {
    console.log("Ajio: Opening product page:", url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000, 4000);

    console.log("Ajio: Waiting for product details...");

    try {
      await Promise.race([
        page.waitForSelector('[class*="productTitle"]', { timeout: 15000 }),
        page.waitForSelector('h1', { timeout: 15000 }),
        new Promise(resolve => setTimeout(resolve, 8000))
      ]);
    } catch (e) {
      console.log("Ajio: Selector wait timed out, attempting extraction anyway...");
    }

    console.log("Ajio: Scraping product data...");

    const product = await page.evaluate(() => {
      const titleEl = document.querySelector('[class*="productTitle"]') ||
                     document.querySelector('h1') ||
                     document.querySelector('[class*="title"]');
      
      const priceEl = document.querySelector('[class*="productPrice"]') ||
                     document.querySelector('span[class*="price"]');
      
      const ratingEl = document.querySelector('[class*="rating"]') ||
                      document.querySelector('div[class*="star"]');
      
      const imageEl = document.querySelector('img[class*="productImage"]') ||
                     document.querySelector('img[alt*="Product"]') ||
                     document.querySelector('img');

      let title = titleEl ? titleEl.textContent.trim() : '';
      let price = priceEl ? parseFloat(priceEl.textContent.replace(/[^\d]/g, '')) : 0;
      let rating = ratingEl ? parseFloat(ratingEl.textContent.match(/[\d.]+/)?.[0] || 0) : 0;
      let image = imageEl ? imageEl.src : '';

      return {
        title,
        price,
        rating,
        image,
        link: window.location.href
      };
    });

    console.log("Ajio: Extracted product:", { title: product.title, price: product.price });

    return product;
  } catch (error) {
    console.error('Ajio scrape error:', error.message);
    return {};
  } finally {
    await browser.close();
  }
}

module.exports = { searchAjio, scrapeAjioProduct };