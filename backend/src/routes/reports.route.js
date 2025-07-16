import express from "express";
const router = express.Router();

import { db } from "../config/db.js";
import { trips, fuelLogs, drivers, vehicles, usersTable } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { applyFilters, sendPDF, sendCSV } from "../utils/reportsFunctions.js";
import { format } from 'date-fns';
import { exportFullReport } from '../controllers/exportController.js';

// Utility function to format dates consistently
const formatDate = (date) => {
  if (!date) return null;
  return format(new Date(date), 'yyyy-MM-dd HH:mm');
};

// Trip reports
// Updated Trip Reports endpoint
router.get("/trips", async (req, res) => {
  try {
    // Build the query with fields that actually exist in your schema
    const query = db.select({
      id: trips.id,
      date: trips.checkInTime,
      driver: sql`COALESCE(${usersTable.fullname}, 'Unassigned')`.as('driver'),
      vehicle: sql`COALESCE(${vehicles.plateNumber}, 'N/A')`.as('vehicle'),
      route: sql`CONCAT(
        COALESCE(${trips.locationStart}, 'Unknown'), 
        ' → ', 
        COALESCE(${trips.locationEnd}, 'Unknown')
      )`.as('route'),
      distance: sql`COALESCE(${trips.odometerEnd} - ${trips.odometerStart}, 0)`.mapWith(Number),
      duration: sql`COALESCE(EXTRACT(EPOCH FROM (${trips.checkOutTime} - ${trips.checkInTime}))/3600, 0)`.mapWith(Number),
      // Removed tripPurpose since it's not in the trips table
      // If you need it, you'll need to join with checkins table
    })
    .from(trips)
    .leftJoin(usersTable, eq(trips.driverId, usersTable.id))
    .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id));

    // If you need trip purpose, you would need to join with checkins:
    // .leftJoin(checkins, eq(trips.id, checkins.tripId))
    // And add to select: purpose: checkins.tripPurpose

    const rows = await query;

    // Format the results
    const formattedRows = rows.map(row => ({
      ...row,
      date: formatDate(row.date),
      distance: `${row.distance.toFixed(1)} km`,
      duration: `${row.duration.toFixed(1)} hrs`,
      // purpose: row.purpose || 'Not specified' // Would be available if you join with checkins
    }));

    res.json({
      columns: [
        { key: "date", title: "Date", type: "date" },
        { key: "driver", title: "Driver" },
        { key: "vehicle", title: "Vehicle" },
        { key: "route", title: "Route" },
        { key: "distance", title: "Distance", type: "number" },
        { key: "duration", title: "Duration", type: "number" },
        // { key: "purpose", title: "Purpose" }, // Include if you add the checkins join
      ],
      rows: formattedRows
    });

  } catch (err) {
    console.error("Error fetching trip reports:", err);
    res.status(500).json({ 
      error: "Failed to fetch trip reports",
      details: err.message 
    });
  }
});

