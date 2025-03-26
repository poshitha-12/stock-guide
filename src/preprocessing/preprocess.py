import pandas as pd
import os

def convert_negative_brackets(val):
    """
    Converts bracketed strings (e.g., '(100)') into negative floats (e.g., -100.0).
    Removes commas before conversion.
    """
    if isinstance(val, str):
        val_clean = val.replace(',', '')
        if val_clean.startswith('(') and val_clean.endswith(')'):
            return -float(val_clean.strip("()"))
        else:
            return float(val_clean)
    return val

def convert_remove_brackets(val):
    """
    Removes parentheses around numeric strings (e.g., '(100)' -> 100.0).
    Removes commas before conversion.
    """
    if isinstance(val, str):
        val_clean = val.replace(',', '')
        return float(val_clean.replace("(", "").replace(")", ""))
    return val

def convert_numeric(val):
    """
    Converts numeric strings with commas (e.g., '1,234') into floats (e.g., 1234.0).
    """
    if isinstance(val, str):
        return float(val.replace(',', ''))
    return val

def get_fiscal_quarter(date):
    """
    Determines the fiscal quarter based on the period_end date.
    Assumes fiscal year starts on April 1.
    
    - If month == 6 (Apr-Jun): Q1 of current year.
    - If month == 9 (Jul-Sep): Q2 of current year.
    - If month == 12 (Oct-Dec): Q3 of current year.
    - If month == 3 (Jan-Mar): Q4 of previous year.
    """
    month = date.month
    year = date.year
    if month == 3:
        return f"{year-1}-Q4"
    elif month == 6:
        return f"{year}-Q1"
    elif month == 9:
        return f"{year}-Q2"
    elif month == 12:
        return f"{year}-Q3"
    else:
        return "Unknown"

def main():
    # ------------------------------------------------------------------------
    # 1. Load the Dataset
    # ------------------------------------------------------------------------
    input_path = os.path.join("outputs", "financial_metrics.csv")
    df = pd.read_csv(input_path)
    
    # ------------------------------------------------------------------------
    # 2. Define Columns for Specific Conversions
    # ------------------------------------------------------------------------
    neg_bracket_cols = ["GrossProfit", "NetIncome"]  # bracketed -> negative
    remove_bracket_cols = [
        "COGS", 
        "OtherOperatingIncome", 
        "DistributionCosts", 
        "AdministrativeExpenses", 
        "OtherOperatingExpense"
    ]  # bracketed -> positive
    
    # ------------------------------------------------------------------------
    # 3. Convert String Values to Numeric
    # ------------------------------------------------------------------------
    for col in df.columns:
        if col in neg_bracket_cols:
            df[col] = df[col].apply(convert_negative_brackets)
        elif col in remove_bracket_cols:
            df[col] = df[col].apply(convert_remove_brackets)
        elif col in ["Revenue"]:
            df[col] = df[col].apply(convert_numeric)
        # Other columns remain unchanged
    
    # Fill NaNs in numeric columns with 0
    for col in remove_bracket_cols:
        df[col] = df[col].fillna(0)
    
    # ------------------------------------------------------------------------
    # 4. Calculate New Values
    # ------------------------------------------------------------------------
    df["operating_expenses"] = (
        df["DistributionCosts"] + df["AdministrativeExpenses"] + df.get("OtherOperatingExpense", 0)
    )
    df["operating_income"] = df["GrossProfit"] + df["OtherOperatingIncome"] - df["operating_expenses"]
    
    # ------------------------------------------------------------------------
    # 5. Split Period Columns and Convert to Datetime
    # ------------------------------------------------------------------------
    if "PeriodStartEnd" in df.columns:
        df[["period_start", "period_end"]] = df["PeriodStartEnd"].str.split(" - ", expand=True)
        df["period_start"] = pd.to_datetime(df["period_start"])
        df["period_end"] = pd.to_datetime(df["period_end"])
    else:
        if "period_end" not in df.columns:
            raise ValueError("No valid date columns found. Check your data source.")
        else:
            df["period_end"] = pd.to_datetime(df["period_end"])
            df["period_start"] = pd.to_datetime(df["period_start"])
    
    # ------------------------------------------------------------------------
    # 6. Select Final Columns
    # ------------------------------------------------------------------------
    final_columns = [
        "CompanyName", 
        "Revenue", 
        "COGS", 
        "GrossProfit", 
        "operating_expenses", 
        "operating_income", 
        "NetIncome", 
        "period_start", 
        "period_end", 
        "FileName"
    ]
    
    df_final = df[final_columns].copy()
    
    # ------------------------------------------------------------------------
    # 7. Rename Columns for Consistency
    # ------------------------------------------------------------------------
    rename_map = {
        "CompanyName": "company_name",
        "Revenue": "revenue",
        "COGS": "cogs",
        "GrossProfit": "gross_profit",
        "operating_expenses": "opex",
        "operating_income": "operating_income",
        "NetIncome": "net_income",
        "FileName": "filename",
    }
    df_final.rename(columns=rename_map, inplace=True)
    
    # ------------------------------------------------------------------------
    # 8. Derive Quarter from period_end
    # ------------------------------------------------------------------------
    df_final['quarter'] = df_final['period_end'].apply(get_fiscal_quarter)
    
    # ------------------------------------------------------------------------
    # 9. Sort by period_end
    # ------------------------------------------------------------------------
    df_final.sort_values("period_end", inplace=True)
    
    # ------------------------------------------------------------------------
    # 10. Save Processed Data
    # ------------------------------------------------------------------------
    output_path = os.path.join("outputs", "processed_dataset.csv")
    
    output_json_path = "flask-backend\processed_dataset.json"
    df_final.to_csv(output_path, index=False)
    df_final.to_json(output_json_path, orient="records", indent=4, date_format="iso")

    print("Data preprocessing complete. Here is a preview:")
    print(df_final.head(20))

if __name__ == "__main__":
    main()
