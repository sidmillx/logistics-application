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
  supervisors,
  entitiesTable as entities,
  drivers
} from "../db/schema.js";
import {  isNotNull, isNull, desc, asc, inArray, or   } from "drizzle-orm";

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


// changed this uncomment after.
// router.get("/supervisor/vehicles", authenticate, async (req, res) => {
//   try {
//     const result = await db.execute(sql`
//         SELECT DISTINCT ON (v.id) v.*, u.fullname AS "driverName"
//         FROM vehicles v
//         LEFT JOIN assignments a ON a.vehicle_id = v.id
//         LEFT JOIN users u ON a.driver_id = u.id
//     `);

//     console.log("Fetched vehicles:", result);

//     res.json(result); 
//   } catch (err) {
//     console.error("Failed to fetch vehicles:", err);
//     res.status(500).json({ error: "Failed to fetch vehicles" });
//   }
// });



// router.get("/supervisor/vehicles", authenticate, async (req, res) => {
//   try {
//     const supervisorId = req.user.id;

//     // 1️⃣ Get all drivers supervised by this supervisor
//     const supervisedDrivers = await db
//       .select({ driverId: supervisions.driverId })
//       .from(supervisions)
//       .where(eq(supervisions.supervisorId, supervisorId));

//     const driverIds = supervisedDrivers.map((d) => d.driverId);

//     // 2️⃣ If no supervised drivers, return empty list
//     if (driverIds.length === 0) {
//       return res.json([]);
//     }

//     // 3️⃣ Fetch all vehicles with their assigned drivers
//     const results = await db
//       .select({
//         id: vehicles.id,
//         plateNumber: vehicles.plateNumber,
//         model: vehicles.model,
//         make: vehicles.make,
//         status: vehicles.status,
//         driverName: users.fullname,
//       })
//       .from(vehicles)
//       .leftJoin(assignments, eq(assignments.vehicleId, vehicles.id))
//       .leftJoin(users, eq(assignments.driverId, users.id))
//       .where(
//         or(
//           isNull(users.id), // include unassigned vehicles
//           inArray(users.id, driverIds) // include vehicles assigned to supervised drivers
//         )
//       );

//     res.json(results);
//   } catch (err) {
//     console.error("Failed to fetch supervisor vehicles:", err);
//     res.status(500).json({ error: "Failed to fetch supervisor vehicles" });
//   }
// });




router.get("/supervisor/vehicles", authenticate, async (req, res) => {
  try {
    const {id: supervisorId, role } = req.user;

    //---- If the user is a super supervisor → return ALL vehicles
    if (role === "super_supervisor") {
      const allVehicles = await db
        .select({
          id: vehicles.id,
          plateNumber: vehicles.plateNumber,
          model: vehicles.model,
          make: vehicles.make,
          status: vehicles.status,
          driverName: users.fullname,
          entityName: entities.name,
        })
        .from(vehicles)
        .leftJoin(assignments, eq(assignments.vehicleId, vehicles.id))
        .leftJoin(users, eq(assignments.driverId, users.id))
        .leftJoin(entities, eq(vehicles.entityId, entities.id)); // join to show entity info

      return res.json(allVehicles);
    }


    //---- Otherwise → normal supervisor logic
    // 1 Get the supervisor's entity
    const [supervisor] = await db
      .select({ entityId: supervisors.assignedEntityId })
      .from(supervisors)
      .where(eq(supervisors.id, supervisorId));

    if (!supervisor || !supervisor.entityId) {
      return res
        .status(404)
        .json({ error: "Supervisor has no assigned entity" });
    }

    const entityId = supervisor.entityId;

    //  Fetch all vehicles belonging to that entity
    const vehiclesList = await db
      .select({
        id: vehicles.id,
        plateNumber: vehicles.plateNumber,
        model: vehicles.model,
        make: vehicles.make,
        status: vehicles.status,
        driverName: users.fullname,
      })
      .from(vehicles)
      .leftJoin(assignments, eq(assignments.vehicleId, vehicles.id))
      .leftJoin(users, eq(assignments.driverId, users.id))
      .where(eq(vehicles.entityId, entityId));

    //  Return results
    res.json(vehiclesList);
  } catch (err) {
    console.error("Failed to fetch supervisor vehicles:", err);
    res.status(500).json({ error: "Failed to fetch supervisor vehicles" });
  }
});



