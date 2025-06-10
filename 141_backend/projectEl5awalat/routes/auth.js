const router = require("express").Router();
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require('jsonwebtoken');
const auth = require ('../middleware/auth.js')
router.post("/", async (req, res) => {
    try {
        const { error } = validate(req.body);
        if (error) return res.status(400).send({ message: error.details[0].message });

        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(401).send({ message: "Invalid Email or Password" });

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(401).send({ message: "Invalid Email or Password" });

        const token = user.generateAuthToken();
        res.status(200).send({ data: token, message: "Logged in successfully" });

    } catch (error) {
        console.error("🔥 Error in /api/auth:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
}); 

router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("firstName lastName role");
        if (!user) return res.status(404).send({ message: "User not found." });

        res.send({ 
            name: `${user.firstName} ${user.lastName}`, 
            role: user.role 
        });
    } catch (error) {
        console.error("🔥 Error in /api/auth/me:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});
const validate = (data) => {
	const schema = Joi.object({
		email: Joi.string().email().required().label("Email"),
		password: Joi.string().required().label("Password"),
	});
	return schema.validate(data);
};

module.exports = router;
