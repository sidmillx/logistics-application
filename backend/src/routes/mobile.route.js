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
  trips,
  supervisions,
  drivers
} from "../db/schema.js";
import {  isNotNull, isNull, desc   } from "drizzle-orm";

const router = express.Router();

// Shared middleware for all mobile users (driver or supervisor)
// router.use(authenticate);

// ==== LOGIN ROUTE (Handled in auth.routes.js) ==== //
// POST /login → already implemented separately

// ========== SUPERVISOR ROUTES ==========
// router.get("/supervisor/vehicles", authorize("supervisor"), async (req, res) => {
import { sql, eq, gte } from "drizzle-orm";
// router.get("/supervisor/vehicles", authenticate, async (req, res) => {
//   try {
//     if (!req.user?.id) {
//       return res.status(401).json({ error: "User authentication failed" });
//     }

//     const supervisorId = req.user.id;

//     const result = await db.execute(sql`
//       SELECT DISTINCT ON (v.id) v.*, u.fullname AS "driverName"
//       FROM vehicles v
//       JOIN assignments a ON a.vehicle_id = v.id
//       JOIN supervisions s ON s.driver_id = a.driver_id
//       LEFT JOIN users u ON a.driver_id = u.id
//       WHERE s.supervisor_id = ${supervisorId}
//     `);

//     res.json(result.rows);
//   } catch (err) {
//     console.error("Failed to fetch vehicles:", err);
//     res.status(500).json({ error: "Failed to fetch vehicles" });
//   }
// });

