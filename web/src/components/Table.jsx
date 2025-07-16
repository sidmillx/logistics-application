import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import styles from "./Table.module.css";

const Table = ({
  columns,
  data,
  rowsPerPage = 5,
  loading = false,
  selectable = false,           // NEW: enable row selection checkbox
  onSelectionChange,
  onDeleteSelected,
  searchable = false,           // NEW: enable search box
  sortable = false,             // NEW: enable sorting by column headers
  pagination = false,           // NEW: enable pagination controls
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedRows, setSelectedRows] = useState([]);

  // Filter data by search term if searchable enabled
  const filteredData = useMemo(() => {
    if (!searchable || !search) return data || [];
    return (data || []).filter((row) =>
      columns.some((col) =>
        String(row[col.key]).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, data, columns, searchable]);

  // Sort data if sortable enabled
  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, sortable]);

  // Pagination logic if pagination enabled
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIdx = pagination ? (currentPage - 1) * rowsPerPage : 0;
  const endIdx = pagination ? startIdx + rowsPerPage : sortedData.length;
  const currentRows = sortedData.slice(startIdx, endIdx);

  const goToPrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Row selection logic if selectable enabled
  const toggleSelectAll = () => {
    if (!selectable) return;
    if (isAllSelected()) {
      setSelectedRows([]);
      onSelectionChange?.([]);
    } else {
      const all = currentRows.map((row) => row.id);
      setSelectedRows(all);
      onSelectionChange?.(all);
    }
  };

  const toggleRow = (id) => {
    if (!selectable) return;
    const updated = selectedRows.includes(id)
      ? selectedRows.filter((rid) => rid !== id)
      : [...selectedRows, id];

    setSelectedRows(updated);
    onSelectionChange?.(updated);
  };

  const isRowSelected = (id) => selectedRows.includes(id);
  const isAllSelected = () =>
    currentRows.length > 0 &&
    currentRows.every((row) => selectedRows.includes(row.id));

  return (
    <div>
      {/* Top controls: Bulk operations (left) and Search (right) */}
      <div className={styles.topControls}>
        {selectable && selectedRows.length > 0 && (
          <div className={styles.bulkDropdownContainer}>
            <select
              className={styles.bulkDropdown}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value === "delete") {
                  if (
                    window.confirm(
                      "Are you sure you want to delete the selected rows?"
                    )
                  ) {
                    onDeleteSelected?.(selectedRows);
                    setSelectedRows([]);
                  }
                }
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                Bulk operations ({selectedRows.length} selected)
              </option>
              <option value="delete">Delete Selected</option>
            </select>
          </div>
        )}

        {searchable && (
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
        )}
      </div>

      {/* Table content */}
      {loading ? (
        <p className={styles.message}>Loading...</p>
      ) : currentRows.length === 0 ? (
        <p className={styles.message}>No data available</p>
      ) : (
        <>
          <table className={styles["custom-table"]}>
            <thead>
              <tr>
                {selectable && (
                  <th>
                    <input
                      type="checkbox"
                      checked={isAllSelected()}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ cursor: sortable ? "pointer" : "default", userSelect: "none" }}
                  >
                    <span className={styles.headerContent}>
                      {col.title}
                      {sortable && (
                        sortConfig.key === col.key ? (
                          sortConfig.direction === "asc" ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )
                        ) : (
                          <ChevronsUpDown size={16} className={styles.inactiveSortIcon} />
                        )
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row) => (
                <tr key={row.id}>
                  {selectable && (
                    <td>
                      <input
                        type="checkbox"
                        checked={isRowSelected(row.id)}
                        onChange={() => toggleRow(row.id)}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {pagination && (
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
          )}
        </>
      )}
    </div>
  );
};

export default Table;
