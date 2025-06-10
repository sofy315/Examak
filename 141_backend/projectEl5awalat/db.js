const mongoose = require("mongoose");
require("dotenv").config(); 

const connection = async () => {
	try {
		if (!process.env.MONGO_URI) {
			throw new Error("MONGO_URI is not defined in .env file");
		}

		await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		console.log("✅ Connected to MongoDB...");
	} catch (error) {
		console.error("❌ Could not connect to MongoDB:", error.message);
		process.exit(1); 
	}
};

module.exports = connection;
