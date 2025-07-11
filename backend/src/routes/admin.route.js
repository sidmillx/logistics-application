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
import { and, eq, isNotNull, sql, gte, lte, desc  } from "drizzle-orm";
import bcrypt from "bcryptjs";


const router = express.Router();

// router.use(authenticate, authorize("admin")); REAPPLY THIS LATER, !!!! VERY IMPORTANT !!!

// DRIVERS
router.post("/drivers/add", async (req, res) => {
    const { fullName, username, password, contact, entityId } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const existing = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, username));

        if (existing.length > 0) {
        return res.status(400).json({ error: "Username already taken" });
        }


        const [user] = await db.insert(usersTable).values({
            username,
            password: hashedPassword,
            fullname: fullName,
            role: "driver"
        }).returning();

        await db.insert(drivers).values({
            id: user.id,
            entityId,
            contact
        });

        res.status(201).json({ message: "Driver added successfully", user });
    
    } catch (err) {
        console.error("Error adding driver:", err);
        res.status(500).json({ error: "Failed to add driver" });
    }
})

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
      const inUse = relatedVehicles.filter((v) => v.status === "In Use").length;
      const available = relatedVehicles.filter((v) => v.status === "Available").length;
      const maintenance = relatedVehicles.filter((v) => v.status === "Under Maintenance").length;

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
    const inUse = vehicles.filter(v => v.status === "In Use").length;
    const available = vehicles.filter(v => v.status === "Available").length;
    const maintenance = vehicles.filter(v => v.status === "Under Maintenance").length;

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
    const available = allVehicles.filter(v => v.status === "Available").length;

    res.json({
        totalVehicles,
        totalEntities,
        availableVehicles: available,
    });
})




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


router.delete("/entities/:id", async (req, res) => {
  try {
    await db.delete(entities).where(eq(entities.id, req.params.id));
    res.json({ message: "Entity deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete entity" });
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



    const results = await db
      .select({
        id: drivers.id,
        name: usersTable.fullname,
        contact: drivers.contact,
        entityName: entities.name,
      })
      .from(drivers)
      .leftJoin(usersTable, eq(drivers.id, usersTable.id))
      .leftJoin(entities, eq(drivers.entityId, entities.id));

    res.json(results);
  } catch (err) {
    console.error("Failed to fetch drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});


// Assume you have a `drivers` and `trips` table in your schema
router.get("/drivers/summary", async (req, res) => {
  try {
    // Fetch all drivers
    const allDrivers = await db.select().from(drivers);

    const totalDrivers = allDrivers.length;
    // const activeDrivers = allDrivers.filter(driver => driver.status === "In Use").length;
    const activeDrivers = 7; // Placeholder, replace with actual logic

    // TRIPS
    // const allTrips = await db.select().from(trips);

    // const tripCountsByDriver = {};
    // allTrips.forEach((trip) => {
    //   if (!tripCountsByDriver[trip.driverId]) {
    //     tripCountsByDriver[trip.driverId] = 0;
    //   }
    //   tripCountsByDriver[trip.driverId]++;
    // });

    // const avgTripsPerDriver = totalDrivers > 0
    //   ? (allTrips.length / totalDrivers).toFixed(2)
    //   : 0;

    res.json({
      totalDrivers,
      activeDrivers,
      // avgTripsPerDriver: Number(avgTripsPerDriver),
      avgTripsPerDriver: 5
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
        fullname: usersTable.fullname,
        fuelCost: fuelLogs.cost,
        receiptUrl: fuelLogs.receiptUrl,
      })
      .from(trips)
      .innerJoin(usersTable, eq(usersTable.id, trips.driverId))
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

    const totalDrivers = await db.select({ count: sql`count(distinct(${trips.driverId}))` }).from(trips);

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
      id: user.id,
      name: user.fullname,
      company: "Inyatsi", // Optional: Lookup from entity table
      phone: driver.contact,
      totalTrips,
      hoursLogged: hoursLogged.toFixed(1),
      avgDistance: `${avgDistance} KM`
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
        vehicleReg: vehicles.registrationNumber,
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
        totalLitresUsed: `${litres} L`,
        avgKmPerLitre: litres > 0 ? `${(distance / litres).toFixed(1)} km` : "0 km",
        fuelCost: `E${cost.toFixed(2)}`
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






export default router;
