const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PASubmissionSchema = new Schema({
  // References
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: Schema.Types.ObjectId,
    ref: 'PATest',
    required: true
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: 'PAQuestion',
    required: true
  },
  
  // Submission details
  submissionType: {
    type: String,
    enum: ['mcq', 'programming'],
    required: true
  },
  
  // MCQ specific fields
  selectedOption: {
    type: Schema.Types.ObjectId,
    ref: 'PAQuestion.options'
  },
  
  // Programming specific fields
  code: {
    type: String
  },
  language: {
    type: String
  },
  testCaseResults: [{
    input: String,
    expectedOutput: String,
    actualOutput: String,
    passed: Boolean,
    executionTime: Number,
    memory: Number
  }],
  
  // Result data
  isCorrect: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: 0
  },
  testCasesPassed: {
    type: Number,
    default: 0
  },
  totalTestCases: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'wrong_answer', 'compilation_error', 'runtime_error', 'time_limit_exceeded'],
    default: 'pending'
  },
  
  // Time tracking
  submittedAt: {
    type: Date,
    default: Date.now
  },
  timeTaken: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add index for faster lookups
PASubmissionSchema.index({ test: 1, question: 1, user: 1 });

module.exports = mongoose.model('PASubmission', PASubmissionSchema); 