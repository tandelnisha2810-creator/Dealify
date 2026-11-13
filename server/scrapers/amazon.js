const { createBrowser, createPage, delay, retry } = require('./scraperUtils');

async function searchAmazon(query) {
  const browser = await createBrowser();
  const page = await createPage(browser);
  try {
    console.log("Amazon: Opening search page for query:", query);
    await page.goto(`https://www.amazon.in/s?k=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000, 4000);

    console.log("Amazon: Waiting for product list...");
    try {
      await page.waitForSelector('[data-asin]:not([data-asin=""])', { timeout: 15000 });
    } catch (e) {
      console.log("Amazon: Product selector timeout, attempting extraction anyway...");
    }

    console.log("Amazon: Extracting products...");

    const products = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[data-asin]:not([data-asin=""])')).slice(0, 5);
      return items.map(item => {
        const titleEl = item.querySelector('h2 a span') || item.querySelector('.a-text-normal') || item.querySelector('span[class*="title"]');
        const priceEl = item.querySelector('.a-price-whole') || item.querySelector('span[class*="price"]');
        const ratingEl = item.querySelector('.a-icon-star-small .a-icon-alt') || item.querySelector('span[class*="rating"]');
        const imageEl = item.querySelector('img.s-image') || item.querySelector('img');
        const linkEl = item.querySelector('h2 a') || item.querySelector('a.a-link-normal');

        return {
          title: titleEl ? titleEl.textContent.trim() : '',
          price: priceEl ? parseFloat(priceEl.textContent.replace(/[^\d]/g, '')) : 0,
          rating: ratingEl ? parseFloat(ratingEl.textContent.split(' ')[0]) : 0,
          image: imageEl ? imageEl.src : '',
          link: linkEl ? (linkEl.getAttribute('href').startsWith('http') ? linkEl.getAttribute('href') : 'https://www.amazon.in' + linkEl.getAttribute('href')) : ''
        };
      }).filter(p => p.title && p.price > 0);
    });

    console.log("Amazon: Found", products.length, "products");
    return products;
  } catch (error) {
    console.error('Amazon search error:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function scrapeAmazonProduct(url) {
  const browser = await createBrowser();
  const page = await createPage(browser);
  try {
    console.log("Amazon: Opening product page:", url);
    
    // Check if this is a search URL
    if (url.includes('/s?k=')) {
      console.log("Amazon: Detected search URL, finding first product...");
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await delay(2000, 4000);

      // Find first product link
      const firstProductUrl = await page.evaluate(() => {
        const link = document.querySelector('h2 a') || document.querySelector('a[href*="/dp/"]');
        return link ? link.getAttribute('href') : null;
      });

      if (firstProductUrl) {
        const fullUrl = firstProductUrl.startsWith('http') ? firstProductUrl : 'https://www.amazon.in' + firstProductUrl;
        console.log("Amazon: Found product URL, navigating...");
        await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      }
    } else {
      // Direct product URL
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    }

    await delay(2000, 4000);

    console.log("Amazon: Waiting for product details...");

    // Try multiple strategies to detect page load
    try {
      await Promise.race([
        page.waitForSelector('#productTitle', { timeout: 15000 }),
        page.waitForSelector('h1[class*="title"]', { timeout: 15000 }),
        new Promise(resolve => setTimeout(resolve, 8000))
      ]);
    } catch (e) {
      console.log("Amazon: Selector wait timed out, attempting extraction anyway...");
    }

    console.log("Amazon: Scraping product data...");

    const product = await page.evaluate(() => {
      const titleEl = document.querySelector('#productTitle') || 
                     document.querySelector('h1[class*="title"]') ||
                     document.querySelector('span[class*="name"]');
      
      const priceEl = document.querySelector('.a-price-whole') || 
                     document.querySelector('#priceblock_ourprice') ||
                     document.querySelector('span[class*="price"]');
      
      const ratingEl = document.querySelector('.a-icon-star .a-icon-alt') ||
                      document.querySelector('span[class*="rating"]');
      
      const imageEl = document.querySelector('#landingImage') || 
                     document.querySelector('#imgBlkFront') ||
                     document.querySelector('img[class*="product"]');

      let title = titleEl ? titleEl.textContent.trim() : '';
      let price = priceEl ? parseFloat(priceEl.textContent.replace(/[^\d]/g, '')) : 0;
      let rating = ratingEl ? parseFloat(ratingEl.textContent.split(' ')[0]) : 0;
      let image = imageEl ? imageEl.src : '';

      return {
        title,
        price,
        rating,
        image,
        link: window.location.href
      };
    });

    console.log("Amazon: Extracted product:", { title: product.title, price: product.price });

    return product;
  } catch (error) {
    console.error('Amazon scrape error:', error.message);
    return {};
  } finally {
    await browser.close();
  }
}

module.exports = { searchAmazon, scrapeAmazonProduct };