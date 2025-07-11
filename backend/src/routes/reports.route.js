import express from "express";

const router = express.Router();

import { db } from "../config/db.js";
import {
  entitiesTable as entities,
  assignments,
  supervisions,
  trips,
  fuelLogs,
  usersTable,
  drivers,
  vehicles
} from "../db/schema.js";
import { and, eq, isNotNull, sql, gte, lte, desc  } from "drizzle-orm";
import { applyFilters , sendPDF, sendCSV} from "../utils/reportsFunctions.js";

// Trip reports
router.get("/trips", async (req, res) => {
  try {
    let query = db.select({
      date: trips.checkInTime,
      driver: drivers.id,
      vehicle: vehicles.plateNumber,
      route: trips.locationEnd,
      distance: sql`${trips.odometerEnd} - ${trips.odometerStart}`.mapWith(Number),
    //   status: trips.status
    })
    .from(trips)
    .leftJoin(drivers, eq(trips.driverId, drivers.id))
    .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id));

    query = applyFilters(query, req.query);
    const rows = await query;

    res.json({
      columns: [
        { key: "date", title: "Date" },
        { key: "driver", title: "Driver" },
        { key: "vehicle", title: "Vehicle" },
        { key: "route", title: "Route" },
        { key: "distance", title: "Distance" },
        // { key: "status", title: "Status" },
      ],
      rows
    });
  } catch (err) {
    console.log("Error fetching trip reports:", err);
    res.status(500).json({ error: "Failed to fetch trip reports" });
  }
});


router.get("/trips/export-pdf", async (req, res) => {
  const rows = await getTripReportRows(req.query);
  sendPDF(res, rows, "Trip Report", "trip-report.pdf");
});

router.get("/trips/export-excel", async (req, res) => {
  const rows = await getTripReportRows(req.query);
  sendCSV(res, rows, "trip-report.csv");
});

async function getTripReportRows(filters) {
  let query = db.select({
    date: trips.checkInTime,
    driver: drivers.id,
    vehicle: vehicles.plateNumber,
    route: trips.locationEnd,
    distance: sql`${trips.odometerEnd} - ${trips.odometerStart}`.mapWith(Number),
    // status: trips.status
  })
  .from(trips)
  .leftJoin(drivers, eq(trips.driverId, drivers.id))
  .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id));

  query = applyFilters(query, filters);
  return await query;
}



// FUEL REPORTS
router.get("/fuel", async (req, res) => {
  try {
    let query = db.select({
      date: fuelLogs.timestamp,
      driver: drivers.id,
      vehicle: vehicles.plateNumber,
      litres: fuelLogs.litres,
      cost: fuelLogs.cost
    })
    .from(fuelLogs)
    .leftJoin(trips, eq(fuelLogs.tripId, trips.id))
    .leftJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id))
    .leftJoin(drivers, eq(trips.driverId, drivers.id));

    query = applyFilters(query, req.query);
    const rows = await query;

    res.json({
      columns: [
        { key: "date", title: "Date" },
        { key: "driver", title: "Driver" },
        { key: "vehicle", title: "Vehicle" },
        { key: "litres", title: "Litres" },
        { key: "cost", title: "Cost" },
      ],
      rows
    });
  } catch (err) {
    console.log("Error fetching fuel reports:", err);
    res.status(500).json({ error: "Failed to fetch fuel reports" });
  }
});


router.get("/fuel/export-pdf", async (req, res) => {
  const rows = await getFuelReportRows(req.query);
  sendPDF(res, rows, "Fuel Report", "fuel-report.pdf");
});

router.get("/fuel/export-excel", async (req, res) => {
  const rows = await getFuelReportRows(req.query);
  sendCSV(res, rows, "fuel-report.csv");
});

