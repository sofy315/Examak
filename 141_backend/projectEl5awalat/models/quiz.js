
const mongoose = require("mongoose");
const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    validate: [arr => arr.length === 4, "Each question must have exactly 4 options."],
  },
  correctAnswer: {
    type: String,
    required: true,
  },
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "doctor", // references professor
    required: true,
  },
  code: {
    type: String,
    unique: true,
    required: true,
  },
  questions: [questionSchema], // embedded questions
  duration: {
    type: Number, // duration in minutes
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  method: {
    type: String,
    enum: ["manual", "ai"],
    default: "manual",
  },
});

module.exports = mongoose.model("Quiz", quizSchema);
