import express from "express";
import driversRoutes from "./drivers.routes.js";

const router = express.Router();

router.use("/drivers", driversRoutes);