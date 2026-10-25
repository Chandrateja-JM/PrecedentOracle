"""
Indian Kanoon Scraper — Fetches real case data from indiankanoon.org
Adapted from LegalSphere's ConsumerCasesScraper approach.

Usage:
    python scraper/indian_kanoon_scraper.py --query "murder" --count 50
    python scraper/indian_kanoon_scraper.py --query "Article 21" --count 100 --court SC

NOTE: Indian Kanoon may rate-limit. Be respectful — add delays between requests.
      For bulk data, use their API: https://api.indiankanoon.org (requires registration).
"""

import json
import time
import os
import re
import sys
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict

# These imports require: pip install requests beautifulsoup4 selenium
try:
    import requests
    from bs4 import BeautifulSoup
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False
    print("Install dependencies: pip install requests beautifulsoup4")


@dataclass
class ScrapedCase:
    title: str
    citation: str
    court: str
    date: str
    year: int
    doc_id: str
    url: str
    headnote: str = ""
    full_text: str = ""
    judges: List[str] = None
    statutes_mentioned: List[str] = None
    cases_cited: List[str] = None
    category: str = "General"

    def __post_init__(self):
        if self.judges is None:
            self.judges = []
        if self.statutes_mentioned is None:
            self.statutes_mentioned = []
        if self.cases_cited is None:
            self.cases_cited = []


