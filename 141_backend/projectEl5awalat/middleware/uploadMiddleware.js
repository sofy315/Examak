  const multer = require("multer");
  const path = require("path");

  // Set storage engine
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/"); // You can customize this folder
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "quiz-" + uniqueSuffix + ext);
    },
  });

  // File filter (accept PDFs only)
  const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  };

  const upload = multer({ storage, fileFilter });

  module.exports = upload;
