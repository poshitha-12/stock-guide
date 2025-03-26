```markdown
# Financial Data Extraction & Forecasting Pipeline

This project extracts financial figures from quarterly reports, preprocesses the data, and performs time-series forecasting. The solution is modular, with clearly separated components for data extraction, preprocessing, and forecasting. A React dashboard is included for visualization (to be run as a separate Node.js project).

---

## Project Structure

```
24_03_projecct/
├── .env
├── .gitignore
├── README.md
├── conf.yaml
├── requirements.txt
│
├── data/
│   ├── raw/             # Place your original PDF files here.
│   ├── interim/         # Optional: Intermediate data files.
│   └── processed/       # Final processed data.
│
├── notebooks/           # Jupyter notebooks for forecasting and analysis.
│   ├── dipd_netincome.ipynb
│   ├── dipd_revenue.ipynb
│   ├── rexp_netincome.ipynb
│   └── rexp_revenue.ipynb
│
├── outputs/             # Output files from pipeline and preprocessing.
│   ├── financial_metrics.csv
│   ├── processed_dataset.csv
│   └── processed_dataset.json
│
├── prompts/
│   └── extraction_prompt.jinja2
│
├── react-dashboard/     # React app for dashboard visualization.
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       └── ...          # React source code.
│
├── src/
│   ├── agents/
│   │   └── agents.py    # Contains all agent classes for data extraction.
│   ├── pipeline/
│   │   └── pipeline.py  # Pipeline orchestration: extraction & aggregation.
│   ├── preprocessing/
│   │   └── preprocess.py  # Data preprocessing and transformation.
│   └── utils/
│       ├── config_utils.py    # Configuration file reader.
│       └── template_utils.py  # Jinja2 template loader.
│
└── models/              # (Optional) Saved model artifacts.
```

---

## Prerequisites

- **Python 3.8+**
- **pip** package manager
- (Optional) A virtual environment tool (e.g., `venv` or `conda`)

---

## Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd 24_03_project
   ```

2. **Create and Activate a Virtual Environment**
   ```bash
   python -m venv venv
   # Activate on Linux/Mac:
   source venv/bin/activate
   # Activate on Windows:
   venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**
   - Create a file named `.env` in the project root.
   - Add your required keys:
     ```env
     OPENAI_API_KEY=your_openai_api_key_here
     OPENAI_END_POINT=your_openai_endpoint_here
     OPENAI_MODEL=gpt-3.5-turbo
     ```
   
5. **Set Up the Configuration File**
   - Edit `conf.yaml` to match your file paths and desired parameters:
     ```yaml
     pdf_folder: "./data/raw"
     output_csv: "./outputs/financial_metrics.csv"
     prompt_template: "extraction_prompt.jinja2"
     openai_params:
       max_tokens: 300
       temperature: 0.0
     ```

---

## Running the Pipeline

### 1. Data Extraction Pipeline

The extraction pipeline reads PDFs, extracts financial data, and aggregates the results into a CSV file.

- **Command:**
  ```bash
  python -m src.pipeline.pipeline
  ```
- **What It Does:**
  - Reads PDF files from the folder specified in `conf.yaml` (default: `./data/raw`).
  - Uses agent classes (located in `src/agents/agents.py`) to extract and consolidate data.
  - Aggregates the results and saves them as `financial_metrics.csv` in the `outputs/` folder.

### 2. Data Preprocessing

The preprocessing script converts and cleans the extracted data, producing a final dataset for analysis.

- **Command:**
  ```bash
  python -m src.preprocessing.preprocess
  ```
- **What It Does:**
  - Reads `financial_metrics.csv` from the `outputs/` folder.
  - Applies conversions (e.g., handling bracketed numbers, date parsing).
  - Calculates new fields (e.g., operating expenses, operating income).
  - Outputs the final processed dataset as both CSV and JSON (`processed_dataset.csv` and `processed_dataset.json` in `outputs/`).

---

## Running Jupyter Notebooks

The forecasting and analysis notebooks are located in the `notebooks/` folder.

1. **Launch Jupyter Notebook:**
   ```bash
   jupyter notebook
   ```
2. **Open and Run:**
   - Open any notebook (e.g., `dipd_netincome.ipynb` or `rexp_netincome.ipynb`).
   - Execute cells as needed.
   - Ensure the notebooks reference the correct path to `processed_dataset.csv` (default: `../outputs/processed_dataset.csv`).

---

## React Dashboard

The React dashboard is a separate Node.js project.

1. **Navigate to the Dashboard Folder:**
   ```bash
   cd react-dashboard
   ```
2. **Install Dependencies and Run:**
   ```bash
   npm install
   npm start
   ```
3. **Usage:**
   - The dashboard will run on a local development server.
   - It is designed to display the processed data (ensure it points to the correct file paths if necessary).

---

## Troubleshooting

- **Environment Variables:**  
  Verify that the `.env` file is correctly configured with valid keys.
- **File Paths:**  
  Ensure that paths in `conf.yaml` and in the notebooks match your directory structure.
- **Dependency Issues:**  
  If you encounter package issues, re-check `requirements.txt` and your virtual environment.

---

## Conclusion

This project modularly extracts, processes, and analyzes financial data from quarterly reports. Follow the steps above to set up and run the extraction pipeline, preprocessing script, and forecasting notebooks. For visualization, use the React dashboard (run separately).

Happy analyzing!
```