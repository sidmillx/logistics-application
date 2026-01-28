// IMPORTS
import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { db } from "../config/db.js";
import {
  entitiesTable as entities,
  assignments,
  supervisions,
  trips,
  fuelLogs,
  usersTable,
  drivers,
  supervisors,
  vehicles
} from "../db/schema.js";
import { and, eq, isNotNull, sql, gte, lte, desc, isNull, inArray  } from "drizzle-orm";
import bcrypt from "bcryptjs";


const router = express.Router();

// router.use(authenticate, authorize("admin")); REAPPLY THIS LATER, !!!! VERY IMPORTANT !!!




//================================================ DRIVER MANAGEMENT =======================================

router.get("/supervision-logs", authenticate, async (req, res) => {
  try {
    // Extract user info (assuming JWT middleware adds it to req.user)
    const { role, entityId } = req.user;
    console.log(`Role: ${role}, Entity ID: ${entityId}`)

    // Base supervision query
    let supervisionQuery = db
      .select({
        id: supervisions.id,
        supervisorId: supervisions.supervisorId,
        driverId: supervisions.driverId,
        assignedAt: supervisions.createdAt,
      })
      .from(supervisions);

    // If admin, filter to supervisors from their entity
    if (role === "admin") {
      // Get supervisor IDs that belong to this admin's entity
      const supervisorsInEntity = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(and(
          eq(usersTable.role, "supervisor"),
          eq(usersTable.entityId, entityId)
        ));

      const supervisorIds = supervisorsInEntity.map(s => s.id);

      if (supervisorIds.length === 0) {
        return res.json([]); // No supervisors = no logs
      }

      supervisionQuery = supervisionQuery.where(inArray(supervisions.supervisorId, supervisorIds));
    }

    const supervisionData = await supervisionQuery;

    if (supervisionData.length === 0) {
      return res.json([]);
    }

    // Collect unique user IDs
    const userIds = [
      ...new Set([
        ...supervisionData.map(s => s.supervisorId),
        ...supervisionData.map(s => s.driverId),
      ]),
    ].filter(Boolean);

    // Fetch user details
    const users = await db
      .select({
        id: usersTable.id,
        fullname: usersTable.fullname,
      })
      .from(usersTable)
      .where(inArray(usersTable.id, userIds));

    // Collect driver IDs for assignments
    const driverIds = supervisionData.map(s => s.driverId).filter(Boolean);

    // Get assignments and vehicles
    const assignmentData =
      driverIds.length > 0
        ? await db
            .select({
              driverId: assignments.driverId,
              plateNumber: vehicles.plateNumber,
            })
            .from(assignments)
            .leftJoin(vehicles, eq(vehicles.id, assignments.vehicleId))
            .where(inArray(assignments.driverId, driverIds))
        : [];

    // Combine everything
    const logs = supervisionData.map((supervision) => {
      const supervisor = users.find((u) => u.id === supervision.supervisorId);
      const driver = users.find((u) => u.id === supervision.driverId);
      const assignment = assignmentData.find(
        (a) => a.driverId === supervision.driverId
      );

      return {
        supervisorName: supervisor?.fullname || null,
        driverName: driver?.fullname || null,
        assignedAt: supervision.assignedAt,
        plateNumber: assignment?.plateNumber || null,
      };
    });

    res.json(logs);
  } catch (err) {
    console.error("Error fetching supervision logs:", err);
    res.status(500).json({ message: "Failed to fetch supervision logs" });
  }
});

/** GET /api/admin/drivers/
 * 
 * Description:
 *  - Get all drivers
 * 
 *
 * Responses:
 * 500 - Server error
 * 
 */

router.get(
  "/drivers",
  authenticate,
  authorize("super_admin", "admin"),
  async (req, res) => {
    try {
      const { role, entityId } = req.user;
      console.log(`Role: ${role} /n Entity ID: ${entityId}`)

      // 1 Get active driver IDs (on active trips)
      const activeDriverResults = await db
        .select({ driverId: trips.driverId })
        .from(trips)
        .where(and(isNotNull(trips.checkInTime), isNull(trips.checkOutTime)))
        .groupBy(trips.driverId);

      const activeDriverIds = activeDriverResults.map((d) => d.driverId);

      // 2 Base query for all drivers
      let query = db
        .select({
          id: drivers.id,
          name: usersTable.fullname,
          contact: drivers.contact,
          entityName: entities.name,
        })
        .from(drivers)
        .leftJoin(usersTable, eq(drivers.id, usersTable.id))
        .leftJoin(entities, eq(drivers.entityId, entities.id));

      // 3 Restrict for admin role
      if (role === "admin" && entityId) {
        query = query.where(eq(drivers.entityId, entityId));
      }

      const allDrivers = await query;

      //  Add active status
      const results = allDrivers.map((driver) => ({
        ...driver,
        isActive: activeDriverIds.includes(driver.id),
      }));

      res.json(results);
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  }
);

/** GET /api/admin/drivers/summary
 * 
 * Description:
 *  - Get the summary of drivers
 * 
 *
 * Responses:
 * 500 - Server error
 * 
 */


router.get("/drivers/summary", authenticate, async (req, res) => {
  try {
    const { role, entityId } = req.user;

    // Build filters based on role
    let driverFilter = undefined;
    let tripFilter = undefined;

    if (role === "super_admin") {
      // No restriction
    } else if (role === "admin") {
      // Limit to drivers under the admin’s entity
      driverFilter = eq(drivers.entityId, entityId);
      tripFilter = sql`${trips.driverId} IN (SELECT id FROM drivers WHERE entity_id = ${entityId})`;
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    // Active drivers (currently on trips)
    const activeDriversQuery = db
      .select({ driverId: trips.driverId })
      .from(trips)
      .where(
        and(
          isNotNull(trips.checkInTime),
          isNull(trips.checkOutTime),
          ...(tripFilter ? [tripFilter] : [])
        )
      )
      .groupBy(trips.driverId);

    const activeDrivers = await activeDriversQuery;

    // Total driver count
    const totalDriversQuery = db
      .select({ count: sql`count(*)` })
      .from(drivers)
      .where(driverFilter ?? sql`true`);

    const totalDrivers = await totalDriversQuery;

    // Trip statistics (average and total trips per driver)
    const tripStatsQuery = db
      .select({
        totalTrips: sql`count(*)`,
        avgTrips: sql`ROUND(avg(count)::numeric, 1)`,
      })
      .from(
        db
          .select({
            driverId: trips.driverId,
            count: sql`count(*)`.mapWith(Number),
          })
          .from(trips)
          .where(tripFilter ?? sql`true`)
          .groupBy(trips.driverId)
          .as("driver_trips")
      );

    const tripStats = await tripStatsQuery;

    res.json({
      totalDrivers: Number(totalDrivers[0].count),
      activeDrivers: activeDrivers.length,
      avgTripsPerDriver: tripStats[0]?.avgTrips || 0,
      totalTrips: tripStats[0]?.totalTrips || 0,
    });
  } catch (err) {
    console.error("Failed to load driver summary:", err);
    res.status(500).json({ error: "Failed to fetch driver summary" });
  }
});


/** GET /api/admin/drivers/:id
 * 
 * Description:
 *  - Get a single driver by id
 * 
 * Request Parameters:
 * {
 *    "driverId": "string"
 * }
 *  
 * 
 * Responses:
 * 500 - Failed to get driver profile
 * 
 */
router.get("/drivers/:id", async (req, res) => {
  const driverId = req.params.id;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, driverId));
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, driverId));

    const tripsData = await db
      .select()
      .from(trips)
      .where(eq(trips.driverId, driverId));

    const totalTrips = tripsData.length;
    const hoursLogged = tripsData.reduce((acc, trip) => {
      if (trip.checkInTime && trip.checkOutTime) {
        const duration = (new Date(trip.checkOutTime) - new Date(trip.checkInTime)) / 3600000;
        return acc + duration;
      }
      return acc;
    }, 0);

    const avgDistance = (() => {
      const validTrips = tripsData.filter(t => t.odometerStart && t.odometerEnd);
      const totalDist = validTrips.reduce((acc, trip) => acc + (trip.odometerEnd - trip.odometerStart), 0);
      return validTrips.length > 0 ? (totalDist / validTrips.length).toFixed(1) : "0";
    })();

    res.json({
    id: user?.id || driverId,
    name: user?.fullname || "Unknown",
    company: "Inyatsi",
    phone: driver?.contact || "N/A",
    totalTrips,
    hoursLogged: hoursLogged.toFixed(1),
    avgDistance: Number(avgDistance),
  });

  } catch (err) {
    console.error("Error fetching driver profile:", err);
    res.status(500).json({ error: "Failed to get driver profile" });
  }
});


