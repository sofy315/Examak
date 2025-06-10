const Submission = require("../models/submission");
const Quiz = require("../models/quiz");
const QuizSession = require("../models/quizSession");

const submitQuizAnswers = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const studentId = req.user._id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    // Prevent double submissions
    const existingSubmission = await Submission.findOne({ student: studentId, quiz: quizId });
    if (existingSubmission) {
      return res.status(400).json({ message: "You have already submitted this quiz." });
    }

    // Time check
    const session = await QuizSession.findOne({ student: studentId, quiz: quizId });
    if (!session) {
      return res.status(400).json({ message: "No quiz session found. You didn't start the quiz." });
    }

    // Calculate time spent
    const now = new Date();
    const spendMilliseconds = now - new Date(session.startTime);
    const spendMinutes = Math.floor(spendMilliseconds / 60000);
    const spendSeconds = Math.floor((spendMilliseconds % 60000) / 1000);
    const spendTime = `${spendMinutes}m ${String(spendSeconds).padStart(2, '0')}s`;

    // Grade the quiz
    let correctCount = 0;
    const validLetters = ["a", "b", "c", "d"];

    const gradedAnswers = answers.map((submitted) => {
      const original = quiz.questions.id(submitted.questionId);
      const submittedAnswer = String(submitted.selectedAnswer).trim().toLowerCase();
      const correctAnswer = String(original?.correctAnswer).trim().toLowerCase();

      const isCorrect =
        original &&
        validLetters.includes(submittedAnswer) &&
        submittedAnswer === correctAnswer;

      if (isCorrect) correctCount++;

      return {
        questionId: submitted.questionId,
        selectedAnswer: submitted.selectedAnswer,
        correctAnswer: original?.correctAnswer || "N/A",
        isCorrect
      };
    });

    const score = correctCount;

    const newSubmission = new Submission({
      quiz: quizId,
      student: studentId,
      answers: gradedAnswers,
      score
    });

    await newSubmission.save();

    res.status(201).json({
      message: "Submission saved",
      score,
      total: quiz.questions.length,
      correct: correctCount,
      spendTime
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during submission." });
  }
};

const getSubmissionsByQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;

        const submissions = await Submission.find({ quiz: quizId })
            .populate("student", "firstName lastName email")
            .sort({ score: -1 });

        if (!submissions.length) {
            return res.status(404).json({ 
                message: "No submissions found for this quiz.",
                count: 0,
                submissions: []
            });
        }

        res.status(200).json({
            message: "Submissions retrieved successfully",
            count: submissions.length,
            submissions
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching submissions." });
    }
};
const getMySubmission = async (req, res) => {
    try {
      const { quizId } = req.params;
      const studentId = req.user._id;
  
      const submission = await Submission.findOne({ quiz: quizId, student: studentId });
      if (!submission) {
        return res.status(404).json({ message: "No submission found." });
      }
  
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found." });
      }
  
      const map = { a: 0, b: 1, c: 2, d: 3 };
  
      const answersWithText = submission.answers.map(ans => {
        const question = quiz.questions.id(ans.questionId);
        return {
          ...ans,
          selectedAnswerText: question?.options?.[map[ans.selectedAnswer]] || "N/A",
          correctAnswerText: question?.options?.[map[ans.correctAnswer]] || "N/A"
        };
      });
  
      res.status(200).json({
        score: submission.score,
        total: quiz.questions.length,
        answers: answersWithText
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error retrieving your submission." });
    }
  };
  
const checkSubmissionExists = async (req, res) => {
    try {
        const { quizId } = req.params;
        const studentId = req.user._id;

        const existing = await Submission.findOne({ quiz: quizId, student: studentId });

        if (existing) {
            return res.status(200).json({ submitted: true });
        } else {
            return res.status(200).json({ submitted: false });
        }
    } catch (err) {
        console.error("Error checking submission:", err);
        res.status(500).json({ message: "Failed to check submission." });
    }
};

module.exports = {
    submitQuizAnswers,
    getSubmissionsByQuiz,
    getMySubmission,
    checkSubmissionExists
};
