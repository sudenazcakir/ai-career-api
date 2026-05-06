const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const connectDB = require("./config/db");
const requireAuth = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_PORT = 5173;

connectDB();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Swagger setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Career Matching API",
      version: "1.0.0",
      description: "API docs for AI-assisted job matching system",
    },
    servers: [{ url: `http://localhost:${PORT}/api` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, "routes", "*.js")],
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Routes
const matchRoutes = require("./routes/matchRoutes");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const cvRoutes = require("./routes/cvRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const careerMatrixRoutes = require("./routes/careerMatrixRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const certificateRoutes = require("./routes/certificateRoutes");

app.use("/api", authRoutes);
app.use("/api", requireAuth);

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

app.use("/api", matchRoutes);
app.use("/api", jobRoutes);
app.use("/api/cvs", cvRoutes);
app.use("/api", recommendationRoutes);
app.use("/api", analysisRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", careerMatrixRoutes);
app.use("/api", applicationRoutes);
app.use("/api", certificateRoutes);

// Server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Backend: http://localhost:${PORT}`);
  console.log(`Frontend: http://localhost:${FRONTEND_PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});

server.on("error", (error) => {
  console.error("Server error:", error.message);
});