/** POST /api/admin/drivers/add
 * 
 * Description:
 *  - Creates a new driver
 * 
 * Request body:
 * {
 *  "fullname": "string",
 *  "username": "string",
 *  "password": "string",
 *  "contact" : "string",
 *  "entityId": "string"
 * }
 * 
 * Responses:
 * 201 - Driver created successfully
 * 400 - Invalid input
 * 409 - Username already exists
 * 500 - Server error
 * 
 */
router.post('/drivers/add', async (req, res) => {
  const { fullname, username, password, contact, entityId } = req.body;
  try {
    // Validate required fields
    if (!fullname || !fullname.trim()) {
      return res.status(400).json({ error: 'Full Name is required' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (!contact || !contact.trim()) {
      return res.status(400).json({ error: 'Contact is required' });
    }
    if (!entityId) {
      return res.status(400).json({ error: 'Entity ID is required' });
    }

    // Check for existing username
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into users table
    const [user] = await db
      .insert(usersTable)
      .values({
        username: username.trim(),
        password: hashedPassword,
        fullname: fullname.trim(), 
        role: "driver",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    // Insert into drivers table
    await db.insert(drivers).values({
      id: user.id, 
      entityId,
      contact: contact.trim(),
    });

    res.status(201).json({ message: "Driver added successfully", user });
  } catch (err) {
    console.error("Error adding driver:", err);
    res.status(500).json({ error: "Failed to add driver" });
  }
});


/** PUT /api/admin/drivers/:id
 * 
 * Description:
 *  - Modify driver details
 * 
 * Request Parameters:
 * {
 *    "driverId": "string"
 * }
 * 
 * 
 * Request body:
 * {
 *  "fullname": "string",
 *  "contact" : "string",
 *  "entityId": "string"
 *  "status": "string",
 * }
 * 
 * Responses:
 * 400 - Failed to update driver
 * 
 */
router.put('/drivers/:id', async (req, res) => {
  const driverId = req.params.id;
  const { fullname, contact, entityId, status } = req.body; // Updated to match frontend 'fullname'

  try {
    // Validate required fields
    if (!fullname || !fullname.trim()) {
      throw new Error('Full Name is required');
    }
    if (!contact || !contact.trim()) {
      throw new Error('Contact is required');
    }
    if (!entityId) {
      throw new Error('Entity ID is required');
    }
    if (!status) {
      throw new Error('Status is required');
    }

    // Validate entityId exists
    const entityResult = await db
      .select({ id: entities.id })
      .from(entities)
      .where(eq(entities.id, entityId))
      .limit(1);

    if (entityResult.length === 0) {
      throw new Error('Entity not found');
    }

    // Update usersTable (fullname and status)
    const [updatedUser] = await db
      .update(usersTable)
      .set({
        fullname: fullname.trim(),
        status: status, // Only if status is added to schema
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, driverId))
      .returning();

    if (!updatedUser) {
      throw new Error('User not found or update failed');
    }

    // Update drivers table (contact and entityId)
    const [updatedDriver] = await db
      .update(drivers)
      .set({
        contact: contact.trim(),
        entityId,
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      throw new Error('Driver update failed');
    }

    res.json({ message: "Driver updated successfully", data: { user: updatedUser, driver: updatedDriver } });
  } catch (err) {
    console.error("Update driver error:", err);
    res.status(400).json({ message: err.message || "Failed to update driver" });
  }
});


/** DELETE /api/admin/drivers/:id
 * 
 * Description:
 *  - Delete a driver by id
 * 
 * Request Parameters:
 * {
 *    "driverId": "string"
 * }
 * 
 * 
 * 
 * Responses:
 * 200 - Driver successfully deleted
 * 500 - Failed to delete driver
 * 
 */
router.delete("/drivers/:id", async (req, res) => {
  const driverId = req.params.id;

  try {
    // Delete from `drivers` table first (child)
    await db.delete(drivers).where(eq(drivers.id, driverId));

    // Then delete from `users` table (parent)
    await db.delete(usersTable).where(eq(usersTable.id, driverId));

    res.status(200).json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error("Delete driver error:", error);
    res.status(500).json({ error: "Failed to delete driver" });
  }
});






// ========================================== USER MANAGEMENT =======================================

/** GET /api/admin/users
 * 
 * Description:
 *  - Gets all users
 * 
 * Responses:
 * 500 - Failed to fetch users
 */


router.get("/users", authenticate, async (req, res) => {
  try {
    const { role, entityId } = req.user;

    let query = db.select().from(usersTable);

    // If admin, restrict to users in same entity
    if (role === "admin") {
      query = query.where(eq(usersTable.entityId, entityId));
    }

    // If super admin, leave unrestricted
    const allUsers = await query;

    res.json(allUsers);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/** GET /api/admin/users/:id
 * 
 * Description:
 *  - Gets specific user
 * 
 * Responses:
 * 404 - User not found
 * 500 - Failed to fetch user
 * 
 */
router.get("/users/:id", async (req, res) => {
  try {
    const result = await db.select().from(users).where(eq(users.id, req.params.id));
    if (!result.length) return res.status(404).json({ error: "User not found" });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});


/** GET /api/admin/users
 * 
 * Description:
 *  - Get all users
 * 
 * Responses:
 * 500 - Internal Server Error!
 */
router.get("/users", authenticate, async (req, res) => {
  try {
    const { role, entityId } = req.user;

    let query = db
      .select({
        id: usersTable.id,
        fullname: usersTable.fullname,
        username: usersTable.username,
        role: usersTable.role,
        entityId: usersTable.entityId,
        entityName: entitiesTable.name,
      })
      .from(usersTable)
      .leftJoin(entitiesTable, eq(usersTable.entityId, entitiesTable.id));

    // Restrict admins to their own entity
    if (role === "admin") {
      query = query.where(eq(usersTable.entityId, entityId));
    }

    const users = await query;
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});


/** POST /api/admin/users
 * 
 * Description:
 *  - Add a user
 * 
 * Request body:
 * {
 *  "fullname": "string",
 *  "username": "string",
 *  "password": "string",
 *  "role"    : "string"
 * }
 * 
 * Responses:
 * 201 - User created successfully
 * 500 - Failed to create user
 * 
 */
router.post("/users", async (req, res) => {

  try {
    const { fullname, username, password, role } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.insert(usersTable).values({
      fullname,
      username,
      password: hashedPassword,
      role 
    }).returning();

    res.status(201).json(newUser[0]);
  } catch (err){
    console.error(err);
    res.status(500).json({ error: 'Could not create user'});
  }
})


/** PUT /api/admin/users/:id
 * 
 * Description:
 *  - Modify a user
 * 
 * 
 * Request parameters:
 * {
 *  "id": "string"
 * }
 * 
 * Request body:
 * {
 *  "password": "string",
 *  "role"    : "string"
 * }
 * 
 * Responses:
 * 400 - Invalid Role
 * 404 - User not found
 * 500 - Failed to modify user
 * 
 */
router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { role, password } = req.body;

  // Validate role if provided
  if (role && !["admin", "supervisor", "driver"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    // Prepare the update object
    const updateData = {};

    if (role) {
      updateData.role = role;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updated = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, id))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated", user: updated[0] });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});



/** DELETE /api/users/:id
 * 
 * Description:
 *  - Delete a specific user
 * 
 * Request body:
 * {
 *  "id" :"string"
 * }
 * 
 * Responses:
 * 404 - User not found
 * 500 - Internal Server Error
 */
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning();

    if (!deleted.length) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted", user: deleted[0] });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});







// ==== ENTITIES ====
// GET: Overview of entities and vehicles



router.get("/entities/overview", authenticate, async (req, res) => {
  try {
    const { role, entityId } = req.user;

    let entitiesData = [];
    let vehiclesData = [];

    if (role === "super_admin") {
      // Super admin can see everything
      entitiesData = await db.select().from(entities);
      vehiclesData = await db.select().from(vehicles);
    } else if (role === "admin") {
      // Admin can only see vehicles from their entity
      entitiesData = await db
        .select()
        .from(entities)
        .where(eq(entities.id, entityId));

      vehiclesData = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.entityId, entityId));
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    const entitySummaries = entitiesData.map((entity) => {
      const relatedVehicles = vehiclesData.filter(
        (v) => v.entityId === entity.id
      );

      const total = relatedVehicles.length;
      const inUse = relatedVehicles.filter((v) => v.status === "in-use").length;
      const available = relatedVehicles.filter(
        (v) => v.status === "available"
      ).length;
      const maintenance = relatedVehicles.filter(
        (v) => v.status === "maintenance"
      ).length;

      return {
        id: entity.id,
        name: entity.name,
        totalVehicles: total,
        vehiclesInUse: inUse,
        vehiclesAvailable: available,
        underMaintenance: maintenance,
      };
    });

    const totalVehicles = vehiclesData.length;
    const totalEntities = entitiesData.length;
    const totalAvailable = vehiclesData.filter(
      (v) => v.status === "available"
    ).length;

    res.json({
      entitySummaries,
      totalVehicles,
      totalEntities,
      totalAvailable,
    });
  } catch (err) {
    console.error("Error in /entities/overview:", err);
    res.status(500).json({ error: "Failed to load overview" });
  }
});

// GET ENTITIES OVERVIEW
router.get("/entities/:id/overview", async (req, res) => {
    const { id } = req.params;

    const entity = await db.query.entities.findFirst({
    where: eq(entities.id, id),
    });

    if (!entity) return res.status(404).json({ error: "Entity not found" });
    

    const vehicles = await db.query.vehicles.findMany({
    where: eq(vehicles.entityId, id),
    });

    const totalVehicles = vehicles.length;
    const inUse = vehicles.filter(v => v.status === "in-use").length;
    const available = vehicles.filter(v => v.status === "available").length;
    const maintenance = vehicles.filter(v => v.status === "maintenance").length;

    return res.json({
    name: entity.name,
    totalVehicles,
    inUse,
    available,
    maintenance,
  });
});


/**
 * Get a specific entity
 * GET /api/admin/entities/:id
 * 
 * Request body:
 * {
 *  "id": "string"
 * }
 * 
 * Responses:
 * 404 - Entity not found
 * 500 - Failed to fetch entity
 */
router.get("/entities/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.select().from(entities).where(eq(entities.id, id));
    if (result.length === 0) return res.status(404).json({ error: "Entity not found" });
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch entity" });
  }
});


/**
 * Get all entities
 * GET /api/admin/entities/:id
 * 
 * Responses:
 * 500 - Failed to fetch entity
 */

router.get("/entities", async (req, res) => {
  try {
    const allEntities = await db.select().from(entities);
    res.json(allEntities);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch entities" });
  }
});


router.get("/summary", async (req, res) => {
     const [allVehicles, allEntities] = await Promise.all([
        db.select().from(vehicles),
        db.select().from(entities),
    ]);

    const totalVehicles = allVehicles.length;
    const totalEntities = allEntities.length;
    const available = allVehicles.filter(v => v.status === "available").length;

    res.json({
        totalVehicles,
        totalEntities,
        availableVehicles: available,
    });
})


// admin.route.ts or vehicles.route.ts

/**
 * Create a vehicle
 * POST /api/admin/vehicles
 * 
 * Request body:
 * {
 *  "plateNumber" : "string",
 *  "model"       : "string",
 *  "make"        : "string",
 *  "status"      : "string",
 *  "entityId"    : "string"
 * }
 * 
 * Responses:
 * 201 - Vehicle created successfully
 * 400 - Invalid input
 * 500 - Internal Server Error ( Failed to create vehicle )
 * 
 */
router.post("/vehicles", async (req, res) => {
  const { plateNumber, model, make,  status, entityId, plantNumber } = req.body;

  if (!plateNumber || !model || !make || !status || !entityId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [vehicle] = await db
      .insert(vehicles)
      .values({ plateNumber, model, make, status, entityId, plantNumber })
      .returning();

    res.status(201).json(vehicle);
  } catch (err) {
    console.error("Error creating vehicle:", err);
    res.status(500).json({ error: "Failed to create vehicle" });
  }
});


/**
 * Create a new entity
 */

router.post("/entities", authenticate, authorize("super_admin"), async (req, res) => {
  try {
    const [newEntity] = await db.insert(entities).values(req.body).returning();
    res.status(201).json(newEntity);
  } catch (err) {
    res.status(500).json({ error: "Failed to create entity" });
  }
});

router.put("/entities/:id", authenticate, authorize("super_admin"), async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    await db.update(entities)
      .set({ name, description })
      .where(eq(entities.id, id));

    res.json({ message: "Entity updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update entity" });
  }
});




// ==== VEHICLE ASSIGNMENTS ====
router.post("/assignments", async (req, res) => {
  try {
    const [assignment] = await db.insert(assignments).values(req.body).returning();
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: "Failed to assign driver to vehicle" });
  }
});

router.delete("/assignments/:id", async (req, res) => {
  try {
    await db.delete(assignments).where(eq(assignments.id, req.params.id));
    res.json({ message: "Assignment deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

// ==== SUPERVISION ASSIGNMENTS ====
router.post("/supervisions", async (req, res) => {
  try {
    const [record] = await db.insert(supervisions).values(req.body).returning();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: "Failed to assign supervisor" });
  }
});

router.delete("/supervisions/:id", async (req, res) => {
  try {
    await db.delete(supervisions).where(eq(supervisions.id, req.params.id));
    res.json({ message: "Supervision link deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete supervision" });
  }
});

// ==== TRIPS ====
router.get("/trips", async (req, res) => {
  try {
    const results = await db.select().from(trips);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

// ==== FUEL LOGS ====
router.get("/fuel-logs", async (req, res) => {
  try {
    const results = await db.select().from(fuelLogs);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch fuel logs" });
  }
});


// GET /api/admin/vehicles
router.get(
  "/vehicles",
  authenticate,  //  ensures user is logged in
  authorize("super_admin", "admin"), //  allows only admins
  async (req, res) => {
    try {
      const { role, entityId } = req.user;

      let query = db
        .select({
          id: vehicles.id,
          plateNumber: vehicles.plateNumber,
          make: vehicles.make,
          model: vehicles.model,
          status: vehicles.status,
          entityId: vehicles.entityId,
          entityName: entities.name,
          createdAt: vehicles.createdAt,
          plantNumber: vehicles.plantNumber,
        })
        .from(vehicles)
        .leftJoin(entities, eq(vehicles.entityId, entities.id));

      //  If admin, filter by their entityId
      if (role === "admin") {
        query = query.where(eq(vehicles.entityId, entityId));
      }

      const results = await query;
      res.json(results);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  }
);





router.get("/vehicles/summary", authenticate, async (req, res) => {
  try {
    const { role, entityId } = req.user;

    // Apply role-based filtering
    let whereCondition = undefined;

    if (role === "super_admin") {
      // No restriction
    } else if (role === "admin") {
      whereCondition = eq(vehicles.entityId, entityId);
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    // Fetch vehicles based on role
    const all = await db
      .select()
      .from(vehicles)
      .where(whereCondition ?? undefined);

    // Compute summary
    const totalVehicles = all.length;
    const available = all.filter(v => v.status === "available").length || 0;
    const inUse = all.filter(v => v.status === "in-use").length || 0;

    // Optional: Replace with actual query if you track daily fuel logs
    const fuelLoggedToday = 0;

    res.json({ totalVehicles, available, inUse, fuelLoggedToday });
  } catch (err) {
    console.error("Failed to fetch vehicle summary:", err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});


router.delete("/vehicles/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await db.delete(vehicles).where(eq(vehicles.id, id));
    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error("Failed to delete vehicle:", err);
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
});


router.put("/vehicles/:id", async (req, res) => {
  const { id } = req.params;
  const { plateNumber, make, model, status, plantNumber } = req.body;

  try {
    await db
      .update(vehicles)
      .set({ plateNumber, make, model, status, plantNumber })
      .where(eq(vehicles.id, id));
    res.json({ message: "Vehicle updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update vehicle" });
  }
});



// src/routes/admin.route.js (or equivalent)
// src/routes/admin.route.


// GET /api/admin/vehicles/:id
router.get("/vehicles/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id));

    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

    res.json(vehicle);
  } catch (err) {
    console.error("Fetch vehicle error:", err);
    res.status(500).json({ error: "Failed to fetch vehicle" });
  }
});



router.delete("/entities/:id", authenticate, authorize("super_admin"), async (req, res) => {
  try {
    await db.delete(entities).where(eq(entities.id, req.params.id));
    res.json({ message: "Entity deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete entity" });
  }
});



router.get("/vehicles/:id/fuel-logs", async (req, res) => {
  try {
    const vehicleId = req.params.id;

    const logs = await db
      .select({
        id: fuelLogs.id,
        date: fuelLogs.timestamp,
        fuelType: fuelLogs.location, // Replace with actual fuel type if different
        liters: fuelLogs.litres,
        cost: fuelLogs.cost,
        odometer: fuelLogs.odometer,
        loggedBy: usersTable.fullname,
      })
      .from(fuelLogs)
      .leftJoin(usersTable, eq(fuelLogs.loggedBy, usersTable.id))
      .where(eq(fuelLogs.vehicleId, vehicleId))
      .orderBy(fuelLogs.timestamp, "desc");

    res.json(logs); // Send array directly
  } catch (error) {
    console.error("Error fetching fuel logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.get("/trips/logs", authenticate, async (req, res) => {
  try {
    const { role, entityId } = req.user;

    // Build base query
    let query = db
      .select({
        id: trips.id,
        vehicleId: trips.vehicleId,
        driverId: trips.driverId,
        odometerStart: trips.odometerStart,
        odometerEnd: trips.odometerEnd,
        locationStart: trips.locationStart,
        locationEnd: trips.locationEnd,
        checkInTime: trips.checkInTime,
        checkOutTime: trips.checkOutTime,
        driverName: usersTable.fullname,
        vehiclePlate: vehicles.plateNumber,
        vehicleMake: vehicles.make,
        vehicleModel: vehicles.model,
        fuelCost: fuelLogs.cost,
        receiptUrl: fuelLogs.receiptUrl,
      })
      .from(trips)
      .innerJoin(usersTable, eq(usersTable.id, trips.driverId))
      .innerJoin(vehicles, eq(vehicles.id, trips.vehicleId))
      .leftJoin(fuelLogs, eq(fuelLogs.tripId, trips.id))
      .where(and(isNotNull(trips.odometerEnd), isNotNull(trips.checkOutTime)));

    // If admin (not super-admin), filter by their entity
    if (role === "admin") {
      query = query.where(
        and(
          eq(vehicles.entityId, entityId),
          isNotNull(trips.odometerEnd),
          isNotNull(trips.checkOutTime)
        )
      );
    }

    const tripData = await query;

    res.json(tripData);
  } catch (err) {
    console.error("Failed to fetch completed trip logs:", err);
    res.status(500).json({ error: "Failed to fetch trip logs" });
  }
});




router.get("/drivers/utilization/summary", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const isSuperAdmin = user.role === "super_admin";
    const entityId = user.entityId;

    const thisMonth = new Date();
    thisMonth.setDate(1); // first day of month

    // Trip conditions
    const tripConditions = [gte(trips.checkInTime, thisMonth), isNotNull(trips.checkOutTime)];
    let totalDriversQuery = db.select({ count: sql`COUNT(DISTINCT ${drivers.id})` }).from(drivers);
    if (!isSuperAdmin && entityId) {
      tripConditions.push(eq(vehicles.entityId, entityId));
      totalDriversQuery.where(eq(drivers.entityId, entityId));
    }

    const totalDrivers = await totalDriversQuery;
    const totalTripsThisMonth = await db.select({ count: sql`COUNT(*)` })
      .from(trips)
      .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id))
      .where(and(...tripConditions));

    const avgTripsPerDriver = totalDrivers[0].count > 0 ? totalTripsThisMonth[0].count / totalDrivers[0].count : 0;

    res.json({
      totalActiveDrivers: totalDrivers[0].count,
      totalTrips: totalTripsThisMonth[0].count,
      avgTripsPerDriver: parseFloat(avgTripsPerDriver.toFixed(1)),
    });
  } catch (err) {
    console.error("Driver utilization summary error:", err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});



// router.get("/drivers/utilization/details", authenticate, async (req, res) => {
//   try {
//     const user = req.user; // from your auth middleware
//     const isSuperAdmin = user.role === "super_admin";
//     const entityId = user.entity_id;

//     const thisMonth = new Date();
//     thisMonth.setDate(1);

//     // Apply entity-based filtering
//     const baseConditions = [
//       gte(trips.checkInTime, thisMonth),
//       isNotNull(trips.checkOutTime),
//     ];

//     // Only add entity filter if not super admin
//     if (!isSuperAdmin && entityId) {
//       baseConditions.push(eq(trips.entityId, entityId));
//     }

//     const details = await db
//       .select({
//         driverId: trips.driverId,
//         name: usersTable.fullname,
//         trips: sql`COUNT(*)`,
//         hoursMs: sql`SUM(EXTRACT(EPOCH FROM (check_out_time - check_in_time)) * 1000)`,
//         distanceTotal: sql`SUM(odometer_end - odometer_start)`,
//       })
//       .from(trips)
//       .innerJoin(usersTable, eq(usersTable.id, trips.driverId))
//       .where(and(...baseConditions))
//       .groupBy(trips.driverId, usersTable.fullname);

//     const result = details.map((d) => ({
//       id: d.driverId,
//       name: d.name,
//       trips: Number(d.trips) || 0,
//       hours: Math.round((Number(d.hoursMs) || 0) / 3600000), // ms → hours
//       avgDistance:
//         d.trips > 0
//           ? `${Math.round((Number(d.distanceTotal) || 0) / d.trips)} km`
//           : "0 km",
//     }));

//     res.json(result);
//   } catch (err) {
//     console.error("Driver utilization details error:", err);
//     res.status(500).json({ error: "Failed to fetch driver utilization details" });
//   }
// });

// router.get("/drivers/utilization/details", authenticate, async (req, res) => {
//   try {
//     const user = req.user; // from your auth middleware
//     const isSuperAdmin = user.role === "super_admin";
//     const entityId = user.entity_id;

//     const thisMonth = new Date();
//     thisMonth.setDate(1); // first day of current month

//     // Base conditions: trips this month with check-out done
//     const baseConditions = [
//       gte(trips.checkInTime, thisMonth),
//       isNotNull(trips.checkOutTime),
//     ];

//     // Only add entity filter if not super admin
//     // Join drivers table to get their entityId
//     if (!isSuperAdmin && entityId) {
//       baseConditions.push(eq(drivers.entityId, entityId));
//     }

//     const details = await db
//       .select({
//         driverId: trips.driverId,
//         name: usersTable.fullname,
//         trips: sql`COUNT(*)`,
//         hoursMs: sql`SUM(EXTRACT(EPOCH FROM (check_out_time - check_in_time)) * 1000)`,
//         distanceTotal: sql`SUM(odometer_end - odometer_start)`,
//       })
//       .from(trips)
//       .innerJoin(usersTable, eq(usersTable.id, trips.driverId))
//       .innerJoin(drivers, eq(drivers.id, trips.driverId)) // join to apply entity filter
//       .where(and(...baseConditions))
//       .groupBy(trips.driverId, usersTable.fullname);

//     const result = details.map((d) => ({
//       id: d.driverId,
//       name: d.name,
//       trips: Number(d.trips) || 0,
//       hours: Math.round((Number(d.hoursMs) || 0) / 3600000), // ms → hours
//       avgDistance:
//         d.trips > 0
//           ? `${Math.round((Number(d.distanceTotal) || 0) / d.trips)} km`
//           : "0 km",
//     }));

//     res.json(result);
//   } catch (err) {
//     console.error("Driver utilization details error:", err);
//     res.status(500).json({ error: "Failed to fetch driver utilization details" });
//   }
// });

router.get("/drivers/utilization/details", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const isSuperAdmin = user.role === "super_admin";
    const entityId = user.entity_id;

    const thisMonth = new Date();
    thisMonth.setDate(1); // first day of current month

    // Base conditions
    const baseConditions = [
      gte(trips.checkInTime, thisMonth),
      isNotNull(trips.checkOutTime),
    ];

    // Build query
    let query = db
      .select({
        driverId: trips.driverId,
        name: usersTable.fullname,
        trips: sql`COUNT(*)`,
        hoursMs: sql`SUM(EXTRACT(EPOCH FROM (check_out_time - check_in_time)) * 1000)`,
        distanceTotal: sql`SUM(odometer_end - odometer_start)`,
      })
      .from(trips)
      .innerJoin(usersTable, eq(usersTable.id, trips.driverId))
      .innerJoin(drivers, eq(drivers.id, trips.driverId));

    // Entity filter (for non-super admins)
    if (!isSuperAdmin && entityId) {
      query = query.where(eq(drivers.entityId, entityId));
    }

    // Apply base conditions
    query = query.where(and(...baseConditions));

    // ✅ Correct groupBy fields
    query = query.groupBy(trips.driverId, usersTable.fullname);

    const details = await query;

    const result = details.map((d) => ({
      id: d.driverId,
      name: d.name,
      trips: Number(d.trips) || 0,
      hours: Math.round((Number(d.hoursMs) || 0) / 3600000), // convert ms → hours
      avgDistance:
        d.trips > 0
          ? `${Math.round((Number(d.distanceTotal) || 0) / d.trips)} km`
          : "0 km",
    }));

    res.json(result);
  } catch (err) {
    console.error("Driver utilization details error:", err);
    res.status(500).json({ error: "Failed to fetch driver utilization details" });
  }
});


router.get("/drivers/:id/recent-trips", async (req, res) => {
  const driverId = req.params.id;

  try {
    const tripsData = await db
      .select()
      .from(trips)
      .where(eq(trips.driverId, driverId))
      .orderBy(desc(trips.checkInTime))
      .limit(10);

    const formatted = tripsData.map(trip => ({
      date: trip.checkOutTime?.toISOString().split("T")[0] ?? "Ongoing",
      route: `${trip.locationStart} to ${trip.locationEnd ?? "—"}`,
      distance: trip.odometerStart && trip.odometerEnd ? `${trip.odometerEnd - trip.odometerStart} KM` : "—",
      duration:
        trip.checkInTime && trip.checkOutTime
          ? `${((new Date(trip.checkOutTime) - new Date(trip.checkInTime)) / 3600000).toFixed(1)} hrs`
          : "In progress",
      status: trip.checkOutTime ? "completed" : "in progress",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching recent trips:", err);
    res.status(500).json({ error: "Failed to get recent trips" });
  }
});


// GET /api/admin/fuel-utilization/summary
router.get("/fuel-utilization/summary", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const isSuperAdmin = user.role === "super_admin";
    const entityId = user.entityId;

    // Base query
    let query = db
      .select({
        totalLitres: sql`SUM(${fuelLogs.litres})`.mapWith(Number),
        totalCost: sql`SUM(${fuelLogs.cost})`.mapWith(Number),
        totalTrips: sql`COUNT(DISTINCT ${fuelLogs.tripId})`.mapWith(Number),
        totalDistance: sql`SUM(${trips.odometerEnd} - ${trips.odometerStart})`.mapWith(Number),
      })
      .from(fuelLogs)
      .leftJoin(trips, eq(fuelLogs.tripId, trips.id))
      .leftJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id));

    // Conditions
    const conditions = [isNotNull(fuelLogs.tripId)];
    if (!isSuperAdmin && entityId) conditions.push(eq(vehicles.entityId, entityId));

    query = query.where(and(...conditions));
    const result = await query;

    const { totalLitres = 0, totalCost = 0, totalTrips = 0, totalDistance = 0 } = result[0] || {};
    const avgLitresPerTrip = totalTrips ? (totalLitres / totalTrips).toFixed(1) : 0;
    const avgCostPerKm = totalDistance ? (totalCost / totalDistance).toFixed(2) : 0;

    res.json({ totalLitres, totalCost, avgLitresPerTrip, avgCostPerKm });
  } catch (err) {
    console.error("Fuel summary error:", err);
    res.status(500).json({ error: "Failed to fetch fuel summary" });
  }
});



// GET /api/admin/fuel-utilization/table
router.get("/fuel-utilization/table", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const isSuperAdmin = user.role === "super_admin";
    const entityId = user.entityId; // ✅ corrected from user.entity_id to user.entityId

    // Base condition: only fuel logs linked to trips
    const conditions = [isNotNull(fuelLogs.tripId)];

    // Apply entity filter if NOT super admin
    if (!isSuperAdmin && entityId) {
      conditions.push(eq(vehicles.entityId, entityId));
    }

    const result = await db
      .select({
        id: vehicles.id,
        vehicleReg: vehicles.plateNumber,
        entityName: entities.name,
        totalLitresUsed: sql`SUM(${fuelLogs.litres})`.as("totalLitresUsed"),
        fuelCost: sql`SUM(${fuelLogs.cost})`.as("fuelCost"),
        totalDistance: sql`SUM(${trips.odometerEnd} - ${trips.odometerStart})`.as("totalDistance"),
      })
      .from(fuelLogs)
      .leftJoin(trips, eq(fuelLogs.tripId, trips.id))
      .leftJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id))
      .leftJoin(entities, eq(vehicles.entityId, entities.id))
      .where(and(...conditions))
      .groupBy(vehicles.id, vehicles.plateNumber, entities.name); 

    // Map results with computed averages
    const tableData = result.map((r) => {
      const litres = Number(r.totalLitresUsed ?? 0);
      const distance = Number(r.totalDistance ?? 0);
      const cost = Number(r.fuelCost ?? 0);

      return {
        id: r.id,
        vehicleReg: r.vehicleReg,
        entityName: r.entityName,
        totalLitresUsed: `${litres.toFixed(1)} Litres`,
        avgKmPerLitre: litres > 0 ? `${(distance / litres).toFixed(1)} km/L` : "0 km/L",
        fuelCost: `E ${cost.toFixed(2)}`,
      };
    });

    res.json(tableData);
  } catch (err) {
    console.error("Fuel table error:", err);
    res.status(500).json({ error: "Failed to fetch fuel table" });
  }
});



// GET /api/admin/fuel-utilization/chart?groupBy=litres|hours
router.get("/fuel-utilization/chart", authenticate, async (req, res) => {
  const groupBy = req.query.groupBy === "hours" ? "hours" : "litres"; // default to litres

  try {
    const user = req.user;
    const isSuperAdmin = user.role === "super_admin";
    const entityId = user.entityId;

    // Base conditions
    const conditions = [
      isNotNull(fuelLogs.tripId),
      isNotNull(trips.checkOutTime),
    ];

    // Apply entity-based filtering for non–super admins
    if (!isSuperAdmin && entityId) {
      conditions.push(eq(vehicles.entityId, entityId)); // ✅ correct: filter by vehicle entity
    }

    const result = await db
      .select({
        month: sql`TO_CHAR(${fuelLogs.timestamp}, 'Mon')`.as("month"),
        year: sql`EXTRACT(YEAR FROM ${fuelLogs.timestamp})`.as("year"),
        total:
          groupBy === "litres"
            ? sql`SUM(${fuelLogs.litres})`.mapWith(Number)
            : sql`SUM(EXTRACT(EPOCH FROM (${trips.checkOutTime} - ${trips.checkInTime})) / 3600)::float`.mapWith(Number),
      })
      .from(fuelLogs)
      .leftJoin(trips, eq(fuelLogs.tripId, trips.id))
      .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id)) // ✅ join vehicles to filter by entity
      .where(and(...conditions))
      .groupBy(
        sql`TO_CHAR(${fuelLogs.timestamp}, 'Mon')`,
        sql`EXTRACT(YEAR FROM ${fuelLogs.timestamp})`
      )
      .orderBy(sql`MIN(${fuelLogs.timestamp})`);

    const formatted = result.map((row) => ({
      month: `${row.month} ${row.year}`,
      [groupBy]: Number(row.total?.toFixed(1) || 0),
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fuel chart error:", err);
    res.status(500).json({ error: "Failed to fetch fuel chart data" });
  }
});

// GET /api/admin/dashboard/driver-utilization


router.get("/dashboard/summary", authenticate, async (req, res) => {
  try {
    const user = req.user; 
    const isSuperAdmin = user.role === "super_admin";
    const entityId = user.entityId; // matches schema

    // Base filter for non-super admins: filter trips by vehicle's entity
    const entityFilter = !isSuperAdmin && entityId
      ? eq(vehicles.entityId, entityId)
      : undefined;

    // Total trips
    const totalTripsQuery = db
    .select({ count: sql`COUNT(*)` })
    .from(trips)
    .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id));

    if (entityFilter) totalTripsQuery.where(entityFilter);

    // Top driver
    const topDriverQuery = db
      .select({
        name: usersTable.fullname,
        trips: sql`COUNT(*)`,
      })
      .from(trips)
      .leftJoin(usersTable, eq(trips.driverId, usersTable.id))
      .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id))
      .groupBy(usersTable.fullname)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(1);
    if (entityFilter) topDriverQuery.where(entityFilter);

    // Top vehicle
    const topVehicleQuery = db
      .select({
        plate: vehicles.plateNumber,
        km: sql`SUM(${trips.odometerEnd} - ${trips.odometerStart})`,
      })
      .from(trips)
      .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id))
      .groupBy(vehicles.plateNumber)
      .orderBy(sql`SUM(${trips.odometerEnd} - ${trips.odometerStart}) DESC`)
      .limit(1);
    if (entityFilter) topVehicleQuery.where(entityFilter);

    // Trip distances
    const tripDistancesQuery = db
      .select({ totalKm: sql`SUM(${trips.odometerEnd} - ${trips.odometerStart})` })
      .from(trips)
      .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id));
    if (entityFilter) tripDistancesQuery.where(entityFilter);

    // Fuel data
    const fuelDataQuery = db
      .select({
        totalLitres: sql`SUM(${fuelLogs.litres})`,
        totalCost: sql`SUM(${fuelLogs.cost})`,
      })
      .from(fuelLogs)
      .leftJoin(trips, eq(fuelLogs.tripId, trips.id))
      .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id));
    if (entityFilter) fuelDataQuery.where(entityFilter);

    // Execute queries in parallel
    const [totalTrips, topDriver, topVehicle, tripDistances, fuelData] = await Promise.all([
      totalTripsQuery,
      topDriverQuery,
      topVehicleQuery,
      tripDistancesQuery,
      fuelDataQuery,
    ]);

    const totalKm = Number(tripDistances[0]?.totalKm || 0);
    const totalLitres = Number(fuelData[0]?.totalLitres || 0);
    const totalCost = Number(fuelData[0]?.totalCost || 0);

    const litresPer100Km = totalKm > 0 ? (totalLitres / totalKm) * 100 : 0;
    const costPerKm = totalKm > 0 ? totalCost / totalKm : 0;

    res.json({
      scope: isSuperAdmin ? "all entities" : `entity ${entityId}`,
      totalTrips: Number(totalTrips[0]?.count || 0),
      topDriver: topDriver[0]
        ? `${topDriver[0].name} (${topDriver[0].trips} trips)`
        : "No data",
      topVehicle: topVehicle[0]
        ? `${topVehicle[0].plate} (${topVehicle[0].km} km)`
        : "No data",
      litresPer100Km: litresPer100Km.toFixed(2),
      costPerKm: costPerKm.toFixed(2),
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
});


