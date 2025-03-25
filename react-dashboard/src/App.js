import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import "./App.css"; // Optional: place additional styles here

function App() {
  const [rawData, setRawData] = useState([]);
  
  // First filter: which company to show in the charts
  const [selectedCompany, setSelectedCompany] = useState("ALL"); 
  // Second filter: which quarter to show in the KPI cards only
  const [selectedQuarterForCards, setSelectedQuarterForCards] = useState("");

  const [quarters, setQuarters] = useState([]);

  // ------ 1. Fetch the default dataset on mount ------
  useEffect(() => {
    fetch("/processed_dataset.json")
      .then((res) => res.json())
      .then((data) => {
        setRawData(data);
      })
      .catch((err) => console.error("Error fetching default dataset:", err));
  }, []);

  // ------ 2. Once rawData is set, extract and sort unique quarters ------
  useEffect(() => {
    if (!rawData || rawData.length === 0) return;

    const uniqueQuarters = [...new Set(rawData.map((d) => d.quarter))].sort((a, b) => {
      // a = "2021-Q1", b = "2022-Q3", etc.
      const [yearA, qA] = a.split("-Q");
      const [yearB, qB] = b.split("-Q");
      return (parseInt(yearA) * 4 + parseInt(qA)) - (parseInt(yearB) * 4 + parseInt(qB));
    });
    setQuarters(uniqueQuarters);

    // Optionally, default the KPI-quarter filter to the latest quarter
    if (uniqueQuarters.length > 0) {
      setSelectedQuarterForCards(uniqueQuarters[uniqueQuarters.length - 1]);
    }
  }, [rawData]);

  // ------ 3. Filter data by selected company for charts ------
  const getFilteredDataForCharts = () => {
    if (selectedCompany === "ALL") return rawData;
    return rawData.filter((item) => item.company_name === selectedCompany);
  };

  // ------ 4. KPI Calculation ------
  // We'll have a helper to get KPI for a single company & single quarter
  const getKpiForCompanyAndQuarter = (company, quarter) => {
    // Filter the raw data for the chosen company & quarter
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

    // We assume only one record per company-quarter
    const dp = filtered[0];
    return {
      revenue: dp.revenue,
      netIncome: dp.net_income,
      operatingIncome: dp.operating_income,
      grossProfit: dp.gross_profit,
      grossMargin: dp.revenue ? dp.gross_profit / dp.revenue : null,
    };
  };

  // Decide what to show in the KPI cards based on selectedCompany & selectedQuarterForCards
  // If "ALL", show 2 sets of KPI cards side by side
  // If single company, show 1 set of KPI cards
  const renderKpiCards = () => {
    if (!selectedQuarterForCards) return null; // No quarter selected yet

    if (selectedCompany === "ALL") {
      // Show both companies side by side
      const kpisDipped = getKpiForCompanyAndQuarter("DIPPED PRODUCTS PLC", selectedQuarterForCards);
      const kpisRich = getKpiForCompanyAndQuarter("Richard Pieris Exports PLC", selectedQuarterForCards);

      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {/* DIPPED PRODUCTS PLC */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h3 style={{ color: "#ccc" }}>DIPPED PRODUCTS PLC</h3>
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ color: "#ccc" }}>Revenue</h4>
                <h3 style={{ color: "#fff" }}>
                  {kpisDipped.revenue ? kpisDipped.revenue.toLocaleString() : "-"}
                </h3>
              </div>
              <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ color: "#ccc" }}>Net Income</h4>
                <h3 style={{ color: "#fff" }}>
                  {kpisDipped.netIncome ? kpisDipped.netIncome.toLocaleString() : "-"}
                </h3>
              </div>
            </div>
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ color: "#ccc" }}>Op. Income</h4>
                <h3 style={{ color: "#fff" }}>
                  {kpisDipped.operatingIncome ? kpisDipped.operatingIncome.toLocaleString() : "-"}
                </h3>
              </div>
              <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ color: "#ccc" }}>Gross Profit</h4>
                <h3 style={{ color: "#fff" }}>
                  {kpisDipped.grossProfit ? kpisDipped.grossProfit.toLocaleString() : "-"}
                </h3>
              </div>
              <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ color: "#ccc" }}>Gross Margin</h4>
                <h3 style={{ color: "#fff" }}>
                  {kpisDipped.grossMargin
                    ? (kpisDipped.grossMargin * 100).toFixed(2) + "%"
                    : "-"}
                </h3>
              </div>
            </div>
          </div>

          {/* RICHARD PIERIS EXPORTS PLC */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h3 style={{ color: "#ccc" }}>Richard Pieris Exports PLC</h3>
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ color: "#ccc" }}>Revenue</h4>
                <h3 style={{ color: "#fff" }}>
                  {kpisRich.revenue ? kpisRich.revenue.toLocaleString() : "-"}
                </h3>
              </div>
              <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ color: "#ccc" }}>Net Income</h4>
                <h3 style={{ color: "#fff" }}>
                  {kpisRich.netIncome ? kpisRich.netIncome.toLocaleString() : "-"}
                </h3>
              </div>
            </div>
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ color: "#ccc" }}>Op. Income</h4>
                <h3 style={{ color: "#fff" }}>
                  {kpisRich.operatingIncome ? kpisRich.operatingIncome.toLocaleString() : "-"}
                </h3>
              </div>
              <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ color: "#ccc" }}>Gross Profit</h4>
                <h3 style={{ color: "#fff" }}>
                  {kpisRich.grossProfit ? kpisRich.grossProfit.toLocaleString() : "-"}
                </h3>
              </div>
              <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ color: "#ccc" }}>Gross Margin</h4>
                <h3 style={{ color: "#fff" }}>
                  {kpisRich.grossMargin
                    ? (kpisRich.grossMargin * 100).toFixed(2) + "%"
                    : "-"}
                </h3>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Single company: just one set of cards
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
          <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
            <h4 style={{ color: "#ccc" }}>Revenue</h4>
            <h3 style={{ color: "#fff" }}>
              {kpi.revenue ? kpi.revenue.toLocaleString() : "-"}
            </h3>
          </div>
          <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
            <h4 style={{ color: "#ccc" }}>Net Income</h4>
            <h3 style={{ color: "#fff" }}>
              {kpi.netIncome ? kpi.netIncome.toLocaleString() : "-"}
            </h3>
          </div>
          <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
            <h4 style={{ color: "#ccc" }}>Op. Income</h4>
            <h3 style={{ color: "#fff" }}>
              {kpi.operatingIncome ? kpi.operatingIncome.toLocaleString() : "-"}
            </h3>
          </div>
          <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
            <h4 style={{ color: "#ccc" }}>Gross Profit</h4>
            <h3 style={{ color: "#fff" }}>
              {kpi.grossProfit ? kpi.grossProfit.toLocaleString() : "-"}
            </h3>
          </div>
          <div style={{ backgroundColor: "#2A2A3A", flex: 1, padding: "15px", borderRadius: "8px" }}>
            <h4 style={{ color: "#ccc" }}>Gross Margin</h4>
            <h3 style={{ color: "#fff" }}>
              {kpi.grossMargin ? (kpi.grossMargin * 100).toFixed(2) + "%" : "-"}
            </h3>
          </div>
        </div>
      );
    }
  };

  // ------ CHART DATA PREPARATION (unchanged, still shows all quarters) ------
  const prepareRevenueData = () => {
    if (!rawData || rawData.length === 0) return [];
    const companies =
      selectedCompany === "ALL"
        ? [...new Set(rawData.map((d) => d.company_name))]
        : [selectedCompany];

    return companies.map((company) => {
      const companyData = rawData.filter((d) => d.company_name === company);
      const yVals = quarters.map((q) => {
        const found = companyData.find((d) => d.quarter === q);
        return found ? found.revenue : null;
      });
      return {
        x: quarters,
        y: yVals,
        type: "scatter",
        mode: "lines+markers",
        name: company,
      };
    });
  };

  const prepareIncomeData = () => {
    const filtered = getFilteredDataForCharts();
    const netIncomeVals = quarters.map((q) => {
      const found = filtered.find((d) => d.quarter === q);
      return found ? found.net_income : null;
    });
    const opIncomeVals = quarters.map((q) => {
      const found = filtered.find((d) => d.quarter === q);
      return found ? found.operating_income : null;
    });

    return [
      { x: quarters, y: netIncomeVals, name: "Net Income", type: "bar" },
      { x: quarters, y: opIncomeVals, name: "Operating Income", type: "bar" },
    ];
  };

  const prepareCostBreakdownData = () => {
    const filtered = getFilteredDataForCharts();
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
        marker: { color: "#f44336" },
      },
      {
        x: quarters,
        y: opexVals,
        name: "OPEX",
        type: "bar",
        marker: { color: "#ffa726" },
      },
    ];
  };

  const prepareGrossProfitMarginData = () => {
    const filtered = getFilteredDataForCharts();
    const gpVals = quarters.map((q) => {
      const found = filtered.find((d) => d.quarter === q);
      return found ? found.gross_profit : null;
    });
    const marginVals = quarters.map((q) => {
      const found = filtered.find((d) => d.quarter === q);
      return found && found.revenue > 0
        ? found.gross_profit / found.revenue
        : null;
    });

    return [
      {
        x: quarters,
        y: gpVals,
        type: "bar",
        name: "Gross Profit",
        yaxis: "y1",
        marker: { color: "#66bb6a" },
      },
      {
        x: quarters,
        y: marginVals,
        type: "scatter",
        mode: "lines+markers",
        name: "Gross Margin",
        yaxis: "y2",
        marker: { color: "#26c6da" },
      },
    ];
  };

  // ------ 6. Chart Layout: Dark Theme ------
  const darkLayout = {
    paper_bgcolor: "#21202A",
    plot_bgcolor: "#21202A",
    font: { color: "#E0E0E0" },
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#1E1E2F" }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: "250px",
          backgroundColor: "#29293f",
          color: "#fff",
          padding: "20px",
        }}
      >
        <h2 style={{ marginBottom: "30px" }}>Stockviz</h2>

        {/* COMPANY SELECTOR */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Select Company:
          </label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
          >
            <option value="ALL">Compare Both</option>
            <option value="DIPPED PRODUCTS PLC">DIPPED PRODUCTS PLC</option>
            <option value="Richard Pieris Exports PLC">Richard Pieris Exports PLC</option>
          </select>
        </div>

        <nav>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ margin: "15px 0" }}>Dashboard</li>
            <li style={{ margin: "15px 0" }}>Reports</li>
            <li style={{ margin: "15px 0" }}>Settings</li>
          </ul>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        {/* Page Title */}
        <h1 style={{ color: "#fff", marginBottom: "10px" }}>Performance</h1>

        {/* KPI SECTION TITLE + QUARTER FILTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h2 style={{ color: "#fff" }}>Quarterly Snapshot</h2>
          <div>
            <label style={{ color: "#ccc", marginRight: "8px" }}>
              Select Quarter:
            </label>
            <select
              value={selectedQuarterForCards}
              onChange={(e) => setSelectedQuarterForCards(e.target.value)}
              style={{ padding: "8px", borderRadius: "4px" }}
            >
              {quarters.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI CARDS (Controlled by selectedQuarterForCards + selectedCompany) */}
        {renderKpiCards()}

        {/* CHART 1: REVENUE TREND */}
        <div
          style={{
            backgroundColor: "#2A2A3A",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ padding: "10px 15px", color: "#ccc" }}>
            Quarterly Revenue Trend
          </h3>
          <Plot
            data={prepareRevenueData()}
            layout={{
              ...darkLayout,
              margin: { t: 40, r: 20, l: 40, b: 40 },
              xaxis: { title: "Quarter" },
              yaxis: { title: "Revenue" },
            }}
            style={{ width: "100%", height: "400px" }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>

        {/* CHART 2: NET INCOME vs OPERATING INCOME */}
        <div
          style={{
            backgroundColor: "#2A2A3A",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ padding: "10px 15px", color: "#ccc" }}>
            Net vs Operating Income
          </h3>
          <Plot
            data={prepareIncomeData()}
            layout={{
              ...darkLayout,
              barmode: "group",
              margin: { t: 40, r: 20, l: 40, b: 40 },
              xaxis: { title: "Quarter" },
              yaxis: { title: "Amount" },
            }}
            style={{ width: "100%", height: "400px" }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>

        {/* CHART 3: COST BREAKDOWN (STACKED BAR) */}
        <div
          style={{
            backgroundColor: "#2A2A3A",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ padding: "10px 15px", color: "#ccc" }}>
            Cost Breakdown (COGS vs OPEX)
          </h3>
          <Plot
            data={prepareCostBreakdownData()}
            layout={{
              ...darkLayout,
              barmode: "stack",
              margin: { t: 40, r: 20, l: 40, b: 40 },
              xaxis: { title: "Quarter" },
              yaxis: { title: "Cost" },
            }}
            style={{ width: "100%", height: "400px" }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>

        {/* CHART 4: GROSS PROFIT & MARGIN (COMBO) */}
        <div
          style={{
            backgroundColor: "#2A2A3A",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ padding: "10px 15px", color: "#ccc" }}>
            Gross Profit & Margin
          </h3>
          <Plot
            data={prepareGrossProfitMarginData()}
            layout={{
              ...darkLayout,
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

        {/* (Optionally) Add more charts or analysis sections here */}
      </main>
    </div>
  );
}

export default App;
