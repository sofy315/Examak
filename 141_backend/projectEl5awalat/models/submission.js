const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  answers: [
    {
      questionText: String,
      selectedAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean,
    },
  ],
  score: Number,
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});
// models/submission.js
submissionSchema.index({ student: 1, quiz: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);
