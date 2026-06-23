import express from "express";
import cors from "cors";

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://atyant.in",
  "https://www.atyant.in",
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin / server-to-server calls (no Origin header) and
    // explicitly listed origins only.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error("CORS: origin not allowed"));
  },
  credentials: true,
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

app.post("/api/book-session", (req, res) => {
  console.log(req.body);

  res.json({
    success: true,
    message: "Booking Confirmed",
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});