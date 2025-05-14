import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  TextField,
  Button,
  Avatar,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import {
  Send as SendIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ThumbUp as ThumbUpIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-toastify';
import { apiUrl } from '../../config/apiConfig';

const CohortFeedback = ({ cohortId }) => {
  const theme = useTheme();
  const { darkMode } = useAppTheme();
  const { token, user } = useAuth();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userFeedback, setUserFeedback] = useState(null);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [error, setError] = useState(null);
  
  // Fetch user's existing feedback and all cohort feedbacks
  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      try {
        // Get user's feedback
        const userFeedbackResponse = await axios.get(
          `${apiUrl}/cohorts/${cohortId}/feedback/user`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // If user has already provided feedback, set it in the state
        if (userFeedbackResponse.data.hasFeedback) {
          const feedback = userFeedbackResponse.data.feedback;
          setUserFeedback(feedback);
          setRating(feedback.rating);
          setComment(feedback.comment || '');
        }
        
        // Get all feedbacks for this cohort
        const allFeedbacksResponse = await axios.get(
          `${apiUrl}/cohorts/${cohortId}/feedback`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        setAllFeedbacks(allFeedbacksResponse.data.feedbacks || []);
        
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to load feedback data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (cohortId && token) {
      fetchFeedbacks();
    }
  }, [cohortId, token]);
  
  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast.error('Please select a rating before submitting');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${apiUrl}/cohorts/${cohortId}/feedback`,
        {
          rating,
          comment
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setUserFeedback(response.data.feedback);
      
      // Refresh the feedbacks list
      const allFeedbacksResponse = await axios.get(
        `${apiUrl}/cohorts/${cohortId}/feedback`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setAllFeedbacks(allFeedbacksResponse.data.feedbacks || []);
      toast.success('Thank you for your feedback!');
      
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={40} sx={{ color: '#0088CC' }} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 700, 
            color: darkMode ? '#FFFFFF' : '#333333',
            mb: 1
          }}
        >
          Cohort Feedback
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            mb: 2
          }}
        >
          Share your experience with this cohort and help others make informed decisions
        </Typography>
      </Box>
      
      {/* User Feedback Form */}
      <Card sx={{ 
        mb: 4, 
        bgcolor: darkMode ? alpha('#0088CC', 0.08) : alpha('#0088CC', 0.04),
        boxShadow: 'none',
        border: `1px solid ${darkMode ? alpha('#0088CC', 0.2) : alpha('#0088CC', 0.1)}`,
        borderRadius: '10px'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              mb: 2,
              color: darkMode ? '#FFFFFF' : '#333333'
            }}
          >
            {userFeedback ? 'Your Feedback' : 'Rate This Cohort'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                mr: 2,
                color: darkMode ? '#FFFFFF' : '#333333',
                fontWeight: 500
              }}
            >
              Rating:
            </Typography>
            <Rating 
              value={rating} 
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              precision={1}
              size="large"
              icon={<StarIcon fontSize="inherit" sx={{ color: '#FFD700' }} />}
              emptyIcon={<StarBorderIcon fontSize="inherit" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)' }} />}
            />
          </Box>
          
          <TextField 
            label="Your review (optional)" 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0088CC',
                },
              },
              '& .MuiInputLabel-root': {
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              },
              '& .MuiInputBase-input': {
                color: darkMode ? '#FFFFFF' : '#333333',
              }
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSubmitFeedback}
              disabled={submitting || rating === 0}
              sx={{
                bgcolor: '#0088CC',
                color: 'white',
                '&:hover': {
                  bgcolor: alpha('#0088CC', 0.9),
                },
                '&.Mui-disabled': {
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                  color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
                }
              }}
            >
              {submitting ? 'Submitting...' : (userFeedback ? 'Update Feedback' : 'Submit Feedback')}
            </Button>
          </Box>
          
          {userFeedback && (
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                mt: 2, 
                color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                textAlign: 'right'
              }}
            >
              Last updated: {formatDate(userFeedback.createdAt)}
            </Typography>
          )}
        </CardContent>
      </Card>
      
      {/* Community Feedback */}
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 600, 
          mb: 2,
          color: darkMode ? '#FFFFFF' : '#333333'
        }}
      >
        Community Feedback
      </Typography>
      
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 520px)', // Set maximum height for scrollable area
        pr: 1, // Right padding to accommodate scrollbar
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        }
      }}>
        {allFeedbacks.length > 0 ? (
          allFeedbacks.map((feedback, index) => (
            <Card 
              key={feedback._id || index} 
              sx={{ 
                mb: 2, 
                bgcolor: darkMode ? alpha('#121212', 0.5) : '#FFFFFF',
                boxShadow: darkMode ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                border: darkMode ? `1px solid ${alpha('#FFFFFF', 0.1)}` : 'none',
                borderRadius: '8px'
              }}
            >
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Avatar 
                    src={feedback.user?.avatar} 
                    alt={feedback.user?.name}
                    sx={{ 
                      width: 36, 
                      height: 36,
                      bgcolor: '#0088CC',
                      color: '#FFFFFF'
                    }}
                  >
                    {feedback.user?.name ? feedback.user.name[0] : 'U'}
                  </Avatar>
                  <Box sx={{ ml: 1.5 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600,
                        color: darkMode ? '#FFFFFF' : '#333333'
                      }}
                    >
                      {feedback.user?.name || 'Anonymous User'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                          mr: 1
                        }}
                      >
                        {formatDate(feedback.createdAt)}
                      </Typography>
                      <Rating 
                        value={feedback.rating} 
                        readOnly 
                        size="small"
                        icon={<StarIcon fontSize="inherit" sx={{ color: '#FFD700' }} />}
                        emptyIcon={<StarBorderIcon fontSize="inherit" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)' }} />}
                      />
                    </Box>
                  </Box>
                </Box>
                
                {feedback.comment && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                      ml: 7,
                      mt: 0.5
                    }}
                  >
                    {feedback.comment}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Box 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              border: `1px dashed ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderRadius: '8px'
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                mb: 1
              }}
            >
              No feedback available yet
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
              }}
            >
              Be the first to share your experience with this cohort
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CohortFeedback; 