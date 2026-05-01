const express = require("express");
const cors = require("cors");
require("dotenv").config();

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ===== Swagger ayarı =====
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Career Matching API",
      version: "1.0.0",
      description: "API docs for AI-assisted job matching system",
    },
    servers: [{ url: `http://localhost:${PORT}/api` }],
  },
  apis: ["./routes/*.js"], // swagger yorumlarını buradan okuyacak
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// ===== Test endpoint =====
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

// ===== ROUTES =====
const matchRoutes = require("./routes/matchRoutes");
app.use("/api", matchRoutes);

// ===== SERVER =====
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});

server.on("error", (error) => {
  console.error("Server error:", error.message);
});
