const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PATestSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  parameters: {
    subject: String,
    topics: [String],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'mixed'
    },
    questionTypes: {
      mcq: {
        count: Number
      },
      programming: {
        count: Number
      }
    },
    timeLimit: {
      type: Number,
      default: 60 // default 60 minutes
    }
  },
  questions: [{
    type: Schema.Types.ObjectId,
    ref: 'PAQuestion'
  }],
  status: {
    type: String,
    enum: ['created', 'started', 'completed'],
    default: 'created'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  totalTimeTaken: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  maxPossibleScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to get submissions for this test
PATestSchema.virtual('submissions', {
  ref: 'PASubmission',
  localField: '_id',
  foreignField: 'test'
});

module.exports = mongoose.model('PATest', PATestSchema); 