async function getFuelReportRows(filters) {
  let query = db.select({
    date: fuelLogs.timestamp,
    driver: drivers.id,
    vehicle: vehicles.plateNumber,
    litres: fuelLogs.litres,
    cost: fuelLogs.cost
  })
  .from(fuelLogs)
  .leftJoin(trips, eq(fuelLogs.tripId, trips.id))
  .leftJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id))
  .leftJoin(drivers, eq(trips.driverId, drivers.id));

  query = applyFilters(query, filters);
  return await query;
}


// DRIVER REPORTS
router.get("/drivers", async (req, res) => {
  try {
    const rows = await db.select({
      driver: drivers.id,
      totalTrips: sql`COUNT(${trips.id})`,
      totalHours: sql`SUM(EXTRACT(EPOCH FROM (${trips.checkOutTime} - ${trips.checkInTime}))/3600)`.mapWith(Number)
    })
    .from(drivers)
    .leftJoin(trips, eq(drivers.id, trips.driverId))
    .groupBy(drivers.id);

    res.json({
      columns: [
        { key: "driver", title: "Driver" },
        { key: "totalTrips", title: "Total Trips" },
        { key: "totalHours", title: "Hours Logged" },
      ],
      rows
    });
  } catch (err) {
    console.log("Error fetching drivers: ", err);
    res.status(500).json({ error: "Failed to fetch driver reports" });
  }
});


router.get("/drivers/export-pdf", async (req, res) => {
  const rows = await getDriverReportRows();
  sendPDF(res, rows, "Driver Report", "driver-report.pdf");
});

router.get("/drivers/export-excel", async (req, res) => {
  const rows = await getDriverReportRows();
  sendCSV(res, rows, "driver-report.csv");
});

async function getDriverReportRows() {
  return db.select({
    driver: drivers.id,
    totalTrips: sql`COUNT(${trips.id})`,
    totalHours: sql`SUM(EXTRACT(EPOCH FROM (${trips.checkOutTime} - ${trips.checkInTime}))/3600)`.mapWith(Number)
  })
  .from(drivers)
  .leftJoin(trips, eq(drivers.id, trips.driverId))
  .groupBy(drivers.id);
}


// VEHICLE REPORTS
router.get("/vehicles", async (req, res) => {
  try {
    const rows = await db.select({
      vehicle: vehicles.plateNumber,
      totalTrips: sql`COUNT(${trips.id})`,
      totalLitres: sql`SUM(${fuelLogs.litres})`,
      totalCost: sql`SUM(${fuelLogs.cost})`
    })
    .from(vehicles)
    .leftJoin(trips, eq(vehicles.id, trips.vehicleId))
    .leftJoin(fuelLogs, eq(fuelLogs.vehicleId, vehicles.id))
    .groupBy(vehicles.plateNumber);

    res.json({
      columns: [
        { key: "vehicle", title: "Vehicle" },
        { key: "totalTrips", title: "Total Trips" },
        { key: "totalLitres", title: "Litres Used" },
        { key: "totalCost", title: "Fuel Cost" },
      ],
      rows
    });
  } catch (err) {
    console.log("Error fetching vehicles: ", err);
    res.status(500).json({ error: "Failed to fetch vehicle reports" });
  }
});


router.get("/vehicles/export-pdf", async (req, res) => {
  const rows = await getVehicleReportRows();
  sendPDF(res, rows, "Vehicle Report", "vehicle-report.pdf");
});

router.get("/vehicles/export-excel", async (req, res) => {
  const rows = await getVehicleReportRows();
  sendCSV(res, rows, "vehicle-report.csv");
});

async function getVehicleReportRows() {
  return db.select({
    vehicle: vehicles.plateNumber,
    totalTrips: sql`COUNT(${trips.id})`,
    totalLitres: sql`SUM(${fuelLogs.litres})`,
    totalCost: sql`SUM(${fuelLogs.cost})`
  })
  .from(vehicles)
  .leftJoin(trips, eq(vehicles.id, trips.vehicleId))
  .leftJoin(fuelLogs, eq(fuelLogs.vehicleId, vehicles.id))
  .groupBy(vehicles.plateNumber);
}


export default router;
