const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const Cohort = require('../models/Cohort');
const Module = require('../models/Module');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const UserCohort = require('../models/UserCohort');
const User = require('../models/User');
const mongoose = require('mongoose');
const Note = require('../models/Note');
const QuestionReport = require('../models/QuestionReport');
const Notification = require('../models/Notification');

// Get all cohorts (admin view)
router.get('/admin', [auth, adminAuth], async (req, res) => {
  try {
    const cohorts = await Cohort.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(cohorts);
  } catch (err) {
    console.error('Error fetching cohorts:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all cohorts (user view - only eligible cohorts)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get cohorts where the user is eligible
    const eligibleCohorts = await Cohort.find({
      eligibleUsers: userId,
      isActive: true,
      isDraft: false
    }).populate('createdBy', 'name email');
    
    // Get the user's cohort progress
    const userCohorts = await UserCohort.find({ user: userId });
    
    // Combine the data
    const cohortsWithProgress = eligibleCohorts.map(cohort => {
      const userCohort = userCohorts.find(uc => 
        uc.cohort.toString() === cohort._id.toString()
      );
      
      return {
        ...cohort._doc,
        userProgress: userCohort ? {
          status: userCohort.status,
          totalScore: userCohort.totalScore,
          rank: userCohort.rank
        } : null
      };
    });
    
    res.json(cohortsWithProgress);
  } catch (err) {
    console.error('Error fetching cohorts:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get a specific cohort (admin view)
router.get('/admin/:id', [auth, adminAuth], async (req, res) => {
  try {
    const cohortId = req.params.id;
    console.log(`Admin fetching cohort: ${cohortId}`);
    
    // Check if the cohort exists
    const cohort = await Cohort.findById(cohortId)
      .populate('createdBy', 'name email')
      .populate({
        path: 'modules',
        populate: {
          path: 'questions'
        }
      })
      .populate('eligibleUsers', 'name email rollNumber department graduatingYear');
    
    if (!cohort) {
      console.log(`Cohort ${cohortId} not found in the database (admin view)`);
      return res.status(404).json({ message: 'Cohort not found', reason: 'not_found' });
    }
    
    console.log(`Successfully fetched cohort ${cohortId} for admin with ${cohort.modules?.length || 0} modules`);
    res.json(cohort);
  } catch (err) {
    console.error('Error fetching cohort:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get a specific cohort (user view)
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const cohortId = req.params.id;
    
    console.log(`Fetching cohort: ${cohortId}, user: ${userId}`);
    
    // First check if the cohort exists at all
    const cohortExists = await Cohort.findById(cohortId);
    if (!cohortExists) {
      console.log(`Cohort ${cohortId} not found in the database`);
      return res.status(404).json({ message: 'Cohort not found', reason: 'not_found' });
    }
    
    // Check if user is admin - use consistent property access
    const isAdmin = req.user.userType === 'admin';
    console.log(`User is admin: ${isAdmin}`);
    
    // If admin, skip the eligibility checks
    if (!isAdmin) {
      const isEligible = cohortExists.eligibleUsers.some(id => id.toString() === userId.toString());
      const isActive = cohortExists.isActive;
      const isDraft = cohortExists.isDraft;
      
      console.log(`User eligibility check - isEligible: ${isEligible}, isActive: ${isActive}, isDraft: ${isDraft}`);
      
      if (!isEligible) {
        return res.status(403).json({ message: 'You are not eligible for this cohort', reason: 'not_eligible' });
      }
      
      if (!isActive) {
        return res.status(403).json({ message: 'This cohort is not active', reason: 'not_active' });
      }
      
      if (isDraft) {
        return res.status(403).json({ message: 'This cohort is in draft mode', reason: 'draft_mode' });
      }
    } else {
      console.log(`Admin user: bypassing eligibility checks for cohort ${cohortId}`);
    }
    
    // Get the cohort with properly populated fields
    const cohort = await Cohort.findById(cohortId)
      .populate('createdBy', 'name email')
      .lean(); // Use lean() for better performance
    
    // Get the modules for this cohort
    const modules = await Module.find({ cohort: cohortId })
      .sort({ order: 1 })
      .populate({
        path: 'questions',
        select: 'title type difficultyLevel marks stats'
      });
    
    // Get the user's progress
    const userCohort = await UserCohort.findOne({
      user: userId,
      cohort: cohortId
    });
    
    // Get cohort leaderboard
    const leaderboard = await UserCohort.find({ cohort: cohortId })
      .sort({ totalScore: -1 })
      .limit(10)
      .populate('user', 'name rollNumber department');
    
    // EXPLICITLY fetch the top 3 enrolled users with profile pictures
    // Convert ID strings to ObjectIds if necessary
    const userIds = cohort.eligibleUsers.map(id => 
      typeof id === 'string' ? mongoose.Types.ObjectId(id) : id
    );
    
    // Get top 3 eligible users with their profile pictures
    const enrolledUsers = await User.find({ 
      _id: { $in: userIds }
    })
    .select('name profilePicture')
    .limit(3);
    
    console.log('Enrolled users with profile pictures:', JSON.stringify(enrolledUsers));
    
    // Combine the data
    const result = {
      ...cohort,
      modules,
      userProgress: userCohort ? {
        status: userCohort.status,
        totalScore: userCohort.totalScore,
        rank: userCohort.rank,
        moduleProgress: userCohort.moduleProgress,
        questionProgress: userCohort.questionProgress
      } : null,
      leaderboard: leaderboard.map(entry => ({
        user: entry.user,
        totalScore: entry.totalScore,
        rank: entry.rank
      })),
      enrolledUsers: enrolledUsers
    };
    
    console.log(`Successfully fetched cohort ${cohortId} with ${modules.length} modules`);
    console.log(`Included ${enrolledUsers.length} enrolled users with profile data`);
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching cohort:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get modules for a specific cohort
router.get('/:id/modules', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const cohortId = req.params.id;
    
    console.log(`Fetching modules for cohort: ${cohortId}, user: ${userId}`);
    console.log(`User type: ${req.user.userType}, isAdmin check: ${req.user.userType === 'admin'}`);
    
    // Check if user is admin
    const isAdmin = req.user.userType === 'admin';
    console.log(`User is admin: ${isAdmin}`);
    
    // First check if the cohort exists at all
    const cohortExists = await Cohort.findById(cohortId);
    if (!cohortExists) {
      console.log(`Cohort ${cohortId} not found in the database`);
      return res.status(404).json({ message: 'Cohort not found', reason: 'not_found' });
    }
    
    // If user is admin, skip eligibility checks
    if (isAdmin) {
      console.log(`Admin user: bypassing eligibility checks`);
      const modules = await Module.find({ cohort: cohortId })
        .sort({ order: 1 })
        .populate({
          path: 'questions',
          select: 'title type difficultyLevel marks stats'
        });
      
      console.log(`Found ${modules.length} modules for cohort ${cohortId} (admin access)`);
      return res.json({ modules });
    }
    
    // For regular users, check eligibility
    const isEligible = cohortExists.eligibleUsers.some(id => id.toString() === userId.toString());
    const isActive = cohortExists.isActive;
    const isDraft = cohortExists.isDraft;
    
    console.log(`User eligibility check - isEligible: ${isEligible}, isActive: ${isActive}, isDraft: ${isDraft}`);
    
    if (!isEligible) {
      return res.status(403).json({ message: 'You are not eligible for this cohort', reason: 'not_eligible' });
    }
    
    if (!isActive) {
      return res.status(403).json({ message: 'This cohort is not active', reason: 'not_active' });
    }
    
    if (isDraft) {
      return res.status(403).json({ message: 'This cohort is in draft mode', reason: 'draft_mode' });
    }
    
    // Get the modules for this cohort
    const modules = await Module.find({ cohort: cohortId })
      .sort({ order: 1 })
      .populate({
        path: 'questions',
        select: 'title type difficultyLevel marks stats'
      });
    
    console.log(`Found ${modules.length} modules for cohort ${cohortId}`);
    res.json({ modules });
  } catch (err) {
    console.error('Error fetching modules:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get a specific module from a cohort
router.get('/:id/modules/:moduleId', auth, async (req, res) => {
  try {
    const { id: cohortId, moduleId } = req.params;
    const userId = req.user.id;
    
    // Check if user is admin
    const isAdmin = req.user.userType === 'admin';
    
    // Verify the cohort exists and user has access
    let cohort;
    if (isAdmin) {
      cohort = await Cohort.findById(cohortId);
    } else {
      cohort = await Cohort.findOne({
        _id: cohortId,
        eligibleUsers: userId,
        isActive: true,
        isDraft: false
      });
    }
    
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found or not eligible' });
    }
    
    // Find the specific module
    const module = await Module.findOne({
      _id: moduleId,
      cohort: cohortId
    }).populate({
      path: 'questions',
      select: isAdmin ? '' : 'title type difficultyLevel marks stats'
    });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    res.json(module);
  } catch (err) {
    console.error('Error fetching module:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get questions for a specific module in a cohort
router.get('/:id/modules/:moduleId/questions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const cohortId = req.params.id;
    
    console.log(`Fetching questions for cohort: ${cohortId}, user: ${userId}`);
    console.log(`User type: ${req.user.userType}, isAdmin check: ${req.user.userType === 'admin'}`);
    
    // Check if user is admin
    const isAdmin = req.user.userType === 'admin';
    console.log(`User is admin: ${isAdmin}`);
    
    // First check if the cohort exists at all
    const cohortExists = await Cohort.findById(cohortId);
    if (!cohortExists) {
      console.log(`Cohort ${cohortId} not found in the database`);
      return res.status(404).json({ message: 'Cohort not found', reason: 'not_found' });
    }
    
    // If user is admin, skip eligibility checks
    if (isAdmin) {
      console.log(`Admin user: bypassing eligibility checks`);
      const questions = await Question.find({ cohort: cohortId });
      return res.json({ questions });
    }
    
    // For regular users, check eligibility
    const isEligible = cohortExists.eligibleUsers.some(id => id.toString() === userId.toString());
    const isActive = cohortExists.isActive;
    const isDraft = cohortExists.isDraft;
    
    console.log(`User eligibility check - isEligible: ${isEligible}, isActive: ${isActive}, isDraft: ${isDraft}`);
    
    if (!isEligible) {
      return res.status(403).json({ message: 'You are not eligible for this cohort', reason: 'not_eligible' });
    }
    
    if (!isActive) {
      return res.status(403).json({ message: 'This cohort is not active', reason: 'not_active' });
    }
    
    if (isDraft) {
      return res.status(403).json({ message: 'This cohort is in draft mode', reason: 'draft_mode' });
    }
    
    // Get the questions for this cohort
    const questions = await Question.find({ cohort: cohortId });
    
    console.log(`Found ${questions.length} questions for cohort ${cohortId}`);
    res.json({ questions });
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create a new cohort
router.post('/', [auth, adminAuth], async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      videoResource,
      documentationUrl,
      isActive,
      isDraft,
      eligibleUserIds
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['title', 'description', 'startDate', 'endDate']
      });
    }
    
    // Create the cohort
    const cohort = new Cohort({
      title,
      description,
      startDate,
      endDate,
      videoResource,
      documentationUrl,
      isActive: isActive !== undefined ? isActive : true,
      isDraft: isDraft !== undefined ? isDraft : true,
      eligibleUsers: eligibleUserIds || [],
      createdBy: req.user.id
    });
    
    await cohort.save();
    
    res.status(201).json(cohort);
  } catch (err) {
    console.error('Error creating cohort:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a cohort
router.put('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      videoResource,
      documentationUrl,
      isActive,
      isDraft,
      eligibleUserIds
    } = req.body;
    
    // Find the cohort
    const cohort = await Cohort.findById(req.params.id);
    
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }
    
    // Update the fields
    if (title) cohort.title = title;
    if (description) cohort.description = description;
    if (startDate) cohort.startDate = startDate;
    if (endDate) cohort.endDate = endDate;
    if (videoResource !== undefined) cohort.videoResource = videoResource;
    if (documentationUrl !== undefined) cohort.documentationUrl = documentationUrl;
    if (isActive !== undefined) cohort.isActive = isActive;
    if (isDraft !== undefined) cohort.isDraft = isDraft;
    if (eligibleUserIds) cohort.eligibleUsers = eligibleUserIds;
    
    await cohort.save();
    
    res.json(cohort);
  } catch (err) {
    console.error('Error updating cohort:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a cohort
router.delete('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id);
    
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }
    
    // Delete the cohort and all related modules, questions, and user progress
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Get all modules for this cohort
      const modules = await Module.find({ cohort: cohort._id });
      const moduleIds = modules.map(module => module._id);
      
      // Get all questions for these modules
      const questions = await Question.find({ module: { $in: moduleIds } });
      const questionIds = questions.map(question => question._id);
      
      // Delete all submissions for these questions
      await Submission.deleteMany({ question: { $in: questionIds } });
      
      // Delete all user cohort progress
      await UserCohort.deleteMany({ cohort: cohort._id });
      
      // Delete all questions for these modules
      await Question.deleteMany({ module: { $in: moduleIds } });
      
      // Delete all modules for this cohort
      await Module.deleteMany({ cohort: cohort._id });
      
      // Delete the cohort itself
      await Cohort.findByIdAndDelete(cohort._id);
      
      await session.commitTransaction();
      
      res.json({ message: 'Cohort and all related data deleted successfully' });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Error deleting cohort:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add eligible users to a cohort - top performers
router.post('/:id/add-top-users', [auth, adminAuth], async (req, res) => {
  try {
    const { count } = req.body;
    
    if (!count || isNaN(count) || count <= 0) {
      return res.status(400).json({ message: 'Invalid count provided' });
    }
    
    const cohort = await Cohort.findById(req.params.id);
    
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }
    
    // Get top users by total score
    const topUsers = await User.find({ userType: 'user' })
      .sort({ totalScore: -1 })
      .limit(parseInt(count))
      .select('_id');
    
    const topUserIds = topUsers.map(user => user._id);
    
    // Add these users to eligible list if not already there
    const existingEligibleUserIds = cohort.eligibleUsers.map(id => id.toString());
    const newEligibleUserIds = topUserIds.filter(
      id => !existingEligibleUserIds.includes(id.toString())
    );
    
    cohort.eligibleUsers = [...cohort.eligibleUsers, ...newEligibleUserIds];
    await cohort.save();
    
    res.json({
      message: `Added ${newEligibleUserIds.length} top users to cohort`,
      totalEligibleUsers: cohort.eligibleUsers.length
    });
  } catch (err) {
    console.error('Error adding top users to cohort:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Apply to a cohort (user)
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const cohortId = req.params.id;
    
    // Check if the cohort exists and is active
    const cohort = await Cohort.findOne({
      _id: cohortId,
      isActive: true,
      isDraft: false
    });
    
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found or not active' });
    }
    
    // Check if the user is eligible
    const isEligible = cohort.eligibleUsers.some(
      id => id.toString() === userId
    );
    
    if (!isEligible) {
      return res.status(403).json({ message: 'You are not eligible for this cohort' });
    }
    
    // Check if the user has already applied/enrolled
    let userCohort = await UserCohort.findOne({
      user: userId,
      cohort: cohortId
    });
    
    if (userCohort) {
      return res.status(400).json({
        message: `You have already ${userCohort.status} for this cohort`
      });
    }
    
    // Create a new user cohort record
    userCohort = new UserCohort({
      user: userId,
      cohort: cohortId,
      status: 'applied',
      enrolledAt: new Date()
    });
    
    await userCohort.save();
    
    res.status(201).json({
      message: 'Successfully applied to cohort',
      userCohort
    });
  } catch (err) {
    console.error('Error applying to cohort:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Auto-enroll in a cohort for eligible users
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const cohortId = req.params.id;
    
    // Check if the cohort exists and is active
    const cohort = await Cohort.findOne({
      _id: cohortId,
      isActive: true,
      isDraft: false
    });
    
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found or not active' });
    }
    
    // Check if the user is eligible
    const isEligible = cohort.eligibleUsers.some(
      id => id.toString() === userId
    );
    
    if (!isEligible) {
      return res.status(403).json({ message: 'You are not eligible for this cohort' });
    }
    
    // Check if the user has already enrolled
    let userCohort = await UserCohort.findOne({
      user: userId,
      cohort: cohortId
    });
    
    if (userCohort) {
      // If the user has applied but not enrolled, update status to enrolled
      if (userCohort.status === 'applied') {
        userCohort.status = 'enrolled';
        userCohort.enrolledAt = new Date();
        await userCohort.save();
        
        return res.json({
          message: 'Successfully enrolled in cohort',
          userCohort
        });
      }
      
      // If already enrolled or completed, return current status
      return res.json({
        message: `You are already ${userCohort.status} in this cohort`,
        userCohort
      });
    }
    
    // Create a new user cohort record with enrolled status
    userCohort = new UserCohort({
      user: userId,
      cohort: cohortId,
      status: 'enrolled',
      enrolledAt: new Date()
    });
    
    // Initialize module progress
    const modules = await Module.find({ cohort: cohortId });
    
    for (const module of modules) {
      // Get questions count
      const questionsCount = await Question.countDocuments({ module: module._id });
      
      userCohort.moduleProgress.push({
        module: module._id,
        questionsCompleted: 0,
        totalQuestions: questionsCount,
        score: 0,
        completed: false
      });
    }
    
    await userCohort.save();
    
    // Return success response
    res.status(201).json({
      message: 'Successfully enrolled in cohort',
      userCohort
    });
  } catch (err) {
    console.error('Error enrolling in cohort:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add eligible users to a cohort
router.post('/:id/eligible-users', [auth, adminAuth], async (req, res) => {
  try {
    const cohortId = req.params.id;
    const { userIds } = req.body;
    
    console.log(`Adding ${userIds?.length || 0} eligible users to cohort ${cohortId}`);
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        message: 'No valid user IDs provided',
        example: { userIds: ['userId1', 'userId2'] }
      });
    }
    
    // Find the cohort
    const cohort = await Cohort.findById(cohortId);
    
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found', reason: 'not_found' });
    }
    
    // Convert existing eligibleUsers to string format for easy comparison
    const existingUserIds = cohort.eligibleUsers.map(id => id.toString());
    
    // Filter out IDs that already exist
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id.toString()));
    
    // Add the new IDs to the cohort's eligibleUsers array
    cohort.eligibleUsers = [...cohort.eligibleUsers, ...newUserIds];
    
    await cohort.save();
    
    console.log(`Added ${newUserIds.length} new users to cohort ${cohortId}`);
    
    res.json({ 
      message: `Added ${newUserIds.length} new users to cohort`,
      totalEligibleUsers: cohort.eligibleUsers.length,
      newUsersAdded: newUserIds.length,
      alreadyExistingUsers: userIds.length - newUserIds.length
    });
  } catch (err) {
    console.error('Error adding eligible users to cohort:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// MODULES API Endpoints

// Create a new module in a cohort
router.post('/:cohortId/modules', [auth, adminAuth], async (req, res) => {
  try {
    const {
      title,
      description,
      order,
      videoResource,
      documentationUrl,
      resources
    } = req.body;
    
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['title', 'description']
      });
    }
    
    // Check if the cohort exists
    const cohort = await Cohort.findById(req.params.cohortId);
    
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }
    
    // Find the highest order if not provided
    let moduleOrder = order;
    if (!moduleOrder) {
      const highestOrderModule = await Module.findOne({ cohort: cohort._id })
        .sort({ order: -1 });
      
      moduleOrder = highestOrderModule ? highestOrderModule.order + 1 : 0;
    }
    
    // Create the module
    const module = new Module({
      title,
      description,
      order: moduleOrder,
      videoResource,
      documentationUrl,
      resources: resources || [],
      cohort: cohort._id
    });
    
    await module.save();
    
    // Add the module to the cohort
    cohort.modules.push(module._id);
    await cohort.save();
    
    res.status(201).json(module);
  } catch (err) {
    console.error('Error creating module:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a module
router.put('/:cohortId/modules/:moduleId', [auth, adminAuth], async (req, res) => {
  try {
    const {
      title,
      description,
      order,
      videoResource,
      documentationUrl,
      resources
    } = req.body;
    
    // Find the module
    const module = await Module.findOne({
      _id: req.params.moduleId,
      cohort: req.params.cohortId
    });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Update the fields
    if (title) module.title = title;
    if (description) module.description = description;
    if (order !== undefined) module.order = order;
    if (videoResource !== undefined) module.videoResource = videoResource;
    if (documentationUrl !== undefined) module.documentationUrl = documentationUrl;
    if (resources) module.resources = resources;
    
    await module.save();
    
    res.json(module);
  } catch (err) {
    console.error('Error updating module:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a module
router.delete('/:cohortId/modules/:moduleId', [auth, adminAuth], async (req, res) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Find the module
      const module = await Module.findOne({
        _id: req.params.moduleId,
        cohort: req.params.cohortId
      });
      
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }
      
      // Find the cohort
      const cohort = await Cohort.findById(req.params.cohortId);
      
      if (!cohort) {
        return res.status(404).json({ message: 'Cohort not found' });
      }
      
      // Get all questions for this module
      const questions = await Question.find({ module: module._id });
      const questionIds = questions.map(question => question._id);
      
      // Delete all submissions for these questions
      await Submission.deleteMany({ question: { $in: questionIds } });
      
      // Update user progress
      await UserCohort.updateMany(
        { cohort: cohort._id },
        {
          $pull: {
            moduleProgress: { module: module._id },
            questionProgress: { question: { $in: questionIds } }
          }
        }
      );
      
      // Delete all questions for this module
      await Question.deleteMany({ module: module._id });
      
      // Remove module from cohort
      cohort.modules = cohort.modules.filter(
        id => id.toString() !== module._id.toString()
      );
      await cohort.save();
      
      // Delete the module
      await Module.findByIdAndDelete(module._id);
      
      await session.commitTransaction();
      
      res.json({ message: 'Module and all related data deleted successfully' });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Error deleting module:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// QUESTIONS API Endpoints

// Create a new question in a module
router.post('/:cohortId/modules/:moduleId/questions', [auth, adminAuth], async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      difficultyLevel,
      marks,
      options,
      languages,
      defaultLanguage,
      testCases,
      examples,
      constraints,
      hints,
      tags,
      companies
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !type) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['title', 'description', 'type']
      });
    }
    
    // Check if the module exists
    const module = await Module.findOne({
      _id: req.params.moduleId,
      cohort: req.params.cohortId
    });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Build the question object based on type
    const questionData = {
      title,
      description,
      type,
      difficultyLevel: difficultyLevel || 'medium',
      marks: marks || 10,
      module: module._id,
      hints: hints || [],
      tags: tags || [],
      companies: companies || [],
      createdBy: req.user.id
    };
    
    // Add type-specific fields
    if (type === 'mcq') {
      questionData.options = options || [];
    } else if (type === 'programming') {
      questionData.languages = languages || [];
      questionData.defaultLanguage = defaultLanguage || 'python';
      questionData.testCases = testCases || [];
      questionData.examples = examples || [];
      questionData.constraints = constraints || {
        timeLimit: 1000,
        memoryLimit: 256
      };
    }
    
    // Create the question
    const question = new Question(questionData);
    
    await question.save();
    
    // Add the question to the module
    module.questions.push(question._id);
    await module.save();
    
    // Update user cohorts with a new question entry
    const userCohorts = await UserCohort.find({ cohort: req.params.cohortId });
    for (const userCohort of userCohorts) {
      // Check if the module is already in progress
      const moduleProgressIndex = userCohort.moduleProgress.findIndex(
        mp => mp.module.toString() === module._id.toString()
      );
      
      if (moduleProgressIndex !== -1) {
        // Update module progress
        userCohort.moduleProgress[moduleProgressIndex].totalQuestions += 1;
        
        // Add new question progress
        userCohort.questionProgress.push({
          question: question._id,
          attempts: 0,
          solved: false,
          bestScore: 0
        });
        
        await userCohort.save();
      }
    }
    
    res.status(201).json(question);
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get a specific question
router.get('/:cohortId/modules/:moduleId/questions/:questionId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cohortId, moduleId, questionId } = req.params;
    
    // Check if the user is eligible for this cohort
    const cohort = await Cohort.findOne({
      _id: cohortId,
      eligibleUsers: userId,
      isActive: true,
      isDraft: false
    });
    
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found or not eligible' });
    }
    
    // Get the question
    const question = await Question.findOne({
      _id: questionId,
      module: moduleId
    });
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Filter out hidden test cases for non-admin users
    if (!req.user.userType === 'admin' && question.type === 'programming') {
      question.testCases = question.testCases.filter(tc => !tc.hidden);
    }
    
    // Get the user's progress for this question
    const userCohort = await UserCohort.findOne({
      user: userId,
      cohort: cohortId
    });
    
    const questionProgress = userCohort?.questionProgress?.find(
      qp => qp.question.toString() === questionId
    );
    
    // Get recent submissions
    const submissions = await Submission.find({
      user: userId,
      question: questionId
    })
    .sort({ submittedAt: -1 })
    .limit(5);
    
    const result = {
      ...question._doc,
      userProgress: questionProgress || null,
      submissions
    };
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching question:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get complete question data for editing (admin only)
router.get('/:cohortId/modules/:moduleId/questions/:questionId/edit', [auth, adminAuth], async (req, res) => {
  try {
    const { cohortId, moduleId, questionId } = req.params;
    
    // Check if the module exists and belongs to the cohort
    const module = await Module.findOne({
      _id: moduleId,
      cohort: cohortId
    });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Get the complete question data with all fields
    const question = await Question.findOne({
      _id: questionId,
      module: moduleId
    }).lean();
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Return the complete question data with all fields
    console.log('Sending complete question data for editing:', questionId);
    res.json(question);
    
  } catch (err) {
    console.error('Error fetching question for editing:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update an existing question
router.put('/:cohortId/modules/:moduleId/questions/:questionId', [auth, adminAuth], async (req, res) => {
  try {
    const { cohortId, moduleId, questionId } = req.params;
    
    // Check if the module exists and belongs to the cohort
    const module = await Module.findOne({
      _id: moduleId,
      cohort: cohortId
    });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check if the question exists and belongs to the module
    const question = await Question.findOne({
      _id: questionId,
      module: moduleId
    });
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Extract fields from request body
    const {
      title,
      description,
      type,
      difficultyLevel,
      marks,
      options,
      languages,
      defaultLanguage,
      testCases,
      examples,
      constraints,
      hints,
      tags,
      companies,
      module: moduleFromBody
    } = req.body;
    
    // Update the question
    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      {
        title: title || question.title,
        description: description || question.description,
        type: type || question.type,
        difficultyLevel: difficultyLevel || question.difficultyLevel,
        marks: marks || question.marks,
        options: type === 'mcq' ? options : question.options,
        languages: type === 'programming' ? languages : question.languages,
        defaultLanguage: type === 'programming' ? defaultLanguage : question.defaultLanguage,
        testCases: type === 'programming' ? testCases : question.testCases,
        examples: type === 'programming' ? examples : question.examples,
        constraints: type === 'programming' ? constraints : question.constraints,
        hints: hints || question.hints,
        tags: tags || question.tags,
        companies: companies || question.companies,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    res.json(updatedQuestion);
  } catch (err) {
    console.error('Error updating question:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a question
router.delete('/:cohortId/modules/:moduleId/questions/:questionId', [auth, adminAuth], async (req, res) => {
  try {
    const { cohortId, moduleId, questionId } = req.params;
    
    // Check if the module exists and belongs to the cohort
    const module = await Module.findOne({
      _id: moduleId,
      cohort: cohortId
    });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check if the question exists and belongs to the module
    const question = await Question.findOne({
      _id: questionId,
      module: moduleId
    });
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Start a session to handle multiple operations
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Delete all submissions for this question
      await Submission.deleteMany({ question: questionId });
      
      // Update user progress data to remove this question
      await UserCohort.updateMany(
        { cohort: cohortId },
        { 
          $pull: { 
            questionProgress: { question: questionId } 
          }
        }
      );
      
      // Update module progress counts
      await UserCohort.updateMany(
        { 
          cohort: cohortId,
          'moduleProgress.module': moduleId 
        },
        { 
          $inc: { 'moduleProgress.$.totalQuestions': -1 } 
        }
      );
      
      // Remove question from module
      module.questions = module.questions.filter(
        qId => qId.toString() !== questionId.toString()
      );
      await module.save();
      
      // Delete the question
      await Question.findByIdAndDelete(questionId);
      
      await session.commitTransaction();
      
      res.json({ message: 'Question deleted successfully' });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
    
  } catch (err) {
    console.error('Error deleting question:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Submit answer to a question
router.post('/:cohortId/modules/:moduleId/questions/:questionId/submit', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cohortId, moduleId, questionId } = req.params;
    const { 
      code, 
      language, 
      selectedOption, 
      testCaseResults, 
      status, 
      isCorrect,
      executionTime,
      memoryUsed,
      submissionType 
    } = req.body;
    
    console.log(`Processing submission for question ${questionId}, user ${userId}, type: ${submissionType}`);
    
    // Check if the user is eligible for this cohort
    const userCohort = await UserCohort.findOne({
      user: userId,
      cohort: cohortId
    });
    
    if (!userCohort) {
      console.log(`User ${userId} is not enrolled in cohort ${cohortId}`);
      return res.status(403).json({ message: 'Not enrolled in this cohort' });
    }
    
    // Get the question
    const question = await Question.findOne({
      _id: questionId,
      module: moduleId
    });
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Create a submission based on question type
    let submission;
    let submissionIsCorrect = false;
    
    if (submissionType === 'mcq') {
      console.log('Processing MCQ submission');
      // Check the selected option
      if (!selectedOption) {
        return res.status(400).json({ message: 'No option selected' });
      }
      
      // Find the selected option in the question
      const option = question.options.find(
        opt => opt._id.toString() === selectedOption
      );
      
      if (!option) {
        return res.status(400).json({ message: 'Invalid option selected' });
      }
      
      const isOptionCorrect = option.isCorrect;
      submissionIsCorrect = isOptionCorrect;
      
      console.log(`MCQ submission - isCorrect: ${isOptionCorrect}, marks: ${question.marks}`);
      
      // Create submission record
      submission = new Submission({
        user: userId,
        question: questionId,
        module: moduleId,
        cohort: cohortId,
        submissionType: 'mcq',
        selectedOption,
        isCorrect: isOptionCorrect,
        // Set proper status based on correctness instead of defaulting to pending
        status: isOptionCorrect ? 'accepted' : 'wrong_answer',
        score: isOptionCorrect ? question.marks : 0
      });
      
      await submission.save();
      console.log('MCQ submission saved with status:', submission.status);
    } else if (submissionType === 'programming') {
      // Handle programming submission
      if (!code || !language || !testCaseResults) {
        return res.status(400).json({
          message: 'Missing required fields',
          required: ['code', 'language', 'testCaseResults']
        });
      }
      
      // Create submission with the execution results from frontend
      submission = new Submission({
        user: userId,
        question: questionId,
        module: moduleId,
        cohort: cohortId,
        submissionType: 'programming',
        code,
        language,
        status: status || (isCorrect ? 'accepted' : 'wrong_answer'),
        testCaseResults: testCaseResults || [],
        executionTime: executionTime || 0,
        memoryUsed: memoryUsed || 0,
        isCorrect: !!isCorrect,
        score: isCorrect ? question.marks : 0
      });
      
      submissionIsCorrect = !!isCorrect;
      await submission.save();
    } else {
      return res.status(400).json({ message: 'Invalid submission type' });
    }
    
    // Update question stats
    question.stats.totalSubmissions += 1;
    if (submissionIsCorrect) {
      question.stats.acceptedSubmissions += 1;
    }
    await question.save();
    
    console.log(`Updating user progress for question ${questionId} in module ${moduleId}`);
    
    // Update user progress
    const questionProgressIndex = userCohort.questionProgress.findIndex(
      qp => qp.question.toString() === questionId
    );
    
    if (questionProgressIndex !== -1) {
      const qp = userCohort.questionProgress[questionProgressIndex];
      qp.attempts += 1;
      
      // Update solved status and best score if better than previous
      if (submissionIsCorrect) {
        qp.solved = true;
        if (submission.score > qp.bestScore) {
          qp.bestScore = submission.score;
          qp.solvedAt = new Date();
        }
      }
      
      console.log(`Updated existing question progress: attempts=${qp.attempts}, solved=${qp.solved}, bestScore=${qp.bestScore}`);
    } else {
      // Add new question progress entry
      userCohort.questionProgress.push({
        question: questionId,
        attempts: 1,
        solved: submissionIsCorrect,
        bestScore: submissionIsCorrect ? submission.score : 0,
        solvedAt: submissionIsCorrect ? new Date() : null
      });
      
      console.log(`Added new question progress: solved=${submissionIsCorrect}, bestScore=${submissionIsCorrect ? submission.score : 0}`);
    }
    
    // Update module progress
    const moduleProgressIndex = userCohort.moduleProgress.findIndex(
      mp => mp.module.toString() === moduleId
    );
    
    if (moduleProgressIndex !== -1) {
      const mp = userCohort.moduleProgress[moduleProgressIndex];
      
      // Calculate how many questions are solved in this module
      const moduleQuestions = await Question.find({ module: moduleId });
      const solvedQuestionIds = userCohort.questionProgress
        .filter(qp => qp.solved)
        .map(qp => qp.question.toString());
      
      const solvedModuleQuestions = moduleQuestions.filter(
        q => solvedQuestionIds.includes(q._id.toString())
      );
      
      // Update module progress
      mp.questionsCompleted = solvedModuleQuestions.length;
      mp.totalQuestions = moduleQuestions.length;
      
      // Calculate total score from all solved questions in this module
      mp.score = userCohort.questionProgress
        .filter(qp => 
          moduleQuestions.some(q => q._id.toString() === qp.question.toString()) && qp.solved
        )
        .reduce((sum, qp) => sum + qp.bestScore, 0);
      
      // Check if module is completed
      mp.completed = mp.questionsCompleted === mp.totalQuestions && mp.totalQuestions > 0;
      if (mp.completed && !mp.completedAt) {
        mp.completedAt = new Date();
      }
      
      console.log(`Updated module progress: questionsCompleted=${mp.questionsCompleted}/${mp.totalQuestions}, score=${mp.score}, completed=${mp.completed}`);
    } else {
      // Add new module progress entry
      const moduleQuestions = await Question.find({ module: moduleId });
      const isModuleCompleted = moduleQuestions.length === 1 && submissionIsCorrect;
      
      userCohort.moduleProgress.push({
        module: moduleId,
        questionsCompleted: submissionIsCorrect ? 1 : 0,
        totalQuestions: moduleQuestions.length,
        score: submissionIsCorrect ? submission.score : 0,
        completed: isModuleCompleted,
        completedAt: isModuleCompleted ? new Date() : null
      });
      
      console.log(`Added new module progress: questionsCompleted=${submissionIsCorrect ? 1 : 0}/${moduleQuestions.length}, score=${submissionIsCorrect ? submission.score : 0}`);
    }
    
    // Calculate total score across all modules
    userCohort.totalScore = userCohort.questionProgress
      .filter(qp => qp.solved)
      .reduce((sum, qp) => sum + qp.bestScore, 0);
    
    console.log(`Updated total user score: ${userCohort.totalScore}`);
    
    // Check if the entire cohort is completed
    const cohortModules = await Module.find({ cohort: cohortId });
    const completedModules = userCohort.moduleProgress.filter(mp => mp.completed);
    
    if (completedModules.length === cohortModules.length && cohortModules.length > 0) {
      userCohort.status = 'completed';
      userCohort.completedAt = new Date();
      console.log(`Cohort marked as completed!`);
    }
    
    await userCohort.save();
    console.log(`Saved userCohort updates to database`);
    
    // Update cohort leaderboard rankings
    await updateCohortLeaderboard(cohortId);
    
    // Return the submission result with detailed progress information
    res.json({
      submission,
      isCorrect: submissionIsCorrect,
      userProgress: {
        questionProgress: userCohort.questionProgress.find(
          qp => qp.question.toString() === questionId
        ),
        moduleProgress: userCohort.moduleProgress.find(
          mp => mp.module.toString() === moduleId
        ),
        totalScore: userCohort.totalScore,
        rank: userCohort.rank
      }
    });
  } catch (err) {
    console.error('Error submitting answer:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all users' submissions for a question
router.get('/:cohortId/modules/:moduleId/questions/:questionId/all-submissions', auth, async (req, res) => {
  try {
    const { cohortId, moduleId, questionId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this cohort
    const userCohort = await UserCohort.findOne({
      user: userId,
      cohort: cohortId
    });

    if (!userCohort) {
      return res.status(403).json({ message: 'Not enrolled in this cohort' });
    }

    // Get all submissions for this question in this cohort
    const submissions = await Submission.find({
      question: questionId,
      cohort: cohortId
    })
    .populate('user', 'name username avatar') // Include user details
    .sort({ submittedAt: -1 })
    .limit(100); // Limit to last 100 submissions for performance

    res.json(submissions);
  } catch (err) {
    console.error('Error fetching all submissions:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Test run code (for programming questions - doesn't count as submission)
router.post('/:cohortId/modules/:moduleId/questions/:questionId/test-run', auth, async (req, res) => {
  try {
    const { code, language, input } = req.body;
    const { questionId } = req.params;
    
    if (!code || !language) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['code', 'language']
      });
    }
    
    // Import the code execution service instead of platformAPI
    const codeExecutionService = require('../services/codeExecutionService');
    
    // Get question details to include expected output in response
    const question = await Question.findById(questionId);
    
    // Find the test case that matches this input if exists
    const testCase = question && question.testCases ? 
      question.testCases.find(tc => tc.input === input) : null;
    
    // Execute the code using the new service
    const result = await codeExecutionService.executeCode(language, code, input);
    
    // Ensure the response is null-safe
    const runResult = result.run || {};
    const compileResult = result.compile || {};
    const compileError = compileResult.stderr || '';
    
    // Calculate if output matches expected if we have test case
    let passed = false;
    let expectedOutput = '';
    
    if (testCase) {
      expectedOutput = testCase.output || '';
      // Compare trimmed outputs to handle whitespace differences
      passed = (runResult.stdout || '').trim() === expectedOutput.trim() && 
              !runResult.stderr && 
              !compileError &&
              runResult.code === 0;
    }
    
    // Format the result to match what the frontend expects
    const formattedResult = {
      output: runResult.stdout || '',
      actualOutput: runResult.stdout || '',
      expectedOutput: expectedOutput,
      error: runResult.stderr || compileError || '',
      executionTime: runResult.time ? parseFloat((runResult.time * 1000).toFixed(2)) : 0, // convert to ms
      memoryUsed: runResult.memory || 0, // in KB
      status: runResult.code === 0 && !compileError ? 'success' : 'error',
      passed: passed,
      isCompileError: !!compileError,
      exitCode: runResult.code || 0,
      input: input,
      testCaseId: testCase ? testCase._id : null
    };
    
    res.json(formattedResult);
  } catch (err) {
    console.error('Error test running code:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      // Add basic error fields for the frontend
      output: '',
      actualOutput: '',
      error: err.message || 'Unknown error occurred',
      executionTime: 0,
      memoryUsed: 0,
      status: 'error',
      passed: false,
      exitCode: 1
    });
  }
});

// Get leaderboard for a cohort
router.get('/:cohortId/leaderboard', auth, async (req, res) => {
  try {
    const cohortId = req.params.cohortId;
    
    // Get cohort leaderboard
    const leaderboard = await UserCohort.find({ cohort: cohortId })
      .sort({ totalScore: -1 })
      .populate('user', 'name rollNumber department')
      .limit(100);
    
    // Format the response
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      user: entry.user,
      totalScore: entry.totalScore,
      completedModules: entry.moduleProgress.filter(mp => mp.completed).length,
      status: entry.status
    }));
    
    res.json(formattedLeaderboard);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Helper function to update cohort leaderboard rankings
async function updateCohortLeaderboard(cohortId) {
  try {
    // Get all user cohorts for this cohort, sorted by total score
    const userCohorts = await UserCohort.find({ cohort: cohortId })
      .sort({ totalScore: -1 });
    
    // Update ranks
    for (let i = 0; i < userCohorts.length; i++) {
      userCohorts[i].rank = i + 1;
      await userCohorts[i].save();
    }
  } catch (err) {
    console.error('Error updating cohort leaderboard:', err);
  }
}

// Get modules for a specific cohort (admin view)
router.get('/admin/:id/modules', [auth, adminAuth], async (req, res) => {
  try {
    const cohortId = req.params.id;
    console.log(`Admin fetching modules for cohort: ${cohortId}`);
    
    // Check if the cohort exists
    const cohort = await Cohort.findById(cohortId);
    
    if (!cohort) {
      console.log(`Cohort ${cohortId} not found in the database (admin view)`);
      return res.status(404).json({ message: 'Cohort not found', reason: 'not_found' });
    }
    
    // Get the modules for this cohort
    const modules = await Module.find({ cohort: cohortId })
      .sort({ order: 1 })
      .populate({
        path: 'questions'
      });
    
    console.log(`Found ${modules.length} modules for cohort ${cohortId} (admin view)`);
    res.json({ modules });
  } catch (err) {
    console.error('Error fetching modules (admin view):', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get notes for a specific question
router.get('/:cohortId/modules/:moduleId/questions/:questionId/notes', auth, async (req, res) => {
  try {
    const { cohortId, moduleId, questionId } = req.params;
    const userId = req.user.id;

    // Check if the user has access to this cohort
    const userCohort = await UserCohort.findOne({
      user: userId,
      cohort: cohortId
    });

    if (!userCohort) {
      return res.status(403).json({ 
        message: 'Not enrolled in this cohort',
        reason: 'not_enrolled'
      });
    }

    // Find the note or return empty notes
    const note = await Note.findOne({
      user: userId,
      cohort: cohortId,
      module: moduleId,
      question: questionId
    });

    // Return notes or empty string if not found
    res.json({
      notes: note ? note.notes : '',
      lastUpdated: note ? note.updatedAt : null
    });
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Save notes for a specific question
router.post('/:cohortId/modules/:moduleId/questions/:questionId/notes', auth, async (req, res) => {
  try {
    const { cohortId, moduleId, questionId } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    // Check if the user has access to this cohort
    const userCohort = await UserCohort.findOne({
      user: userId,
      cohort: cohortId
    });

    if (!userCohort) {
      return res.status(403).json({ 
        message: 'Not enrolled in this cohort',
        reason: 'not_enrolled'
      });
    }

    // Find and update the note or create a new one
    let note = await Note.findOne({
      user: userId,
      cohort: cohortId,
      module: moduleId,
      question: questionId
    });

    if (note) {
      // Update existing note
      note.notes = notes;
      note.updatedAt = Date.now();
    } else {
      // Create new note
      note = new Note({
        user: userId,
        cohort: cohortId,
        module: moduleId,
        question: questionId,
        notes
      });
    }

    await note.save();

    res.json({
      message: 'Notes saved successfully',
      lastUpdated: note.updatedAt
    });
  } catch (err) {
    console.error('Error saving notes:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Question Report Routes

// Create a new question report
router.post('/:cohortId/modules/:moduleId/questions/:questionId/report', auth, async (req, res) => {
  try {
    const { cohortId, moduleId, questionId } = req.params;
    const { reportType, description } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!reportType || !description) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['reportType', 'description']
      });
    }

    // Check if the question exists
    const question = await Question.findOne({
      _id: questionId,
      module: moduleId
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Create the report
    const report = new QuestionReport({
      user: userId,
      question: questionId,
      module: moduleId,
      cohort: cohortId,
      reportType,
      description,
      status: 'pending'
    });

    await report.save();

    res.status(201).json({
      message: 'Report submitted successfully',
      report
    });
  } catch (err) {
    console.error('Error creating question report:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all reports for a question (for both users and admins)
router.get('/:cohortId/modules/:moduleId/questions/:questionId/reports', auth, async (req, res) => {
  try {
    const { cohortId, moduleId, questionId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.userType === 'admin';

    // For regular users, only return their own reports
    // For admins, return all reports for the question
    const query = isAdmin 
      ? { question: questionId, module: moduleId, cohort: cohortId }
      : { question: questionId, module: moduleId, cohort: cohortId, user: userId };

    const reports = await QuestionReport.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error('Error fetching question reports:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all reports for a cohort (admin only)
router.get('/:cohortId/reports', [auth, adminAuth], async (req, res) => {
  try {
    const { cohortId } = req.params;
    
    const reports = await QuestionReport.find({ cohort: cohortId })
      .populate('user', 'name email')
      .populate('question', 'title type')
      .populate('module', 'title')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error('Error fetching cohort reports:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a report (admin only)
router.put('/:cohortId/reports/:reportId', [auth, adminAuth], async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminResponse } = req.body;

    // Find the report
    const report = await QuestionReport.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Update the report fields
    if (status) report.status = status;
    if (adminResponse !== undefined) report.adminResponse = adminResponse;
    report.updatedAt = Date.now();

    await report.save();

    // Create a notification for the user who submitted the report
    if (adminResponse && report.user) {
      try {
        // Find the user to get their name
        const user = await User.findById(report.user);
        
        if (user) {
          // Create a notification for the user with a 3-day expiration
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
          
          const notification = new Notification({
            userId: report.user,
            title: 'Your Report Has Been Addressed',
            message: `Hey ${user.name}! Your report has been addressed by our SCOPE team. Please check it out.`,
            read: false,
            deletionTime: threeDaysFromNow // Auto delete after 3 days
          });
          
          await notification.save();
        }
      } catch (notifyError) {
        console.error('Error creating notification for report update:', notifyError);
        // Continue execution even if notification fails
      }
    }

    res.json({
      message: 'Report updated successfully',
      report
    });
  } catch (err) {
    console.error('Error updating report:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a report 
router.delete('/:cohortId/reports/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.userType === 'admin';

    // Find the report
    const report = await QuestionReport.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check permissions - users can only delete their own reports, admins can delete any
    if (!isAdmin && report.user.toString() !== userId) {
      return res.status(403).json({ 
        message: 'You can only delete your own reports' 
      });
    }

    // Delete the report
    await QuestionReport.findByIdAndDelete(reportId);

    res.json({
      message: 'Report deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting report:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Feedback Routes

// Add or update feedback for a cohort
router.post('/:id/feedback', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const cohortId = req.params.id;
    const userId = req.user.id;
    
    // Validate the rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Find the cohort
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }
    
    // Check if user is enrolled in this cohort
    const userCohort = await UserCohort.findOne({
      user: userId,
      cohort: cohortId
    });
    
    if (!userCohort) {
      return res.status(403).json({ message: 'You must be enrolled in this cohort to provide feedback' });
    }
    
    // Check if user has already given feedback
    const existingFeedbackIndex = cohort.feedbacks.findIndex(
      feedback => feedback.user.toString() === userId
    );
    
    if (existingFeedbackIndex !== -1) {
      // Update existing feedback
      cohort.feedbacks[existingFeedbackIndex] = {
        user: userId,
        rating,
        comment: comment || cohort.feedbacks[existingFeedbackIndex].comment,
        createdAt: Date.now()
      };
    } else {
      // Add new feedback
      cohort.feedbacks.push({
        user: userId,
        rating,
        comment,
        createdAt: Date.now()
      });
    }
    
    // Calculate new average rating
    if (cohort.feedbacks.length > 0) {
      const totalRating = cohort.feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
      cohort.averageRating = parseFloat((totalRating / cohort.feedbacks.length).toFixed(1));
    }
    
    await cohort.save();
    
    res.json({ 
      message: 'Feedback submitted successfully',
      feedback: existingFeedbackIndex !== -1 ? 
        cohort.feedbacks[existingFeedbackIndex] : 
        cohort.feedbacks[cohort.feedbacks.length - 1],
      averageRating: cohort.averageRating
    });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all feedback for a cohort
router.get('/:id/feedback', auth, async (req, res) => {
  try {
    const cohortId = req.params.id;
    
    // Find the cohort and populate user information
    const cohort = await Cohort.findById(cohortId)
      .populate('feedbacks.user', 'name profilePicture');
    
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }
    
    // Return all feedbacks sorted by most recent
    const feedbacks = cohort.feedbacks.sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({
      feedbacks,
      averageRating: cohort.averageRating,
      totalFeedbacks: cohort.feedbacks.length
    });
  } catch (err) {
    console.error('Error getting feedback:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user's feedback for a specific cohort
router.get('/:id/feedback/user', auth, async (req, res) => {
  try {
    const cohortId = req.params.id;
    const userId = req.user.id;
    
    // Find the cohort
    const cohort = await Cohort.findById(cohortId);
    
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }
    
    // Find user's feedback
    const userFeedback = cohort.feedbacks.find(
      feedback => feedback.user.toString() === userId
    );
    
    if (!userFeedback) {
      return res.json({ 
        hasFeedback: false,
        message: 'You have not provided feedback for this cohort yet' 
      });
    }
    
    res.json({
      hasFeedback: true,
      feedback: userFeedback
    });
  } catch (err) {
    console.error('Error getting user feedback:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 