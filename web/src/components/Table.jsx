import React, { useState } from "react";
import styles from "./Table.module.css"; // Updated import

const Table = ({ columns, data, rowsPerPage = 5 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil((data?.length || 0) / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentRows = data?.slice(startIdx, endIdx) || [];

  const goToPrev = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  return (
    <div>
      <table className={styles["custom-table"]}>
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
      <div className={styles.pagination}>
        <button 
          onClick={goToPrev} 
          disabled={currentPage === 1}
          className={styles.button}
        >
          Previous
        </button>
        <span className={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={goToNext} 
          disabled={currentPage === totalPages}
          className={styles.button}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Table;