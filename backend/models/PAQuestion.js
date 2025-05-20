const mongoose = require('mongoose');

// Define testCase schema for programming problems
const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  hidden: {
    type: Boolean,
    default: false
  },
  explanation: {
    type: String
  }
});

// Define options schema for MCQ
const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
});

const paQuestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['mcq', 'programming'],
    required: true
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  marks: {
    type: Number,
    required: true,
    default: 10
  },
  maintag: {
    type: String,
    required: true,
    trim: true
  },
  // Fields for MCQ type
  options: [optionSchema],
  
  // Fields for Programming type
  languages: [{
    name: {
      type: String,
      enum: ['c', 'cpp', 'java', 'python', 'javascript'],
    },
    version: {
      type: String
    },
    boilerplateCode: {
      type: String
    },
    solutionCode: {
      type: String
    }
  }],
  defaultLanguage: {
    type: String,
    enum: ['c', 'cpp', 'java', 'python', 'javascript', null],
    default: function() {
      return this.type === 'programming' ? 'python' : null;
    },
    validate: {
      validator: function(value) {
        // Only validate if the question is a programming type, otherwise allow null
        return this.type !== 'programming' || 
               ['c', 'cpp', 'java', 'python', 'javascript'].includes(value);
      },
      message: 'defaultLanguage must be a valid programming language for programming questions'
    }
  },
  testCases: [testCaseSchema],
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: {
    timeLimit: {
      type: Number,
      default: 1000  // in milliseconds
    },
    memoryLimit: {
      type: Number,
      default: 256  // in MB
    }
  },
  hints: [String],
  tags: [String],
  companies: [String],
  
  // Stats about the question
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    acceptedSubmissions: {
      type: Number,
      default: 0
    },
    acceptanceRate: {
      type: Number,
      default: 0
    }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on each save
paQuestionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate acceptance rate
  if (this.stats.totalSubmissions > 0) {
    this.stats.acceptanceRate = (this.stats.acceptedSubmissions / this.stats.totalSubmissions) * 100;
  }
  
  next();
});

module.exports = mongoose.model('PAQuestion', paQuestionSchema); 