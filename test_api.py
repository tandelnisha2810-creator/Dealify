import requests
import json

print("Testing Python Scraper API...")
try:
    response = requests.get('http://localhost:8000/search?query=iPhone+16', timeout=5)
    print("Status Code:", response.status_code)
    data = response.json()
    print("Response Type:", data.get('type'))
    print("Number of Products:", len(data.get('products', [])))
    for product in data.get('products', [])[:2]:
        print(f"  - {product['title']} ({product['platform']}) {product['price']}")
except Exception as e:
    print("Error:", e)
    import traceback
    traceback.print_exc()