router.get("/supervisor/drivers", authenticate, async (req, res) => {
  try {
    const supervisorId = req.user.id; // Get the logged-in supervisor's ID

    console.log("Fetching drivers supervised by this supervisor with last activity info and status");

    // Step 1: Get the driver IDs assigned to this supervisor
    const supervisedDrivers = await db
      .select({ driverId: supervisions.driverId })
      .from(supervisions)
      .where(eq(supervisions.supervisorId, supervisorId));

    const driverIds = supervisedDrivers.map(d => d.driverId);

    if (driverIds.length === 0) {
      return res.json([]); // No drivers assigned to this supervisor
    }

    // Step 2: Fetch detailed info for only these drivers
    const results = await db
      .select({
        id: users.id,
        name: users.fullname,
        trips: sql`(
          SELECT COUNT(*) FROM trips t WHERE t.driver_id = users.id
        )`.as("trips"),
        last_checkin_time: sql`(
          SELECT c.checked_in_at
          FROM checkins c
          WHERE c.driver_id = users.id
          ORDER BY c.checked_in_at DESC
          LIMIT 1
        )`.as("last_checkin_time"),
        last_checkin_location: sql`(
          SELECT c.start_location
          FROM checkins c
          WHERE c.driver_id = users.id
          ORDER BY c.checked_in_at DESC
          LIMIT 1
        )`.as("last_checkin_location"),
        last_checkout_time: sql`(
          SELECT c.checked_out_at
          FROM checkouts c
          WHERE c.driver_id = users.id
          ORDER BY c.checked_out_at DESC
          LIMIT 1
        )`.as("last_checkout_time"),
        last_checkout_location: sql`(
          SELECT c.end_location
          FROM checkouts c
          WHERE c.driver_id = users.id
          ORDER BY c.checked_out_at DESC
          LIMIT 1
        )`.as("last_checkout_location"),
        status: sql`(
          CASE
            WHEN EXISTS (
              SELECT 1 FROM trips t WHERE t.driver_id = users.id AND t.check_out_time IS NULL
            ) THEN 'on trip'
            WHEN EXISTS (
              SELECT 1 FROM assignments a WHERE a.driver_id = users.id
            ) THEN 'assigned'
            ELSE 'unassigned'
          END
        )`.as("status")
      })
      .from(users)
      .where(inArray(users.id, driverIds)) // Only supervised drivers
      .orderBy(sql`users.fullname ASC`);

    res.json(results);
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
     //res.json(result.rows); -----> REMOVE THIS
    res.json(result);  // ------> ADD THIS
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
    const { driverId, vehicleId, permanent = false } = req.body;

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

    // Create assignment
    const [newAssignment] = await db
      .insert(assignments)
      .values({
        driverId,
        vehicleId,
        permanent,
      })
      .returning();

    res.status(201).json(newAssignment);
  } catch (err) {
    console.error("Failed to create assignment:", err);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});


// add new one
router.put('/supervisor/assignments/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { driverId, permanent } = req.body;

    // Add validation for assignmentId
    if (!assignmentId) {
      return res.status(400).json({ error: 'Assignment ID is required' });
    }

    await db
      .update(assignments)
      .set({
        driverId,
        permanent,
      })
      .where(eq(assignments.id, assignmentId));

    res.json({ message: 'Assignment updated successfully' });
  } catch (err) {
    console.error('Failed to update assignment:', err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

router.delete(
  "/supervisor/assignments/:assignmentId",
  authenticate,
  authorize("supervisor"),
  async (req, res) => {
    try {
      const { assignmentId } = req.params;

      if (!assignmentId) {
        return res.status(400).json({ error: "assignmentId is required in URL" });
      }

      // Check if assignment exists
      const assignment = await db
        .select({
          id: assignments.id,
          driverId: assignments.driverId,
          vehicleId: assignments.vehicleId,
        })
        .from(assignments)
        .where(eq(assignments.id, assignmentId))
        .limit(1);

      if (!assignment || assignment.length === 0) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      // Delete the assignment
      await db
        .delete(assignments)
        .where(eq(assignments.id, assignmentId));

      res.json({ message: "Assignment removed successfully" });
    } catch (err) {
      console.error("Failed to remove assignment:", err);
      res.status(500).json({ error: "Failed to remove assignment" });
    }
  }
);


router.post("/supervisor/checkin", authenticate, authorize("supervisor"), async (req, res) => {
  try {
    const [record] = await db.insert(checkins).values({ ...req.body, supervisor_id: req.user.id }).returning();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: "Failed to check in vehicle" });
  }
});


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
      a.id AS current_assignment_id,
      a.permanent AS current_assignment_permanent,
      ci.checked_in_at,
      ci.start_odometer,
      t.id AS trip_id,
      t.check_out_time AS checked_out_at
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
        SELECT t.id, t.check_out_time
        FROM trips t
        WHERE t.vehicle_id = v.id
          AND t.driver_id = a.driver_id 
          AND t.check_out_time IS NULL
        ORDER BY t.check_in_time DESC
        LIMIT 1
    ) t ON true
    WHERE v.id = ${vehicleId};