// FUEL REPORTS
router.get("/fuel", async (req, res) => {
  try {
    let query = db.select({
      id: fuelLogs.id,
      date: fuelLogs.timestamp,
      driver: sql`CONCAT(${usersTable.fullname})`.as('driver'),
      vehicle: vehicles.plateNumber,
      litres: fuelLogs.litres,
      cost: fuelLogs.cost,
      costPerLitre: sql`${fuelLogs.cost} / NULLIF(${fuelLogs.litres}, 0)`.mapWith(Number),
      odometer: fuelLogs.odometer,
      location: fuelLogs.location,
      reference: fuelLogs.paymentReference
    })
    .from(fuelLogs)
    .leftJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id))
    .leftJoin(trips, eq(fuelLogs.tripId, trips.id))
    .leftJoin(usersTable, eq(trips.driverId, usersTable.id));

    query = applyFilters(query, req.query);
    let rows = await query;

    // Format data
    rows = rows.map(row => ({
      ...row,
      date: formatDate(row.date),
      driver: row.driver || 'Unassigned',
      vehicle: row.vehicle || 'N/A',
      litres: row.litres ? `${row.litres} L` : 'N/A',
      cost: row.cost ? `E${(row.cost / 100).toFixed(2)}` : 'N/A',
      costPerLitre: row.costPerLitre ? `E${(row.costPerLitre / 100).toFixed(2)}/L` : 'N/A',
      odometer: row.odometer ? `${row.odometer} km` : 'N/A',
      location: row.location || 'Unknown',
      reference: row.reference || 'N/A'
    }));

    res.json({
      columns: [
        { key: "date", title: "Date", type: "date" },
        { key: "driver", title: "Driver" },
        { key: "vehicle", title: "Vehicle" },
        { key: "litres", title: "Litres", type: "number" },
        { key: "cost", title: "Cost", type: "number" },
        { key: "costPerLitre", title: "Cost/Litre", type: "number" },
        { key: "odometer", title: "Odometer" },
        { key: "location", title: "Location" },
        { key: "reference", title: "Reference" },
      ],
      rows
    });
  } catch (err) {
    console.error("Error fetching fuel reports:", err);
    res.status(500).json({ error: "Failed to fetch fuel reports" });
  }
});

// DRIVER REPORTS
router.get("/drivers", async (req, res) => {
  try {
    let query = db.select({
      id: usersTable.id,
      driver: usersTable.fullname,
      totalTrips: sql`COUNT(${trips.id})`.mapWith(Number),
      totalHours: sql`SUM(EXTRACT(EPOCH FROM (${trips.checkOutTime} - ${trips.checkInTime}))/3600)`.mapWith(Number),
      avgTripDuration: sql`AVG(EXTRACT(EPOCH FROM (${trips.checkOutTime} - ${trips.checkInTime}))/3600)`.mapWith(Number),
      lastTripDate: sql`MAX(${trips.checkInTime})`
    })
    .from(usersTable)
    .leftJoin(trips, eq(usersTable.id, trips.driverId))
    .where(eq(usersTable.role, 'driver'))
    .groupBy(usersTable.id);

    query = applyFilters(query, req.query);
    let rows = await query;

    // Format data
    rows = rows.map(row => ({
      ...row,
      totalTrips: row.totalTrips || 0,
      totalHours: row.totalHours ? `${row.totalHours.toFixed(1)} hrs` : '0 hrs',
      avgTripDuration: row.avgTripDuration ? `${row.avgTripDuration.toFixed(1)} hrs` : 'N/A',
      lastTripDate: formatDate(row.lastTripDate) || 'Never'
    }));

    res.json({
      columns: [
        { key: "driver", title: "Driver" },
        { key: "totalTrips", title: "Total Trips", type: "number" },
        { key: "totalHours", title: "Total Hours", type: "number" },
        { key: "avgTripDuration", title: "Avg. Duration", type: "number" },
        { key: "lastTripDate", title: "Last Trip", type: "date" },
      ],
      rows
    });
  } catch (err) {
    console.error("Error fetching driver reports:", err);
    res.status(500).json({ error: "Failed to fetch driver reports" });
  }
});

