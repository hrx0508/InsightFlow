import { spawn } from "node:child_process";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import Database from "better-sqlite3";
import { parse } from "csv-parse/sync";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const allowedOrigins = [
  "http://localhost:5173",
  "https://insight-flow-drab-one.vercel.app",
  process.env.FRONTEND_URL?.replace(/\/+$/, ""),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

const VALID_CATEGORIES = new Set([
  "Product Feedback",
  "Customer Service",
  "Operational Issues",
  "Fraud and Scam",
]);

const MODEL_VERSION_DEFAULT = "baseline-v1";

function normalizeText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function isValidCategory(category) {
  return VALID_CATEGORIES.has(category);
}

function isValidReview(review) {
  return review.length >= 5 && review.length <= 5000;
}

// --------------------------------------------------
// Dataset
// --------------------------------------------------

const DATASET_PATH = path.join(
  __dirname,
  "BuildBattle_2026_Customer_Feedback_Dataset.csv"
);

function loadFeedback() {
  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(`Dataset not found: ${DATASET_PATH}`);
  }

  return parse(fs.readFileSync(DATASET_PATH, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
}

function getOriginalFeedback() {
  return loadFeedback()
    .map((row, index) => ({
      id: `csv-${index + 1}`,
      review: normalizeText(row.review),
      category: normalizeText(row.category),
      source: "dataset",
    }))
    .filter(
      (item) =>
        item.review &&
        item.category &&
        isValidCategory(item.category)
    );
}

// --------------------------------------------------
// SQLite storage
// --------------------------------------------------

const DB_PATH =
  process.env.DB_PATH ||
  path.join(__dirname, "insightflow.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'submitted',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Open',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

 CREATE TABLE IF NOT EXISTS ai_corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review TEXT NOT NULL,
  predicted_category TEXT NOT NULL,
  corrected_category TEXT NOT NULL,
  confidence REAL,
  model_version TEXT NOT NULL DEFAULT 'baseline-v1',
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

  CREATE INDEX IF NOT EXISTS idx_ai_corrections_created_at
  ON ai_corrections(created_at);
`);

// Migrate existing databases safely.
// Existing corrections remain unverified until explicitly reviewed.
const correctionColumns = db
  .prepare("PRAGMA table_info(ai_corrections)")
  .all();

if (
  !correctionColumns.some(
    (column) => column.name === "verified"
  )
) {
  db.exec(`
    ALTER TABLE ai_corrections
    ADD COLUMN verified INTEGER NOT NULL DEFAULT 0
  `);
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_ai_corrections_verified
  ON ai_corrections(verified);
`);


const insertFeedback = db.prepare(`
  INSERT INTO feedback (review, category, source)
  VALUES (?, ?, ?)
`);

const insertFeedbackBatch = db.transaction((rows) => {
  let inserted = 0;

  for (const row of rows) {
    insertFeedback.run(row.review, row.category, "import");
    inserted++;
  }

  return inserted;
});

// --------------------------------------------------
// CSV upload configuration
// --------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, callback) {
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      return callback(new Error("Please upload a CSV file."));
    }

    callback(null, true);
  },
});

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "InsightFlow API is running",
  });
});

// --------------------------------------------------
// Overview
// --------------------------------------------------

app.get("/api/overview", (req, res) => {
  try {
    const original = getOriginalFeedback();

    const submitted = db
      .prepare(`
        SELECT id, review, category, source, created_at
        FROM feedback
        ORDER BY id DESC
      `)
      .all()
      .map((item) => ({
        ...item,
        id: `new-${item.id}`,
      }));

    const all = [...original, ...submitted];

    const unique = [
      ...new Map(
        all.map((item) => [
          `${item.review}|||${item.category}`,
          item,
        ])
      ).values(),
    ];

    const counts = {};

    for (const item of unique) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }

    const categories = Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: unique.length
          ? Number(((count / unique.length) * 100).toFixed(1))
          : 0,
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      totals: {
        totalRows: all.length,
        uniqueReviews: unique.length,
        duplicateRows: all.length - unique.length,
        uniqueReviewPercentage: all.length
          ? Number(((unique.length / all.length) * 100).toFixed(1))
          : 0,
        submittedFeedback: submitted.length,
      },
      categories,
    });
  } catch (error) {
    console.error("Overview error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to process the feedback dataset.",
    });
  }
});