// router.get("/dashboard/driver-utilization", authenticate, async (req, res) => {
//   try {
//     const user = req.user;
//     const isSuperAdmin = user.role === "super_admin";
//     const entityId = user.entityId; // match schema

//     if (!["admin", "super_admin"].includes(user.role)) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const query = db
//       .select({
//         name: usersTable.fullname,
//         trips: sql`COUNT(*)`,
//       })
//       .from(trips)
//       .leftJoin(usersTable, eq(trips.driverId, usersTable.id))
//       .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id)) // join vehicles for entity filter
//       .groupBy(usersTable.fullname)
//       .orderBy(sql`COUNT(*) DESC`)
//       .limit(5);

//     // Apply entity filter via vehicles.entityId for non-super admins
//     if (!isSuperAdmin && entityId) {
//       query.where(eq(vehicles.entityId, entityId));
//     }

//     const result = await query;

//     res.json({
//       scope: isSuperAdmin ? "all entities" : `entity ${entityId}`,
//       topDrivers: result,
//     });
//   } catch (err) {
//     console.error("Driver utilization error:", err);
//     res.status(500).json({ message: "Failed to fetch driver utilization" });
//   }
// });

router.get("/dashboard/driver-utilization", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const isSuperAdmin = user.role === "super_admin";
    const entityId = user.entityId;

    if (!["admin", "super_admin"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    let query = db
      .select({
        driverId: usersTable.id,
        name: usersTable.fullname,
        totalDistance: sql`
          COALESCE(
            SUM(${trips.odometerEnd} - ${trips.odometerStart}), 
            0
          )::int
        `,
        tripCount: sql`COUNT(${trips.id})::int`,
      })
      .from(usersTable)
      .leftJoin(trips, eq(trips.driverId, usersTable.id))
      .where(
        and(
          eq(usersTable.role, 'driver'),
          isSuperAdmin || !entityId 
            ? undefined 
            : eq(usersTable.entityId, entityId)
        )
      )
      .groupBy(usersTable.id, usersTable.fullname)
      .orderBy(sql`SUM(${trips.odometerEnd} - ${trips.odometerStart}) DESC NULLS LAST`)
      .limit(5);

    const result = await query;

    res.json(result);
  } catch (err) {
    console.error("Driver utilization error:", err);
    res.status(500).json({ message: "Failed to fetch driver utilization" });
  }
});