`);



    console.log("Query result for vehicle:", result); //---> removed rows here

    const vehicle = result[0]; //---> removed rows here

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

    // Insert check-in record
    const [checkin] = await db.insert(checkins).values({
      vehicleId,
      driverId,
      performedById,
      performedByRole,
      startOdometer,
      startLocation,
      tripPurpose,
      checkedInAt: new Date(),
    }).returning();

    // Insert trip record
    const [trip] = await db.insert(trips).values({
      driverId,
      vehicleId,
      odometerStart: startOdometer,
      locationStart: startLocation,
      checkInTime: new Date(),
    }).returning();

    // Update vehicle status to "in-use"
    await db.update(vehicles)
      .set({ status: 'in-use' })
      .where(eq(vehicles.id, vehicleId));

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
    const [checkout] = await db
      .insert(checkouts)
      .values({
        tripId,
        vehicleId,
        driverId,
        performedById,
        performedByRole,
        endOdometer,
        endLocation,
        checkedOutAt: new Date(),
      })
      .returning();

    // Update trip end details
    await db
      .update(trips)
      .set({
        odometerEnd: endOdometer,
        locationEnd: endLocation,
        checkOutTime: new Date(),
      })
      .where(eq(trips.id, tripId));

    // Update vehicle status to "available"
    await db
      .update(vehicles)
      .set({
        status: "available",
      })
      .where(eq(vehicles.id, vehicleId));


    // Check if assignment is permanent
    const [assignment] = await db
      .select({ permanent: assignments.permanent })
      .from(assignments)
      .where(
        and(
          eq(assignments.driverId, driverId),
          eq(assignments.vehicleId, vehicleId)
        )
      );

    if (!assignment?.permanent) {
      // Only delete if NOT permanent
      await db
        .delete(assignments)
        .where(
          and(
            eq(assignments.driverId, driverId),
            eq(assignments.vehicleId, vehicleId)
          )
        );
    }


    res.status(201).json({
      message: "Check-out successful",
      checkout,
    });
  } catch (err) {
    console.error("Driver check-out error:", err);
    res.status(500).json({ error: "Driver check-out failed" });
  }
});



// GET /api/mobile/dashboard
router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const supervisorId = req.user.id;

    // Get the supervisor’s assigned entity
    const [supervisor] = await db
      .select({ entityId: supervisors.assignedEntityId })
      .from(supervisors)
      .where(eq(supervisors.id, supervisorId));

    if (!supervisor?.entityId) {
      return res
        .status(404)
        .json({ error: "Supervisor has no assigned entity" });
    }

    const entityId = supervisor.entityId;

    // Fetch total vehicles for that entity
    const vehiclesList = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(eq(vehicles.entityId, entityId));

    // Fetch active drivers checked in to that entity’s vehicles
    const activeDriverRows = await db
      .selectDistinctOn([checkins.driverId])
      .from(checkins)
      .innerJoin(vehicles, eq(checkins.vehicleId, vehicles.id))
      .where(eq(vehicles.entityId, entityId))
      .orderBy(checkins.driverId, desc(checkins.checkedInAt));

    const activeDrivers = activeDriverRows.length;

    // Fetch fuel logs belonging to the entity
    const fuelLogsList = await db
      .select({ id: fuelLogs.id })
      .from(fuelLogs)
      .innerJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id))
      .where(eq(vehicles.entityId, entityId));

    // Send filtered stats
    res.json({
      totalVehicles: vehiclesList.length,
      activeDrivers,
      fuelLogs: fuelLogsList.length,
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

router.post("/driver/fuel", async (req, res) => {
  try {
    console.log("✅ Fuel log received:", req.body);
    const [log] = await db.insert(fuelLogs).values({ ...req.body }).returning();
    res.status(201).json(log);
  } catch (err) {
    console.error("Fuel log error:", err);
    res.status(500).json({ error: "Fuel log failed" });
  }
});


// TESTING DRIVER FETCH ASSIGNED ROUTE:
router.get("/test-drivers", authenticate, async (req, res) => {
  try {
    const supervisorId = req.user.id; // from JWT

    const assignedDrivers = await db
      .select({
        driverId: users.id,
        fullname: users.fullname,
        username: users.username,
        role: users.role,
      })
      .from(supervisions)
      .innerJoin(users, eq(users.id, supervisions.driverId))
      .where(eq(supervisions.supervisorId, supervisorId));

    res.json(assignedDrivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch assigned drivers" });
  }
});



export default router;



// NOTES
// WORKING ROUTES
// 1. CHECKIN => POST /api/mobile/driver/checkin  => use req.users.id to get ref id
// 2. CHECKOUT => POST /api/mobile/driver/checkout