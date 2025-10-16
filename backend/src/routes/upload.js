import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ✅ Create uploads folder if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Configure multer storage - FIXED FILENAME
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Get original extension and preserve it
    const originalName = file.originalname;
    const ext = path.extname(originalName) || '.jpg'; // Fallback to .jpg if no extension
    const baseName = path.basename(originalName, ext); // Remove extension from original name
    
    // Create filename with proper extension
    cb(null, `image-${uniqueSuffix}${ext.toLowerCase()}`);
  },
});

// ✅ Multer upload middleware
// ✅ Multer upload middleware (fixed)
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif"];
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = file.mimetype?.toLowerCase() || "";

    //  Allow if either mimetype OR extension matches
    if (allowed.includes(mime) || [".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
      cb(null, true);
    } else {
      console.warn("Rejected file:", { originalname: file.originalname, mimetype: file.mimetype });
      cb(new Error("Only image files (jpg, png, gif) are allowed"));
    }
  },
});


// ✅ POST /api/upload
router.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Construct accessible URL for uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;

    return res.status(200).json({
      message: "File uploaded successfully",
      fileUrl,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error during file upload" });
  }
});

// ✅ Add this route to serve uploaded files with proper MIME types
router.use('/uploads', express.static(uploadDir, {
  setHeaders: (res, path) => {
    const ext = path.extname(path);
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
      case '.png':
        res.setHeader('Content-Type', 'image/png');
        break;
      case '.gif':
        res.setHeader('Content-Type', 'image/gif');
        break;
      default:
        res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

export default router;