router.get("/dashboard/vehicle-utilization", authenticate, async (req, res) => {
  try {
    const user = req.user; // JWT middleware sets req.user
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isSuperAdmin = user.role === "super_admin";
    const entityId = user.entityId;

    // Base query: trips joined with vehicles
    let query = db
      .select({
        name: vehicles.plateNumber,
        km: sql`SUM(${trips.odometerEnd} - ${trips.odometerStart})`,
      })
      .from(trips)
      .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id));

    // Apply entity filter for non-super-admins
    if (!isSuperAdmin && entityId) {
      query.where(eq(vehicles.entityId, entityId));
    }

    const result = await query
      .groupBy(vehicles.plateNumber)
      .orderBy(
        sql`SUM(${trips.odometerEnd} - ${trips.odometerStart}) DESC`
      )
      .limit(5);

    res.json(result);
  } catch (err) {
    console.error("Vehicle utilization error:", err);
    res.status(500).json({ message: "Failed to fetch vehicle utilization" });
  }
});


router.get("/me", authenticate, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
    res.json({ id: user.id, fullname: user.fullname, username: user.username });
  } catch (err) {
    console.error("Fetch user error:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});


/**
 * PUT /api/admin/settings
 * 
 * Description:  
 *  - Modify admin profile settings (username, fullname and password)
 * 
 * Request body: 
 * {
 *  "fullname": "string",
 *  "username": "string",
 *  "password": "string"
 * }
 * 
 * Responses:
 * 500 - Internal Server Error!
 */


router.put("/settings", authenticate, async (req, res) => {
  const { fullname, username, password } = req.body;

  try {
    const updated = await db
      .update(usersTable)
      .set({
        fullname,
        username,
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      })
      .where(eq(usersTable.id, req.user.id))
      .returning();

    res.json({ message: "Profile updated", user: updated[0] });
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});



router.get("/supervisor-assignments", authenticate, async (req, res) => {
  try {
    const { role, entityId } = req.user;

    let supervisorIds = [];

    // If the user is an admin, restrict supervisors to their entity
    if (role === "admin") {
      const supervisorsInEntity = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(and(eq(usersTable.role, "supervisor"), eq(usersTable.entityId, entityId)));

      supervisorIds = supervisorsInEntity.map((s) => s.id);

      if (supervisorIds.length === 0) {
        return res.json([]); // No supervisors for this entity
      }
    }

    // Build base query
    let query = db
      .select({
        id: supervisions.id,
        supervisorId: supervisions.supervisorId,
        supervisorName: sql`(SELECT fullname FROM users WHERE id = ${supervisions.supervisorId})`,
        driverId: supervisions.driverId,
        driverName: sql`(SELECT fullname FROM users WHERE id = ${supervisions.driverId})`,
        createdAt: supervisions.createdAt,
      })
      .from(supervisions);

    // Apply filter for admin
    if (role === "admin") {
      query = query.where(inArray(supervisions.supervisorId, supervisorIds));
    }

    // Execute the query
    const assignments = await query;

    res.json(assignments);
  } catch (err) {
    console.error("Error fetching supervisor assignments:", err);
    res.status(500).json({ message: "Failed to fetch supervisor assignments" });
  }
});


// POST /api/admin/supervisor-assignments
router.post("/supervisor-assignments", async (req, res) => {
  const { supervisorId, driverId } = req.body;

  if (!supervisorId || !driverId) {
    return res.status(400).json({ message: "Supervisor ID and Driver ID are required" });
  }

  try {
    // Verify supervisor exists
    const supervisor = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, supervisorId), eq(usersTable.role, "supervisor")))
      .limit(1);

    // Verify driver exists
    const driver = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, driverId), eq(usersTable.role, "driver")))
      .limit(1);

    if (!supervisor.length || !driver.length) {
      return res.status(400).json({ message: "Invalid supervisor or driver ID" });
    }

    // Check if assignment already exists
    const existing = await db
      .select()
      .from(supervisions)
      .where(and(eq(supervisions.supervisorId, supervisorId), eq(supervisions.driverId, driverId)))
      .limit(1);

    if (existing.length) {
      return res.status(400).json({ message: "This driver is already assigned to this supervisor" });
    }

    const [newAssignment] = await db
      .insert(supervisions)
      .values({ supervisorId, driverId })
      .returning();

    res.status(201).json(newAssignment);
  } catch (err) {
    console.error("Error creating supervisor assignment:", err);
    res.status(500).json({ message: "Failed to create supervisor assignment" });
  }
});


