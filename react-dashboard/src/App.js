import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import "./App.css"; // Optional: place additional styles here

function App() {
  const [rawData, setRawData] = useState([]);
  
  // Which company to show in the charts
  const [selectedCompany, setSelectedCompany] = useState("ALL");
  // Which quarter to show in the KPI cards only
  const [selectedQuarterForCards, setSelectedQuarterForCards] = useState("");
  const [quarters, setQuarters] = useState([]);

  // ------ Fetch the dataset from Flask endpoint on mount ------
  useEffect(() => {
    fetch("http://127.0.0.1:5000/get-data") // Ensure this matches your Flask route
      .then((res) => res.json())
      .then((data) => {
        console.log("Data received from Flask:", data); // Debug log
        setRawData(data);
      })
      .catch((err) => console.error("Error fetching dataset:", err));
  }, []);

  // ------ Extract & sort unique quarters ------
  useEffect(() => {
    if (!rawData || rawData.length === 0) return;
    const uniqueQuarters = [...new Set(rawData.map((d) => d.quarter))]
      .sort((a, b) => {
        const [yearA, qA] = a.split("-Q");
        const [yearB, qB] = b.split("-Q");
        return (parseInt(yearA) * 4 + parseInt(qA)) - (parseInt(yearB) * 4 + parseInt(qB));
      });
    setQuarters(uniqueQuarters);
    if (uniqueQuarters.length > 0) {
      setSelectedQuarterForCards(uniqueQuarters[uniqueQuarters.length - 1]);
    }
  }, [rawData]);

  // ------ Helper: get KPI for (company, quarter) ------
  const getKpiForCompanyAndQuarter = (company, quarter) => {
    const filtered = rawData.filter(
      (d) => d.company_name === company && d.quarter === quarter
    );
    if (filtered.length === 0) {
      return {
        revenue: null,
        netIncome: null,
        operatingIncome: null,
        grossProfit: null,
        grossMargin: null,
      };
    }
    const dp = filtered[0];
    return {
      revenue: dp.revenue,
      netIncome: dp.net_income,
      operatingIncome: dp.operating_income,
      grossProfit: dp.gross_profit,
      grossMargin: dp.revenue ? dp.gross_profit / dp.revenue : null,
    };
  };

  // ------ Render KPI Cards ------
  const renderKpiCards = () => {
    if (!selectedQuarterForCards) return null;
    if (selectedCompany === "ALL") {
      const kpisDipped = getKpiForCompanyAndQuarter("DIPPED PRODUCTS PLC", selectedQuarterForCards);
      const kpisRich = getKpiForCompanyAndQuarter("Richard Pieris Exports PLC", selectedQuarterForCards);
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h3 style={styles.sectionHeader}>DIPPED PRODUCTS PLC</h3>
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div style={styles.kpiCard}>
                <h4 style={styles.kpiTitle}>Revenue</h4>
                <h3 style={styles.kpiValue}>
                  {kpisDipped.revenue ? kpisDipped.revenue.toLocaleString() : "-"}
                </h3>
              </div>
              <div style={styles.kpiCard}>
                <h4 style={styles.kpiTitle}>Net Income</h4>
                <h3 style={styles.kpiValue}>
                  {kpisDipped.netIncome ? kpisDipped.netIncome.toLocaleString() : "-"}
                </h3>
              </div>
            </div>
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div style={styles.kpiCard}>
                <h4 style={styles.kpiTitle}>Op. Income</h4>
                <h3 style={styles.kpiValue}>
                  {kpisDipped.operatingIncome ? kpisDipped.operatingIncome.toLocaleString() : "-"}
                </h3>
              </div>
              <div style={styles.kpiCard}>
                <h4 style={styles.kpiTitle}>Gross Profit</h4>
                <h3 style={styles.kpiValue}>
                  {kpisDipped.grossProfit ? kpisDipped.grossProfit.toLocaleString() : "-"}
                </h3>
              </div>
              <div style={styles.kpiCard}>
                <h4 style={styles.kpiTitle}>Gross Margin</h4>
                <h3 style={styles.kpiValue}>
                  {kpisDipped.grossMargin ? (kpisDipped.grossMargin * 100).toFixed(2) + "%" : "-"}
                </h3>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h3 style={styles.sectionHeader}>Richard Pieris Exports PLC</h3>
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div style={styles.kpiCard}>
                <h4 style={styles.kpiTitle}>Revenue</h4>
                <h3 style={styles.kpiValue}>
                  {kpisRich.revenue ? kpisRich.revenue.toLocaleString() : "-"}
                </h3>
              </div>
              <div style={styles.kpiCard}>
                <h4 style={styles.kpiTitle}>Net Income</h4>
                <h3 style={styles.kpiValue}>
                  {kpisRich.netIncome ? kpisRich.netIncome.toLocaleString() : "-"}
                </h3>
              </div>
            </div>
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div style={styles.kpiCard}>
                <h4 style={styles.kpiTitle}>Op. Income</h4>
                <h3 style={styles.kpiValue}>
                  {kpisRich.operatingIncome ? kpisRich.operatingIncome.toLocaleString() : "-"}
                </h3>
              </div>
              <div style={styles.kpiCard}>
                <h4 style={styles.kpiTitle}>Gross Profit</h4>
                <h3 style={styles.kpiValue}>
                  {kpisRich.grossProfit ? kpisRich.grossProfit.toLocaleString() : "-"}
                </h3>
              </div>
              <div style={styles.kpiCard}>
                <h4 style={styles.kpiTitle}>Gross Margin</h4>
                <h3 style={styles.kpiValue}>
                  {kpisRich.grossMargin ? (kpisRich.grossMargin * 100).toFixed(2) + "%" : "-"}
                </h3>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      const filtered = rawData.filter((d) => d.company_name === selectedCompany);
      const found = filtered.find((d) => d.quarter === selectedQuarterForCards);
      const kpi = found
        ? {
            revenue: found.revenue,
            netIncome: found.net_income,
            operatingIncome: found.operating_income,
            grossProfit: found.gross_profit,
            grossMargin: found.revenue ? found.gross_profit / found.revenue : null,
          }
        : {
            revenue: null,
            netIncome: null,
            operatingIncome: null,
            grossProfit: null,
            grossMargin: null,
          };

      return (
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div style={styles.kpiCard}>
            <h4 style={styles.kpiTitle}>Revenue</h4>
            <h3 style={styles.kpiValue}>
              {kpi.revenue ? kpi.revenue.toLocaleString() : "-"}
            </h3>
          </div>
          <div style={styles.kpiCard}>
            <h4 style={styles.kpiTitle}>Net Income</h4>
            <h3 style={styles.kpiValue}>
              {kpi.netIncome ? kpi.netIncome.toLocaleString() : "-"}
            </h3>
          </div>
          <div style={styles.kpiCard}>
            <h4 style={styles.kpiTitle}>Op. Income</h4>
            <h3 style={styles.kpiValue}>
              {kpi.operatingIncome ? kpi.operatingIncome.toLocaleString() : "-"}
            </h3>
          </div>
          <div style={styles.kpiCard}>
            <h4 style={styles.kpiTitle}>Gross Profit</h4>
            <h3 style={styles.kpiValue}>
              {kpi.grossProfit ? kpi.grossProfit.toLocaleString() : "-"}
            </h3>
          </div>
          <div style={styles.kpiCard}>
            <h4 style={styles.kpiTitle}>Gross Margin</h4>
            <h3 style={styles.kpiValue}>
              {kpi.grossMargin ? (kpi.grossMargin * 100).toFixed(2) + "%" : "-"}
            </h3>
          </div>
        </div>
      );
    }
  };

  // ------ Chart Data Preparations ------

  // Color palette for creative contrast:
  const SINGLE_BAR_COLOR = "#1E88E5";   // Royal Blue
  const SINGLE_LINE_COLOR = "#00ACC1";  // Bright Cyan

  const DIPPED_BAR_COLOR = "#1E88E5";   
  const DIPPED_LINE_COLOR = "#00ACC1";  
  const REXP_BAR_COLOR = "#FB8C00";     
  const REXP_LINE_COLOR = "#FDD835";    

  const COGS_COLOR = "#E53935";         // Vivid Red
  const OPEX_COLOR = "#8E24AA";         // Vivid Purple

  // 1) Revenue Trend
  const prepareRevenueData = () => {
    if (!rawData || rawData.length === 0) return [];
    if (selectedCompany === "ALL") {
      const dippedData = rawData.filter((d) => d.company_name === "DIPPED PRODUCTS PLC");
      const dippedRev = quarters.map((q) => {
        const found = dippedData.find((d) => d.quarter === q);
        return found ? found.revenue : null;
      });
      const richData = rawData.filter((d) => d.company_name === "Richard Pieris Exports PLC");
      const richRev = quarters.map((q) => {
        const found = richData.find((d) => d.quarter === q);
        return found ? found.revenue : null;
      });

      return [
        {
          x: quarters,
          y: dippedRev,
          type: "scatter",
          mode: "lines+markers",
          name: "DIPD - Revenue",
          line: { color: DIPPED_BAR_COLOR },
          marker: { color: DIPPED_BAR_COLOR },
        },
        {
          x: quarters,
          y: richRev,
          type: "scatter",
          mode: "lines+markers",
          name: "REXP - Revenue",
          line: { color: REXP_BAR_COLOR },
          marker: { color: REXP_BAR_COLOR },
        },
      ];
    } else {
      const filtered = rawData.filter((d) => d.company_name === selectedCompany);
      const revVals = quarters.map((q) => {
        const found = filtered.find((d) => d.quarter === q);
        return found ? found.revenue : null;
      });
      return [
        {
          x: quarters,
          y: revVals,
          type: "scatter",
          mode: "lines+markers",
          name: "Revenue",
          line: { color: SINGLE_BAR_COLOR },
          marker: { color: SINGLE_BAR_COLOR },
        },
      ];
    }
  };

  // 2) Gross Profit & Margin
  const prepareGrossProfitMarginData = () => {
    if (!rawData || rawData.length === 0) return [];
    if (selectedCompany === "ALL") {
      const dippedData = rawData.filter((d) => d.company_name === "DIPPED PRODUCTS PLC");
      const dippedGp = quarters.map((q) => {
        const found = dippedData.find((d) => d.quarter === q);
        return found ? found.gross_profit : null;
      });
      const dippedMargin = quarters.map((q) => {
        const found = dippedData.find((d) => d.quarter === q);
        return found && found.revenue > 0 ? found.gross_profit / found.revenue : null;
      });

      const richData = rawData.filter((d) => d.company_name === "Richard Pieris Exports PLC");
      const richGp = quarters.map((q) => {
        const found = richData.find((d) => d.quarter === q);
        return found ? found.gross_profit : null;
      });
      const richMargin = quarters.map((q) => {
        const found = richData.find((d) => d.quarter === q);
        return found && found.revenue > 0 ? found.gross_profit / found.revenue : null;
      });

      return [
        {
          x: quarters,
          y: dippedGp,
          type: "bar",
          name: "DIPD - Gross Profit",
          yaxis: "y1",
          marker: { color: DIPPED_BAR_COLOR },
        },
        {
          x: quarters,
          y: dippedMargin,
          type: "scatter",
          mode: "lines+markers",
          name: "DIPD - Margin",
          yaxis: "y2",
          line: { color: DIPPED_LINE_COLOR },
          marker: { color: DIPPED_LINE_COLOR },
        },
        {
          x: quarters,
          y: richGp,
          type: "bar",
          name: "REXP - Gross Profit",
          yaxis: "y1",
          marker: { color: REXP_BAR_COLOR },
        },
        {
          x: quarters,
          y: richMargin,
          type: "scatter",
          mode: "lines+markers",
          name: "REXP - Margin",
          yaxis: "y2",
          line: { color: REXP_LINE_COLOR },
          marker: { color: REXP_LINE_COLOR },
        },
      ];
    } else {
      const filtered = rawData.filter((d) => d.company_name === selectedCompany);
      const gpVals = quarters.map((q) => {
        const found = filtered.find((d) => d.quarter === q);
        return found ? found.gross_profit : null;
      });
      const marginVals = quarters.map((q) => {
        const found = filtered.find((d) => d.quarter === q);
        return found && found.revenue > 0 ? found.gross_profit / found.revenue : null;
      });

      return [
        {
          x: quarters,
          y: gpVals,
          type: "bar",
          name: "Gross Profit",
          yaxis: "y1",
          marker: { color: SINGLE_BAR_COLOR },
        },
        {
          x: quarters,
          y: marginVals,
          type: "scatter",
          mode: "lines+markers",
          name: "Gross Margin",
          yaxis: "y2",
          line: { color: SINGLE_LINE_COLOR },
          marker: { color: SINGLE_LINE_COLOR },
        },
      ];
    }
  };

  // 3) Net Income vs Operating Income
  const prepareIncomeData = () => {
    if (!rawData || rawData.length === 0) return [];
    if (selectedCompany === "ALL") {
      const dippedData = rawData.filter((d) => d.company_name === "DIPPED PRODUCTS PLC");
      const dippedNet = quarters.map((q) => {
        const found = dippedData.find((d) => d.quarter === q);
        return found ? found.net_income : null;
      });
      const dippedOp = quarters.map((q) => {
        const found = dippedData.find((d) => d.quarter === q);
        return found ? found.operating_income : null;
      });
      const richData = rawData.filter((d) => d.company_name === "Richard Pieris Exports PLC");
      const richNet = quarters.map((q) => {
        const found = richData.find((d) => d.quarter === q);
        return found ? found.net_income : null;
      });
      const richOp = quarters.map((q) => {
        const found = richData.find((d) => d.quarter === q);
        return found ? found.operating_income : null;
      });

      return [
        {
          x: quarters,
          y: dippedNet,
          name: "DIPD - Net Income",
          type: "bar",
          marker: { color: DIPPED_BAR_COLOR },
        },
        {
          x: quarters,
          y: dippedOp,
          name: "DIPD - Operating Income",
          type: "bar",
          marker: { color: DIPPED_LINE_COLOR },
        },
        {
          x: quarters,
          y: richNet,
          name: "REXP - Net Income",
          type: "bar",
          marker: { color: REXP_BAR_COLOR },
        },
        {
          x: quarters,
          y: richOp,
          name: "REXP - Operating Income",
          type: "bar",
          marker: { color: REXP_LINE_COLOR },
        },
      ];
    } else {
      const filtered = rawData.filter((d) => d.company_name === selectedCompany);
      const netIncome = quarters.map((q) => {
        const found = filtered.find((d) => d.quarter === q);
        return found ? found.net_income : null;
      });
      const opIncome = quarters.map((q) => {
        const found = filtered.find((d) => d.quarter === q);
        return found ? found.operating_income : null;
      });

      return [
        {
          x: quarters,
          y: netIncome,
          name: "Net Income",
          type: "bar",
          marker: { color: SINGLE_BAR_COLOR },
        },
        {
          x: quarters,
          y: opIncome,
          name: "Operating Income",
          type: "bar",
          marker: { color: SINGLE_LINE_COLOR },
        },
      ];
    }
  };

  // 4) Cost Breakdown (stacked bar) - only if single company
  const prepareCostBreakdownData = () => {
    if (!rawData || rawData.length === 0) return [];
    if (selectedCompany === "ALL") return [];
    const filtered = rawData.filter((d) => d.company_name === selectedCompany);
    const cogsVals = quarters.map((q) => {
      const found = filtered.find((d) => d.quarter === q);
      return found ? found.cogs : null;
    });
    const opexVals = quarters.map((q) => {
      const found = filtered.find((d) => d.quarter === q);
      return found ? found.opex : null;
    });
    return [
      {
        x: quarters,
        y: cogsVals,
        name: "COGS",
        type: "bar",
        marker: { color: COGS_COLOR },
      },
      {
        x: quarters,
        y: opexVals,
        name: "OPEX",
        type: "bar",
        marker: { color: OPEX_COLOR },
      },
    ];
  };

  // Layout for Plotly (light background, mostly black text)
  const chartLayout = {
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    font: { color: "#111" },
  };

  // Conditionally render Cost Breakdown chart
  const renderCostBreakdownChart = () => {
    if (selectedCompany === "ALL") return null;
    return (
      <div style={styles.chartContainer}>
        <h3 style={styles.chartTitle}>Cost Breakdown (COGS vs OPEX)</h3>
        <Plot
          data={prepareCostBreakdownData()}
          layout={{
            ...chartLayout,
            barmode: "stack",
            margin: { t: 40, r: 20, l: 40, b: 40 },
            xaxis: { title: "Quarter" },
            yaxis: { title: "Cost" },
          }}
          style={{ width: "100%", height: "400px" }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
    );
  };

  return (
    <div style={styles.appContainer}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Stockviz</h2>
        {/* COMPANY SELECTOR */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#000" }}>
            Select Company:
          </label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            style={styles.selectBox}
          >
            <option value="ALL">Compare Both</option>
            <option value="DIPPED PRODUCTS PLC">DIPPED PRODUCTS PLC</option>
            <option value="Richard Pieris Exports PLC">Richard Pieris Exports PLC</option>
          </select>
        </div>
        <nav>
          <ul style={{ listStyle: "none", padding: 0, color: "#000" }}>
            <li style={{ margin: "15px 0" }}>Dashboard</li>
            <li style={{ margin: "15px 0" }}>Reports</li>
            <li style={{ margin: "15px 0" }}>Settings</li>
          </ul>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.mainContent}>
        {/* Page Title */}
        <h1 style={styles.pageTitle}>Performance</h1>
        {/* KPI SECTION TITLE + QUARTER FILTER */}
        <div style={styles.kpiHeader}>
          <h2 style={styles.kpiHeaderTitle}>Quarterly Snapshot</h2>
          <div>
            <label style={{ color: "#000", marginRight: "8px" }}>
              Select Quarter:
            </label>
            <select
              value={selectedQuarterForCards}
              onChange={(e) => setSelectedQuarterForCards(e.target.value)}
              style={styles.selectBox}
            >
              {quarters.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* KPI CARDS */}
        {renderKpiCards()}

        {/* CHART 1: REVENUE TREND */}
        <div style={styles.chartContainer}>
          <h3 style={styles.chartTitle}>Quarterly Revenue Trend</h3>
          <Plot
            data={prepareRevenueData()}
            layout={{
              ...chartLayout,
              margin: { t: 40, r: 20, l: 40, b: 40 },
              xaxis: { title: "Quarter" },
              yaxis: { title: "Revenue" },
            }}
            style={{ width: "100%", height: "400px" }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>

        {/* CHART 2: GROSS PROFIT & MARGIN */}
        <div style={styles.chartContainer}>
          <h3 style={styles.chartTitle}>Gross Profit &amp; Margin</h3>
          <Plot
            data={prepareGrossProfitMarginData()}
            layout={{
              ...chartLayout,
              margin: { t: 40, r: 40, l: 40, b: 40 },
              xaxis: { title: "Quarter" },
              yaxis: { title: "Gross Profit", side: "left" },
              yaxis2: {
                title: "Gross Margin (%)",
                overlaying: "y",
                side: "right",
                tickformat: ",.0%",
              },
            }}
            style={{ width: "100%", height: "400px" }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>

        {/* CHART 3: NET vs OPERATING INCOME */}
        <div style={styles.chartContainer}>
          <h3 style={styles.chartTitle}>Net vs Operating Income</h3>
          <Plot
            data={prepareIncomeData()}
            layout={{
              ...chartLayout,
              barmode: "group",
              margin: { t: 40, r: 20, l: 40, b: 40 },
              xaxis: { title: "Quarter" },
              yaxis: { title: "Amount" },
            }}
            style={{ width: "100%", height: "400px" }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>

        {/* CHART 4: COST BREAKDOWN (only if single company) */}
        {renderCostBreakdownChart()}
      </main>
    </div>
  );
}

// -- Styles --
const styles = {
  appContainer: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#FAFBFF", // Soft white-blue pastel background
  },
  sidebar: {
    width: "250px",
    backgroundColor: "#E0D7F3", // Gentle pastel lavender
    color: "#000",
    padding: "20px",
    borderRight: "1px solid #ddd",
  },
  sidebarTitle: {
    marginBottom: "30px",
    color: "#000",
  },
  selectBox: {
    width: "100%",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    color: "#000",
    outline: "none",
  },
  mainContent: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    backgroundColor: "#fff",
  },
  pageTitle: {
    color: "#000",
    marginBottom: "10px",
  },
  kpiHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  kpiHeaderTitle: {
    color: "#000",
    margin: 0,
  },
  kpiCard: {
    backgroundColor: "#fff",
    flex: 1,
    padding: "15px",
    borderRadius: "8px",
    border: "1px solid #eee",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  kpiTitle: {
    color: "#000",
    marginBottom: "5px",
    fontSize: "0.85rem",
  },
  kpiValue: {
    color: "#000",
    margin: 0,
    fontSize: "1.1rem",
    fontWeight: "bold",
  },
  sectionHeader: {
    color: "#000",
    marginBottom: "10px",
  },
  chartContainer: {
    backgroundColor: "#fff",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #eee",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    paddingBottom: "10px",
  },
  chartTitle: {
    padding: "10px 15px",
    color: "#000",
    margin: 0,
    fontWeight: 500,
  },
};

export default App;