router.get("/supervisor/vehicles", authenticate, async (req, res) => {
  try {
    const result = await db.execute(sql`
        SELECT DISTINCT ON (v.id) v.*, u.fullname AS "driverName"
        FROM vehicles v
        LEFT JOIN assignments a ON a.vehicle_id = v.id
        LEFT JOIN users u ON a.driver_id = u.id
    `);

    console.log("Fetched vehicles:", result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch vehicles:", err);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

// src/routes/mobile.route.js
// router.get("/supervisor/drivers", authenticate, async (req, res) => {
//   try {
//     const supervisorId = req.user?.id;

//     if (!supervisorId) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     console.log("Fetching drivers for supervisor:", supervisorId);

//     const drivers = await db.execute(
//       sql`
//         SELECT u.id, u.fullname AS name, COUNT(t.id) AS trips
//         FROM users u
//         INNER JOIN supervisions s ON s.driver_id = u.id
//         LEFT JOIN trips t ON t.driver_id = u.id
//         WHERE s.supervisor_id = ${supervisorId} AND u.role = 'driver'
//         GROUP BY u.id, u.fullname
//         ORDER BY u.fullname ASC
//       `
//     );

//     res.json(drivers.rows);
//   } catch (err) {
//     console.error("Failed to fetch drivers:", err);
//     res.status(500).json({ error: "Failed to fetch drivers" });
//   }
// });

router.get("/supervisor/drivers", authenticate, async (req, res) => {
  try {
    console.log("Fetching all drivers");

    const drivers = await db.execute(
      sql`
        SELECT u.id, u.fullname AS name, COUNT(t.id) AS trips
        FROM users u
        LEFT JOIN trips t ON t.driver_id = u.id
        WHERE u.role = 'driver'
        GROUP BY u.id, u.fullname
        ORDER BY u.fullname ASC
      `
    );

    res.json(drivers.rows);
  } catch (err) {
    console.error("Failed to fetch drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});


router.get("/drivers", authenticate, async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, fullname FROM users
      WHERE role = 'driver'
      ORDER BY fullname ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// To get only drivers assigned to a supervisor: above
// SELECT u.id, u.fullname FROM users u
// JOIN supervisions s ON s.driver_id = u.id
// WHERE s.supervisor_id = ${supervisorId} AND u.role = 'driver'



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


router.post("/supervisor/checkin", authenticate, authorize("supervisor"), async (req, res) => {
  try {
    const [record] = await db.insert(checkins).values({ ...req.body, supervisor_id: req.user.id }).returning();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: "Failed to check in vehicle" });
  }
});

// router.post("/supervisor/checkout", authenticate, authorize("supervisor"), async (req, res) => {
//   try {
//     const [record] = await db.insert(checkouts).values({ ...req.body, supervisor_id: req.user.id }).returning();
//     res.status(201).json(record);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to check out vehicle" });
//   }
// });

router.post("/supervisor/checkout", authorize("supervisor"), async (req, res) => {
  try {
    const {
      tripId,
      vehicleId,
      driverId,
      endOdometer,
      endLocation
    } = req.body;

    if (!tripId || !vehicleId || !driverId || !endOdometer || !endLocation) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const supervisorId = req.user.id;

    // Insert checkout record
    const [record] = await db.insert(checkouts).values({
      vehicleId,
      driverId,
      performedById: supervisorId,
      performedByRole: "supervisor",
      endOdometer,
      endLocation,
      checkedOutAt: new Date(),
      supervisor_id: supervisorId,
    }).returning();

    // Update trip details
    await db.update(trips)
      .set({
        odometerEnd: endOdometer,
        locationEnd: endLocation,
        checkOutTime: new Date()
      })
      .where(eq(trips.id, tripId));

    res.status(201).json({ message: "Checked out successfully by supervisor", checkout: record });

  } catch (err) {
    console.error("Supervisor check-out error:", err);
    res.status(500).json({ error: "Supervisor check-out failed" });
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



// GET /api/supervisor/vehicles/:id/details
router.get("/supervisor/vehicles/:id/details", authenticate, authorize("supervisor"), async (req, res) => {
  try {
    const vehicleId = req.params.id;
    console.log("Fetching vehicle details for:", vehicleId);

    const result = await db.execute(sql`
  SELECT 
    v.id,
    v.make,
    v.model,
    v.plate_number,
    v.status,
    u.fullname AS current_driver,
    a.driver_id,                           
    ci.checked_in_at,
    ci.start_odometer,
    t.id AS trip_id
  FROM vehicles v
  LEFT JOIN assignments a ON a.vehicle_id = v.id
  LEFT JOIN users u ON u.id = a.driver_id
  LEFT JOIN LATERAL (
      SELECT c.checked_in_at, c.start_odometer
      FROM checkins c
      WHERE c.vehicle_id = v.id
      ORDER BY c.checked_in_at DESC
      LIMIT 1
  ) ci ON true
  LEFT JOIN LATERAL (
      SELECT t.id
      FROM trips t
      WHERE t.vehicle_id = v.id
        AND t.driver_id = a.driver_id -- ✅ match assignment
        AND t.check_out_time IS NULL
      ORDER BY t.check_in_time DESC
      LIMIT 1
  ) t ON true
  WHERE v.id = ${vehicleId}
`);



    console.log("Query result for vehicle:", result.rows);

    const vehicle = result.rows[0];

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json(vehicle); // ✅ Now includes driver_id
  } catch (err) {
    console.error("❌ Failed to fetch vehicle details:", err);
    res.status(500).json({ error: "Failed to fetch vehicle details" });
  }
});


// ========== DRIVER ROUTES ==========
import { and } from "drizzle-orm";

router.get("/driver/assignment", authenticate, async (req, res) => {
  try {
    const driverId = req.query.driverId || req.user.id;
    console.log(driverId);

    const result = await db
      .select({
        assignmentId: assignments.id,
        vehicleId: assignments.vehicleId,
        assignedAt: assignments.assignedAt,
        plateNumber: vehicles.plateNumber,
        make: vehicles.make,
        model: vehicles.model,
      })
      .from(assignments)
      .innerJoin(vehicles, eq(assignments.vehicleId, vehicles.id))
      .where(eq(assignments.driverId, driverId))
      .limit(1);

    if (result.length === 0) {
      return res.json({ message: `No assignment found for driver: ${driverId}` });
    }

    res.json(result[0]);
  } catch (err) {
    console.error("❌ Failed to fetch assignment:", err);
    res.status(500).json({ error: "Failed to check assignment" });
  }
});



// router.post("/driver/checkin", async (req, res) => {
//   try {

//     const {
//       vehicleId,
//       driverId,
//       startOdometer,
//       startLocation,
//       performedById,
//       performedByRole,
//       tripPurpose
//     } = req.body;

//     console.log({
//   vehicleId,
//   driverId,
//   performedById,
//   performedByRole,
//   startOdometer,
//   startLocation,
// });


//     const [record] = await db.insert(checkins).values({
//       vehicleId,
//       // driverId: req.user.id,
//       driverId,
//       performedById,
//       performedByRole,
//       startOdometer,
//       startLocation,
//       tripPurpose,
//     }).returning();


//     const [trip] = await db.insert(trips).values({
//       // driverId: req.user.id,
//       driverId: req.body.driverId,
//       vehicleId: req.body.vehicleId,
//       odometerStart: req.body.startOdometer,
//       locationStart: req.body.startLocation,
//       checkInTime: new Date()
//     }).returning();

//     res.status(201).json({
//       checkin: record,
//       tripId: trip.id
//     });
//   } catch (err) {
//     console.error("Driver check-in error:", err);
//     res.status(500).json({ error: "Driver check-in failed" });
//   }
// });

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

    if (!vehicleId || !driverId || !startOdometer || !startLocation || !performedById || !performedByRole || !tripPurpose) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("Check-in payload:", {
      vehicleId,
      driverId,
      performedById,
      performedByRole,
      startOdometer,
      startLocation,
      tripPurpose,
    });

    const [checkin] = await db.insert(checkins).values({
      vehicleId,
      driverId,
      performedById,
      performedByRole,
      startOdometer,
      startLocation,
      tripPurpose,
      timestamp: new Date(), // add timestamp if not auto-generated
    }).returning();

    const [trip] = await db.insert(trips).values({
      driverId,
      vehicleId,
      odometerStart: startOdometer,
      locationStart: startLocation,
      checkInTime: new Date(),
    }).returning();

    res.status(201).json({
      message: "Check-in successful",
      checkin,
      tripId: trip.id,
    });
  } catch (err) {
    console.error("Driver check-in error:", err);
    res.status(500).json({ error: "Driver check-in failed" });
  }
});


router.get("/driver/active-trip", authenticate, async (req, res) => {
  try {
    const driverId = req.user.id;  

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

// router.post("/driver/checkout", async (req, res) => {
//   try {
//     const {
//       tripId,
//       vehicleId,
//       driverId,
//       performedById,
//       performedByRole,
//       endOdometer,
//       endLocation
//     } = req.body;

//     // Basic validation
//     if (!tripId || !vehicleId || !driverId || !performedById || !performedByRole || !endOdometer || !endLocation) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // Insert into checkouts
//     const [record] = await db.insert(checkouts).values({
//       vehicleId,
//       driverId,
//       performedById,
//       performedByRole,
//       endOdometer,
//       endLocation,
//       checkedOutAt: new Date()
//     }).returning();

//     // Update trip
//     await db.update(trips)
//       .set({
//         odometerEnd: endOdometer,
//         locationEnd: endLocation,
//         checkOutTime: new Date()
//       })
//       .where(eq(trips.id, tripId));

//     res.status(201).json({ message: "Checked out successfully", checkout: record });

//   } catch (err) {
//     console.error("Driver check-out error:", err);
//     res.status(500).json({ error: "Driver check-out failed" });
//   }
// });
// router.post("/driver/checkout", authorize("driver"), async (req, res) => {
//   try {
//     const {
//       tripId,
//       vehicleId,
//       endOdometer,
//       endLocation
//     } = req.body;

//     // Basic validation
//     if (!tripId || !vehicleId || !endOdometer || !endLocation) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // performedById and performedByRole from req.user (token)
//     const performedById = req.user.id;
//     const performedByRole = "driver";
//     const driverId = req.user.id; // driver checking out themselves

//     // Insert checkout record
//     const [record] = await db.insert(checkouts).values({
//       vehicleId,
//       driverId,
//       performedById,
//       performedByRole,
//       endOdometer,
//       endLocation,
//       checkedOutAt: new Date()
//     }).returning();

//     // Update trip details
//     await db.update(trips)
//       .set({
//         odometerEnd: endOdometer,
//         locationEnd: endLocation,
//         checkOutTime: new Date()
//       })
//       .where(eq(trips.id, tripId));

//     res.status(201).json({ message: "Checked out successfully", checkout: record });

//   } catch (err) {
//     console.error("Driver check-out error:", err);
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

    // Validate required fields
    if (
      !tripId ||
      !vehicleId ||
      !driverId ||
      !performedById ||
      !performedByRole ||
      !endOdometer ||
      !endLocation
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("Check-out payload:", {
      tripId,
      vehicleId,
      driverId,
      performedById,
      performedByRole,
      endOdometer,
      endLocation,
    });

    // Insert into checkouts table
    const [checkout] = await db.insert(checkouts).values({
      tripId,
      vehicleId,
      driverId,
      performedById,
      performedByRole,
      endOdometer,
      endLocation,
      checkedOutAt: new Date(),
    }).returning();

    // Update trip end details
    await db.update(trips)
      .set({
        odometerEnd: endOdometer,
        locationEnd: endLocation,
        checkOutTime: new Date(),
      })
      .where(eq(trips.id, tripId));

    res.status(201).json({
      message: "Check-out successful",
      checkout
    });

  } catch (err) {
    console.error("Driver check-out error:", err);
    res.status(500).json({ error: "Driver check-out failed" });
  }
});



// GET /api/mobile/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Total vehicles
    const totalVehicles = await db.select().from(vehicles);
    
    // Active drivers (currently checked-in)
    const activeDriverRows = await db
      .selectDistinctOn([checkins.driverId])
      .from(checkins)
      .orderBy(checkins.driverId, desc(checkins.checkedInAt));

    const activeDrivers = activeDriverRows.length;

    // Fuel logs
    const fuel_logs = await db.select().from(fuelLogs);

    res.json({
      totalVehicles: totalVehicles.length,
      activeDrivers,
      fuelLogs: fuel_logs.length,
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
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