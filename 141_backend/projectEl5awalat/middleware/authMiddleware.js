const jwt = require('jsonwebtoken');

// In authMiddleware.js
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authorization token required' 
      });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('JWT verification failed:', err);
        return res.status(403).json({ 
          success: false,
          message: 'Invalid or expired token' 
        });
      }
      req.user = user;
      next();
    });
  };

  const authMiddleware = (roles) => {
    return (req, res, next) => {
        const token = req.header("Authorization");
        if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Decoded Token: ", decoded);  // Log decoded token for inspection
            req.user = decoded;

            // if (!roles.includes(req.user.role)) {
            //     return res.status(403).json({ message: "Access Denied. You do not have permission." });
            // }

            next();
        } catch (error) {
            res.status(400).json({ message: "Invalid token." });
        }
    };
};


module.exports = authMiddleware ,verifyToken;
