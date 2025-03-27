

# Financial Data Extraction, Preprocessing & Forecasting Pipeline

This project extracts financial figures from quarterly reports, preprocesses the data, and performs time-series forecasting. The solution is modular, with clearly separated components for data extraction, preprocessing, and forecasting. A React dashboard is included for visualization (to be run as a separate Node.js project).

---

## 0. Clone the Repository

To get started, clone the repository from GitHub. Since the project file is heavy, follow these step-by-step instructions:

1. **Open your terminal or command prompt.**
2. **Clone the repository:**

   ```bash
   git clone https://github.com/poshitha-12/stock-guide.git
   ```

3. **Navigate to the project directory:**

   ```bash
   cd stock-guide
   ```

*Note:* This repository contains the complete code for financial data extraction, preprocessing, forecasting, and a React dashboard for visualization.

---

## 1. Project Structure

```
24_03_project/
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

## 2. Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **npm**
- **Docker & Docker Compose** (if you plan to run the containerized version)

---

## 3. Setup Instructions

### A. Clone the Repository

1. Open your terminal and run:
   ```bash
   git clone https://github.com/poshitha-12/stock-guide.git
   cd stock-guide
   ```

### B. Create and Activate a Virtual Environment

```bash
python -m venv venv
```

- **Activate on Linux/Mac:**
  ```bash
  source venv/bin/activate
  ```
- **Activate on Windows:**
  ```bash
  venv\Scripts\activate
  ```

### C. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### D. Configure Environment Variables

- Create a file named `.env` in the project root.
- Add your keys, for example:

  ```env
  OPENAI_API_KEY=your_openai_api_key_here
  OPENAI_END_POINT=your_openai_endpoint_here
  OPENAI_MODEL=gpt-3.5-turbo
  ```

### E. Edit the Configuration File

- Open `conf.yaml` and adjust parameters such as file paths:
  
  ```yaml
  pdf_folder: "./data/raw"
  output_csv: "./outputs/financial_metrics.csv"
  prompt_template: "extraction_prompt.jinja2"
  openai_params:
    max_tokens: 300
    temperature: 0.0
  ```

---

## 4. Running the Pipeline

### A. Running with Docker

1. **Build the Docker Containers:**
   ```bash
   docker-compose build --no-cache
   ```

2. **Run the Containers:**
   ```bash
   docker-compose up
   ```
   - Backend: [http://127.0.0.1:5000](http://127.0.0.1:5000)
   - Frontend: [http://127.0.0.1:3000](http://127.0.0.1:3000)

3. **Stop the Containers:**
   ```bash
   docker-compose down
   ```

### B. Running the Pipeline Without Docker

1. **Data Extraction Pipeline:**
   ```bash
   python src/pipeline/pipeline.py
   ```

2. **Data Preprocessing:**
   ```bash
   python src/preprocessing/preprocess.py
   ```

---

## 5. Running Jupyter Notebooks

1. **Launch Jupyter Notebook:**
   ```bash
   jupyter notebook
   ```
2. **Navigate to `notebooks/`:**
   - Open notebooks (e.g., `dipd_netincome.ipynb`) for forecasting and analysis.
   - Ensure paths to `processed_dataset.csv` are correctly referenced.

---

## 6. Running the React Dashboard

1. **Navigate to the Dashboard Folder:**
   ```bash
   cd react-dashboard
   ```
2. **Install Dependencies and Run:**
   ```bash
   npm install
   npm start
   ```
3. **View Dashboard:**
   - Access via [http://localhost:3000](http://localhost:3000)
   - Make sure the backend is running at [http://localhost:5000](http://localhost:5000)

---

## 7. Final Analysis Document

### 7.1. Approach and Assumptions

- **Objective:** Forecast quarterly Revenue and Net Income for DIPPED PRODUCTS PLC and Richard Pieris Exports PLC.
- **Data:** 16 quarters per company; using the first 14 for training and the last 2 for testing.
- **Method:** SARIMA models are used because quarterly data typically exhibits seasonality (period of 4).
- **EDA:**  
  - **Visual Inspection:** Line charts were plotted to assess trends, seasonality, and volatility.
  - **Stationarity Testing:** ADF tests were applied. For instance, DIPD’s net income was stationary (p-value ≈ 0.0) while REXP’s net income was not (p-value ≈ 0.187), influencing our modeling decisions.
- **Assumptions:**  
  - Past seasonal patterns and trends will persist.
  - Data inconsistencies (missing values, bracketed negatives) are addressed during preprocessing.
  - External conditions remain stable over the forecast horizon.

### 7.2. Data Limitations and Handling of Data Inconsistencies

- **Short Historical Series:**  
  Only 16 quarters available (14 for training), limiting model complexity.
- **Volatility:**  
  High variability, especially in revenue, makes it challenging to capture trends.
- **Inconsistency Handling:**  
  - Missing numeric values are imputed.
  - Bracketed negative values are converted.
  - Non-stationarity is managed via differencing or forced seasonal differencing (e.g., D=0 when auto_arima fails).

### 7.3. Detailed Explanation of Methods and Final Results

#### DIPPED PRODUCTS PLC – Net Income
- **Chosen Model:** ARIMA(0,0,0)(0,0,0)[4] intercept  
  (A constant-mean model selected after auto_arima encountered singular matrix issues.)
- **Results:**  
  - **MAE:** ≈ 2,697,988  
  - **RMSE:** ≈ 2,759,362.95  
- **Observations:**  
  - Actual test values (orange points) are around 5–6 million, while the forecast (green) is around 3.8 million.
  - The model underestimates net income, likely due to insufficient data to capture trends.
- **Improvement Suggestions:**  
  - Collect more data or use monthly frequency.
  - Apply a log transform.
  - Consider alternative models (e.g., ETS, SARIMAX with exogenous variables).

#### DIPPED PRODUCTS PLC – Revenue
- **Chosen Model:** ARIMA(0,0,0)(0,0,1)[4] intercept  
  (A minimal seasonal MA(1) model.)
- **Results:**  
  - **MAE:** ≈ 19,277,212  
  - **RMSE:** ≈ 19,296,170  
- **Observations:**  
  - The forecast remains near a constant value with a slight seasonal effect, failing to capture high variability.
- **Improvement Suggestions:**  
  - Use a log transformation to model relative changes.
  - Expand the historical data.
  - Consider adding exogenous variables.

#### Richard Pieris Exports PLC – Net Income
- **Chosen Model:** ARIMA(0,0,1)(0,0,0)[4] intercept  
  (A one-lag MA model was selected.)
- **Results:**  
  - **MAE:** ≈ 70,916  
  - **RMSE:** ≈ 72,908  
- **Observations:**  
  - The forecast underestimates the test net income, and warnings suggest instability.
- **Improvement Suggestions:**  
  - Apply differencing or log transformation.
  - Increase data points to stabilize parameter estimates.

#### Richard Pieris Exports PLC – Revenue
- **Chosen Model:** ARIMA(0,0,1)(0,0,0)[4] intercept  
  (Capturing a single-lag MA effect.)
- **Results:**  
  - **MAE:** ≈ 1,601,745  
  - **RMSE:** ≈ 1,637,463  
- **Observations:**  
  - Forecast significantly underestimates test revenue.
- **Improvement Suggestions:**  
  - Use seasonal differencing if appropriate.
  - Consider transformations and additional data.

### 7.4. Evaluation of Metrics

- **MAE (Mean Absolute Error):**  
  - Represents the average absolute forecast error.
  - For example, DIPD revenue has an MAE of ~19 million, meaning forecasts are off by that amount on average.
  
- **RMSE (Root Mean Squared Error):**  
  - Penalizes larger errors, offering insight into how extreme the forecast errors can be.
  - When RMSE is close to MAE, errors are fairly consistent; when much larger, occasional big errors are present.

### 7.5. Final Recommendations

1. **Data Acquisition:**  
   - Obtain more historical data or use a higher-frequency series (e.g., monthly) to enhance model reliability.
2. **Simpler Methods:**  
   - Try naïve or seasonal naïve forecasts, or exponential smoothing (ETS), which may outperform complex ARIMA models with limited data.
3. **Transformations:**  
   - Use log or differencing to stabilize variance and improve stationarity.
4. **Exogenous Variables:**  
   - Incorporate relevant external factors with SARIMAX if they influence the financial metrics.
5. **Validation:**  
   - Consider rolling or expanding window validation due to the small sample size.

---

## 8. Suggested Diagrams/Charts to Attach

- **Time Series Line Charts:**  
  For each scenario, attach a chart displaying the training data (blue), test data (orange), and forecast (green).
- **Seasonal Decomposition Plots:**  
  Include at least one decomposition plot per company to illustrate identified trends and seasonal patterns.
- **Error Comparison Bar Chart (Optional):**  
  A bar chart comparing MAE and RMSE across the four models to visually summarize performance.

