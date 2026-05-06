const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

connectDB();
app.use(cors());
app.use(express.json());

// Rota Tanımlamaları
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cvs", require("./routes/cvRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api", require("./routes/matchRoutes"));
app.use("/api", require("./routes/recommendationRoutes"));
app.use("/api", require("./routes/analyticsRoutes"));
app.use("/api", require("./routes/applicationRoutes"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));