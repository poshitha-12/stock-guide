import os
import re
import json
import yaml
import requests
import time
import pdfminer.high_level
import pandas as pd
from jinja2 import Environment, FileSystemLoader
from dotenv import load_dotenv

# Updated import per LangChain deprecation notice:
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ---- Configuration Helpers ----
def read_configuration(file_path):
    with open(file_path, 'r') as file:
        return yaml.safe_load(file)

def load_jinja_template(template_name: str, **kwargs) -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    template_dir = os.path.join(base_dir, 'prompts')
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template(template_name)
    return template.render(**kwargs)

# ---- Agent Classes ----
class Agent:
    def run(self, *args, **kwargs):
        raise NotImplementedError

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
            # Choose the longest match (assuming it's the complete company name)
            company_name = max(matches, key=len)
            print(f"[CompanyNameExtractionAgent] Extracted company name: {company_name.strip()}")
            return company_name.strip()
        print("[CompanyNameExtractionAgent] No company name found.")
        return ""

class DataExtractionAgent(Agent):
    def __init__(self, api_key: str, endpoint: str, model: str, prompt_template: str, openai_params: dict):
        self.api_key = api_key
        self.endpoint = endpoint
        self.model = model
        self.prompt_template = prompt_template
        self.openai_params = openai_params

    def run(self, pdf_text: str) -> dict:
        # Render the extraction prompt using the provided text.
        prompt = load_jinja_template(self.prompt_template, pdf_text=pdf_text)
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
                    wait_time = 5  # default wait time if parsing fails
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
            
            # Remove markdown formatting if present.
            if content.startswith("```"):
                content = content.strip("`").strip()
                if content.lower().startswith("json"):
                    content = content[4:].strip()
            
            parsed_result = json.loads(content)
            return parsed_result
        except Exception as e:
            print(f"[DataExtractionAgent ERROR] {e}")
            return {"error": str(e)}

class DataAggregatorAgent(Agent):
    def run(self, extraction_results: list) -> pd.DataFrame:
        print("[DataAggregatorAgent] Aggregating results into DataFrame...")
        return pd.DataFrame(extraction_results)

# ---- Main Pipeline ----
def run_autogen_pipeline():
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    endpoint = os.getenv("OPENAI_END_POINT")
    model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    if not api_key or not endpoint:
        print("[ERROR] Missing OPENAI_API_KEY or OPENAI_END_POINT in .env file")
        return

    config = read_configuration("conf.yaml")
    pdf_folder = config.get("pdf_folder", "./pdfs")
    output_csv = config.get("output_csv", "financial_metrics.csv")
    prompt_template = config.get("prompt_template", "extraction_prompt.jinja2")
    openai_params = config.get("openai_params", {})

    pdf_files = [os.path.join(pdf_folder, f) for f in os.listdir(pdf_folder) if f.lower().endswith(".pdf")]
    if not pdf_files:
        print("[INFO] No PDF files found in the folder.")
        return

    # Initialize agents
    scraper_agent = PDFScraperAgent()
    company_name_agent = CompanyNameExtractionAgent()
    extraction_agent = DataExtractionAgent(api_key, endpoint, model, prompt_template, openai_params)
    aggregator_agent = DataAggregatorAgent()

    extraction_results = []
    for pdf_file in pdf_files:
        print(f"\n[Pipeline] Processing file: {pdf_file}")
        pdf_text = scraper_agent.run(pdf_file)
        if not pdf_text:
            print(f"[Pipeline] Skipping {pdf_file} due to extraction error.")
            continue

        # Extract the company name from the full PDF (first page).
        company_name = company_name_agent.run(pdf_text)
        
        # Extract financial data using the existing prompt (this may use only the relevant section).
        result = extraction_agent.run(pdf_text)
        if isinstance(result, dict):
            # Override the CompanyName with the regex-extracted name
            result["CompanyName"] = company_name
            result["FileName"] = os.path.basename(pdf_file)
        extraction_results.append(result)

    final_df = aggregator_agent.run(extraction_results)
    print("\n[Pipeline] Final aggregated data:")
    print(final_df)

    output_dir = os.path.dirname(output_csv)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    final_df.to_csv(output_csv, index=False)
    print(f"[Pipeline] Aggregated data saved to: {output_csv}")

if __name__ == "__main__":
    run_autogen_pipeline()
