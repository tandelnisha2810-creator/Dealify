const { createBrowser, createPage, delay, retry } = require('./scraperUtils');

async function searchFlipkart(query) {
  const browser = await createBrowser();
  const page = await createPage(browser);
  try {
    console.log("Flipkart: Opening search page for query:", query);
    await page.goto(`https://www.flipkart.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000, 4000);

    // Close any popups
    try {
      await page.click("button[class*='close']");
    } catch (e) {}

    console.log("Flipkart: Waiting for product list...");
    
    // Wait for product list with multiple fallback selectors
    try {
      await page.waitForSelector('div[class*="s1Q9rs"]', { timeout: 15000 });
    } catch (e) {
      try {
        await page.waitForSelector('a[class*="product"]', { timeout: 15000 });
      } catch (e2) {
        console.log("Flipkart: Product selector timeout, attempting fallback...");
      }
    }

    console.log("Flipkart: Extracting products...");

    const products = await page.evaluate(() => {
      // Try multiple product container selectors
      let items = Array.from(document.querySelectorAll('[class*="s1Q9rs"]'));
      if (items.length === 0) {
        items = Array.from(document.querySelectorAll('div[class*="col"]')).filter(el => el.querySelector('a[href*="/p/"]'));
      }
      if (items.length === 0) {
        items = Array.from(document.querySelectorAll('a[href*="/p/"]')).slice(0, 5);
      }

      return items.slice(0, 5).map(item => {
        // Title extraction with multiple selectors
        let titleEl = item.querySelector('span') || item.querySelector('div[class*="title"]');
        if (!titleEl) {
          const allSpans = item.querySelectorAll('span');
          titleEl = allSpans[allSpans.length - 1];
        }

        // Price extraction
        const priceEl = item.querySelector('div[class*="price"]') || 
                       item.querySelector('span[class*="price"]') ||
                       item.querySelector('[class*="_30jeq3"]');

        // Rating extraction
        const ratingEl = item.querySelector('span[class*="rating"]') ||
                        item.querySelector('div[class*="rating"]') ||
                        item.querySelector('[class*="_3LWZlK"]');

        // Image extraction
        const imageEl = item.querySelector('img') || 
                       item.querySelector('img[class*="_396cs4"]');

        // Link extraction
        let linkEl = item.querySelector('a[href*="/p/"]') || item.querySelector('a[href]');

        return {
          title: titleEl ? titleEl.textContent.trim() : '',
          price: priceEl ? parseFloat(priceEl.textContent.replace(/[^\d]/g, '')) : 0,
          rating: ratingEl ? parseFloat(ratingEl.textContent.match(/[\d.]+/)?.[0] || 0) : 0,
          image: imageEl ? imageEl.src : '',
          link: linkEl ? (linkEl.getAttribute('href').startsWith('http') ? linkEl.getAttribute('href') : 'https://www.flipkart.com' + linkEl.getAttribute('href')) : ''
        };
      }).filter(p => p.title && p.price > 0);
    });

    console.log("Flipkart: Found", products.length, "products");
    return products;
  } catch (error) {
    console.error('Flipkart search error:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function scrapeFlipkartProduct(url) {
  const browser = await createBrowser();
  const page = await createPage(browser);
  try {
    console.log("Flipkart: Opening product page:", url);
    
    // Check if this is a search URL
    if (url.includes('/search?')) {
      console.log("Flipkart: Detected search URL, finding first product...");
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await delay(2000, 4000);

      // Close popups
      try {
        await page.click("button[class*='close']");
      } catch (e) {}

      // Find first product link
      const firstProductUrl = await page.evaluate(() => {
        const link = document.querySelector('a[href*="/p/"]');
        return link ? link.getAttribute('href') : null;
      });

      if (firstProductUrl) {
        const fullUrl = firstProductUrl.startsWith('http') ? firstProductUrl : 'https://www.flipkart.com' + firstProductUrl;
        console.log("Flipkart: Found product URL, navigating...");
        await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      }
    } else {
      // Direct product URL
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }

    await delay(2000, 4000);

    // Close any popups
    try {
      await page.click("button[class*='close']");
    } catch (e) {}

    console.log("Flipkart: Waiting for product details...");

    // Try multiple strategies to detect page load
    try {
      await Promise.race([
        page.waitForSelector('span[class*="B_NuCI"]', { timeout: 15000 }),
        page.waitForSelector('h1[class*="title"]', { timeout: 15000 }),
        page.waitForSelector('div[class*="productTitle"]', { timeout: 15000 }),
        new Promise(resolve => setTimeout(resolve, 8000))
      ]);
    } catch (e) {
      console.log("Flipkart: Selector wait timed out, attempting extraction anyway...");
    }

    console.log("Flipkart: Scraping product data...");

    const product = await page.evaluate(() => {
      // Title extraction with multiple fallbacks
      let titleEl = document.querySelector('span[class*="B_NuCI"]') ||
                   document.querySelector('h1[class*="title"]') ||
                   document.querySelector('div[class*="productTitle"]') ||
                   document.querySelector('span[class*="name"]');

      // Price extraction with multiple selectors
      let priceEl = document.querySelector('div[class*="_30jeq3._16Jk6d"]') ||
                   document.querySelector('div[class*="price"][class*="current"]') ||
                   document.querySelector('[class*="_16Jk6d"]') ||
                   document.querySelector('span[class*="price"]');

      // Rating extraction
      let ratingEl = document.querySelector('div[class*="_3LWZlK"]') ||
                    document.querySelector('span[class*="rating"]') ||
                    document.querySelector('div[class*="rating"]');

      // Image extraction
      let imageEl = document.querySelector('img[class*="productImage"]') ||
                   document.querySelector('img[alt*="Product"]') ||
                   document.querySelector('img[src*="images"]')?.parentElement?.querySelector('img') ||
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

    console.log("Flipkart: Extracted product:", { title: product.title, price: product.price });

    return product;
  } catch (error) {
    console.error('Flipkart scrape error:', error.message);
    return {};
  } finally {
    await browser.close();
  }
}

module.exports = { searchFlipkart, scrapeFlipkartProduct };