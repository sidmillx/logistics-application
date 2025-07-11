// reportsFunctions.js
import { format } from "date-fns";
import { Writable } from "stream";
import { writeToString } from "fast-csv";
import PDFDocument from "pdfkit";
import { and, eq, isNotNull, sql, gte, lte, desc, ilike  } from "drizzle-orm";


export function applyFilters(query, filters) {
  const conditions = [];

  if (filters.driver) {
    conditions.push(ilike(drivers.name, `%${filters.driver}%`));
  }
  if (filters.vehicle) {
    conditions.push(ilike(vehicles.registrationNumber, `%${filters.vehicle}%`));
  }
  if (filters.entity) {
    conditions.push(ilike(entities.name, `%${filters.entity}%`));
  }
  if (filters.dateFrom) {
    conditions.push(gte(trips.checkInTime, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(trips.checkOutTime, new Date(filters.dateTo)));
  }

  return conditions.length > 0 ? query.where(and(...conditions)) : query;
}

export async function sendCSV(res, data, filename) {
  const csv = await writeToString(data, { headers: true });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

export function sendPDF(res, data, title, filename) {
  const doc = new PDFDocument({ margin: 30, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);

  // Title
  doc.fontSize(18).text(title, { align: "center" });
  doc.moveDown();

  // Table (simple formatting)
  data.forEach((row, idx) => {
    const content = Object.entries(row)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
    doc.fontSize(12).text(`${idx + 1}. ${content}`);
    doc.moveDown(0.5);
  });

  doc.end(); // Finalize the PDF
}
