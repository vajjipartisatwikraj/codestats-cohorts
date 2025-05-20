import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Divider,
  Card,
  CardContent,
  Grid,
  alpha,
  Chip,
  Avatar,
  useTheme,
  Tab,
  Tabs
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Stars as StarsIcon,
  Timeline as TimelineIcon,
  AccessTime as TimeIcon,
  Equalizer as EqualizerIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import axios from 'axios';
import { apiUrl } from '../../config/apiConfig';
import { useAuth } from '../../contexts/AuthContext';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`progress-tabpanel-${index}`}
      aria-labelledby={`progress-tab-${index}`}
      style={{ 
        display: value === index ? 'block' : 'none',
        width: '100%',
        height: 'calc(100% - 48px)'
      }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CohortProgress = ({ cohort, userProgress, isAdmin }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState(isAdmin ? 0 : 0);
  
  useEffect(() => {
    if (cohort && cohort._id) {
      fetchLeaderboard();
      if (isAdmin) {
      fetchStats();
    }
    }
  }, [cohort, isAdmin]);
  
  // When isAdmin changes, reset to the first tab
  useEffect(() => {
    setActiveTab(0);
  }, [isAdmin]);
  
  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/cohorts/${cohort._id}/leaderboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setLeaderboard(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Create sample data for display
      const sampleLeaderboard = [
        { user: { name: 'John Doe', avatar: '' }, score: 450, rank: 1, questionsCompleted: 15, bestStreak: 5 },
        { user: { name: 'Jane Smith', avatar: '' }, score: 380, rank: 2, questionsCompleted: 12, bestStreak: 3 },
        { user: { name: 'Alex Johnson', avatar: '' }, score: 340, rank: 3, questionsCompleted: 11, bestStreak: 4 },
        { user: { name: 'Sarah Williams', avatar: '' }, score: 310, rank: 4, questionsCompleted: 10, bestStreak: 2 },
        { user: { name: 'Michael Brown', avatar: '' }, score: 280, rank: 5, questionsCompleted: 9, bestStreak: 3 },
      ];
      setLeaderboard(sampleLeaderboard);
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/cohorts/${cohort._id}/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Set the stats directly from the backend response
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Create sample data for display if API fails
      setStats({
        totalEnrolled: 0,
        activeUsers: 0,
        completionRate: 0,
        moduleCompletionRates: []
      });
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Compute the questions completed count from the questionProgress array
  const getQuestionsCompletedCount = () => {
    if (!userProgress || !userProgress.questionProgress) return 0;
    return userProgress.questionProgress.filter(q => q.solved).length;
  };

  // Generate difficulty progress data using the questionProgress array
  const calculateDifficultyProgress = () => {
    if (!userProgress || !userProgress.questionProgress || !cohort.modules) return { easy: { completed: 0, total: 0, percentage: 0 }, medium: { completed: 0, total: 0, percentage: 0 }, hard: { completed: 0, total: 0, percentage: 0 } };
    
    // Initialize counters
    const progress = {
      easy: { completed: 0, total: 0 },
      medium: { completed: 0, total: 0 },
      hard: { completed: 0, total: 0 }
    };
    
    // Get all questions from all modules
    const allQuestions = [];
    cohort.modules.forEach(module => {
      if (module.questions && module.questions.length > 0) {
        allQuestions.push(...module.questions);
      }
    });
    
    // Count questions by difficulty
    allQuestions.forEach(question => {
      const difficulty = question.difficultyLevel?.toLowerCase() || 'medium';
      if (progress[difficulty]) {
        progress[difficulty].total++;
      }
    });
    
    // Count completed questions by difficulty
    userProgress.questionProgress.forEach(qp => {
      if (qp.solved) {
        // Find the question to determine its difficulty
        const question = allQuestions.find(q => q._id === qp.question);
        if (question) {
          const difficulty = question.difficultyLevel?.toLowerCase() || 'medium';
          if (progress[difficulty]) {
            progress[difficulty].completed++;
          }
        }
      }
    });
    
    // Calculate percentages
    Object.keys(progress).forEach(key => {
      progress[key].percentage = progress[key].total > 0 ? 
        (progress[key].completed / progress[key].total) * 100 : 0;
    });
    
    return progress;
  };

  const difficultyProgress = calculateDifficultyProgress();

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 }, 
      height: '100%', 
      bgcolor: 'transparent',
      color: isDarkMode ? '#FFFFFF' : '#333333',
      borderRadius: { xs: 0, md: '10px' },
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto'
    }}>
      {/* Progress Dashboard Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon sx={{ color: '#0088CC' }} /> Progress Dashboard
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2, opacity: 0.85, maxWidth: '90%', fontSize: '0.9rem' }}>
          Track your progress and see how you compare with other students in this cohort.
        </Typography>
      </Box>

      {/* Tabs for different sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              minWidth: 0,
              px: 3,
            }
          }}
        >
          {!isAdmin && <Tab label="Overview" />}
          <Tab label="Leaderboard" />
          {isAdmin && <Tab label="Statistics" />}
        </Tabs>
      </Box>

      {/* Content area with scrolling */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto',
        mt: 2,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(isDarkMode ? '#ffffff' : '#000000', 0.2),
          borderRadius: '4px',
        },
      }}>
        {/* Overview Panel - Only for regular users */}
        {!isAdmin && (
        <TabPanel value={activeTab} index={0}>
          {/* Your Progress Summary */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Card sx={{ 
                bgcolor: isDarkMode ? alpha('#0088CC', 0.1) : alpha('#0088CC', 0.05),
                borderRadius: 2,
                boxShadow: 'none',
                border: `1px solid ${alpha('#0088CC', 0.2)}`
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: '#0088CC',
                      mr: 2
                    }}>
                      <StarsIcon sx={{ color: '#FFFFFF' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Your Progress Summary
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#0088CC', mb: 1 }}>
                          {userProgress?.totalScore || '0'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                          Total Points
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#0088CC', mb: 1 }}>
                            {getQuestionsCompletedCount()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                          Questions Completed
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#0088CC', mb: 1 }}>
                            #{userProgress?.rank || '-'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                          Your Rank
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Difficulty Progress */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Progress by Difficulty
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: isDarkMode ? '#000D16' : '#f5f8fa', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4caf50' }}>Easy</Typography>
                    <Chip 
                        label={`${difficultyProgress.easy.completed}/${difficultyProgress.easy.total}`} 
                      size="small" 
                      sx={{ bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' }}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                      value={difficultyProgress.easy.percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha('#4caf50', 0.15),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#4caf50',
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: isDarkMode ? '#000D16' : '#f5f8fa', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ff9800' }}>Medium</Typography>
                    <Chip 
                        label={`${difficultyProgress.medium.completed}/${difficultyProgress.medium.total}`} 
                      size="small" 
                      sx={{ bgcolor: alpha('#ff9800', 0.1), color: '#ff9800' }}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                      value={difficultyProgress.medium.percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha('#ff9800', 0.15),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#ff9800',
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: isDarkMode ? '#000D16' : '#f5f8fa', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f44336' }}>Hard</Typography>
                    <Chip 
                        label={`${difficultyProgress.hard.completed}/${difficultyProgress.hard.total}`} 
                      size="small" 
                      sx={{ bgcolor: alpha('#f44336', 0.1), color: '#f44336' }}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                      value={difficultyProgress.hard.percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha('#f44336', 0.15),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#f44336',
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

            {/* Module Progress */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Module Progress
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {userProgress?.moduleProgress && userProgress.moduleProgress.length > 0 ? (
                userProgress.moduleProgress.map((module, index) => {
                  // Find the module name from cohort.modules
                  const moduleData = cohort.modules?.find(m => m._id === module.module);
                  const moduleName = moduleData?.title || `Module ${index + 1}`;
                  
                  return (
                    <Grid item xs={12} key={index}>
                      <Card sx={{ bgcolor: isDarkMode ? '#000D16' : '#f5f8fa', borderRadius: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{moduleName}</Typography>
                            <Chip 
                              label={`${module.questionsCompleted}/${module.totalQuestions}`} 
                              size="small" 
                              sx={{ 
                                bgcolor: alpha('#0088CC', 0.1), 
                                color: '#0088CC' 
                              }}
                            />
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={module.totalQuestions > 0 ? (module.questionsCompleted / module.totalQuestions) * 100 : 0}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: alpha('#0088CC', 0.15),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#0088CC',
                              }
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                      No module progress available.
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Recent Activity */}
          <Grid container spacing={3}>
              <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Your Recent Activity
              </Typography>
              
              <Card sx={{ bgcolor: isDarkMode ? '#000D16' : '#f5f8fa', borderRadius: 2, mb: 2 }}>
                <CardContent sx={{ p: 0 }}>
                    {userProgress?.questionProgress && userProgress.questionProgress.length > 0 ? (
                    <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                        {userProgress.questionProgress
                          .filter(qp => qp.solved) // Only show solved questions
                          .sort((a, b) => new Date(b.solvedAt || 0) - new Date(a.solvedAt || 0)) // Sort by most recent
                          .slice(0, 5) // Show only 5 most recent
                          .map((activity, index) => {
                            // Try to find question details
                            let questionTitle = "Question solved";
                            let questionData = null;
                            
                            // Search for the question in all modules
                            cohort.modules?.forEach(module => {
                              module.questions?.forEach(question => {
                                if (question._id === activity.question) {
                                  questionData = question;
                                  questionTitle = question.title;
                                }
                              });
                            });
                            
                            const formattedDate = activity.solvedAt ? new Date(activity.solvedAt).toLocaleDateString() : 'Unknown date';
                            
                            return (
                        <Box 
                          component="li" 
                          key={index}
                          sx={{ 
                            p: 2, 
                                  borderBottom: index < Math.min(4, userProgress.questionProgress.filter(qp => qp.solved).length - 1) ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                                  bgcolor: alpha('#4caf50', 0.2),
                                  color: '#4caf50',
                            mr: 2
                          }}>
                                  <TrophyIcon />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {questionTitle}
                            </Typography>
                            <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                                    {formattedDate}
                            </Typography>
                          </Box>
                            <Chip 
                                  label={`+${activity.bestScore} points`} 
                              size="small" 
                              sx={{ bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' }}
                            />
                        </Box>
                            );
                          })}
                    </Box>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body1" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                          No recent activity found. Solve some questions to see your activity here!
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        )}

        {/* Leaderboard Panel */}
        <TabPanel value={activeTab} index={isAdmin ? 0 : 1}>
          <TableContainer component={Paper} sx={{ 
            boxShadow: 'none', 
            bgcolor: isDarkMode ? '#000D16' : '#f5f8fa',
            borderRadius: 2,
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            mb: 3
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: isDarkMode ? '#ffffff' : '#333333' }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: isDarkMode ? '#ffffff' : '#333333' }}>User</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: isDarkMode ? '#ffffff' : '#333333' }}>Modules Completed</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: isDarkMode ? '#ffffff' : '#333333' }}>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map((entry, index) => (
                  <TableRow 
                    key={index}
                    sx={{ 
                      bgcolor: entry.user?._id === userProgress?.user ? 
                        (isDarkMode ? alpha('#0088CC', 0.15) : alpha('#0088CC', 0.05)) : 
                        'transparent',
                      '&:hover': {
                        bgcolor: isDarkMode ? alpha('#ffffff', 0.05) : alpha('#000000', 0.02)
                      }
                    }}
                  >
                    <TableCell sx={{ 
                      color: isDarkMode ? '#ffffff' : '#333333',
                      fontWeight: 'bold'
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        bgcolor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'transparent',
                        color: index <= 2 ? '#000000' : isDarkMode ? '#ffffff' : '#000000'
                      }}>
                        {entry.rank || index + 1}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#333333' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          alt={entry.user?.name || 'User'} 
                          src={entry.user?.avatar} 
                          sx={{ width: 36, height: 36, mr: 2 }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {entry.user?.name || 'Anonymous'}
                          {entry.user?._id === userProgress?.user && (
                            <Chip 
                              label="You" 
                              size="small" 
                              sx={{ 
                                ml: 1, 
                                height: 20, 
                                fontSize: '0.7rem',
                                bgcolor: '#0088CC',
                                color: '#ffffff'
                              }} 
                            />
                          )}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ color: isDarkMode ? '#ffffff' : '#333333' }}>
                      {entry.completedModules || 0}
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      color: '#0088CC',
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}>
                      {entry.totalScore || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Statistics Panel */}
        {isAdmin && (
          <TabPanel value={activeTab} index={1}>
          {/* Cohort Stats Summary */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
              <Card sx={{ 
                bgcolor: isDarkMode ? '#000D16' : '#f5f8fa', 
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <EqualizerIcon sx={{ fontSize: 40, color: '#0088CC', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: isDarkMode ? '#ffffff' : '#333333' }}>
                    {stats?.totalEnrolled || 0}
                  </Typography>
                  <Typography variant="body1" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                      Eligible Students
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ 
                  bgcolor: isDarkMode ? '#000D16' : '#f5f8fa', 
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <PeopleIcon sx={{ fontSize: 40, color: '#0088CC', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: isDarkMode ? '#ffffff' : '#333333' }}>
                      {stats?.enrolledUsers || 0}
                    </Typography>
                    <Typography variant="body1" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                      Enrolled Students
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
              <Grid item xs={12} md={3}>
              <Card sx={{ 
                bgcolor: isDarkMode ? '#000D16' : '#f5f8fa', 
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <TimelineIcon sx={{ fontSize: 40, color: '#0088CC', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: isDarkMode ? '#ffffff' : '#333333' }}>
                      {stats?.completionRate || 0}%
                  </Typography>
                  <Typography variant="body1" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                      Completion Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
              <Grid item xs={12} md={3}>
              <Card sx={{ 
                bgcolor: isDarkMode ? '#000D16' : '#f5f8fa', 
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <TimeIcon sx={{ fontSize: 40, color: '#0088CC', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: isDarkMode ? '#ffffff' : '#333333' }}>
                    {stats?.activeUsers || 0}
                  </Typography>
                  <Typography variant="body1" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                    Active Students
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Module Completion Rates */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Module Completion Rates
            </Typography>
            <Card sx={{ bgcolor: isDarkMode ? '#000D16' : '#f5f8fa', borderRadius: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  {(stats?.moduleCompletionRates || []).map((module, index) => (
                    <Grid item xs={12} key={index}>
                      <Box sx={{ mb: index < (stats?.moduleCompletionRates.length - 1) ? 2 : 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {module.name}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {module.completion}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={module.completion}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha('#0088CC', 0.15),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: '#0088CC',
                            }
                          }}
                        />
                      </Box>
                    </Grid>
                  ))}
                    {!stats?.moduleCompletionRates || stats.moduleCompletionRates.length === 0 ? (
                      <Grid item xs={12}>
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="body1" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                            No module data available.
                          </Typography>
                        </Box>
                      </Grid>
                    ) : null}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
        )}
      </Box>
    </Box>
  );
};

export default CohortProgress; 