// VEHICLE REPORTS
router.get("/vehicles", async (req, res) => {
  try {
    let query = db.select({
      id: vehicles.id,
      vehicle: vehicles.plateNumber,
      make: vehicles.make,
      model: vehicles.model,
      status: vehicles.status,
      totalTrips: sql`COUNT(${trips.id})`.mapWith(Number),
      totalDistance: sql`SUM(${trips.odometerEnd} - ${trips.odometerStart})`.mapWith(Number),
      totalLitres: sql`SUM(${fuelLogs.litres})`.mapWith(Number),
      totalCost: sql`SUM(${fuelLogs.cost})`.mapWith(Number),
      fuelEfficiency: sql`SUM(${trips.odometerEnd} - ${trips.odometerStart}) / NULLIF(SUM(${fuelLogs.litres}), 0)`.mapWith(Number),
      lastTripDate: sql`MAX(${trips.checkInTime})`
    })
    .from(vehicles)
    .leftJoin(trips, eq(vehicles.id, trips.vehicleId))
    .leftJoin(fuelLogs, eq(fuelLogs.vehicleId, vehicles.id))
    .groupBy(vehicles.id);

    query = applyFilters(query, req.query);
    let rows = await query;

    // Format data
    rows = rows.map(row => ({
      ...row,
      vehicle: row.vehicle || 'Unknown',
      make: row.make || 'N/A',
      model: row.model || 'N/A',
      status: row.status || 'Unknown',
      totalTrips: row.totalTrips || 0,
      totalDistance: row.totalDistance ? `${row.totalDistance} km` : '0 km',
      totalLitres: row.totalLitres ? `${row.totalLitres} L` : '0 L',
      totalCost: row.totalCost ? `E${(row.totalCost / 100).toFixed(2)}` : 'E0.00',
      fuelEfficiency: row.fuelEfficiency ? `${row.fuelEfficiency.toFixed(2)} km/L` : 'N/A',
      lastTripDate: formatDate(row.lastTripDate) || 'Never'
    }));

    res.json({
      columns: [
        { key: "vehicle", title: "Vehicle" },
        { key: "make", title: "Make" },
        { key: "model", title: "Model" },
        { key: "status", title: "Status" },
        { key: "totalTrips", title: "Total Trips", type: "number" },
        { key: "totalDistance", title: "Total Distance", type: "number" },
        { key: "totalLitres", title: "Total Litres", type: "number" },
        { key: "totalCost", title: "Total Cost", type: "number" },
        { key: "fuelEfficiency", title: "Fuel Efficiency", type: "number" },
        { key: "lastTripDate", title: "Last Trip", type: "date" },
      ],
      rows
    });
  } catch (err) {
    console.error("Error fetching vehicle reports:", err);
    res.status(500).json({ error: "Failed to fetch vehicle reports" });
  }
});

// Export endpoints
router.get("/:type/export-pdf", async (req, res) => {
  try {
    const { type } = req.params;
    let rows;

    switch (type) {
      case 'trips':
        rows = await getTripReportRows(req.query);
        sendPDF(res, rows, "Trip Report", "trip-report.pdf");
        break;
      case 'fuel':
        rows = await getFuelReportRows(req.query);
        sendPDF(res, rows, "Fuel Report", "fuel-report.pdf");
        break;
      case 'drivers':
        rows = await getDriverReportRows(req.query);
        sendPDF(res, rows, "Driver Report", "driver-report.pdf");
        break;
      case 'vehicles':
        rows = await getVehicleReportRows(req.query);
        sendPDF(res, rows, "Vehicle Report", "vehicle-report.pdf");
        break;
      default:
        res.status(404).json({ error: "Invalid report type" });
    }
  } catch (err) {
    console.error("Export PDF failed:", err);
    res.status(500).json({ error: "Export failed" });
  }
});

router.get("/:type/export-excel", async (req, res) => {
  try {
    const { type } = req.params;
    let rows;

    switch (type) {
      case 'trips':
        rows = await getTripReportRows(req.query);
        sendCSV(res, rows, "trip-report.csv");
        break;
      case 'fuel':
        rows = await getFuelReportRows(req.query);
        sendCSV(res, rows, "fuel-report.csv");
        break;
      case 'drivers':
        rows = await getDriverReportRows(req.query);
        sendCSV(res, rows, "driver-report.csv");
        break;
      case 'vehicles':
        rows = await getVehicleReportRows(req.query);
        sendCSV(res, rows, "vehicle-report.csv");
        break;
      default:
        res.status(404).json({ error: "Invalid report type" });
    }
  } catch (err) {
    console.error("Export Excel failed:", err);
    res.status(500).json({ error: "Export failed" });
  }
});