// --------------------------------------------------
// Feedback activity
// --------------------------------------------------

app.get("/api/feedback/activity", (req, res) => {
  try {
    const allowedRanges = {
      "7D": 7,
      "30D": 30,
      "90D": 90,
    };

    const range = req.query.range || "7D";
    const days = allowedRanges[range];

    if (!days) {
      return res.status(400).json({
        success: false,
        message: "Invalid range. Use 7D, 30D, or 90D.",
      });
    }

    const rows = db
      .prepare(`
        SELECT
          date(created_at) AS date,
          COUNT(*) AS feedback
        FROM feedback
        WHERE date(created_at) >= date('now', ?)
          AND date(created_at) <= date('now')
        GROUP BY date(created_at)
        ORDER BY date(created_at) ASC
      `)
      .all(`-${days - 1} days`);

    const countsByDate = new Map(
      rows.map((row) => [row.date, row.feedback])
    );

    const activity = [];

    for (let i = days - 1; i >= 0; i--) {
      const result = db
        .prepare("SELECT date('now', ?) AS date")
        .get(`-${i} days`);

      const date = result.date;

      activity.push({
        date,
        label: date.slice(5),
        feedback: countsByDate.get(date) || 0,
      });
    }

    res.json({
      success: true,
      range,
      total: activity.reduce(
        (sum, item) => sum + item.feedback,
        0
      ),
      activity,
    });
  } catch (error) {
    console.error("Activity endpoint error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load feedback activity.",
    });
  }
});

// --------------------------------------------------
// List and search feedback
// --------------------------------------------------

app.get("/api/feedback", (req, res) => {
  try {
    const search = normalizeText(req.query.search).toLowerCase();
    const category = normalizeText(req.query.category);

    const parsedPage = Number.parseInt(req.query.page, 10);
    const parsedLimit = Number.parseInt(req.query.limit, 10);

    const page = Math.max(
      1,
      Number.isFinite(parsedPage) ? parsedPage : 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.isFinite(parsedLimit) ? parsedLimit : 10
      )
    );

    const sort = req.query.sort === "oldest" ? "oldest" : "newest";

    let feedback = [
      ...getOriginalFeedback(),
      ...db
        .prepare(`
          SELECT id, review, category, source, created_at
          FROM feedback
          ORDER BY id DESC
        `)
        .all()
        .map((item) => ({
          ...item,
          id: `new-${item.id}`,
        })),
    ];

    if (req.query.includeDuplicates !== "true") {
      feedback = [
        ...new Map(
          feedback.map((item) => [
            `${item.review}|||${item.category}`,
            item,
          ])
        ).values(),
      ];
    }

    if (search) {
      feedback = feedback.filter((item) =>
        item.review.toLowerCase().includes(search)
      );
    }

    if (category && category !== "All") {
      feedback = feedback.filter(
        (item) => item.category === category
      );
    }

    feedback.sort((a, b) => {
      const comparison = String(a.id).localeCompare(
        String(b.id),
        undefined,
        { numeric: true }
      );

      return sort === "newest" ? -comparison : comparison;
    });

    const total = feedback.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      feedback: feedback.slice(start, start + limit),
    });
  } catch (error) {
    console.error("Feedback error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve feedback.",
    });
  }
});

// --------------------------------------------------
// AI correction storage
// --------------------------------------------------

const insertCorrection = db.prepare(`
  INSERT INTO ai_corrections (
    review,
    predicted_category,
    corrected_category,
    confidence,
    model_version,
    verified
  )
  VALUES (?, ?, ?, ?, ?, 0)
`);

const selectCorrectionById = db.prepare(`
  SELECT
    id,
    review,
    predicted_category,
    corrected_category,
    confidence,
    model_version,
    verified,
    created_at
  FROM ai_corrections
  WHERE id = ?
`);

const selectCorrectionList = db.prepare(`
  SELECT
    id,
    review,
    predicted_category,
    corrected_category,
    confidence,
    model_version,
    verified,
    created_at
  FROM ai_corrections
  ORDER BY id DESC
  LIMIT ? OFFSET ?
`);