// DELETE /api/admin/supervisor-assignments/:id
router.delete("/supervisor-assignments/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [deleted] = await db
      .delete(supervisions)
      .where(eq(supervisions.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({ message: "Assignment deleted successfully" });
  } catch (err) {
    console.error("Error deleting supervisor assignment:", err);
    res.status(500).json({ message: "Failed to delete supervisor assignment" });
  }
});


// GET all supervisors
router.get("/supervisors", async (req, res) => {
  try {
    const data = await db
      .select({
        id: supervisors.id,
        fullname: usersTable.fullname,
        username: usersTable.username,
        phoneNumber: supervisors.phoneNumber,
        entityId: supervisors.entityId,
      })
      .from(supervisors)
      .leftJoin(usersTable, eq(supervisors.userId, usersTable.id));

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch supervisors" });
  }
});

// GET entities for dropdown
// router.get("/supervisors/entities", async (req, res) => {
//   try {
//     const data = await db.select().from(entities);
//     res.json(data);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch entities" });
//   }
// });

router.get("/supervisors/entities", authenticate, async (req, res) => {
  try {
    const { role, entityId } = req.user;

    let query = db.select().from(entities);

    // Admins see only their entity
    if (role === "admin") {
      query = query.where(eq(entities.id, entityId));
    }

    // Super admins see all entities
    const data = await query;

    res.json(data);
  } catch (error) {
    console.error("Error fetching entities:", error);
    res.status(500).json({ message: "Failed to fetch entities" });
  }
});

