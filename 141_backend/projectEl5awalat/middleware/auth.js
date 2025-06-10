// ✅ Correct middleware file: middleware/auth.js

const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const token = req.header("Authorization");
    if (!token) return res.status(401).send({ message: "Access Denied. No token provided." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // {_id, role}
        next();
    } catch (error) {
        res.status(400).send({ message: "Invalid token." });
    }
}

module.exports = auth; // ✅ Make sure it's just the function
