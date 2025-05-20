// At the very top of the file - suppress specific experimental warnings
// This must be the first code in the file
process.env.NODE_NO_WARNINGS = '1';
// Patch the default emitWarning function to filter out specific warnings
const originalEmit = process.emitWarning;
process.emitWarning = function(warning, ...args) {
  // Filter out the specific warnings about CommonJS loading ES modules
  if (warning && typeof warning === 'string' && 
      (warning.includes('CommonJS module') || 
       warning.includes('loading ES Module') || 
       warning.includes('using require'))) {
    return; // Suppress this specific warning
  }
  return originalEmit.call(this, warning, ...args);
};



const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const leaderboardRoutes = require('./routes/leaderboard');
const usersRoutes = require('./routes/users');
const coursesRoutes = require('./routes/courses');
const opportunitiesRoutes = require('./routes/opportunities');
const mongoose = require('mongoose');
const adminRoutes = require('./routes/admin');
const notificationsRoutes = require('./routes/notifications');
const cron = require('node-cron');
const Profile = require('./models/Profile');
const User = require('./models/User');
const platformAPI = require('./services/platformAPIs');
const codeExecutionService = require('./services/codeExecutionService');
const compilerService = require('./services/compilerService');
const healthRoutes = require('./routes/healthRoutes');
const passport = require('passport');
const session = require('express-session');
const googleAuthRoutes = require('./routes/auth/googleAuth');
const registerCronJobs = require('./ensure-cron-jobs');
const webPushUtil = require('./utils/webPushUtil');
const cohortsRoutes = require('./routes/cohorts');
const practiceArenaRoutes = require('./routes/practiceArena');

const app = express();

// Initialize syncProgress tracking for profile synchronization
app.locals.syncProgress = {};

// Initialize Web Push
const publicVapidKey = webPushUtil.initWebPush();
console.log('Web Push initialized with public VAPID key');

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'], 
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Set up session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Register all cron jobs
registerCronJobs();

// Removed: Redundant cron job (already handled in updateUserProfiles.js)
// Auto-sync profiles is now scheduled only once at midnight IST via the updateUserProfiles.js file

// Debug route
app.get('/api/debug', (req, res) => {
  res.json({ 
    message: 'Server is running correctly',
    timestamp: new Date().toISOString(),
    routes: [
      '/api/auth',
      '/api/profiles',
      '/api/leaderboard',
      '/api/admin',
      '/api/achievements',
      '/api/users',
      '/api/courses',
      '/api/opportunities'
    ]
  });
});

// Web Push public key endpoint
app.get('/api/push/vapidPublicKey', (req, res) => {
  try {
    res.json({ publicKey: webPushUtil.getVapidPublicKey() });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({ message: 'Error retrieving VAPID public key' });
  }
});

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/courses', coursesRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/cohorts', cohortsRoutes);
app.use('/api/practice-arena', practiceArenaRoutes);
app.use('/api/search', require('./routes/search'));

// Code execution endpoints using Judge0 API
app.post('/api/compiler/execute', async (req, res) => {
  try {
    const { language, version, code, stdin } = req.body;
    
    if (!language || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Language and code are required' 
      });
    }
    
    console.log(`Executing code in ${language}`);
    const result = await compilerService.executeCode(language, version, code, stdin || '');
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error executing code', 
      error: error.message 
    });
  }
});

app.post('/api/compiler/run-test-cases', async (req, res) => {
  try {
    const { language, version, code, testCases } = req.body;
    
    if (!language || !code || !testCases) {
      return res.status(400).json({ 
        success: false, 
        message: 'Language, code, and testCases are required' 
      });
    }
    
    console.log(`Running ${testCases.length} test cases for ${language} code`);
    const results = await compilerService.runTestCases(language, version, code, testCases);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Test cases execution error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error running test cases', 
      error: error.message 
    });
  }
});

app.post('/api/compiler/simple-execution', async (req, res) => {
  try {
    const { language, version, code, stdin } = req.body;
    
    if (!language || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Language and code are required' 
      });
    }
    
    console.log(`Simple execution of ${language} code`);
    const result = await compilerService.simpleExecution(language, version, code, stdin || '');
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Simple execution error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error in simple execution', 
      error: error.message 
    });
  }
});

