import React, { useEffect, useState } from "react";
import { getDailyReport } from "../utils/api";

function dollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Headline numbers for the date being viewed on the dashboard. */
function DashboardSummary({ date, refreshKey }) {
  const [report, setReport] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    getDailyReport(date, abortController.signal)
      .then(setReport)
      .catch(() => setReport(null));
    return () => abortController.abort();
  }, [date, refreshKey]);

  if (!report) return null;

  const tiles = [
    { label: "Reservations", value: report.reservation_count },
    { label: "Booked online", value: report.online_count },
    { label: "Covers", value: report.covers },
    { label: "Checks closed", value: report.checks_closed },
    { label: "Sales", value: dollars(report.sales_total_cents) },
  ];

  return (
    <div className="summary-tiles">
      {tiles.map((tile) => (
        <div className="summary-tile" key={tile.label}>
          <div className="summary-tile-value">{tile.value}</div>
          <div className="summary-tile-label">{tile.label}</div>
        </div>
      ))}
    </div>
  );
}

export default DashboardSummary;
