const Quiz = require("../models/quiz");
const generateQuizCode = require("../utils/generateQuizCode");
const Submission = require('../models/submission');
const QuizSession = require("../models/quizSession");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const callOpenRouter = require("../utils/openrouter");

const createManualQuiz = async (req, res) => {
  try {
    const { title, duration, questions } = req.body;

    // Enhanced validation
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Quiz title is required." });
    }
    
    if (!duration || isNaN(duration) || duration <= 0) {
      return res.status(400).json({ message: "Valid duration is required." });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "At least one question is required." });
    }

    // Validate each question
    const validationErrors = [];
    const validLetters = ["a", "b", "c", "d"];

    questions.forEach((q, index) => {
      if (!q.questionText || !q.questionText.trim()) {
        validationErrors.push(`Question ${index + 1}: Text is required`);
      }
      
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        validationErrors.push(`Question ${index + 1}: Must have exactly 4 options`);
      }
      
      const answer = String(q.correctAnswer).toLowerCase().trim();
      if (!validLetters.includes(answer)) {
        validationErrors.push(`Question ${index + 1}: Correct answer must be a, b, c, or d`);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: "Validation failed",
        errors: validationErrors 
      });
    }

    // Create quiz
    const code = generateQuizCode();
    const quiz = new Quiz({
      title,
      code,
      duration,
      type: "manual",
      createdBy: req.user._id, // This comes from the authenticated user
      questions: questions.map(q => ({
        questionText: q.questionText.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswer: q.correctAnswer.toLowerCase()
      }))
    });

    await quiz.save();

    res.status(201).json({
      message: "Manual quiz created successfully.",
      quizId: quiz._id,
      code: quiz.code,
    });
  } catch (err) {
    console.error("Manual quiz creation error:", err);
    res.status(500).json({ 
      message: "Failed to create manual quiz.",
      error: err.message 
    });
  }
};
const createQuizFromPdfAI = async (req, res) => {
  let filePath = null;
  
  try {
    // Validate file exists in request
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "No PDF file uploaded.",
        field: "pdf"
      });
    }

    filePath = req.file.path;
    
    // Verify file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ 
        success: false,
        message: "Uploaded file could not be found on server.",
        field: "pdf"
      });
    }

    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size > 10 * 1024 * 1024) { // 10MB
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        success: false,
        message: "PDF must be smaller than 10MB.",
        field: "pdf"
      });
    }

    // Read and parse PDF
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    // Validate PDF content
    if (!text || text.length < 100) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        success: false,
        message: "PDF content is too short or empty (minimum 100 characters required).",
        field: "pdf"
      });
    }

    // Generate AI prompt
    const prompt = `
You are an expert quiz generator. From the provided text, create exactly 10 multiple-choice questions.

RULES:
1. Each question must have:
   - A clear question text
   - Exactly 4 options (labeled a, b, c, d)
   - One correct answer (specify only the letter)
2. Format the response as a STRICT JSON ARRAY with this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "a"
  },
  // ... 9 more questions
]

IMPORTANT:
- Only return the JSON array, nothing else
- Do not include any additional text or explanations
- Ensure all brackets and quotes are properly closed

TEXT TO ANALYZE:
${text.slice(0, 4000)}
`;

    // Call AI service
    const aiContent = await callOpenRouter(prompt);
    console.log("Raw AI Response:", aiContent);

    // Extract JSON from response
    let jsonString = aiContent;
    const jsonMatch = aiContent.match(/\[.*\]/s);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    // Parse and validate questions
    let questions;
    try {
      questions = JSON.parse(jsonString);
      
      if (!Array.isArray(questions) || questions.length !== 10) {
        throw new Error("AI did not return exactly 10 questions");
      }

      const validLetters = ["a", "b", "c", "d"];
      questions = questions.map((q, index) => {
        if (!q.question || !q.options || !q.correctAnswer) {
          throw new Error(`Question ${index + 1} missing required fields`);
        }
        
        const letter = String(q.correctAnswer).trim().toLowerCase();
        if (!validLetters.includes(letter)) {
          throw new Error(`Question ${index + 1} has invalid correct answer`);
        }
        
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Question ${index + 1} must have exactly 4 options`);
        }

        return {
          questionText: q.question,
          options: q.options,
          correctAnswer: letter
        };
      });

    } catch (err) {
      console.error("Quiz parsing error:", {
        error: err.message,
        response: aiContent
      });
      
      fs.unlinkSync(filePath);
      return res.status(422).json({ 
        success: false,
        message: "Failed to generate valid quiz questions",
        details: err.message,
        errorType: "PARSE_ERROR"
      });
    }

    // Validate request body
    const { title, duration } = req.body;

    if (!title || !title.trim()) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        success: false,
        message: "Quiz title is required",
        field: "title"
      });
    }

    if (!duration || isNaN(duration) || duration <= 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        success: false,
        message: "Valid duration is required",
        field: "duration"
      });
    }

    // Create and save quiz
    const quizCode = generateQuizCode();
    const quiz = new Quiz({
      title: title.trim(),
      code: quizCode,
      duration: Number(duration),
      type: "ai",
      createdBy: req.user._id,
      questions,
    });

    await quiz.save();
    fs.unlinkSync(filePath);

    res.status(201).json({
      success: true,
      message: "AI-based quiz created successfully",
      quizId: quiz._id,
      code: quiz.code
    });

  } catch (error) {
    console.error("AI Quiz Generation Error:", error);
    
    // Clean up uploaded file if error occurred
    if (filePath && fs.existsSync(filePath)) {
      try { 
        fs.unlinkSync(filePath); 
      } catch (err) { 
        console.error("File cleanup failed:", err); 
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: "Failed to create quiz using AI",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
const getQuizByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const studentId = req.user._id;

    const quiz = await Quiz.findOne({ code });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found with this code." });
    }

    // ⛔ Check if student already submitted this quiz
    const alreadySubmitted = await Submission.findOne({
      quiz: quiz._id,
      student: studentId,
    });

    if (alreadySubmitted) {
      return res.status(403).json({ message: "You have already submitted this quiz." });
    }

    // ⏱️ Start time tracking (if not already started)
    let session = await QuizSession.findOne({ student: studentId, quiz: quiz._id });
    if (!session) {
      session = await QuizSession.create({
        student: studentId,
        quiz: quiz._id,
        startTime: new Date(),
      });
    }

    // 🧼 Include questionId along with questionText and options
    const questionsWithIds = quiz.questions.map((q) => ({
      questionId: q._id,  // Use _id for the questionId
      questionText: q.questionText,
      options: q.options,
    }));

    res.status(200).json({
      quizId: quiz._id,
      title: quiz.title,
      duration: quiz.duration,
      startTime: session.startTime,
      questions: questionsWithIds,  // Return updated questions array with questionId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error retrieving quiz." });
  }
};

const getQuizSubmissions = async (req, res) => {
  try {
    const quizId = req.params.quizId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. You did not create this quiz." });
    }

    const submissions = await Submission.find({ quiz: quizId })
      .populate("student", "firstName lastName email")
      .sort({ createdAt: -1 });

    const map = { a: 0, b: 1, c: 2, d: 3 };

    const submissionsWithText = submissions.map(sub => {
      const answers = sub.answers.map(ans => {
        const question = quiz.questions.id(ans.questionId);
        return {
          ...ans,
          selectedAnswerText: question?.options?.[map[ans.selectedAnswer]] || "N/A",
          correctAnswerText: question?.options?.[map[ans.correctAnswer]] || "N/A"
        };
      });

      return {
        student: sub.student,
        score: sub.score,
        answers,
        submittedAt: sub.createdAt
      };
    });

    res.status(200).json({ submissions: submissionsWithText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch submissions." });
  }
};
const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, timeSpent } = req.body;
    const studentId = req.user._id;

    // Validate input
    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission data'
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Calculate score
    let correctAnswers = 0;
    answers.forEach(answer => {
      const question = quiz.questions.id(answer.questionId);
      if (question && answer.selectedAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / quiz.questions.length) * 100;

    // Create submission record
    const submission = new Submission({
      quiz: quizId,
      student: studentId,
      answers,
      score,
      timeSpent,
      submittedAt: new Date()
    });

    await submission.save();

    res.status(200).json({
      success: true,
      score,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      timeSpent
    });

  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz'
    });
  }
};

const getAllQuizzes = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search } = req.query;
    const userId = req.user._id;

    // Build the base query
    let query = { createdBy: userId }; // Only show quizzes created by the user

    // Add type filter if provided
    if (type && ['manual', 'ai'].includes(type)) {
      query.type = type;
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute the query with pagination
    const quizzes = await Quiz.find(query)
      .select('-questions') // Exclude questions by default
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get total count for pagination info
    const total = await Quiz.countDocuments(query);

    res.status(200).json({
      success: true,
      data: quizzes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch quizzes',
      error: err.message 
    });
  }
};
module.exports = {getAllQuizzes,submitQuiz, createManualQuiz, getQuizByCode, getQuizSubmissions, createQuizFromPdfAI };