import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, createBrowserRouter, RouterProvider, Navigate, useParams, useLocation } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, CssBaseline, Box, Container, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress, useMediaQuery } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import axios from './utils/axiosConfig';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import MultiStepRegister from './components/MultiStepRegister';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Leaderboard from './components/Leaderboard';
import Courses from './components/Courses';
import Opportunities from './components/Opportunities';
import Landing from './components/Landing';
import Profile from './components/Profile';
import PrivateRoute from './components/PrivateRoute';
import CourseManagement from './components/CourseManagement';
import OpportunityManagement from './components/OpportunityManagement';
import NotificationManagement from './components/NotificationManagement';
import UserView from './components/UserView';
import ConditionalDashboard from './components/ConditionalDashboard';
import CodePad from './components/CodePad';
import TestGoogleImage from './components/TestGoogleImage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import SearchPage from './pages/SearchPage';
import NotFound from './components/NotFound';

// Import Practice Arena components
import PracticeArena from './components/PracticeArena/PracticeArena';
import PracticeArenaManagement from './components/PracticeArena/PracticeArenaManagement';
import PATestView from './components/PracticeArena/PATestView';
import PARandomTestForm from './components/PracticeArena/PARandomTestForm';

// Import cohort components
import CohortList from './components/cohort/CohortList';
import CohortDetail from './components/cohort/CohortDetail';
import CohortProblem from './components/cohort/CohortProblem';
import CohortManagementTab from './components/cohort/CohortManagementTab';
import CohortStats from './components/cohort/CohortStats';
import QuestionReports from './components/cohort/QuestionReports';

import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';

// Add custom menu icon component
const CustomMenuIcon = () => (
  <svg  
    xmlns="http://www.w3.org/2000/svg"  
    width="24"  
    height="24"  
    viewBox="0 0 24 24"  
    fill="none"  
    stroke="currentColor"  
    strokeWidth="2"  
    strokeLinecap="round"  
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M7 6h10" />
    <path d="M4 12h16" />
    <path d="M7 12h13" />
    <path d="M7 18h10" />
  </svg>
);