router.post("/supervisors", async (req, res) => {
  console.log("\nIncoming POST /supervisors request");
  console.log("Request body:", req.body);

  const { fullname, username, password, phoneNumber, region, entityId } = req.body;

  try {
    console.log("Step 1: Checking if username already exists...");
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(sql`LOWER(${usersTable.username})`, username.toLowerCase()))
      .limit(1);

    console.log("Existing user check result:", existing);

    if (existing.length > 0) {
      console.log("Username already exists:", username);
      return res.status(400).json({ message: "Username already exists" });
    }

    console.log("Step 2: Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");

    console.log("Step 3: Starting database transaction...");
    const result = await db.transaction(async (tx) => {
      console.log("Inserting into usersTable...");
      const [newUser] = await tx
        .insert(usersTable)
        .values({
          fullname,
          username,
          password: hashedPassword,
          role: "supervisor",
        })
        .returning({ id: usersTable.id });

      console.log("User inserted:", newUser);

      console.log("Inserting into supervisors table...");
      await tx.insert(supervisors).values({
        id: newUser.id,
        phone: phoneNumber,
        region,
        assignedEntityId: entityId,
      });

      console.log("Supervisor inserted successfully");
      return newUser;
    });

    console.log("Step 4: Transaction complete. New supervisor ID:", result.id);
    res.json({
      message: "Supervisor created successfully",
      id: result.id,
    });
  } catch (error) {
    console.error("Failed to create supervisor:", error);
    res.status(500).json({ message: "Failed to create supervisor" });
  }
});


// DELETE supervisor
router.delete("/supervisors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(supervisors).where(eq(supervisors.id, id));
    res.json({ message: "Supervisor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete supervisor" });
  }
});

export default router;
