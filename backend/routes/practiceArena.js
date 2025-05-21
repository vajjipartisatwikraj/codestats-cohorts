const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PAQuestion = require('../models/PAQuestion');
const PATest = require('../models/PATest');
const PASubmission = require('../models/PASubmission');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// ==== ADMIN ROUTES ====

// Get all practice arena questions (admin only)
router.get('/questions', auth, adminAuth, async (req, res) => {
  try {
    const questions = await PAQuestion.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');
    
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching practice arena questions:', error);
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// Search for questions (admin only) - IMPORTANT: This route must come before the /questions/:id route
router.get('/questions/search', auth, adminAuth, async (req, res) => {
  try {
    const searchQuery = req.query.q;
    
    if (!searchQuery) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Create a regex search query that's case-insensitive
    const searchRegex = new RegExp(searchQuery, 'i');
    
    // Search in title, description, tags, and maintag
    const questions = await PAQuestion.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { maintag: searchRegex }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(20) // Limit results to prevent performance issues
    .populate('createdBy', 'name email');
    
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error searching practice arena questions:', error);
    res.status(500).json({ message: 'Error searching questions', error: error.message });
  }
});

// Get a specific practice arena question by ID
router.get('/questions/:id', auth, async (req, res) => {
  try {
    const question = await PAQuestion.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.status(200).json(question);
  } catch (error) {
    console.error(`Error fetching practice arena question ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching question', error: error.message });
  }
});

// Create a new practice arena question (admin only)
router.post('/questions', auth, adminAuth, async (req, res) => {
  try {
    const {
      title, description, type, difficultyLevel, marks, maintag,
      options, languages, defaultLanguage, testCases, examples,
      constraints, hints, tags, companies
    } = req.body;
    
    // Create a new question
    const question = new PAQuestion({
      title,
      description,
      type,
      difficultyLevel,
      marks,
      maintag,
      createdBy: req.user.id
    });
    
    // Add type-specific fields
    if (type === 'mcq' && options) {
      question.options = options;
    } else if (type === 'programming') {
      if (languages) question.languages = languages;
      if (defaultLanguage) question.defaultLanguage = defaultLanguage;
      if (testCases) question.testCases = testCases;
      if (examples) question.examples = examples;
      if (constraints) question.constraints = constraints;
    }
    
    // Add additional fields
    if (hints) question.hints = hints;
    if (tags) question.tags = tags;
    if (companies) question.companies = companies;
    
    await question.save();
    
    res.status(201).json({
      message: 'Practice arena question created successfully',
      question
    });
  } catch (error) {
    console.error('Error creating practice arena question:', error);
    res.status(500).json({ message: 'Error creating question', error: error.message });
  }
});

// Update a practice arena question (admin only)
router.put('/questions/:id', auth, adminAuth, async (req, res) => {
  try {
    const questionId = req.params.id;
    const updates = req.body;
    
    // Find the question first
    const question = await PAQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Update all provided fields
    for (const [key, value] of Object.entries(updates)) {
      if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt') {
        question[key] = value;
      }
    }
    
    await question.save();
    
    res.status(200).json({
      message: 'Practice arena question updated successfully',
      question
    });
  } catch (error) {
    console.error(`Error updating practice arena question ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
});

// Delete a practice arena question (admin only)
router.delete('/questions/:id', auth, adminAuth, async (req, res) => {
  try {
    const questionId = req.params.id;
    
    const result = await PAQuestion.findByIdAndDelete(questionId);
    
    if (!result) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.status(200).json({ message: 'Practice arena question deleted successfully' });
  } catch (error) {
    console.error(`Error deleting practice arena question ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
});

// ==== USER ROUTES ====

// Get available subjects (unique maintags)
router.get('/subjects', auth, async (req, res) => {
  try {
    const subjects = await PAQuestion.distinct('maintag');
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
});

// Get available topics (unique tags)
router.get('/topics', auth, async (req, res) => {
  try {
    const topics = await PAQuestion.distinct('tags');
    res.status(200).json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ message: 'Error fetching topics', error: error.message });
  }
});

// Create a new practice test
router.post('/tests', auth, async (req, res) => {
  try {
    const { subject, topics, difficulty, questionTypes, timeLimit, title } = req.body;
    
    // Validate required fields
    if (!subject) {
      return res.status(400).json({ message: 'Subject is required' });
    }
    
    if (!questionTypes || (!questionTypes.mcq?.count && !questionTypes.programming?.count)) {
      return res.status(400).json({ message: 'At least one question type count must be provided' });
    }
    
    // Calculate how many questions we need
    const mcqCount = questionTypes.mcq?.count || 0;
    const programmingCount = questionTypes.programming?.count || 0;
    
    // Build query to find eligible questions
    const baseQuery = {
      maintag: subject,
    };
    
    // Add difficulty if specified
    if (difficulty && difficulty !== 'mixed') {
      baseQuery.difficultyLevel = difficulty;
    }
    
    // Add topics if specified
    if (topics && topics.length > 0) {
      baseQuery.tags = { $in: topics };
    }
    
    // Fetch MCQ questions if needed
    let mcqQuestions = [];
    if (mcqCount > 0) {
      mcqQuestions = await PAQuestion.aggregate([
        { $match: { ...baseQuery, type: 'mcq' } },
        { $sample: { size: mcqCount } }
      ]);
    }
    
    // Fetch programming questions if needed
    let programmingQuestions = [];
    if (programmingCount > 0) {
      programmingQuestions = await PAQuestion.aggregate([
        { $match: { ...baseQuery, type: 'programming' } },
        { $sample: { size: programmingCount } }
      ]);
    }
    
    // Combine all selected questions
    const selectedQuestions = [...mcqQuestions, ...programmingQuestions];
    
    // If we couldn't find enough questions, return an error
    if (selectedQuestions.length < (mcqCount + programmingCount)) {
      return res.status(400).json({
        message: 'Not enough questions available with the selected criteria',
        available: selectedQuestions.length,
        requested: mcqCount + programmingCount
      });
    }
    
    // Calculate max possible score
    const maxPossibleScore = selectedQuestions.reduce((total, q) => total + q.marks, 0);
    
    // Create a new test
    const test = new PATest({
      user: req.user.id,
      title: title || 'Practice Test',
      parameters: {
        subject,
        topics: topics || [],
        difficulty: difficulty || 'mixed',
        questionTypes: {
          mcq: { count: mcqCount },
          programming: { count: programmingCount }
        },
        timeLimit: timeLimit || 60 // default 60 minutes
      },
      questions: selectedQuestions.map(q => q._id),
      maxPossibleScore,
      status: 'created'
    });
    
    await test.save();
    
    res.status(201).json({
      message: 'Practice test created successfully',
      test: {
        _id: test._id,
        title: test.title,
        parameters: test.parameters,
        questionCount: selectedQuestions.length,
        status: test.status,
        maxPossibleScore
      }
    });
  } catch (error) {
    console.error('Error creating practice test:', error);
    res.status(500).json({ message: 'Error creating test', error: error.message });
  }
});

// Start a practice test
router.put('/tests/:id/start', auth, async (req, res) => {
  try {
    const testId = req.params.id;
    
    // Find the test and verify ownership
    const test = await PATest.findOne({ _id: testId, user: req.user.id });
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found or unauthorized' });
    }
    
    if (test.status !== 'created') {
      return res.status(400).json({ 
        message: `Cannot start test in ${test.status} status. Only 'created' tests can be started.` 
      });
    }
    
    // Update test status and start time
    test.status = 'started';
    test.startTime = new Date();
    
    await test.save();
    
    // Populate the questions
    await test.populate('questions');
    
    // Remove solution code and hidden test cases from response for security
    const sanitizedQuestions = test.questions.map(q => {
      const sanitized = q.toObject();
      
      // Remove solutions for programming questions
      if (sanitized.type === 'programming' && sanitized.languages) {
        sanitized.languages = sanitized.languages.map(lang => {
          return {
            ...lang,
            solutionCode: undefined
          };
        });
      }
      
      return sanitized;
    });
    
    res.status(200).json({
      message: 'Practice test started successfully',
      test: {
        _id: test._id,
        title: test.title,
        parameters: test.parameters,
        questions: sanitizedQuestions,
        status: test.status,
        startTime: test.startTime,
        maxPossibleScore: test.maxPossibleScore
      }
    });
  } catch (error) {
    console.error('Error starting practice test:', error);
    res.status(500).json({ message: 'Error starting test', error: error.message });
  }
});

// Submit answer for a test question
router.post('/tests/:id/submit', auth, async (req, res) => {
  try {
    const testId = req.params.id;
    const { questionId, submissionType, selectedOption, code, language, testCaseResults } = req.body;
    
    // Find the test and verify ownership
    const test = await PATest.findOne({ _id: testId, user: req.user.id });
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found or unauthorized' });
    }
    
    if (test.status !== 'started') {
      return res.status(400).json({ 
        message: `Cannot submit answers for test in ${test.status} status. Only 'started' tests accept submissions.` 
      });
    }
    
    // Verify the question belongs to this test
    if (!test.questions.some(q => q.toString() === questionId)) {
      return res.status(400).json({ message: 'Question is not part of this test' });
    }
    
    // Get the question details
    const question = await PAQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Calculate submission details based on question type
    let isCorrect = false;
    let score = 0;
    let status = 'pending';
    let testCasesPassed = 0;
    const timeTaken = Math.floor((new Date() - test.startTime) / 1000); // in seconds
    
    if (submissionType === 'mcq') {
      // Verify the selected option is valid
      const selectedOptionObj = question.options.find(opt => opt._id.toString() === selectedOption);
      
      if (!selectedOptionObj) {
        return res.status(400).json({ message: 'Invalid option selected' });
      }
      
      isCorrect = selectedOptionObj.isCorrect;
      status = isCorrect ? 'accepted' : 'wrong_answer';
      score = isCorrect ? question.marks : 0;
    } 
    else if (submissionType === 'programming') {
      // For programming submissions, calculate correctness based on test case results
      if (!testCaseResults || !Array.isArray(testCaseResults)) {
        return res.status(400).json({ message: 'Test case results are required for programming submissions' });
      }
      
      // Calculate if all test cases passed
      testCasesPassed = testCaseResults.filter(result => result.passed).length;
      const totalTestCases = testCaseResults.length;
      isCorrect = testCasesPassed === totalTestCases && totalTestCases > 0;
      status = isCorrect ? 'accepted' : 'wrong_answer';
      
      // For programming, we can give partial credit based on test cases
      if (totalTestCases > 0) {
        score = Math.round((testCasesPassed / totalTestCases) * question.marks);
      }
    }
    
    // Find existing submission or create new one
    let submission = await PASubmission.findOne({
      test: testId,
      question: questionId,
      user: req.user.id
    });
    
    if (submission) {
      // Update existing submission
      submission.submissionType = submissionType;
      
      if (submissionType === 'mcq') {
        submission.selectedOption = selectedOption;
      } else if (submissionType === 'programming') {
        submission.code = code;
        submission.language = language;
        submission.testCaseResults = testCaseResults;
        submission.testCasesPassed = testCasesPassed;
        submission.totalTestCases = testCaseResults.length;
      }
      
      submission.isCorrect = isCorrect;
      submission.status = status;
      submission.score = score;
      submission.timeTaken = timeTaken;
      submission.submittedAt = new Date();
    } else {
      // Create new submission
      submission = new PASubmission({
        user: req.user.id,
        test: testId,
        question: questionId,
        submissionType,
        selectedOption: submissionType === 'mcq' ? selectedOption : undefined,
        code: submissionType === 'programming' ? code : undefined,
        language: submissionType === 'programming' ? language : undefined,
        testCaseResults: submissionType === 'programming' ? testCaseResults : undefined,
        testCasesPassed: testCasesPassed,
        totalTestCases: submissionType === 'programming' ? testCaseResults.length : 0,
        isCorrect,
        status,
        score,
        timeTaken,
        submittedAt: new Date()
      });
    }
    
    await submission.save();
    
    // Update stats for the question
    if (question.stats) {
      question.stats.totalSubmissions += 1;
      if (isCorrect) {
        question.stats.acceptedSubmissions += 1;
      }
      await question.save();
    }
    
    res.status(200).json({
      message: 'Submission recorded successfully',
      submission: {
        ...submission.toObject(),
        question: questionId // To maintain previous API response format
      }
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ message: 'Error submitting answer', error: error.message });
  }
});

// End a test (manually or due to time expiration)
router.put('/tests/:id/end', auth, async (req, res) => {
  try {
    const testId = req.params.id;
    
    // Find the test and verify ownership
    const test = await PATest.findOne({ _id: testId, user: req.user.id });
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found or unauthorized' });
    }
    
    if (test.status !== 'started') {
      return res.status(400).json({ 
        message: `Cannot end test in ${test.status} status. Only 'started' tests can be ended.` 
      });
    }
    
    // Get all submissions for this test
    const submissions = await PASubmission.find({ test: testId, user: req.user.id });
    
    // Calculate total score
    const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);
    
    // Mark test as completed
    test.status = 'completed';
    test.endTime = new Date();
    test.totalTimeTaken = Math.floor((test.endTime - test.startTime) / 1000);
    test.totalScore = totalScore;
    
    await test.save();
    
    res.status(200).json({
      message: 'Practice test ended successfully',
      test: {
        _id: test._id,
        title: test.title,
        status: test.status,
        startTime: test.startTime,
        endTime: test.endTime,
        totalTimeTaken: test.totalTimeTaken,
        submissions: submissions.length,
        totalQuestions: test.questions.length,
        totalScore: test.totalScore,
        maxPossibleScore: test.maxPossibleScore
      }
    });
  } catch (error) {
    console.error('Error ending practice test:', error);
    res.status(500).json({ message: 'Error ending test', error: error.message });
  }
});

// Get all tests for a user - include submission counts
router.get('/tests', auth, async (req, res) => {
  try {
    const tests = await PATest.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-questions');
    
    // Get submission counts for each test
    const testResults = await Promise.all(tests.map(async (test) => {
      const submissions = await PASubmission.find({ test: test._id, user: req.user.id });
      const correctSubmissions = submissions.filter(sub => sub.isCorrect).length;
      
      return {
        ...test.toObject(),
        submissionCount: submissions.length,
        correctSubmissions
      };
    }));
    
    res.status(200).json(testResults);
  } catch (error) {
    console.error('Error fetching user tests:', error);
    res.status(500).json({ message: 'Error fetching tests', error: error.message });
  }
});

// Get a specific test by ID with submissions
router.get('/tests/:id', auth, async (req, res) => {
  try {
    const testId = req.params.id;
    
    // Find the test and verify ownership
    const test = await PATest.findOne({ _id: testId, user: req.user.id })
      .populate('questions');
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found or unauthorized' });
    }
    
    // Get all submissions for this test
    const submissions = await PASubmission.find({ test: testId, user: req.user.id })
      .populate('question');
    
    // Add submissions to the response
    const testWithSubmissions = {
      ...test.toObject(),
      submissions
    };
    
    res.status(200).json(testWithSubmissions);
  } catch (error) {
    console.error('Error fetching test details:', error);
    res.status(500).json({ message: 'Error fetching test details', error: error.message });
  }
});

module.exports = router; 