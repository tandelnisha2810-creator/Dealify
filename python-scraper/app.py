from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from scraper import scrape_all_platforms
from matcher import hybrid_match_products
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BuyHatke Python Scraper", version="1.0.0")

class SearchRequest(BaseModel):
    query: str

class Product(BaseModel):
    platform: str
    title: str
    price: str
    rating: Optional[str] = None
    link: str
    image: Optional[str] = None

class SearchResponse(BaseModel):
    type: str  # "exact" or "similar"
    products: List[Product]

async def do_search(query: str):
    logger.info(f"Starting search for: {query}")

    scraped_data = await scrape_all_platforms(query)
    logger.info(f"Scraped data: {sum(len(products) for products in scraped_data.values())} total products")

    result = hybrid_match_products(query, scraped_data)
    logger.info(f"Match result: type={result['type']}, products={len(result['products'])}")

    return result


@app.post("/search", response_model=SearchResponse)
async def search_products(request: SearchRequest):
    """
    Search for products across all platforms with hybrid matching
    """
    try:
        return await do_search(request.query)
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@app.get("/search", response_model=SearchResponse)
async def search_products_get(query: str):
    """
    Search endpoint for quick GET-based debugging
    """
    try:
        return await do_search(query)
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)