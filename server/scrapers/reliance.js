// Real Reliance Digital scraper
const { createBrowser, createPage, delay, retry } = require('./scraperUtils');

async function searchReliance(query) {
  const browser = await createBrowser();
  const page = await createPage(browser);
  try {
    console.log("Reliance: Opening search page for query:", query);
    await page.goto(`https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000, 4000);

    console.log("Reliance: Waiting for product list...");
    try {
      await page.waitForSelector('[class*="productGrid"]', { timeout: 15000 });
    } catch (e) {
      console.log("Reliance: Product selector timeout, attempting extraction anyway...");
    }

    console.log("Reliance: Extracting products...");

    const products = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[class*="product"]')).slice(0, 5);
      if (items.length === 0) {
        return Array.from(document.querySelectorAll('a[href*="/p/"]')).slice(0, 5).map(el => ({
          title: el.textContent?.trim() || '',
          price: 0,
          rating: 0,
          image: el.querySelector('img')?.src || '',
          link: 'https://www.reliancedigital.in' + el.getAttribute('href')
        }));
      }

      return items.map(item => {
        const titleEl = item.querySelector('[class*="title"]') || item.querySelector('p');
        const priceEl = item.querySelector('[class*="price"]');
        const ratingEl = item.querySelector('[class*="rating"]');
        const imageEl = item.querySelector('img');
        const linkEl = item.querySelector('a');

        return {
          title: titleEl ? titleEl.textContent.trim() : '',
          price: priceEl ? parseFloat(priceEl.textContent.replace(/[^\d]/g, '')) : 0,
          rating: ratingEl ? parseFloat(ratingEl.textContent.match(/[\d.]+/)?.[0] || 0) : 0,
          image: imageEl ? imageEl.src : '',
          link: linkEl ? (linkEl.getAttribute('href').startsWith('http') ? linkEl.getAttribute('href') : 'https://www.reliancedigital.in' + linkEl.getAttribute('href')) : ''
        };
      }).filter(p => p.title && p.price > 0);
    });

    console.log("Reliance: Found", products.length, "products");
    return products;
  } catch (error) {
    console.error('Reliance search error:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function scrapeRelianceProduct(url) {
  const browser = await createBrowser();
  const page = await createPage(browser);
  try {
    console.log("Reliance: Opening product page:", url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000, 4000);

    console.log("Reliance: Waiting for product details...");

    try {
      await Promise.race([
        page.waitForSelector('[class*="productTitle"]', { timeout: 15000 }),
        page.waitForSelector('h1', { timeout: 15000 }),
        new Promise(resolve => setTimeout(resolve, 8000))
      ]);
    } catch (e) {
      console.log("Reliance: Selector wait timed out, attempting extraction anyway...");
    }

    console.log("Reliance: Scraping product data...");

    const product = await page.evaluate(() => {
      const titleEl = document.querySelector('[class*="productTitle"]') ||
                     document.querySelector('[class*="product-name"]') ||
                     document.querySelector('h1');
      
      const priceEl = document.querySelector('[class*="price"]') ||
                     document.querySelector('[class*="productPrice"]');
      
      const ratingEl = document.querySelector('[class*="rating"]') ||
                      document.querySelector('[class*="star"]');
      
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

    console.log("Reliance: Extracted product:", { title: product.title, price: product.price });

    return product;
  } catch (error) {
    console.error('Reliance scrape error:', error.message);
    return {};
  } finally {
    await browser.close();
  }
}

module.exports = { searchReliance, scrapeRelianceProduct };