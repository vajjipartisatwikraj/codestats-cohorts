import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  useTheme as useMuiTheme,
  Tab,
  Tabs,
  alpha,
  Rating,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  BarChart as BarChartIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import StarRateRoundedIcon from '@mui/icons-material/StarRateRounded';
import { useNavigate } from 'react-router-dom';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import { apiUrl } from '../../config/apiConfig';
import { useAuth } from '../../contexts/AuthContext';

const CohortListRight = ({ selectedCohort }) => {
  const muiTheme = useMuiTheme();
  const { darkMode } = useAppTheme();
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // Add loading state for reviews
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviews, setReviews] = useState([]);

  // Effect to fetch reviews whenever selectedCohort changes
  useEffect(() => {
    if (selectedCohort?._id && token) {
      fetchReviews(selectedCohort._id);
    }
  }, [selectedCohort?._id, token]);

  // Add console logs for debugging enrolled users
  useEffect(() => {
    if (selectedCohort) {
      console.log("Selected cohort data:", selectedCohort);
      console.log("Enrolled users:", selectedCohort.enrolledUsers);
      console.log("Eligible users count:", selectedCohort.eligibleUsers?.length);
    }
  }, [selectedCohort]);

  // Function to fetch reviews for the selected cohort
  const fetchReviews = async (cohortId) => {
    setLoadingReviews(true);
    try {
      const response = await axios.get(
        `${apiUrl}/cohorts/${cohortId}/feedback`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(response.data);
      
      if (response.data && response.data.feedbacks) {
        setReviews(response.data.feedbacks);
      }
    } catch (error) {
      console.error('Error fetching cohort reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!selectedCohort) {
    // Default data for display purposes
    selectedCohort = {
      _id: '1',
      title: 'Object Oriented Programming',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and',
      progress: 35,
      status: 'Pending',
      topics: 'Java, Python, OOP\'s',
      startDate: '2025-05-07',
      endDate: '2025-06-06',
      level: 'Beginner'
    };
  }

  // Generate initials from name for avatar fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Handle button clicks
  const handleStartLearning = () => {
    // Navigate to the cohort page
    if (selectedCohort && selectedCohort._id) {
      navigate(`/cohorts/${selectedCohort._id}`);
    }
  };

  const handleProgress = () => {
    console.log('Progress clicked');
  };

  // Use the reviews data instead of selectedCohort.feedbacks for the Reviews tab
  const feedbacksToShow = activeTab === 1 ? (reviews.length > 0 ? reviews : []) : 
    (selectedCohort.feedbacks && selectedCohort.feedbacks.length > 0 ? selectedCohort.feedbacks : []);
                                  
  return (
    <Box 
      sx={{ 
        maxHeight: 'calc(100vh - 100px)',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 15, 15, 0.08)'}`,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: darkMode ? 'transparent' : '#FFFFFF',
        color: darkMode ? '#FFFFFF' : '#0F0F0F',
        borderRadius: '10px',
        px: 3,
        pb: 3,
        pt: 2,
        width: '100%',
        position: 'relative',
        overflow: 'auto',
        boxShadow: darkMode ? 'none' : '0 6px 20px rgba(15, 15, 15, 0.08)'
      }}
    >
      {/* Gaussian Blur Effect - Only for dark mode */}
      {darkMode && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            overflow: 'hidden'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 629 583" fill="none" style={{ position: 'absolute', top: 0, left: 0, opacity: 1 }}>
            <g opacity="0.9" filter="url(#filter0_f_255_604)">
              <path d="M697.5 -237L26 194L714 268L697.5 -237Z" fill="#1580CC"/>
              <path d="M697.5 -237L26 194L714 268L697.5 -237Z" stroke="black"/>
            </g>
            <defs>
              <filter id="filter0_f_255_604" x="-440.563" y="-702.996" width="1620.18" height="1436.66" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                <feGaussianBlur stdDeviation="232.55" result="effect1_foregroundBlur_255_604"/>
              </filter>
            </defs>
          </svg>
        </Box>
      )}

      {/* Cohort Title */}
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ 
          fontWeight: 700, 
          mb: 2,
          mt: 2,
          fontSize: '2rem',
          color: darkMode ? '#FFFFFF' : '#0F0F0F'
        }}
      >
        {selectedCohort.title || "Object Oriented Programming"}
      </Typography>
      
      {/* Cohort Description */}
      <Typography 
        variant="body1" 
        sx={{ 
          mb: 3, 
          color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(15,15,15,0.8)',
          lineHeight: 1.6,
          fontSize: '0.95rem'
        }}
      >
        {selectedCohort.description || "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and"}
      </Typography>

      {/* Progress Bar */}
      <Box sx={{ mb: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
            mb: 1,
            fontWeight: 500
          }}
        >
          Your Progress
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LinearProgress 
            variant="determinate" 
            value={selectedCohort.userProgress?.totalScore || selectedCohort.progress || 35} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,1)',
              width: '50%',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: '#0088CC'
              }
            }}
          />
          <Typography variant="body2" sx={{ color: darkMode ? '#FFFFFF' : '#333333', fontWeight: 'medium', ml: 2 }}>
            {selectedCohort.userProgress?.totalScore || selectedCohort.progress || 35}%
          </Typography>
        </Box>
      </Box>

      {/* Users Enrolled */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AvatarGroup 
          max={3}
          sx={{ 
            '& .MuiAvatar-root': { 
              width: 40, 
              height: 40, 
              fontSize: '1rem',
              border: darkMode ? '2px solid #000D16' : '2px solid #EAEAEA'
            }
          }}
        >
          {/* Display actual user avatars if available */}
          {Array.isArray(selectedCohort.enrolledUsers) && selectedCohort.enrolledUsers.length > 0 ? (
            selectedCohort.enrolledUsers.map((user, index) => {
              console.log("Rendering user avatar:", user);
              return (
                <Avatar 
                  key={index} 
                  alt={user.name || `User ${index + 1}`} 
                  src={user.profilePicture || null}
                  sx={{ bgcolor: ['#f44336', '#ff9800', '#4caf50'][index % 3] }}
                >
                  {getInitials(user.name || `U${index + 1}`)}
                </Avatar>
              );
            })
          ) : (
            // Fallback avatars when enrolledUsers is not available
            <>
              <Avatar sx={{ bgcolor: '#f44336' }}>U1</Avatar>
              <Avatar sx={{ bgcolor: '#ff9800' }}>U2</Avatar>
              <Avatar sx={{ bgcolor: '#4caf50' }}>U3</Avatar>
            </>
          )}
        </AvatarGroup>
        <Typography 
          variant="body1" 
          sx={{ 
            ml: 2, 
            color: darkMode ? '#FFFFFF' : '#333333',
            fontWeight: 400,
            fontSize: '1rem'
          }}
        >
          {selectedCohort.eligibleUsers?.length || 250}+ Users Enrolled
        </Typography>
      </Box>

      {/* Combined container for tabs and content */}
      <Box sx={{ 
        bgcolor: darkMode ? 'rgba(0, 0, 0, 0.50)' : '#FFFFFF',
        borderRadius: '10px',
        overflow: 'hidden',
        mb: 2,
        mt: 2,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 120px)',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 6px 16px rgba(15, 15, 15, 0.06)',
        backdropFilter: darkMode ? 'blur(10px)' : 'none',
        border: darkMode ? 'none' : '1px solid rgba(15, 15, 15, 0.08)'
      }}>
        {/* Tab Selection */}
        <Box sx={{ display: 'flex', px: 2, pt: 2 }}>
          <Button
            sx={{
              bgcolor: activeTab === 0 ? '#0088CC' : 'transparent',
              color: activeTab === 0 
                ? 'white' 
                : darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              borderRadius: '4px',
              textTransform: 'none',
              mr: 2,
              '&:hover': {
                bgcolor: activeTab === 0 ? '#0088CC' : 'transparent',
              }
            }}
            onClick={() => setActiveTab(0)}
          >
            Details
          </Button>
          <Button
            sx={{
              bgcolor: activeTab === 1 ? '#0088CC' : 'transparent',
              color: activeTab === 1 
                ? 'white' 
                : darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              borderRadius: '4px',
              textTransform: 'none',
              '&:hover': {
                bgcolor: activeTab === 1 ? '#0088CC' : 'transparent',
              }
            }}
            onClick={() => setActiveTab(1)}
          >
            Reviews
          </Button>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Box sx={{ 
            p: 3,
            pt: 2,
            overflow: 'auto',
            maxHeight: 'calc(100vh - 280px)',
          }}>
            {/* Status */}
            <Box sx={{ 
              display: 'flex', 
              mb: 3,
              alignItems: 'center',
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  fontWeight: 400,
                  width: '120px'
                }}
              >
                Status:
              </Typography>
              <Chip 
                label={selectedCohort.status || "Pending"} 
                size="small" 
                sx={{ 
                  bgcolor: '#0088CC',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: '24px',
                  borderRadius: '4px'
                }} 
              />
            </Box>
            
            {/* Topics */}
            <Box sx={{ 
              display: 'flex', 
              mb: 3,
              alignItems: 'center',
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  fontWeight: 400,
                  width: '120px'
                }}
              >
                Topics:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  color: darkMode ? 'white' : '#333333'
                }}
              >
                {selectedCohort.topics || 'Java, Python, OOP\'s'}
              </Typography>
            </Box>
            
            {/* Start Date */}
            <Box sx={{ 
              display: 'flex',
              mb: 3,
              alignItems: 'center',
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  fontWeight: 400,
                  width: '120px'
                }}
              >
                Start Date:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  color: darkMode ? 'white' : '#333333'
                }}
              >
                {selectedCohort.startDate ? 'January 21, 2025' : formatDate(selectedCohort.startDate)}
              </Typography>
            </Box>
            
            {/* End Date */}
            <Box sx={{ 
              display: 'flex',
              mb: 3,
              alignItems: 'center',
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  fontWeight: 400,
                  width: '120px'
                }}
              >
                End Date:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  color: darkMode ? 'white' : '#333333'
                }}
              >
                {selectedCohort.endDate ? 'February 21, 2025' : formatDate(selectedCohort.endDate)}
              </Typography>
            </Box>
            
            {/* Level */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  fontWeight: 400,
                  width: '120px'
                }}
              >
                Level:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  color: '#4CAF50'
                }}
              >
                {selectedCohort.level || 'Beginner'}
              </Typography>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ 
            p: 3,
            overflow: 'auto',
            maxHeight: 'calc(100vh - 180px)',
          }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: darkMode ? 'white' : '#0F0F0F' }}>
              Recent Reviews
            </Typography>
            
            {loadingReviews ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={30} sx={{ color: '#0088CC' }} />
              </Box>
            ) : (
              <Box sx={{ 
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 15, 15, 0.1)',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(15, 15, 15, 0.2)',
                },
                overflow: 'auto',
                height: '100%' 
              }}>
                {feedbacksToShow.length > 0 ? feedbacksToShow.map((feedback, index) => {
                  // Get user details safely with fallbacks
                  const userName = feedback.user?.name || "Anonymous User";
                  const userInitials = getInitials(userName);
                  const userAvatar = feedback.user?.profilePicture || null;
                  
                  return (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar 
                          src={userAvatar}
                          alt={userName}
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: '#0088CC',
                            fontSize: '0.7rem',
                            flexShrink: 0,
                            mr: 1.5
                          }}
                        >
                          {userInitials}
                        </Avatar>
                        <Box sx={{ width: '100%' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600,
                              color: darkMode ? 'white' : '#333333',
                              fontSize: '0.85rem',
                              mb: 0.5
                            }}
                          >
                            {userName}
                          </Typography>
                          
                          <Box 
                            sx={{
                              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 136, 204, 0.03)',
                              borderRadius: '6px',
                              p: 1.5,
                              color: darkMode ? 'rgb(255, 255, 255)' : '#0F0F0F',
                              boxShadow: darkMode ? 'none' : '0 2px 8px rgba(15, 15, 15, 0.04)',
                              border: darkMode ? 'none' : '1px solid rgba(15, 15, 15, 0.04)'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Rating 
                                value={feedback.rating} 
                                size="small" 
                                readOnly 
                                precision={0.5}
                                icon={<StarRateRoundedIcon fontSize="small" sx={{ color: '#0088CC', fontSize: '1rem' }} />}
                                emptyIcon={<StarRateRoundedIcon fontSize="small" sx={{ color:'rgba(0, 136, 204, 0.3)', fontSize: '1rem' }} />}
                                sx={{ mr: 1 }}
                              />
                              <Chip
                                label={feedback.rating.toFixed(1)}
                                size="small"
                                sx={{
                                  bgcolor: '#0088CC',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  height: '18px',
                                  fontSize: '0.65rem',
                                  px: 0.5
                                }}
                              />
                            </Box>
                            
                            <Typography variant="body2" sx={{ 
                              lineHeight: 1.5, 
                              fontSize: '0.75rem', 
                              fontWeight: 400,
                              color: darkMode ? 'white' : '#0F0F0F',
                            }}>
                              {feedback.comment || "No comment provided"}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {index < feedbacksToShow.length - 1 && (
                        <Divider sx={{ my: 2, opacity: 0.1 }} />
                      )}
                    </Box>
                  );
                }) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color={darkMode ? 'white' : '#333333'}>
                      No reviews available yet
                    </Typography>
                    <Typography variant="body2" color={darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'}>
                      Be the first to share your experience
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
      
      {/* Action Buttons */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Button
            variant="outlined"
            startIcon={<BarChartIcon />}
            onClick={handleProgress}
            sx={{ 
              color: darkMode ? 'white' : '#0F0F0F',
              borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(15, 15, 15, 0.15)',
              borderRadius: '20px',
              textTransform: 'none',
              '&:hover': {
                borderColor: darkMode ? 'white' : '#0088CC',
                bgcolor: 'transparent'
              }
            }}
          >
            Progress
          </Button>
        </Box>
        
        <Box>
          <Button
            variant="contained"
            onClick={handleStartLearning}
            endIcon={<ArrowForwardIcon />}
            sx={{
              bgcolor: '#0088CC',
              color: 'white',
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              py: 1,
              px: 3,
              '&:hover': {
                bgcolor: '#0077b6'
              }
            }}
          >
            Start Learning
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CohortListRight;
