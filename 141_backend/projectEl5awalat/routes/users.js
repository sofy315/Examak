const router = require("express").Router();
const { User, validate } = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
	try {
		const { error } = validate(req.body);
		if (error) return res.status(400).json({ message: error.details[0].message });

		const userExists = await User.findOne({ email: req.body.email });
		if (userExists) return res.status(409).json({ message: "User with given email already exists!" });

		const validRoles = ["student", "doctor"];
		if (!validRoles.includes(req.body.role)) {
			return res.status(400).json({ message: "Invalid role. Allowed roles: student, doctor" });
		}

		// التأكد من وجود SALT في البيئة، وإلا سيتم تعيين 10 كقيمة افتراضية
		const saltRounds = process.env.SALT ? Number(process.env.SALT) : 10;
		const hashPassword = await bcrypt.hash(req.body.password, saltRounds);

		// إنشاء المستخدم
		const user = new User({ ...req.body, password: hashPassword });
		await user.save();

		// توليد التوكن
		if (!process.env.JWT_SECRET) {
			throw new Error("JWT_SECRET is not defined in .env file!");
		}
		const token = jwt.sign(
			{ _id: user._id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: "7d" }
		);

		res.status(201).json({ token, role: user.role, message: "User created successfully" });
	} catch (error) {
		console.error("🔥 Error in /api/users:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

module.exports = router;
