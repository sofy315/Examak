const express = require("express");
const router = express.Router();
const { submitQuizAnswers, getSubmissionsByQuiz , checkSubmissionExists , getMySubmission } = require("../controllers/submissionController");
const authMiddleware = require("../middleware/authMiddleware");

// POST /api/submissions
router.post("/", authMiddleware(["student"]), submitQuizAnswers);
router.get("/quiz/:quizId", authMiddleware(["doctor"]), getSubmissionsByQuiz);
// Student views their own result
router.get("/my/:quizId", authMiddleware(["student"]), getMySubmission);
router.get("/:quizId/check", authMiddleware(["student"]), checkSubmissionExists);

module.exports = router;

