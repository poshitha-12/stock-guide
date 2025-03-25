import os
import re
import time
import json
import requests
import pdfminer.high_level
import pandas as pd
import numpy as np

from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity

# Import your utility functions and agent classes
from src.utils.config_utils import read_configuration
from src.agents.agents import (
    PDFScraperAgent,
    CompanyNameExtractionAgent,
    SectionSelectorAgent,
    DataExtractionAgent,
    DataAggregatorAgent
)


def run_autogen_pipeline():
    # Load environment variables
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    endpoint = os.getenv("OPENAI_END_POINT")
    model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

    if not api_key or not endpoint:
        print("[ERROR] Missing OPENAI_API_KEY or OPENAI_END_POINT in .env file")
        return

    # Read the config YAML
    config = read_configuration("conf.yaml")
    pdf_folder = config.get("pdf_folder", "./pdfs")
    output_csv = config.get("output_csv", "financial_metrics.csv")
    prompt_template = config.get("prompt_template", "extraction_prompt.jinja2")
    openai_params = config.get("openai_params", {})

    # Find PDF files in the specified folder
    pdf_files = [
        os.path.join(pdf_folder, f)
        for f in os.listdir(pdf_folder)
        if f.lower().endswith(".pdf")
    ]
    if not pdf_files:
        print("[INFO] No PDF files found in the folder.")
        return

    # Initialize agents
    scraper_agent = PDFScraperAgent()
    company_name_agent = CompanyNameExtractionAgent()
    section_selector_agent = SectionSelectorAgent(api_key)
    extraction_agent = DataExtractionAgent(
        api_key, endpoint, model, prompt_template, openai_params
    )
    aggregator_agent = DataAggregatorAgent()

    extraction_results = []
    for pdf_file in pdf_files:
        print(f"\n[Pipeline] Processing file: {pdf_file}")
        pdf_text = scraper_agent.run(pdf_file)
        if not pdf_text:
            print(f"[Pipeline] Skipping {pdf_file} due to extraction error.")
            continue

        # Extract company name
        company_name = company_name_agent.run(pdf_text)

        # Get candidate sections
        selected_section = section_selector_agent.run(pdf_text)
        if not selected_section:
            print(f"[Pipeline] Skipping {pdf_file} because no suitable section was found.")
            continue

        # Combine first page + selected section
        first_page = pdf_text.split("\f")[0]
        combined_text = first_page + "\n---\n" + selected_section

        # Extract data
        result = extraction_agent.run(combined_text)
        if isinstance(result, dict):
            # Override the CompanyName with the name extracted from the first page
            result["CompanyName"] = company_name
            result["FileName"] = os.path.basename(pdf_file)

        extraction_results.append(result)

    # Aggregate
    final_df = aggregator_agent.run(extraction_results)
    print("\n[Pipeline] Final aggregated data:")
    print(final_df)

    # Save to CSV
    output_dir = os.path.dirname(output_csv)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    final_df.to_csv(output_csv, index=False)
    print(f"[Pipeline] Aggregated data saved to: {output_csv}")


if __name__ == "__main__":
    run_autogen_pipeline()
