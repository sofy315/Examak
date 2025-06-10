const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const verifyToken = require('../middleware/authMiddleware'); // Add this import



// POST /api/quizzes/manual (doctor only)
router.post("/manual", authMiddleware(["doctor"]), quizController.createManualQuiz);
// In your backend routes
router.post('/submissions', verifyToken, quizController.submitQuiz);

// GET /api/quizzes/code/:code (accessible to doctor and student)
router.get("/code/:code", authMiddleware(["doctor", "student"]), quizController.getQuizByCode);
router.get('/allQuizes',authMiddleware(["doctor", "student"]), quizController.getAllQuizzes); // New endpoint for getting all quizzes

// GET submissions for quiz (doctor only)
router.get("/submissions/:quizId", authMiddleware(["doctor"]), quizController.getQuizSubmissions);

// POST /api/quizzes/ai (doctor only, with PDF upload)
router.post(
  "/ai",
  authMiddleware(["doctor"]),
  upload.single("pdf"),
  quizController.createQuizFromPdfAI
);
module.exports = router;