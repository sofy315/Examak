const mongoose = require("mongoose");

const quizSessionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  }
});

quizSessionSchema.index({ student: 1, quiz: 1 }, { unique: true });

module.exports = mongoose.model("QuizSession", quizSessionSchema);
