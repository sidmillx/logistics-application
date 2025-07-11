// src/components/Table.jsx
import React, { useState } from "react";
import "./Table.css";

const Table = ({ columns, data, rowsPerPage = 5 }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
 const totalPages = Math.ceil((data?.length || 0) / rowsPerPage);



  // Slice data for current page
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentRows = data?.slice(startIdx, endIdx) || [];

  // Handlers
  const goToPrev = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  return (
    <div>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
        <button onClick={goToPrev} disabled={currentPage === 1}>
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={goToNext} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Table;