// Test route for CodeChef profile scraping
app.get('/api/test/codechef/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || username.trim() === '') {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    console.log(`TEST: Fetching CodeChef profile for ${username}`);
    const profileData = await platformAPI.getCodeChefProfile(username);
    
    res.json({
      success: true,
      message: 'CodeChef profile data retrieved',
      data: profileData
    });
  } catch (err) {
    console.error('CodeChef test error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching CodeChef profile', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Test route for GeeksforGeeks API
app.get('/api/test/geeksforgeeks/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || username.trim() === '') {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    console.log(`TEST: Fetching GeeksforGeeks profile for ${username}`);
    const profileData = await platformAPI.getGeeksforGeeksProfile(username);
    
    res.json({
      success: true,
      message: 'GeeksforGeeks profile data retrieved',
      data: profileData
    });
  } catch (err) {
    console.error('GeeksforGeeks test error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching GeeksforGeeks profile', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Test route for LeetCode API
app.get('/api/test/leetcode/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || username.trim() === '') {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    console.log(`TEST: Fetching LeetCode profile for ${username}`);
    const profileData = await platformAPI.getLeetCodeProfile(username);
    
    res.json({
      success: true,
      message: 'LeetCode profile data retrieved',
      data: profileData
    });
  } catch (err) {
    console.error('LeetCode test error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching LeetCode profile', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Direct endpoint for profile verification (temporary solution)
app.post('/api/profiles/verify/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { username } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No authorization token provided' });
    }
    
    if (!username || username.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Username is required'
      });
    }
    
    if (!['geeksforgeeks', 'codechef', 'codeforces', 'leetcode', 'hackerrank', 'github'].includes(platform)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid platform'
      });
    }
    
    try {
      // Try to fetch the profile data to verify it exists
      let profileData;
      
      // Use a timeout promise to avoid hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timed out')), 15000)
      );
      
      // Get platform data with timeout
      try {
        // For demo/testing purposes, handle "xyz" as a special valid username
        // This allows testing without real accounts
        if (username === 'xyz') {
          // Return mock data for testing
          profileData = {
            username: 'xyz',
            problemsSolved: 100,
            rating: 1500,
            rank: platform === 'leetcode' ? 'Candidate Master' : 
                  platform === 'codeforces' ? 'Expert' :
                  platform === 'codechef' ? '4 Star' :
                  platform === 'hackerrank' ? 'Gold' :
                  platform === 'geeksforgeeks' ? 'Institute Rank 1' : 'Demo User',
            score: 850
          };
        } else {
          // Handle real verification with the appropriate method
          switch (platform) {
            case 'leetcode':
              profileData = await Promise.race([
                platformAPI.getLeetCodeProfile(username),
                timeoutPromise
              ]);
              break;
            case 'codeforces':
              profileData = await Promise.race([
                platformAPI.getCodeforcesProfile(username),
                timeoutPromise
              ]);
              break;
            case 'codechef':
              profileData = await Promise.race([
                platformAPI.getCodeChefProfile(username),
                timeoutPromise
              ]);
              break;
            case 'geeksforgeeks':
              profileData = await Promise.race([
                platformAPI.getGeeksforGeeksProfile(username),
                timeoutPromise
              ]);
              break;
            case 'hackerrank':
              profileData = await Promise.race([
                platformAPI.getHackerRankProfile(username),
                timeoutPromise
              ]);
              break;
            case 'github':
              profileData = await Promise.race([
                platformAPI.getGitHubProfile(username),
                timeoutPromise
              ]);
              break;
            default:
              throw new Error('Unsupported platform');
          }
        }
      } catch (fetchError) {
        console.error(`Error fetching ${platform} profile for ${username}:`, fetchError);
        throw new Error(`Could not verify ${platform} profile: ${fetchError.message}`);
      }
      
      if (!profileData) {
        throw new Error(`Could not find ${platform} profile for "${username}"`);
      }
      
      return res.json({
        success: true,
        message: `${platform} profile verified successfully`,
        profile: {
          platform,
          username,
          verified: true,
          details: profileData
        }
      });
    } catch (error) {
      console.error(`Profile verification error for ${platform}/${username}:`, error);
      return res.status(400).json({
        success: false,
        message: error.message || `Could not verify ${platform} profile`,
        error: error.message
      });
    }
  } catch (err) {
    console.error('Profile verification error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// Test route for Google Auth
app.get('/api/test/google-auth', (req, res) => {
  res.json({
    success: true,
    message: 'Google OAuth test route is working',
    googleAuthRoute: '/api/auth/google',
    googleCallbackRoute: '/api/auth/google/callback',
    clientID: process.env.GOOGLE_CLIENT_ID 
      ? `Configured (starts with ${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...)` 
      : 'Not configured'
  });
});

// Test route for Google profile image
app.get('/api/test/google-profile-image', (req, res) => {
  // Check if there's a user in the session
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Return the user's profile picture URL
  return res.json({
    name: req.user.name,
    profilePicture: req.user.profilePicture || '',
    hasProfilePicture: !!req.user.profilePicture,
    googleId: req.user.googleId || null
  });
});

// Test route for code execution
app.post('/api/test/execute-code', async (req, res) => {
  try {
    const { language, code, input } = req.body;
    
    if (!language || !code) {
      return res.status(400).json({ 
        success: false,
        message: 'Language and code are required',
        required: ['language', 'code']
      });
    }
    
    console.log(`TEST: Executing ${language} code`);
    const result = await codeExecutionService.executeCode(language, code, input || '');
    
    res.json({
      success: true,
      message: 'Code execution completed',
      result
    });
  } catch (err) {
    console.error('Code execution test error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error executing code', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Add MongoDB connection error handling and reconnection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  console.log('Will attempt to reconnect to MongoDB...');
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  // Try to reconnect after a short delay
  setTimeout(() => {
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log('Reconnected to MongoDB'))
      .catch(err => console.error('MongoDB reconnection error:', err));
  }, 5000);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
