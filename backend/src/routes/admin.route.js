// src/routes/admin.routes.js
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
  vehicles
} from "../db/schema.js";
import { and, eq, isNotNull, sql, gte, lte, desc, isNull  } from "drizzle-orm";
import bcrypt from "bcryptjs";


const router = express.Router();

// router.use(authenticate, authorize("admin")); REAPPLY THIS LATER, !!!! VERY IMPORTANT !!!

// DRIVERS
// src/routes/admin.route.js (or equivalent)


router.post('/drivers/add', async (req, res) => {
  const { fullname, username, password, contact, entityId } = req.body; // Match frontend payload

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
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into users table
    const [user] = await db
      .insert(usersTable)
      .values({
        username: username.trim(),
        password: hashedPassword,
        fullname: fullname.trim(), // Ensure non-null and trimmed
        role: "driver",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    // Insert into drivers table
    await db.insert(drivers).values({
      id: user.id, // Assuming id is the foreign key linking users and drivers
      entityId,
      contact: contact.trim(),
    });

    res.status(201).json({ message: "Driver added successfully", user });
  } catch (err) {
    console.error("Error adding driver:", err);
    res.status(500).json({ error: "Failed to add driver" });
  }
});
// ==== USERS ====
router.get("/users", async (req, res) => {
  try {
    const allUsers = await db.select().from(usersTable);
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const result = await db.select().from(users).where(eq(users.id, req.params.id));
    if (!result.length) return res.status(404).json({ error: "User not found" });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ==== ENTITIES ====
// GET: Overview of entities and vehicles
router.get("/entities/overview", async (req, res) => {
  try {
    const entitiesData = await db.select().from(entities);
    const vehiclesData = await db.select().from(vehicles);

    console.log(entitiesData);
    console.log(vehiclesData);

    const entitySummaries = entitiesData.map((entity) => {
      const relatedVehicles = vehiclesData.filter(
        (v) => v.entityId === entity.id
      );

      const total = relatedVehicles.length;
      const inUse = relatedVehicles.filter((v) => v.status === "in-use").length;
      const available = relatedVehicles.filter((v) => v.status === "available").length;
      const maintenance = relatedVehicles.filter((v) => v.status === "maintenance").length;

      return {
        id: entity.id,
        name: entity.name,
        totalVehicles: total,
        vehiclesInUse: inUse,
        vehiclesAvailable: available,
        underMaintenance: maintenance,
      };
    });

    // Get totals across all entities
    const totalVehicles = vehiclesData.length;
    const totalEntities = entitiesData.length;
    const totalAvailable = vehiclesData.filter(v => v.status === "Available").length;

    res.json({
      entitySummaries,
      totalVehicles,
      totalEntities,
      totalAvailable,
    });

    // res.json([{ name: "Test Entity", totalVehicles: 10, vehiclesInUse: 5, vehiclesAvailable: 3, underMaintenance: 2 }]);
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


router.get("/entities/:id", async (req, res) => {
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

router.post("/vehicles", async (req, res) => {
  const { plateNumber, model, make, status, entityId } = req.body;

  if (!plateNumber || !model || !make || !status || !entityId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [vehicle] = await db
      .insert(vehicles)
      .values({ plateNumber, model, make, status, entityId })
      .returning();

    res.status(201).json(vehicle);
  } catch (err) {
    console.error("Error creating vehicle:", err);
    res.status(500).json({ error: "Failed to create vehicle" });
  }
});


router.post("/entities", async (req, res) => {
  try {
    const [newEntity] = await db.insert(entities).values(req.body).returning();
    res.status(201).json(newEntity);
  } catch (err) {
    res.status(500).json({ error: "Failed to create entity" });
  }
});

router.put("/entities/:id", async (req, res) => {
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



// GET /api/admin/drivers
router.get("/drivers", async (req, res) => {
  try {
    // First get all active driver IDs (those currently on trips)
    const activeDriverResults = await db
      .select({ 
        driverId: trips.driverId 
      })
      .from(trips)
      .where(
        and(
          isNotNull(trips.checkInTime),
          isNull(trips.checkOutTime)
        )
      )
      .groupBy(trips.driverId);

    const activeDriverIds = activeDriverResults.map(d => d.driverId);

    // Then get all drivers with their details
    const allDrivers = await db
      .select({
        id: drivers.id,
        name: usersTable.fullname,
        contact: drivers.contact,
        entityName: entities.name,
      })
      .from(drivers)
      .leftJoin(usersTable, eq(drivers.id, usersTable.id))
      .leftJoin(entities, eq(drivers.entityId, entities.id));

    // Augment each driver with active status
    const results = allDrivers.map(driver => ({
      ...driver,
      isActive: activeDriverIds.includes(driver.id)
    }));

    res.json(results);
  } catch (err) {
    console.error("Failed to fetch drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// Assume you have a `drivers` and `trips` table in your schema
router.get("/drivers/summary", async (req, res) => {
  try {
    // Get active drivers (currently on trips)
    const activeDrivers = await db
      .select({ 
        driverId: trips.driverId 
      })
      .from(trips)
      .where(
        and(
          isNotNull(trips.checkInTime),
          isNull(trips.checkOutTime)
        )
      )
      .groupBy(trips.driverId);

    // Get total driver count
    const totalDrivers = await db
      .select({ count: sql`count(*)` })
      .from(drivers);

    // Get trip statistics - FIXED VERSION
    const tripStats = await db
      .select({
        totalTrips: sql`count(*)`,
        avgTrips: sql`ROUND(avg(count)::numeric, 1)`
      })
      .from(
        db
          .select({
            driverId: trips.driverId,
            count: sql`count(*)`.mapWith(Number)
          })
          .from(trips)
          .groupBy(trips.driverId)
          .as("driver_trips")
      );

    res.json({
      totalDrivers: Number(totalDrivers[0].count),
      activeDrivers: activeDrivers.length,
      avgTripsPerDriver: tripStats[0].avgTrips || 0,
      totalTrips: tripStats[0].totalTrips || 0
    });
  } catch (err) {
    console.error("Failed to load driver summary:", err);
    res.status(500).json({ error: "Failed to fetch driver summary" });
  }
});
// GET /api/admin/vehicles
router.get("/vehicles", async (req, res) => {
  try {
    const results = await db
      .select({
        id: vehicles.id,
        plateNumber: vehicles.plateNumber,
        make: vehicles.make,
        model: vehicles.model,
        status: vehicles.status,
        entityId: vehicles.entityId,
        createdAt: vehicles.createdAt,
      })
      .from(vehicles);
    
    res.json(results);
  } catch (err) {
    console.error("Failed to fetch vehicles:", err);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

router.get("/vehicles/summary", async (req, res) => {
  try {
    const all = await db.select().from(vehicles);
    const totalVehicles = all.length;
    const available = all.filter(v => v.status === "available").length || 0;
    const inUse = all.filter(v => v.status === "in-use").length || 0;

    // TODO: Replace with actual logic for fuel logged today
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
  const { plateNumber, make, model, status } = req.body;

  try {
    await db
      .update(vehicles)
      .set({ plateNumber, make, model, status })
      .where(eq(vehicles.id, id));
    res.json({ message: "Vehicle updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update vehicle" });
  }
});

// src/routes/admin.route.js (or equivalent)

// src/routes/admin.route.

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


// DELETE a driver by ID
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


router.delete("/entities/:id", async (req, res) => {
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

    res.json(logs); // ✅ Send array directly
  } catch (error) {
    console.error("Error fetching fuel logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/trips/logs", async (req, res) => {
  try {
    const tripData = await db
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
      .where(
        and(
          isNotNull(trips.odometerEnd),
          isNotNull(trips.checkOutTime)
        )
      );

    res.json(tripData);
  } catch (err) {
    console.error("Failed to fetch completed trip logs:", err);
    res.status(500).json({ error: "Failed to fetch trip logs" });
  }
});


router.get("/drivers/utilization/summary", async (req, res) => {
  try {
    const thisMonth = new Date();
    thisMonth.setDate(1); // first day of current month

    const totalDrivers = await db.select({ count: sql`count(distinct(${drivers.id}))` }).from(drivers);

    const totalTripsThisMonth = await db.select({ count: sql`count(*)` })
      .from(trips)
      .where(
  and(
    gte(trips.checkInTime, thisMonth),
    isNotNull(trips.checkOutTime)
  )
);

    const avgTripsPerDriver = totalTripsThisMonth[0].count / totalDrivers[0].count;

    res.json({
      totalActiveDrivers: totalDrivers[0].count,
      totalTrips: totalTripsThisMonth[0].count,
      avgTripsPerDriver: parseFloat(avgTripsPerDriver.toFixed(1)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});


router.get("/drivers/utilization/details", async (req, res) => {
  try {
    const thisMonth = new Date();
    thisMonth.setDate(1);

    const details = await db.select({
      driverId: trips.driverId,
      name: usersTable.fullname,
      trips: sql`count(*)`,
      hoursMs: sql`SUM(
        EXTRACT(EPOCH FROM (check_out_time - check_in_time)) * 1000
      )`,
      distanceTotal: sql`SUM(odometer_end - odometer_start)`
    })
    .from(trips)
    .innerJoin(usersTable, eq(usersTable.id, trips.driverId))
    .where(
  and(
    gte(trips.checkInTime, thisMonth),
    isNotNull(trips.checkOutTime)
  )
)
    .groupBy(trips.driverId, usersTable.fullname);

    const result = details.map(d => ({
      id: d.driverId,
      name: d.name,
      trips: d.trips,
      hours: Math.round(d.hoursMs / (3600000)), // ms to hours
      avgDistance: `${Math.round(d.distanceTotal / d.trips)} km`
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch details" });
  }
});


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
router.get("/fuel-utilization/summary", async (req, res) => {
  try {
    const result = await db.select({
      totalLitres: sql`SUM(${fuelLogs.litres})`.mapWith(Number),
      totalCost: sql`SUM(${fuelLogs.cost})`.mapWith(Number),
      totalTrips: sql`COUNT(DISTINCT ${fuelLogs.tripId})`.mapWith(Number),
      totalDistance: sql`SUM(${trips.odometerEnd} - ${trips.odometerStart})`.mapWith(Number),
    })
    .from(fuelLogs)
    .leftJoin(trips, eq(fuelLogs.tripId, trips.id))
    .where(isNotNull(fuelLogs.tripId));

    const { totalLitres, totalCost, totalTrips, totalDistance } = result[0];

    const avgLitresPerTrip = totalTrips ? (totalLitres / totalTrips).toFixed(1) : 0;
    const avgCostPerKm = totalDistance ? (totalCost / totalDistance).toFixed(2) : 0;

    res.json({
      totalLitres,
      totalCost,
      avgLitresPerTrip,
      avgCostPerKm
    });
  } catch (err) {
    console.error("Fuel summary error:", err);
    res.status(500).json({ error: "Failed to fetch fuel summary" });
  }
});



// GET /api/admin/fuel-utilization/table
router.get("/fuel-utilization/table", async (req, res) => {
  try {
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
      .leftJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id))
      .leftJoin(trips, eq(fuelLogs.tripId, trips.id))
      .leftJoin(entities, eq(vehicles.entityId, entities.id))
      .where(isNotNull(fuelLogs.tripId))
      .groupBy(vehicles.id, entities.name);

    // Parse raw string numbers to Number
    const tableData = result.map(r => {
      const litres = Number(r.totalLitresUsed ?? 0);
      const distance = Number(r.totalDistance ?? 0);
      const cost = Number(r.fuelCost ?? 0);

      return {
        id: r.id,
        vehicleReg: r.vehicleReg,
        entityName: r.entityName,
        totalLitresUsed: `${litres} Litres`,
        avgKmPerLitre: litres > 0 ? `${(distance / litres).toFixed(1)} km` : "0 km",
        fuelCost: `E ${cost.toFixed(2)}`
      };
    });

    res.json(tableData);
  } catch (err) {
    console.error("Fuel table error:", err);
    res.status(500).json({ error: "Failed to fetch fuel table" });
  }
});


// GET /api/admin/fuel-utilization/chart?groupBy=litres|hours
router.get("/fuel-utilization/chart", async (req, res) => {
  const groupBy = req.query.groupBy === "hours" ? "hours" : "litres"; // default to litres

  try {
    const result = await db
      .select({
        month: sql`TO_CHAR(${fuelLogs.timestamp}, 'Mon')`,
        year: sql`EXTRACT(YEAR FROM ${fuelLogs.timestamp})`,
        total: groupBy === "litres"
          ? sql`SUM(${fuelLogs.litres})`.mapWith(Number)
          : sql`SUM(EXTRACT(EPOCH FROM (${trips.checkOutTime} - ${trips.checkInTime})) / 3600)::float`.mapWith(Number)
      })
      .from(fuelLogs)
      .leftJoin(trips, eq(fuelLogs.tripId, trips.id))
      .where(and(
        isNotNull(fuelLogs.tripId),
        isNotNull(trips.checkOutTime)
      ))
      .groupBy(sql`TO_CHAR(${fuelLogs.timestamp}, 'Mon')`, sql`EXTRACT(YEAR FROM ${fuelLogs.timestamp})`)
      .orderBy(sql`MIN(${fuelLogs.timestamp})`);

    const formatted = result.map(row => ({
      month: row.month,
      [groupBy]: Number(row.total.toFixed(1))
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fuel chart error:", err);
    res.status(500).json({ error: "Failed to fetch fuel chart data" });
  }
});




router.get("/dashboard/summary", async (req, res) => {
  try {
    // Basic stats and aggregations
    const [totalTrips, topDriver, topVehicle, tripDistances, fuelData] = await Promise.all([
      db.select({ count: sql`COUNT(*)` }).from(trips),
      db
        .select({ name: usersTable.fullname, trips: sql`COUNT(*)` })
        .from(trips)
        .leftJoin(usersTable, eq(trips.driverId, usersTable.id))
        .groupBy(usersTable.fullname)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(1),
      db
        .select({ plate: vehicles.plateNumber, km: sql`SUM("trips"."odometer_end" - "trips"."odometer_start")` })
        .from(trips)
        .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id))
        .groupBy(vehicles.plateNumber)
        .orderBy(sql`SUM("trips"."odometer_end" - "trips"."odometer_start") DESC`)
        .limit(1),

      // Sum total km traveled for all trips
      db.select({
        totalKm: sql`SUM("odometer_end" - "odometer_start")`
      }).from(trips),

      // Sum total litres and total cost from fuel logs
      db.select({
        totalLitres: sql`SUM(litres)`,
        totalCost: sql`SUM(cost)`
      }).from(fuelLogs),
    ]);

    // Extract total km, litres and cost safely
    const totalKm = Number(tripDistances[0]?.totalKm || 0);
    const totalLitres = Number(fuelData[0]?.totalLitres || 0);
    const totalCost = Number(fuelData[0]?.totalCost || 0);

    // Calculate fuel efficiency (litres per 100 km)
    const litresPer100Km = totalKm > 0 ? (totalLitres / totalKm) * 100 : 0;

    // Calculate cost per km
    const costPerKm = totalKm > 0 ? (totalCost / totalKm) : 0;

    res.json({
      totalTrips: Number(totalTrips[0].count),
      topDriver: topDriver[0]?.name + ` (${topDriver[0]?.trips} trips)`,
      topVehicle: topVehicle[0]?.plate + ` (${topVehicle[0]?.km} km)`,
      litresPer100Km: litresPer100Km.toFixed(2),
      costPerKm: costPerKm.toFixed(2),
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
});


// GET /api/admin/dashboard/driver-utilization
router.get("/dashboard/driver-utilization", async (req, res) => {
  try {
    const result = await db
      .select({ name: usersTable.fullname, trips: sql`COUNT(*)` })
      .from(trips)
      .leftJoin(usersTable, eq(trips.driverId, usersTable.id))
      .groupBy(usersTable.fullname)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5);
    res.json(result);
  } catch (err) {
    console.error("Driver utilization error:", err);
    res.status(500).json({ message: "Failed to fetch driver utilization" });
  }
});


// GET /api/admin/dashboard/vehicle-utilization
router.get("/dashboard/vehicle-utilization", async (req, res) => {
  try {
    const result = await db
      .select({ name: vehicles.plateNumber, km: sql`SUM("trips"."odometer_end" - "trips"."odometer_start")` })
      .from(trips)
      .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id))
      .groupBy(vehicles.plateNumber)
      .orderBy(sql`SUM("trips"."odometer_end" - "trips"."odometer_start") DESC`)
      .limit(5);

    res.json(result);
  } catch (err) {
    console.error("Vehicle utilization error:", err);
    res.status(500).json({ message: "Failed to fetch vehicle utilization" });
  }
});

// src/routes/admin.route.ts (or similar)
router.get("/users", async (req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      fullname: usersTable.fullname,
      username: usersTable.username,
      role: usersTable.role,
    }).from(usersTable);

    res.json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});



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

router.get("/me", authenticate, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
    res.json({ id: user.id, fullname: user.fullname, username: user.username });
  } catch (err) {
    console.error("Fetch user error:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

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





export default router;