const updateCorrectionVerification = db.prepare(`
  UPDATE ai_corrections
  SET verified = ?
  WHERE id = ?
`);

// Save a correction. Saving does NOT automatically verify it.
app.post("/api/ai/corrections", (req, res) => {
  try {
    const review = normalizeText(req.body?.review);
    const predictedCategory = normalizeText(
      req.body?.predicted_category
    );
    const correctedCategory = normalizeText(
      req.body?.corrected_category
    );

    const confidence = req.body?.confidence;

    const modelVersion = normalizeText(
      req.body?.model_version || MODEL_VERSION_DEFAULT
    );

    if (!isValidReview(review)) {
      return res.status(400).json({
        success: false,
        message: "Review must contain 5–5000 characters.",
      });
    }

    if (!isValidCategory(predictedCategory)) {
      return res.status(400).json({
        success: false,
        message: "Invalid predicted category.",
      });
    }

    if (!isValidCategory(correctedCategory)) {
      return res.status(400).json({
        success: false,
        message: "Invalid corrected category.",
      });
    }

    if (
      confidence !== undefined &&
      confidence !== null &&
      (
        typeof confidence !== "number" ||
        !Number.isFinite(confidence) ||
        confidence < 0 ||
        confidence > 1
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Confidence must be a number between 0 and 1.",
      });
    }

    if (modelVersion.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Model version must not exceed 100 characters.",
      });
    }

    const result = insertCorrection.run(
      review,
      predictedCategory,
      correctedCategory,
      confidence ?? null,
      modelVersion
    );

    const correction = selectCorrectionById.get(
      Number(result.lastInsertRowid)
    );

    res.status(201).json({
      success: true,
      message: "AI correction saved. It still requires verification.",
      correction,
    });
  } catch (error) {
    console.error("AI correction error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to save AI correction.",
    });
  }
});

// List corrections.
// By default, return all corrections so an admin UI can review them.
// Use ?verified=true to retrieve verified corrections only.
// Use ?verified=false to retrieve unverified corrections only.
// GET saved AI corrections
app.get("/api/ai/corrections", (req, res) => {
  try {
    const { verified } = req.query;

    let query = `
      SELECT
        id,
        review,
        predicted_category,
        corrected_category,
        confidence,
        model_version,
        verified,
        created_at
      FROM ai_corrections
    `;

    const params = [];

    if (verified === "true") {
      query += " WHERE verified = ?";
      params.push(1);
    } else if (verified === "false") {
      query += " WHERE verified = ?";
      params.push(0);
    }

    query += " ORDER BY created_at DESC";

    const corrections = db.prepare(query).all(...params);

    res.json({
      success: true,
      count: corrections.length,
      corrections,
    });
  } catch (error) {
    console.error("Error fetching AI corrections:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch AI corrections",
    });
  }
});

// Verify an AI correction
app.patch("/api/ai/corrections/:id/verify", (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid correction ID",
      });
    }

    const correction = db
      .prepare("SELECT id FROM ai_corrections WHERE id = ?")
      .get(id);

    if (!correction) {
      return res.status(404).json({
        success: false,
        message: "Correction not found",
      });
    }

    db.prepare(`
      UPDATE ai_corrections
      SET verified = 1
      WHERE id = ?
    `).run(id);

    res.json({
      success: true,
      message: "Correction verified successfully",
      id,
      verified: true,
    });
  } catch (error) {
    console.error("Error verifying correction:", error);

    res.status(500).json({
      success: false,
      message: "Failed to verify correction",
    });
  }
});
// Verify a correction after human review.
// IMPORTANT: Protect this endpoint with authentication before public deployment.
app.post("/api/ai/corrections/:id/verify", (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid correction ID.",
      });
    }

    const correction = selectCorrectionById.get(id);

    if (!correction) {
      return res.status(404).json({
        success: false,
        message: "Correction not found.",
      });
    }

    updateCorrectionVerification.run(1, id);

    res.json({
      success: true,
      message: "Correction verified.",
      correction: selectCorrectionById.get(id),
    });
  } catch (error) {
    console.error("Verify correction error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to verify correction.",
    });
  }
});

