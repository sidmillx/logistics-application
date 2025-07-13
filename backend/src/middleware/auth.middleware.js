import jwt from "jsonwebtoken";
import { ENV } from '../config/env.js';

const JWT_SECRET = ENV.JWT_SECRET;

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("JWT verification error:", error);
        return res.status(401).json({ error: "Invalid token" });
    }
};

export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role || !allowedRoles.includes(req.user.role)) {
            console.log(`Required role: ${allowedRoles.join(', ')}, User role: ${req.user ? req.user.role : 'None'}`);
            console.error("Access denied for user:", req.user);
            return res.status(403).json({ error: "Access Denied" });
        }
        next(); // User is authorized, proceed to the next middleware or route handler
    }
}