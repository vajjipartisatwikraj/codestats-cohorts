const mongoose = require('mongoose');

const testCaseResultSchema = new mongoose.Schema({
  testCaseId: {
    type: mongoose.Schema.Types.ObjectId
  },
  passed: {
    type: Boolean,
    required: true
  },
  executionTime: {
    type: Number // in milliseconds
  },
  memoryUsed: {
    type: Number // in KB
  },
  output: String,
  error: String
});

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  cohort: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort',
    required: true
  },
  submissionType: {
    type: String,
    enum: ['mcq', 'programming'],
    required: true
  },
  // For MCQ questions
  selectedOption: {
    type: mongoose.Schema.Types.ObjectId
  },
  // For programming questions
  code: {
    type: String
  },
  language: {
    type: String,
    enum: ['c', 'cpp', 'java', 'python', 'javascript']
  },
  status: {
    type: String,
    enum: ['accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error', 'pending'],
    default: 'wrong_answer'
  },
  testCaseResults: [testCaseResultSchema],
  executionTime: {
    type: Number // in milliseconds
  },
  memoryUsed: {
    type: Number // in KB
  },
  score: {
    type: Number,
    default: 0
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
submissionSchema.index({ user: 1, question: 1, cohort: 1 });
submissionSchema.index({ cohort: 1, submittedAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema); 