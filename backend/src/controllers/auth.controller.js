// src/controllers/authController.ts
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { usersTable } from "../db/schema.js";
import { ENV } from '../config/env.js';


export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.select().from(usersTable).where(eq(usersTable.username, username));

    if (result.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }


    const token = jwt.sign({ id: user.id, role: user.role, entityId: user.entityId }, ENV.JWT_SECRET, {
      expiresIn: "3d",
    });

    // console.log(`Debug user details: ${user.id}, ${user.role}, ${user.entityId}`)

    const { password: _, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