// Revoke verification if a correction was verified by mistake.
app.post("/api/ai/corrections/:id/unverify", (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid correction ID.",
      });
    }

    const correction = selectCorrectionById.get(id);

    if (!correction) {
      return res.status(404).json({
        success: false,
        message: "Correction not found.",
      });
    }

    updateCorrectionVerification.run(0, id);

    res.json({
      success: true,
      message: "Correction verification revoked.",
      correction: selectCorrectionById.get(id),
    });
  } catch (error) {
    console.error("Unverify correction error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to revoke verification.",
    });
  }
});

// Correction statistics.
app.get("/api/ai/corrections/stats", (req, res) => {
  try {
    const stats = db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) AS verified,
          SUM(CASE WHEN verified = 0 THEN 1 ELSE 0 END) AS unverified
        FROM ai_corrections
      `)
      .get();

    res.json({
      success: true,
      stats: {
        total: stats.total || 0,
        verified: stats.verified || 0,
        unverified: stats.unverified || 0,
      },
    });
  } catch (error) {
    console.error("Correction statistics error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve correction statistics.",
    });
  }
});

// --------------------------------------------------
// Submit feedback
// --------------------------------------------------

app.post("/api/feedback", (req, res) => {
  try {
    const review = normalizeText(req.body?.review);
    const category = normalizeText(req.body?.category);

    if (!isValidReview(review)) {
      return res.status(400).json({
        success: false,
        message: "Feedback must contain 5–5000 characters.",
      });
    }

    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid category.",
      });
    }

    const result = insertFeedback.run(
      review,
      category,
      "submitted"
    );

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      feedback: {
        id: Number(result.lastInsertRowid),
        review,
        category,
        source: "submitted",
      },
    });
  } catch (error) {
    console.error("Submission error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to save feedback.",
    });
  }
});

// --------------------------------------------------
// Import CSV
// --------------------------------------------------

app.post(
  "/api/feedback/import",
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a CSV file.",
        });
      }

      const rows = parse(req.file.buffer.toString("utf8"), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "The CSV file contains no feedback records.",
        });
      }

      const headers = Object.keys(rows[0] || {});

      if (!headers.includes("review") || !headers.includes("category")) {
        return res.status(400).json({
          success: false,
          message: "CSV must contain review and category columns.",
        });
      }

      if (rows.length > 10000) {
        return res.status(400).json({
          success: false,
          message: "Maximum 10,000 records per import.",
        });
      }

      const cleaned = rows.map((row, index) => {
        const review = normalizeText(row.review);
        const category = normalizeText(row.category);

        if (!isValidReview(review) || !isValidCategory(category)) {
          throw new Error(
            `Invalid review or category at CSV data row ${index + 2}.`
          );
        }

        return { review, category };
      });

      const inserted = insertFeedbackBatch(cleaned);

      res.status(201).json({
        success: true,
        message: "CSV imported successfully.",
        imported: inserted,
      });
    } catch (error) {
      console.error("CSV import error:", error);

      res.status(400).json({
        success: false,
        message: error.message || "Unable to import CSV.",
      });
    }
  }
);

// --------------------------------------------------
// AI Feedback Analysis
// --------------------------------------------------

app.post("/api/analysis", (req, res) => {
  const pythonPath =
    process.env.PYTHON_PATH ||
    (process.platform === "win32"
      ? path.join(__dirname, ".venv", "Scripts", "python.exe")
      : "python3");

  const scriptPath = path.join(
    __dirname,
    "scripts",
    "analysis",
    "analyze_feedback.py"
  );

  if (!fs.existsSync(scriptPath)) {
    return res.status(500).json({
      success: false,
      message: "Analysis script was not found.",
    });
  }

  let feedback;

  try {
    const original = getOriginalFeedback();

    const submitted = db
      .prepare(`
        SELECT id, review, category, source, created_at
        FROM feedback
        ORDER BY id DESC
      `)
      .all()
      .map((item) => ({
        ...item,
        id: `new-${item.id}`,
      }));

    // Keep duplicates because repeated feedback may reveal trends.
    feedback = [...original, ...submitted].filter(
      (item) => item.review && item.category
    );
  } catch (error) {
    console.error("Unable to load analysis data:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load feedback for analysis.",
    });
  }

  const python = spawn(pythonPath, [scriptPath], {
    cwd: __dirname,
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  let settled = false;

  const timeout = setTimeout(() => {
    if (settled) return;

    settled = true;
    python.kill();

    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: "Feedback analysis timed out.",
      });
    }
  }, 120000);

  python.stdout.setEncoding("utf8");
  python.stderr.setEncoding("utf8");

  python.stdout.on("data", (chunk) => {
    if (settled) return;

    stdout += chunk;

    if (stdout.length > 20 * 1024 * 1024) {
      settled = true;
      clearTimeout(timeout);
      python.kill();

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Analysis output exceeded the allowed size.",
        });
      }
    }
  });

  python.stderr.on("data", (chunk) => {
    if (stderr.length < 20000) {
      stderr += chunk.slice(0, 4000);
    }
  });

  python.on("error", (error) => {
    if (settled) return;

    settled = true;
    clearTimeout(timeout);

    console.error("Python process error:", error);

    res.status(500).json({
      success: false,
      message:
        "Unable to start Python. Check PYTHON_PATH and your installed libraries.",
    });
  });

  python.on("close", (code) => {
    if (settled) return;

    settled = true;
    clearTimeout(timeout);

    if (code !== 0) {
      console.error("Analysis script failed:", stderr);

      return res.status(500).json({
        success: false,
        message: "Feedback analysis failed.",
      });
    }

    try {
      const result = JSON.parse(stdout);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.error || "Feedback analysis failed.",
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Invalid Python analysis response:", error);

      res.status(500).json({
        success: false,
        message: "The analysis engine returned an invalid response.",
      });
    }
  });

  python.stdin.on("error", (error) => {
    if (error.code !== "EPIPE") {
      console.error("Error sending data to Python:", error);
    }
  });

  python.stdin.end(JSON.stringify({ feedback }));
});

// --------------------------------------------------
// Upload and general error handling
// --------------------------------------------------

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "CSV file must be smaller than 5 MB."
          : "Invalid file upload.",
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Request failed.",
    });
  }

  next();
});



app.post("/api/ai/predict", async (req, res) => {
  try {
    const { review } = req.body;

    if (typeof review !== "string" || !review.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid review is required.",
      });
    }

    const { spawn } = await import("node:child_process");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    const currentFile = fileURLToPath(import.meta.url);
    const projectRoot = path.dirname(currentFile);

   const pythonPath =
  process.env.PYTHON_PATH ||
  (process.platform === "win32"
    ? path.join(projectRoot, ".venv", "Scripts", "python.exe")
    : "python3");

    const scriptPath = path.join(
      projectRoot,
      "scripts",
      "ml",
      "predict_feedback.py"
    );

    const child = spawn(
      pythonPath,
      [scriptPath],
      {
        cwd: projectRoot,
        windowsHide: true,
      }
    );

    let stdout = "";
    let stderr = "";
    let finished = false;

    const timeout = setTimeout(() => {
  if (finished) return;

  finished = true;
  child.kill();

  if (!res.headersSent) {
    res.status(504).json({
      success: false,
      message: "Prediction service timed out.",
    });
  }
}, 15000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);

      console.error("Could not start prediction process:", error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Could not start the prediction service.",
        });
      }
    });

    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);

      if (code !== 0) {
        console.error("Prediction failed:", stderr);

        return res.status(500).json({
          success: false,
          message: "Prediction failed.",
        });
      }

      try {
        const result = JSON.parse(stdout);

        res.json({
          success: true,
          prediction: result,
        });
      } catch {
        console.error("Invalid prediction output:", stdout);

        res.status(500).json({
          success: false,
          message: "The prediction service returned invalid output.",
        });
      }
    });

    child.stdin.write(JSON.stringify({ review: review.trim() }));
    child.stdin.end();
  } catch (error) {
    console.error("Prediction route error:", error);

    res.status(500).json({
      success: false,
      message: "Internal prediction error.",
    });
  }
});
// --------------------------------------------------
// Start server
// --------------------------------------------------

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`InsightFlow API running on port ${PORT}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);