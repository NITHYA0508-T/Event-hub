const express = require("express");     // Import Express
const mongoose = require("mongoose");   // Import MongoDB library
const cors = require("cors");           // Allow frontend-backend connection
require("dotenv").config();             // Load environment variables

const app = express();                  // Create Express app

// Middleware
app.use(cors());                        // Enable CORS
app.use(express.json());                // Read JSON data from frontend

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Test Route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Start Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});