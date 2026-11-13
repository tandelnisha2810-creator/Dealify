import re
from typing import List, Dict, Any, Tuple
from difflib import SequenceMatcher
import logging

logger = logging.getLogger(__name__)

def extract_version_numbers(text: str) -> List[int]:
    """Extract version numbers from text"""
    # Find all numbers that could be version numbers (1-3 digits)
    numbers = re.findall(r'\b(\d{1,3})\b', text.lower())
    return [int(num) for num in numbers if 1 <= int(num) <= 99]  # Reasonable version range

def remove_versions(text: str) -> str:
    """Remove version numbers from text for similar matching"""
    # Remove standalone numbers
    text = re.sub(r'\b\d{1,3}\b', '', text)
    # Clean up extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def normalize_text(text: str) -> str:
    """Normalize text for comparison"""
    if not text:
        return ""
    # Convert to lowercase, remove special chars, normalize spaces
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_keywords(text: str) -> List[str]:
    """Extract meaningful keywords from text"""
    text = normalize_text(text)
    words = text.split()
    # Filter out common stop words and very short words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'}
    keywords = [word for word in words if len(word) > 2 and word not in stop_words]
    return keywords

def has_all_keywords(query_keywords: List[str], product_title: str) -> bool:
    """Check if product title contains all query keywords"""
    product_lower = product_title.lower()
    return all(keyword.lower() in product_lower for keyword in query_keywords)

def versions_match(query_versions: List[int], product_versions: List[int]) -> bool:
    """Check if versions match between query and product"""
    if not query_versions:
        return True  # No version constraint
    return any(qv in product_versions for qv in query_versions)

def calculate_match_score(query: str, product_title: str) -> Tuple[bool, float]:
    """Calculate how well a product matches the query"""
    query_norm = normalize_text(query)
    product_norm = normalize_text(product_title)

    # Extract versions
    query_versions = extract_version_numbers(query_norm)
    product_versions = extract_version_numbers(product_norm)

    # Extract keywords
    query_keywords = extract_keywords(query_norm)
    product_keywords = extract_keywords(product_norm)

    # Version matching (critical for exact matches)
    version_match = versions_match(query_versions, product_versions)

    # Keyword matching
    has_keywords = has_all_keywords(query_keywords, product_norm)

    # Fuzzy similarity
    fuzzy_score = SequenceMatcher(None, query_norm, product_norm).ratio()

    # Calculate final score
    score = 0.0
    matched = False

    if version_match and has_keywords:
        # Exact match
        score = 90.0 + (fuzzy_score * 10)  # 90-100
        matched = True
    elif fuzzy_score > 0.6:
        # Good fuzzy match
        score = fuzzy_score * 50  # 30-50
        matched = True
    elif has_keywords:
        # Keywords match but version doesn't
        score = 20.0 + (fuzzy_score * 30)  # 20-50
        matched = True

    return matched, score

def find_exact_matches(query: str, all_products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Find exact matches based on version numbers and keywords"""
    matches = []

    for product in all_products:
        matched, score = calculate_match_score(query, product['title'])
        if matched and score >= 90:  # Exact match threshold
            product_with_score = product.copy()
            product_with_score['score'] = score
            matches.append(product_with_score)

    # Sort by score descending
    matches.sort(key=lambda x: x['score'], reverse=True)
    return matches[:5]  # Top 5 matches

def find_similar_matches(query: str, all_products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Find similar matches by removing version numbers"""
    query_no_version = remove_versions(query)
    matches = []

    for product in all_products:
        product_no_version = remove_versions(product['title'])

        # Calculate similarity on version-removed text
        fuzzy_score = SequenceMatcher(None, normalize_text(query_no_version), normalize_text(product_no_version)).ratio()

        # Extract keywords from version-removed text
        query_keywords = extract_keywords(query_no_version)
        product_keywords = extract_keywords(product_no_version)

        # Must have some keyword overlap
        keyword_overlap = len(set(query_keywords) & set(product_keywords))
        has_overlap = keyword_overlap > 0

        if fuzzy_score > 0.4 and has_overlap:  # Similar match threshold
            score = fuzzy_score * 60  # 24-60 range
            product_with_score = product.copy()
            product_with_score['score'] = score
            matches.append(product_with_score)

    # Sort by score descending
    matches.sort(key=lambda x: x['score'], reverse=True)
    return matches[:5]  # Top 5 matches

def hybrid_match_products(query: str, scraped_data: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """
    Hybrid matching: exact first, then similar
    Returns: {"type": "exact"|"similar", "products": [...]}
    """
    # Flatten all products from all platforms
    all_products = []
    for platform_products in scraped_data.values():
        all_products.extend(platform_products)

    logger.info(f"Total products to match: {len(all_products)}")

    # Step 1: Try exact matching
    exact_matches = find_exact_matches(query, all_products)
    if exact_matches:
        logger.info(f"Found {len(exact_matches)} exact matches")
        return {
            "type": "exact",
            "products": exact_matches
        }

    # Step 2: Fallback to similar matching
    similar_matches = find_similar_matches(query, all_products)
    if similar_matches:
        logger.info(f"Found {len(similar_matches)} similar matches")
        return {
            "type": "similar",
            "products": similar_matches
        }

    # No matches found
    logger.info("No matches found")
    return {
        "type": "similar",  # Still "similar" but empty
        "products": []
    }