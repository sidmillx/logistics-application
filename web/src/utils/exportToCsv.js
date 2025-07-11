import Papa from "papaparse";

export default function exportToCsv(filename, columns, data) {
  // Build CSV rows
  const csvRows = [];

  // Header row
  const headers = columns.map((col) => col.title);
  csvRows.push(headers);

  // Data rows
  data.forEach((row) => {
    const values = columns.map((col) =>
      typeof col.render === "function" ? "" : row[col.key]
    );
    csvRows.push(values);
  });

  // Convert to CSV string
  const csvString = Papa.unparse(csvRows);

  // Create a blob
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