// MainContent component that uses the theme from context
const MainContent = () => {
  const { theme, darkMode } = useTheme();
  const { token, user, isAuthenticated, isInitialized } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Handler for sidebar toggle events
  const handleSidebarToggle = (isOpen) => {
    if (!isMobile) { // Only handle toggle on desktop
      setSidebarOpen(isOpen);
    }
  };

  // Handler for mobile menu
  const handleMobileMenuToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // Check if current path is an auth page
  const isAuthPage = location.pathname === '/login' || 
                    location.pathname === '/register' || 
                    location.pathname.startsWith('/register');
                    
  // Check if current path is a cohort problem page
  const isCohortProblemPage = /^\/cohorts\/[^/]+\/modules\/[^/]+\/questions\/[^/]+$/.test(location.pathname);

  // Check if current path is a test page
  const isTestPage = location.pathname.startsWith('/practice-arena/tests/');
  
  // Check if current path is the specific test page that needs to open in a new window
  const isSpecificTestPage = location.pathname === '/practice-arena/tests/682a240c9f66f41e5696e2ce';

  // Check if current path is an admin page
  const isAdminPage = location.pathname.startsWith('/admin/');

  // List of valid routes (excluding dynamic routes)
  const validStaticRoutes = ['/', '/login', '/register', '/dashboard', '/admin', '/admin/dashboard', 
    '/leaderboard', '/codepad', '/courses', '/opportunities', '/profile', '/notification-settings',
    '/course-management', '/admin/courses', '/opportunity-management', '/admin/opportunities',
    '/admin/notifications', '/practice-arena', '/cohorts', '/admin/practice-arena', '/admin/cohorts'];

  // Check if current path might be a 404 page
  const is404Page = !validStaticRoutes.includes(location.pathname) && 
                   !location.pathname.startsWith('/cohorts/') &&
                   !location.pathname.startsWith('/admin/cohorts/') &&
                   !location.pathname.startsWith('/practice-arena/') &&
                   !location.pathname.startsWith('/user-view/');

  // Show Navbar and Sidebar for authenticated users on valid pages
  const shouldShowNavigation = token && !isAuthPage && !isCohortProblemPage && !is404Page && !isTestPage;
  
  // Effect to open specific test page in a new tab
  useEffect(() => {
    if (isSpecificTestPage && window.opener === null && !window.sessionStorage.getItem('testPageOpened')) {
      // Set a flag in session storage to prevent infinite loop
      window.sessionStorage.setItem('testPageOpened', 'true');
      
      // Open current URL in new tab
      const newTab = window.open(window.location.href, '_blank');
      
      // If new tab was successfully opened, close the current one
      if (newTab) {
        window.close();
      }
    }
  }, [isSpecificTestPage, location.pathname]);
  
  // Automatically collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);
  
  // Show loading indicator while authentication is initializing
  if (!isInitialized) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          backgroundColor: theme.palette.background.default
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Initializing application...
        </Typography>
      </Box>
    );
  }
  
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Mobile Menu Button - Hide when sidebar is open */}
        {shouldShowNavigation && isMobile && !mobileOpen && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleMobileMenuToggle}
            sx={{
              position: 'fixed',
              top: { xs: 12, sm: 16 },
              left: { xs: 12, sm: 16 },
              zIndex: theme.zIndex.drawer + 2,
              backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 1)',
              },
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CustomMenuIcon />
          </IconButton>
        )}

        {/* Navbar */}
        {shouldShowNavigation && <Navbar />}
        
        {/* Sidebar */}
        {shouldShowNavigation && (
          <Sidebar 
            onToggle={handleSidebarToggle} 
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
        )}
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: '100vh',
            pt: shouldShowNavigation ? { xs: 6, sm: 8 } : 0,
            transition: 'all 0.25s',
            position: 'relative',
            zIndex: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            ml: {
              xs: 0,
            },
            width: {
              xs: '100%',
              md: shouldShowNavigation ? `calc(100% - ${sidebarOpen ? '280px' : '73px'})` : '100%'
            },
            px: { xs: 0, sm: 0}
          }}
        >
          <Container 
            maxWidth={false} 
            disableGutters 
            sx={{ 
              height: '100%',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              boxSizing: 'border-box',
              p: { xs: 2, md: 0 }
            }}
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<MultiStepRegister />} />
              <Route path="/search" element={<PrivateRoute element={<SearchPage />} />} />
              <Route path="/auth/success" element={
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#121212' }}>
                  <CircularProgress size={60} sx={{ color: '#0088cc' }} />
                  <Typography variant="h6" sx={{ mt: 4, color: 'white' }}>
                    Completing your login...
                  </Typography>
                </Box>
              } />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <ConditionalDashboard />
                </PrivateRoute>
              } />
              <Route path="/admin" element={
                <PrivateRoute adminOnly={true}>
                  <AdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/admin/dashboard" element={
                <PrivateRoute adminOnly={true}>
                  <AdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/leaderboard" element={
                <PrivateRoute>
                  <Leaderboard />
                </PrivateRoute>
              } />
              <Route path="/codepad" element={
                <PrivateRoute>
                  <CodePad />
                </PrivateRoute>
              } />
              <Route path="/courses" element={
                <PrivateRoute>
                  <Courses />
                </PrivateRoute>
              } />
              <Route path="/opportunities" element={
                <PrivateRoute>
                  <Opportunities />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/notification-settings" element={
                <PrivateRoute>
                  <NotificationSettingsPage />
                </PrivateRoute>
              } />
              <Route path="/course-management" element={
                <PrivateRoute adminOnly={true}>
                  <CourseManagement />
                </PrivateRoute>
              } />
              <Route path="/admin/courses" element={
                <PrivateRoute adminOnly={true}>
                  <CourseManagement />
                </PrivateRoute>
              } />
              <Route path="/opportunity-management" element={
                <PrivateRoute adminOnly={true}>
                  <OpportunityManagement />
                </PrivateRoute>
              } />
              <Route path="/admin/opportunities" element={
                <PrivateRoute adminOnly={true}>
                  <OpportunityManagement />
                </PrivateRoute>
              } />
              <Route path="/admin/notifications" element={
                <PrivateRoute adminOnly={true}>
                  <NotificationManagement />
                </PrivateRoute>
              } />
              <Route path="/user-view/:username" element={
                <UserView />
              } />
              <Route path="/test/google-image" element={
                <PrivateRoute>
                  <TestGoogleImage />
                </PrivateRoute>
              } />
              
              {/* Practice Arena Routes */}
              <Route path="/practice-arena" element={
                <PrivateRoute>
                  <PracticeArena />
                </PrivateRoute>
              } />
              <Route path="/practice-arena/tests/:testId" element={
                <PrivateRoute>
                  <PATestView />
                </PrivateRoute>
              } />
              <Route path="/practice-arena/create" element={
                <PrivateRoute>
                  <PARandomTestForm />
                </PrivateRoute>
              } />
              <Route path="/admin/practice-arena" element={
                <PrivateRoute adminOnly={true}>
                  <PracticeArenaManagement />
                </PrivateRoute>
              } />
              
              {/* Cohort Routes */}
              <Route path="/cohorts" element={
                <PrivateRoute>
                  <CohortList />
                </PrivateRoute>
              } />
              <Route path="/cohorts/:id" element={
                <PrivateRoute>
                  <CohortDetail />
                </PrivateRoute>
              } />
              <Route path="/cohorts/:cohortId/modules/:moduleId/questions/:questionId" element={
                <PrivateRoute>
                  <CohortProblem />
                </PrivateRoute>
              } />
              <Route path="/admin/cohorts" element={
                <PrivateRoute adminOnly={true}>
                  <CohortManagementTab />
                </PrivateRoute>
              } />
              <Route path="/admin/cohorts/:id" element={
                <PrivateRoute adminOnly={true}>
                  <CohortDetail />
                </PrivateRoute>
              } />
              <Route path="/admin/cohorts/:id/stats" element={
                <PrivateRoute adminOnly={true}>
                  <CohortStats />
                </PrivateRoute>
              } />
              <Route path="/cohorts/:cohortId/reports" element={
                <PrivateRoute adminOnly={true}>
                  <QuestionReports />
                </PrivateRoute>
              } />
              
              {/* 404 catch-all route - must be the last route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Container>
        </Box>
        
        {/* Toast container for notifications */}
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={darkMode ? "dark" : "light"}
        />
        
        {/* Add dedicated container for dialogs to avoid aria-hidden issues */}
        <div id="dialog-container" />
      </Box>
    </MuiThemeProvider>
  );
};

/**
 * Main App component for CodeStats
 * 
 * Note: We use the /auth/success route as part of the OAuth flow
 * The backend redirects to this route after successful Google authentication
 */
function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ThemeProvider>
          <MainContent />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
