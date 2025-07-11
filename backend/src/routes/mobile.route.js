// src/routes/mobile.routes.js
import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { db } from "../config/db.js";
import {
  usersTable as users,
  assignments,
  vehicles,
  fuelLogs,
  checkins,
  checkouts,
  trips
} from "../db/schema.js";
import { and, eq, isNotNull, isNull  } from "drizzle-orm";

const router = express.Router();

// Shared middleware for all mobile users (driver or supervisor)
// router.use(authenticate);

// ==== LOGIN ROUTE (Handled in auth.routes.js) ==== //
// POST /login → already implemented separately

// ========== SUPERVISOR ROUTES ==========
// router.get("/supervisor/vehicles", authorize("supervisor"), async (req, res) => {
router.get("/supervisor/vehicles", async (req, res) => {
  try {
    // Get all vehicles the supervisor is managing (indirect through assignments)
    const result = await db.execute(`
      SELECT v.* FROM vehicles v
      JOIN assignments a ON a.vehicle_id = v.id
      WHERE a.supervisor_id = $1
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

router.get("/supervisor/assignments", authorize("supervisor"), async (req, res) => {
  try {
    const result = await db.select().from(assignments).where(eq(assignments.supervisor_id, req.user.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// POST /supervisor/assignments
router.post("/supervisor/assignments", async (req, res) => {
  try {
    const { driverId, vehicleId } = req.body;

    if (!driverId || !vehicleId) {
      return res.status(400).json({ error: "Driver ID and Vehicle ID are required" });
    }

    // Check if assignment already exists for this vehicle
    const existing = await db
      .select()
      .from(assignments)
      .where(eq(assignments.vehicleId, vehicleId));

    if (existing.length > 0) {
      return res.status(409).json({ error: "Vehicle is already assigned" });
    }

    console.log("Attempting to assign driver:", driverId, "to vehicle:", vehicleId);


    // Create the assignment
    const [newAssignment] = await db
      .insert(assignments)
      .values({
        driverId,
        vehicleId,
        // You can add supervisorId if your schema supports it: supervisorId: req.user.id
      })
      .returning();

    res.status(201).json(newAssignment);
  } catch (err) {
    console.error("Failed to create assignment:", err);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});


router.post("/supervisor/checkin", authorize("supervisor"), async (req, res) => {
  try {
    const [record] = await db.insert(checkins).values({ ...req.body, supervisor_id: req.user.id }).returning();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: "Failed to check in vehicle" });
  }
});

router.post("/supervisor/checkout", authorize("supervisor"), async (req, res) => {
  try {
    const [record] = await db.insert(checkouts).values({ ...req.body, supervisor_id: req.user.id }).returning();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: "Failed to check out vehicle" });
  }
});

router.post("/supervisor/fuel", authorize("supervisor"), async (req, res) => {
  try {
    const [log] = await db.insert(fuelLogs).values({ ...req.body, logged_by: req.user.id }).returning();
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: "Failed to log fuel" });
  }
});

// ========== DRIVER ROUTES ==========
// router.get("/driver/assignment", authorize("driver"), async (req, res) => {
router.get("/driver/assignment", async (req, res) => {
  try {
    const testDriverId = "2368e66f-00c8-4e8e-8394-7662fa247306"
    // const result = await db.select().from(assignments).where(eq(assignments.driverId, req.user.id));
    const result = await db.select().from(assignments).where(eq(assignments.driverId, testDriverId));
    if (result.length === 0) {
      return res.json({ message: "No assignment found" });
    }
    res.json(result[0]);
  } catch (err) {
    console.log("Failed to check assignment:", err);
    res.status(500).json({ error: "Failed to check assignment" });
  }
});

router.post("/driver/checkin", async (req, res) => {
  try {

    const {
      vehicleId,
      driverId,
      startOdometer,
      startLocation,
      performedById,
      performedByRole,
      tripPurpose
    } = req.body;

    console.log({
  vehicleId,
  driverId,
  performedById,
  performedByRole,
  startOdometer,
  startLocation,
});


    const [record] = await db.insert(checkins).values({
      vehicleId,
      // driverId: req.user.id,
      driverId,
      performedById,
      performedByRole,
      startOdometer,
      startLocation,
      tripPurpose,
    }).returning();


    const [trip] = await db.insert(trips).values({
      // driverId: req.user.id,
      driverId: req.body.driverId,
      vehicleId: req.body.vehicleId,
      odometerStart: req.body.startOdometer,
      locationStart: req.body.startLocation,
      checkInTime: new Date()
    }).returning();

    res.status(201).json({
      checkin: record,
      tripId: trip.id
    });
  } catch (err) {
    console.error("Driver check-in error:", err);
    res.status(500).json({ error: "Driver check-in failed" });
  }
});


router.get("/driver/active-trip", async (req, res) => {
  try {
    const driverId = '2368e66f-00c8-4e8e-8394-7662fa247306'; // replace later with req.user.id

    const [trip] = await db
      .select({
        tripId: trips.id,
        vehicleId: trips.vehicleId,
        odometerStart: trips.odometerStart,
        locationStart: trips.locationStart,
        checkInTime: trips.checkInTime,
        plateNumber: vehicles.plateNumber,
        make: vehicles.make,
        model: vehicles.model,
        purpose: checkins.tripPurpose,
      })
      .from(trips)
      .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
      .innerJoin(checkins, and(
        eq(trips.driverId, checkins.driverId),
        eq(trips.vehicleId, checkins.vehicleId),
        eq(trips.odometerStart, checkins.startOdometer)
      ))
      .where(and(
        eq(trips.driverId, driverId),
        isNull(trips.checkOutTime) // trip is active
      ))
      .limit(1);

    if (!trip) {
      return res.status(200).json({ message: "No active trip" });
    }

    res.json(trip);
  } catch (err) {
    console.error("Fetch active trip error:", err);
    res.status(500).json({ error: "Failed to fetch active trip" });
  }
});


// router.post("/driver/checkout", authorize("driver"), async (req, res) => {
//   try {
//     const [record] = await db.insert(checkouts).values({ ...req.body, driver_id: req.user.id }).returning();
//     res.status(201).json(record);
//   } catch (err) {
//     res.status(500).json({ error: "Driver check-out failed" });
//   }
// });

router.post("/driver/checkout", async (req, res) => {
  try {
    const {
      tripId,
      vehicleId,
      driverId,
      performedById,
      performedByRole,
      endOdometer,
      endLocation
    } = req.body;

    // Basic validation
    if (!tripId || !vehicleId || !driverId || !performedById || !performedByRole || !endOdometer || !endLocation) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert into checkouts
    const [record] = await db.insert(checkouts).values({
      vehicleId,
      driverId,
      performedById,
      performedByRole,
      endOdometer,
      endLocation,
      checkedOutAt: new Date()
    }).returning();

    // Update trip
    await db.update(trips)
      .set({
        odometerEnd: endOdometer,
        locationEnd: endLocation,
        checkOutTime: new Date()
      })
      .where(eq(trips.id, tripId));

    res.status(201).json({ message: "Checked out successfully", checkout: record });

  } catch (err) {
    console.error("Driver check-out error:", err);
    res.status(500).json({ error: "Driver check-out failed" });
  }
});


router.post("/driver/fuel", async (req, res) => {
  try {
    // const [log] = await db.insert(fuelLogs).values({ ...req.body, logged_by: req.user.id }).returning();
    const [log] = await db.insert(fuelLogs).values({ ...req.body }).returning();
    res.status(201).json(log);
  } catch (err) {
    console.error("Fuel log error:", err);
    res.status(500).json({ error: "Fuel log failed" });
  }
});




export default router;



// NOTES
// WORKING ROUTES
// 1. CHECKIN => POST /api/mobile/driver/checkin  => use req.users.id to get ref id
// 2. CHECKOUT => POST /api/mobile/driver/checkout