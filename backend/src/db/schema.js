import { pgTable, serial, text, uuid, timestamp, varchar, ForeignKey, integer, boolean, real } from 'drizzle-orm/pg-core';

// USERS TABLE
export const usersTable = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    fullname: text('fullname').notNull(),
    username: text('username').notNull().unique(),
    password: text('password').notNull(),
    role: text('role').notNull().default('driver'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const entitiesTable = pgTable('entities', {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const drivers = pgTable("drivers", {
  id: uuid("id").primaryKey().references(() => usersTable.id), // same as user ID
  contact: text("contact").notNull(),
  entityId: uuid("entity_id").references(() => entitiesTable.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// vehicles
export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  plateNumber: varchar("plate_number", { length: 20 }).notNull().unique(),
  model: text("model").notNull(),
  make: text("make").notNull(),
  status: text("status").notNull().default("available"), // e.g., available, in-use, maintenance
  plantNumber: text('plant_number'),
  entityId: uuid("entity_id").references(() => entitiesTable.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// assignments
// 4. ASSIGNMENTS
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => usersTable.id),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  permanent: boolean("permanent").default(false),
});


// trips
export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id),
  driverId: uuid("driver_id").references(() => usersTable.id),
  odometerStart: integer("odometer_start"),
  odometerEnd: integer("odometer_end"),
  locationStart: text("location_start"),
  locationEnd: text("location_end"),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
});

// FUEL LOGS
export const fuelLogs = pgTable("fuel_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id),
  litres: real("litres").notNull(),  
  cost: real("cost").notNull(),
  odometer: integer("odometer").notNull(),
  location: text("location").notNull(),
  paymentReference: text("payment_reference").notNull(), // e.g., transaction ID
  receiptUrl: text("receipt_url"),
  loggedBy: uuid("logged_by").references(() => usersTable.id),
  tripId: uuid("trip_id").references(() => trips.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

// SUPERVISIONS
export const supervisions = pgTable("supervisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  supervisorId: uuid("supervisor_id").references(() => usersTable.id),
  driverId: uuid("driver_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// SUPERVISORS
export const supervisors = pgTable("supervisors", {
  id: uuid("id").primaryKey().references(() => usersTable.id), // same as user ID
  phone: text("phone").notNull(),
  region: text("region"), // optional: region or zone they oversee
  assignedEntityId: uuid("entity_id").references(() => entitiesTable.id), // optional: who they work for
  createdAt: timestamp("created_at").defaultNow(),
});

export const checkins = pgTable("checkins", {
  id: uuid("id").primaryKey().defaultRandom(),

  vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id),
  driverId: uuid("driver_id").notNull().references(() => usersTable.id),

  performedById: uuid("performed_by_id").notNull().references(() => usersTable.id),
  performedByRole: text("performed_by_role").notNull(), // "driver" or "supervisor"

  startOdometer: integer("start_odometer").notNull(),
  startLocation: text("start_location").notNull(),
  tripPurpose: text("trip_purpose").notNull(),

  checkedInAt: timestamp("checked_in_at").defaultNow(),
});


export const checkouts = pgTable("checkouts", {
  id: uuid("id").primaryKey().defaultRandom(),

  vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id),
  driverId: uuid("driver_id").notNull().references(() => usersTable.id),

  performedById: uuid("performed_by_id").notNull().references(() => usersTable.id),
  performedByRole: text("performed_by_role").notNull(), // "driver" or "supervisor"

  endOdometer: integer("end_odometer"),
  endLocation: text("end_location").notNull(),

  checkedOutAt: timestamp("checked_out_at").defaultNow(),
});
