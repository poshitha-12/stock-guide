import os
import re
import json
import time
import requests
import pdfminer.high_level
import pandas as pd
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# --------------------------------------------------------------------------
# Base Agent Class
# --------------------------------------------------------------------------
class Agent:
    def run(self, *args, **kwargs):
        raise NotImplementedError


# --------------------------------------------------------------------------
# PDF Scraper Agent
# --------------------------------------------------------------------------
class PDFScraperAgent(Agent):
    def run(self, pdf_path: str) -> str:
        print(f"[PDFScraperAgent] Extracting text from {pdf_path} ...")
        try:
            with open(pdf_path, "rb") as f:
                text = pdfminer.high_level.extract_text(f)
            return text
        except Exception as e:
            print(f"[PDFScraperAgent ERROR] {e}")
            return ""


# --------------------------------------------------------------------------
# Company Name Extraction Agent
# --------------------------------------------------------------------------
class CompanyNameExtractionAgent(Agent):
    """
    Extracts the company name from the first page of the PDF text.
    Assumes the company name ends with 'PLC' and is located on the cover page.
    """
    def run(self, pdf_text: str) -> str:
        pages = pdf_text.split("\f")
        if not pages:
            return ""
        first_page = pages[0]
        # Regex pattern to capture a company name ending with 'PLC'
        pattern = r"([A-Z][A-Za-z\s\&\-,]+PLC)"
        matches = re.findall(pattern, first_page, re.IGNORECASE)
        if matches:
            company_name = max(matches, key=len)
            print(f"[CompanyNameExtractionAgent] Extracted company name: {company_name.strip()}")
            return company_name.strip()
        print("[CompanyNameExtractionAgent] No company name found.")
        return ""


# --------------------------------------------------------------------------
# Section Selector Agent
# --------------------------------------------------------------------------
class SectionSelectorAgent(Agent):
    """
    Uses a modified approach to select candidate sections for the Income Statement.
    Splits the PDF text on page breaks, searches for pages containing any of the target keywords,
    computes similarity scores using embeddings, and returns the selected candidate sections.
    """
    def __init__(self, openai_api_key: str, top_n: int = 3):
        self.embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
        self.top_n = top_n
        self.keywords = [
            "consolidated income statement",
            "group statement of profit or loss",
            "statement of profit or loss",
            "group profit or loss statement"
        ]
        self.query = " OR ".join(self.keywords)

    def run(self, pdf_text: str) -> str:
        pages = pdf_text.split("\f")
        print(f"[SectionSelectorAgent] {len(pages)} pages identified.")
        candidates = []
        for i, page in enumerate(pages):
            page_lower = page.lower()
            if any(keyword in page_lower for keyword in self.keywords):
                page_embedding = np.array(self.embeddings.embed_documents([page])[0]).reshape(1, -1)
                query_embedding = np.array(self.embeddings.embed_query(self.query)).reshape(1, -1)
                similarity = cosine_similarity(query_embedding, page_embedding)[0][0]
                candidates.append((i, page, similarity))
        
        if not candidates:
            print("[SectionSelectorAgent] No pages found with expected headings.")
            return ""
        
        candidates.sort(key=lambda x: x[2], reverse=True)
        top_candidates = candidates[:self.top_n]
        print(f"[SectionSelectorAgent] Selected top {len(top_candidates)} candidate sections.")
        merged_sections = "\n---\n".join([candidate[1] for candidate in top_candidates])
        return merged_sections


# --------------------------------------------------------------------------
# Data Extraction Agent
# --------------------------------------------------------------------------
from src.utils.template_utils import load_jinja_template  # Import your template loader

class DataExtractionAgent(Agent):
    def __init__(self, api_key: str, endpoint: str, model: str, prompt_template: str, openai_params: dict):
        self.api_key = api_key
        self.endpoint = endpoint
        self.model = model
        self.prompt_template = prompt_template
        self.openai_params = openai_params

    def run(self, text: str) -> dict:
        prompt = load_jinja_template(self.prompt_template, pdf_text=text)
        print("[DataExtractionAgent] Sending prompt to OpenAI API...")

        max_tokens = self.openai_params.get("max_tokens", 500)
        temperature = self.openai_params.get("temperature", 0.2)
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        max_retries = 5
        retries = 0
        while retries < max_retries:
            response = requests.post(self.endpoint, headers=headers, json=payload)
            if response.status_code == 200:
                break
            elif response.status_code == 429:
                try:
                    error_data = response.json()
                    msg = error_data.get("error", {}).get("message", "")
                    wait_time = float(msg.split("in")[-1].split("s")[0].strip())
                except Exception:
                    wait_time = 5
                print(f"[DataExtractionAgent] Rate limit reached. Retrying in {wait_time:.2f} seconds... (attempt {retries+1})")
                time.sleep(wait_time)
                retries += 1
            else:
                print(f"[DataExtractionAgent ERROR] API returned status {response.status_code}: {response.text}")
                return {"error": response.text}

        if response.status_code != 200:
            return {"error": f"Max retries exceeded. Last response: {response.text}"}
        try:
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(f"[DataExtractionAgent] API returned content: {content}")
            if not content:
                raise ValueError("Empty API response content")
            if content.startswith("```"):
                content = content.strip("`").strip()
                if content.lower().startswith("json"):
                    content = content[4:].strip()
            parsed_result = json.loads(content)
            return parsed_result
        except Exception as e:
            print(f"[DataExtractionAgent ERROR] {e}")
            return {"error": str(e)}


# --------------------------------------------------------------------------
# Data Aggregator Agent
# --------------------------------------------------------------------------
class DataAggregatorAgent(Agent):
    def run(self, extraction_results: list) -> pd.DataFrame:
        print("[DataAggregatorAgent] Aggregating results into DataFrame...")
        # Expected keys (columns) include:
        # CompanyName, Revenue, COGS, GrossProfit, Other Operating Income,
        # Distribution Costs, Administrative Expenses, Other Operating Expense/Other income and gains,
        # NetIncome, PeriodStartEnd, FileName, etc.
        return pd.DataFrame(extraction_results)
