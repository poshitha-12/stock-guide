import os
import re
import json
import time
import requests
import pdfminer.high_level
import pandas as pd
import numpy as np

from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sklearn.metrics.pairwise import cosine_similarity

# --------------------------------------------------------------------------
# Base Agent Class
# --------------------------------------------------------------------------
class Agent:
    """
    Base Agent class.
    
    All agents should inherit from this class and implement the run() method.
    """
    def run(self, *args, **kwargs):
        raise NotImplementedError


# --------------------------------------------------------------------------
# PDF Scraper Agent
# --------------------------------------------------------------------------
class PDFScraperAgent(Agent):
    """
    PDFScraperAgent extracts text from a PDF file using pdfminer.
    """
    def run(self, pdf_path: str) -> str:
        """
        Extracts text from the given PDF file.
        
        Args:
            pdf_path (str): Path to the PDF file.
            
        Returns:
            str: Extracted text from the PDF, or an empty string if an error occurs.
        """
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
    CompanyNameExtractionAgent extracts the company name from the first page
    of the PDF text. It assumes the company name ends with 'PLC'.
    """
    def run(self, pdf_text: str) -> str:
        """
        Extracts the company name from the provided PDF text.
        
        Args:
            pdf_text (str): The full text extracted from a PDF.
            
        Returns:
            str: The extracted company name, or an empty string if not found.
        """
        pages = pdf_text.split("\f")
        if not pages:
            return ""
        first_page = pages[0]
        # Regex pattern to capture a company name ending with 'PLC'
        pattern = r"([A-Z][A-Za-z\s\&\-,]+PLC)"
        matches = re.findall(pattern, first_page, re.IGNORECASE)
        if matches:
            # Select the longest match as the company name
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
    SectionSelectorAgent selects candidate sections from the PDF text that likely
    contain the Income Statement information.
    
    It splits the text into pages, then ranks pages using embedding-based similarity
    with respect to target keywords, and returns the top candidate sections.
    """
    def __init__(self, openai_api_key: str, top_n: int = 3):
        """
        Initializes the SectionSelectorAgent with the OpenAI API key and other parameters.
        
        Args:
            openai_api_key (str): API key for generating embeddings.
            top_n (int): Number of candidate sections to select.
        """
        self.embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
        self.top_n = top_n
        
        # Target keywords for income statements
        self.keywords = [
            "consolidated income statement",
            "group statement of profit or loss",
            "statement of profit or loss",
            "group profit or loss statement"
        ]
        
        # Combine keywords into a single query for computing similarity
        self.query = " OR ".join(self.keywords)

        # Regex to capture both "3 months ended" and "03 months to" patterns.
        self.pattern_3m = re.compile(
            r'(?:\b0?3\s*months\s*(?:ended|to)\s*\d{1,2}\s*\w+\s*\d{4})',
            re.IGNORECASE
        )

    def run(self, pdf_text: str) -> str:
        """
        Splits the PDF text into pages and selects candidate sections based on
        the presence of target keywords and embedding similarity.
        
        Args:
            pdf_text (str): Full text extracted from the PDF.
            
        Returns:
            str: Merged text from the selected candidate pages.
        """
        pages = pdf_text.split("\f")
        print(f"[SectionSelectorAgent] {len(pages)} pages identified.")

        candidates = []
        # Iterate over each page and check for target keywords.
        for i, page in enumerate(pages):
            page_lower = page.lower()
            
            # Check if the page includes any target keyword
            if any(keyword in page_lower for keyword in self.keywords):
                # Compute embedding-based similarity for the page
                page_embedding = np.array(self.embeddings.embed_documents([page])[0]).reshape(1, -1)
                query_embedding = np.array(self.embeddings.embed_query(self.query)).reshape(1, -1)
                similarity = cosine_similarity(query_embedding, page_embedding)[0][0]
                candidates.append((i, page, similarity))

        if not candidates:
            print("[SectionSelectorAgent] No pages found with expected headings.")
            return ""

        # Sort candidate pages by similarity score and select the top N
        candidates.sort(key=lambda x: x[2], reverse=True)
        top_candidates = candidates[:self.top_n]
        print(f"[SectionSelectorAgent] Selected top {len(top_candidates)} candidate sections.")

        # Merge selected candidate pages into one string separated by delimiters
        merged_sections = "\n---\n".join([candidate[1] for candidate in top_candidates])
        return merged_sections


# --------------------------------------------------------------------------
# Data Extraction Agent
# --------------------------------------------------------------------------
from src.utils.template_utils import load_jinja_template  # Import the Jinja template loader

class DataExtractionAgent(Agent):
    """
    DataExtractionAgent uses a Jinja template to generate a prompt for the OpenAI API,
    instructing it to extract key financial data from the provided text.
    
    The agent then sends the prompt to the API and parses the JSON output.
    """
    def __init__(self, api_key: str, endpoint: str, model: str, prompt_template: str, openai_params: dict):
        """
        Initializes the DataExtractionAgent.
        
        Args:
            api_key (str): OpenAI API key.
            endpoint (str): API endpoint URL.
            model (str): Model name (e.g., "gpt-3.5-turbo").
            prompt_template (str): Path to the Jinja prompt template.
            openai_params (dict): Additional parameters for the API call.
        """
        self.api_key = api_key
        self.endpoint = endpoint
        self.model = model
        self.prompt_template = prompt_template
        self.openai_params = openai_params

    def run(self, text: str) -> dict:
        """
        Renders the prompt using the Jinja template, sends it to the OpenAI API,
        and parses the resulting JSON.
        
        Args:
            text (str): The combined text extracted from the PDF.
            
        Returns:
            dict: The parsed JSON output containing financial metrics, or an error message.
        """
        # Render the prompt using the Jinja template with the PDF text
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
        # Retry loop to handle potential rate-limiting or network errors
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
            # Extract content from API response
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(f"[DataExtractionAgent] API returned content: {content}")
            if not content:
                raise ValueError("Empty API response content")
            # Remove triple backticks if the content is formatted that way
            if content.startswith("```"):
                content = content.strip("`").strip()
                if content.lower().startswith("json"):
                    content = content[4:].strip()
            # Parse the JSON content
            parsed_result = json.loads(content)
            return parsed_result
        except Exception as e:
            print(f"[DataExtractionAgent ERROR] {e}")
            return {"error": str(e)}


# --------------------------------------------------------------------------
# Data Aggregator Agent
# --------------------------------------------------------------------------
class DataAggregatorAgent(Agent):
    """
    DataAggregatorAgent aggregates the extraction results into a pandas DataFrame.
    """
    def run(self, extraction_results: list) -> pd.DataFrame:
        """
        Aggregates a list of extraction results into a DataFrame.
        
        Args:
            extraction_results (list): List of dictionaries containing extracted data.
            
        Returns:
            pd.DataFrame: DataFrame constructed from the extraction results.
        """
        print("[DataAggregatorAgent] Aggregating results into DataFrame...")
        # Expected keys include: CompanyName, Revenue, COGS, GrossProfit,
        # Other Operating Income, Distribution Costs, Administrative Expenses,
        # Other Operating Expense, NetIncome, PeriodStartEnd, FileName, etc.
        return pd.DataFrame(extraction_results)
