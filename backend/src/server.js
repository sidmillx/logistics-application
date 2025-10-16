import express from 'express'; 
import { ENV } from './config/env.js';
import {db} from './config/db.js';
import { entitiesTable } from './db/schema.js';
import cors from 'cors';
import path from "path";

import authRoutes from "./routes/auth.route.js";
import adminRoutes from "./routes/admin.route.js";
import mobileRoutes from "./routes/mobile.route.js";
import uploadRoutes from "./routes/upload.js";

const app = express();

app.use(express.json());

app.use(cors({}));

// app.use(cors({}))
const PORT = ENV.PORT || 5000;

// Serve images statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
}));

// Register upload route
app.use("/api/upload", uploadRoutes);

// TEST ROUTES
app.get('/api/health', (req, res) => {
    res.status(200).json({success: true})
});

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await db.select().from(schema.usersTable).limit(1);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("DB test failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});



app.post('/api/entities/add', async (req, res) => {
    try {
        const { name, description } = req.body;
        if(!name || !description) {
            return res.status(400).json({ error: 'Missing all required fields' });
        }

        const newEntity = await db.insert(entitiesTable).values({
            name: name,
            description

        }).returning();
        res.status(201).json( newEntity[0] );
    } catch (error) {
        console.log("Error creating entity:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add driver route
app.post('/api/drivers/add', async (req, res) => {
    try {
        const { licenseNumber, phone, address, emergencyContact, entityId } = req.body;
        if(!licenseNumber || !phone || !address || !emergencyContact || !entityId) {
            return res.status(400).json({ error: 'Missing all required fields' });
        }

        const newDriver = await db.insert(drivers).values({
            licenseNumber,
            phone,
            address,
            emergencyContact,
            entityId
        }).returning();
        res.status(201).json(newDriver[0]);
    } catch (error) {
        console.log("Error creating driver:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


import reportRoutes from "./routes/reports.route.js";


app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/mobile", mobileRoutes);
app.use("/api/admin/reports", reportRoutes);
app.use("/api/upload", uploadRoutes);


app.listen(PORT, () => {
    console.log("Listening on PORT:", PORT);
});


// NODEJS -> EXPRESSJS
// REACT NATIVE -> EXPO

// DB -> POSTGRESS -> DRIZZLE ORM