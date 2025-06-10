require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connection = require("./db");

const app = express();

const port = process.env.PORT || 5000;

(async () => {
	try {
		await connection();
		// console.log("✅ Connected to MongoDB...");
	} catch (error) {
		console.error("❌ Failed to connect to MongoDB:", error.message);
		process.exit(1); 
	}
})();

app.use(express.json());
app.use(cors({ origin: "*" })); 

app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/submissions", require("./routes/submissionRoutes"));
app.use("/api/quizzes", require("./routes/quizRoutes")); // ✅ add quiz routes

// Fallback
app.get("/", (req, res) => {
  res.send("Quiz API is running 🚀");
});

app.listen(port, () => console.log(`🚀 Server is running on port ${port}...`));