// Helper functions for exports
async function getTripReportRows(filters) {
  let query = db.select({
    date: trips.checkInTime,
    driver: sql`CONCAT(${usersTable.fullname})`.as('driver'),
    vehicle: vehicles.plateNumber,
    route: sql`CONCAT(${trips.locationStart}, ' → ', ${trips.locationEnd})`.as('route'),
    distance: sql`${trips.odometerEnd} - ${trips.odometerStart}`.mapWith(Number),
    duration: sql`EXTRACT(EPOCH FROM (${trips.checkOutTime} - ${trips.checkInTime}))/3600`.mapWith(Number),
    purpose: trips.tripPurpose
  })
  .from(trips)
  .leftJoin(usersTable, eq(trips.driverId, usersTable.id))
  .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id));

  query = applyFilters(query, filters);
  return await query;
}

async function getFuelReportRows(filters) {
  let query = db.select({
    date: fuelLogs.timestamp,
    driver: sql`CONCAT(${usersTable.fullname})`.as('driver'),
    vehicle: vehicles.plateNumber,
    litres: fuelLogs.litres,
    cost: fuelLogs.cost,
    costPerLitre: sql`${fuelLogs.cost} / NULLIF(${fuelLogs.litres}, 0)`.mapWith(Number),
    odometer: fuelLogs.odometer,
    location: fuelLogs.location,
    reference: fuelLogs.paymentReference
  })
  .from(fuelLogs)
  .leftJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id))
  .leftJoin(trips, eq(fuelLogs.tripId, trips.id))
  .leftJoin(usersTable, eq(trips.driverId, usersTable.id));

  query = applyFilters(query, filters);
  return await query;
}

async function getDriverReportRows(filters) {
  let query = db.select({
    driver: usersTable.fullname,
    totalTrips: sql`COUNT(${trips.id})`.mapWith(Number),
    totalHours: sql`SUM(EXTRACT(EPOCH FROM (${trips.checkOutTime} - ${trips.checkInTime}))/3600)`.mapWith(Number),
    avgTripDuration: sql`AVG(EXTRACT(EPOCH FROM (${trips.checkOutTime} - ${trips.checkInTime}))/3600)`.mapWith(Number),
    lastTripDate: sql`MAX(${trips.checkInTime})`
  })
  .from(usersTable)
  .leftJoin(trips, eq(usersTable.id, trips.driverId))
  .where(eq(usersTable.role, 'driver'))
  .groupBy(usersTable.id);

  query = applyFilters(query, filters);
  return await query;
}

async function getVehicleReportRows(filters) {
  let query = db.select({
    vehicle: vehicles.plateNumber,
    make: vehicles.make,
    model: vehicles.model,
    status: vehicles.status,
    totalTrips: sql`COUNT(${trips.id})`.mapWith(Number),
    totalDistance: sql`SUM(${trips.odometerEnd} - ${trips.odometerStart})`.mapWith(Number),
    totalLitres: sql`SUM(${fuelLogs.litres})`.mapWith(Number),
    totalCost: sql`SUM(${fuelLogs.cost})`.mapWith(Number),
    fuelEfficiency: sql`SUM(${trips.odometerEnd} - ${trips.odometerStart}) / NULLIF(SUM(${fuelLogs.litres}), 0)`.mapWith(Number),
    lastTripDate: sql`MAX(${trips.checkInTime})`
  })
  .from(vehicles)
  .leftJoin(trips, eq(vehicles.id, trips.vehicleId))
  .leftJoin(fuelLogs, eq(fuelLogs.vehicleId, vehicles.id))
  .groupBy(vehicles.id);

  query = applyFilters(query, filters);
  return await query;
}


router.get('/export-full-excel', exportFullReport);
export default router;