class IndianKanoonScraper:
    """
    Scraper for Indian Kanoon (indiankanoon.org).
    Extracts case metadata, headnotes, and full text.
    """

    BASE_URL = "https://indiankanoon.org"
    SEARCH_URL = "https://indiankanoon.org/search/"
    API_URL = "https://api.indiankanoon.org/search/"

    # Court type codes for filtering
    COURT_TYPES = {
        "SC": "supremecourt",
        "HC": "allahabad,bombay,calcutta,delhi,karnataka,kerala,madras,gauhati",
        "Bombay": "bombay",
        "Delhi": "delhi",
        "Karnataka": "karnataka",
        "Madras": "madras",
        "Calcutta": "calcutta",
        "Allahabad": "allahabad",
        "Kerala": "kerala",
    }

    def __init__(self, api_token: Optional[str] = None, delay: float = 2.0):
        """
        Args:
            api_token: Indian Kanoon API token (from api.indiankanoon.org)
            delay: Seconds between requests to avoid rate limiting
        """
        self.api_token = api_token
        self.delay = delay
        self.session = requests.Session() if HAS_DEPS else None
        if self.session:
            self.session.headers.update({
                "User-Agent": "PrecedentOracle/1.0 (Legal Research Platform; M.Tech AI/ML Project)"
            })

    def search(self, query: str, court: str = "", count: int = 25, page: int = 0) -> List[Dict]:
        """
        Search Indian Kanoon and return case metadata.

        Args:
            query: Search query (case name, legal term, section number)
            court: Court filter (SC, HC, Delhi, Karnataka, etc.)
            count: Number of results to fetch
            page: Page number for pagination

        Returns:
            List of case metadata dicts
        """
        if not HAS_DEPS:
            print("Cannot scrape: requests/beautifulsoup4 not installed")
            return []

        results = []
        pages_needed = (count + 9) // 10  # 10 results per page

        for p in range(pages_needed):
            form_input = query
            if court and court in self.COURT_TYPES:
                form_input += f" doctypes:{self.COURT_TYPES[court]}"

            params = {
                "formInput": form_input,
                "pagenum": p
            }

            try:
                if self.api_token:
                    # Use official API
                    headers = {"Authorization": f"Token {self.api_token}"}
                    response = self.session.post(self.API_URL, data=params, headers=headers)
                else:
                    # Scrape web interface
                    response = self.session.get(self.SEARCH_URL, params=params)

                if response.status_code == 200:
                    page_results = self._parse_search_results(response.text)
                    results.extend(page_results)
                    if len(results) >= count:
                        break
                else:
                    print(f"HTTP {response.status_code} on page {p}")
                    break

                time.sleep(self.delay)

            except Exception as e:
                print(f"Error on page {p}: {e}")
                break

        return results[:count]

    def get_case_detail(self, doc_id: str) -> Optional[ScrapedCase]:
        """
        Fetch full case details from Indian Kanoon.

        Args:
            doc_id: Indian Kanoon document ID (from search results)

        Returns:
            ScrapedCase with full text, citations, etc.
        """
        if not HAS_DEPS:
            return None

        url = f"{self.BASE_URL}/doc/{doc_id}/"
        try:
            response = self.session.get(url)
            if response.status_code == 200:
                return self._parse_case_page(response.text, doc_id)
            else:
                print(f"HTTP {response.status_code} for doc {doc_id}")
                return None
        except Exception as e:
            print(f"Error fetching doc {doc_id}: {e}")
            return None

    def scrape_and_save(self, query: str, output_file: str, court: str = "", count: int = 50):
        """
        Full pipeline: search + fetch details + save to JSON.

        Args:
            query: Search query
            output_file: Path to save JSON output
            court: Court filter
            count: Number of cases to fetch
        """
        print(f"Searching Indian Kanoon for: '{query}' (court: {court or 'all'}, count: {count})")
        search_results = self.search(query, court, count)
        print(f"Found {len(search_results)} results")

        cases = []
        for i, result in enumerate(search_results):
            print(f"Fetching case {i+1}/{len(search_results)}: {result.get('title', 'Unknown')[:60]}...")
            doc_id = result.get("doc_id", "")
            if doc_id:
                case = self.get_case_detail(doc_id)
                if case:
                    cases.append(asdict(case))
                time.sleep(self.delay)

        # Save to JSON
        os.makedirs(os.path.dirname(output_file) or ".", exist_ok=True)
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(cases, f, indent=2, ensure_ascii=False)

        print(f"Saved {len(cases)} cases to {output_file}")
        return cases

    def _parse_search_results(self, html: str) -> List[Dict]:
        """Parse search results page HTML."""
        soup = BeautifulSoup(html, "html.parser")
        results = []

        for result_div in soup.select(".result"):
            title_elem = result_div.select_one(".result_title a")
            if not title_elem:
                continue

            title = title_elem.get_text(strip=True)
            href = title_elem.get("href", "")
            doc_id = href.strip("/").split("/")[-1] if href else ""

            # Extract court and date
            meta = result_div.select_one(".result_author")
            court = ""
            date = ""
            if meta:
                meta_text = meta.get_text(strip=True)
                # Parse "Supreme Court of India - 15 March, 2017"
                parts = meta_text.split(" - ")
                if len(parts) >= 1:
                    court = parts[0].strip()
                if len(parts) >= 2:
                    date = parts[1].strip()

            # Extract snippet
            snippet = ""
            snippet_elem = result_div.select_one(".result_text")
            if snippet_elem:
                snippet = snippet_elem.get_text(strip=True)[:500]

            year = 0
            year_match = re.search(r'\b(19\d{2}|20\d{2})\b', date or title)
            if year_match:
                year = int(year_match.group(1))

            results.append({
                "title": title,
                "doc_id": doc_id,
                "court": court,
                "date": date,
                "year": year,
                "snippet": snippet,
                "url": f"{self.BASE_URL}/doc/{doc_id}/"
            })

        return results

    def _parse_case_page(self, html: str, doc_id: str) -> ScrapedCase:
        """Parse individual case page HTML."""
        soup = BeautifulSoup(html, "html.parser")

        # Title
        title = ""
        title_elem = soup.select_one("h2.doc_title, .doc_title")
        if title_elem:
            title = title_elem.get_text(strip=True)

        # Court and date
        court = ""
        date = ""
        author_elem = soup.select_one(".doc_author, .docsource_main")
        if author_elem:
            author_text = author_elem.get_text(strip=True)
            parts = author_text.split(" - ")
            if len(parts) >= 1:
                court = parts[0].strip()
            if len(parts) >= 2:
                date = parts[-1].strip()

        # Full text
        full_text = ""
        judgment_elem = soup.select_one(".judgments, #jd")
        if judgment_elem:
            full_text = judgment_elem.get_text(separator="\n", strip=True)[:50000]

        # Citation
        citation = ""
        cite_elem = soup.select_one(".doc_citations, .docsource_main")
        if cite_elem:
            citation = cite_elem.get_text(strip=True)

        # Extract cited cases
        cited_cases = []
        for link in soup.select("a[href*='/doc/']"):
            cited_text = link.get_text(strip=True)
            if " v. " in cited_text or " vs. " in cited_text:
                cited_cases.append(cited_text)

        # Extract judges
        judges = []
        bench_elem = soup.select_one(".doc_bench")
        if bench_elem:
            bench_text = bench_elem.get_text(strip=True)
            judges = [j.strip() for j in bench_text.split(",") if j.strip()]

        year = 0
        year_match = re.search(r'\b(19\d{2}|20\d{2})\b', date or citation or title)
        if year_match:
            year = int(year_match.group(1))

        return ScrapedCase(
            title=title,
            citation=citation,
            court=court,
            date=date,
            year=year,
            doc_id=doc_id,
            url=f"{self.BASE_URL}/doc/{doc_id}/",
            headnote=full_text[:1000] if full_text else "",
            full_text=full_text,
            judges=judges,
            cases_cited=list(set(cited_cases))[:20],
        )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Scrape Indian Kanoon for legal cases")
    parser.add_argument("--query", required=True, help="Search query")
    parser.add_argument("--court", default="", help="Court filter (SC, HC, Delhi, Karnataka...)")
    parser.add_argument("--count", type=int, default=25, help="Number of cases to fetch")
    parser.add_argument("--output", default="scraped_cases.json", help="Output JSON file")
    parser.add_argument("--api-token", default="", help="Indian Kanoon API token")
    parser.add_argument("--delay", type=float, default=2.0, help="Delay between requests (seconds)")

    args = parser.parse_args()

    scraper = IndianKanoonScraper(api_token=args.api_token or None, delay=args.delay)
    scraper.scrape_and_save(args.query, args.output, args.court, args.count)
