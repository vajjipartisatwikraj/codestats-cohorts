import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Slider,
  Divider,
  Alert,
  FormHelperText,
  Autocomplete
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../../config/apiConfig';
import { toast } from 'react-toastify';

const PARandomTestForm = () => {
  const { darkMode } = useTheme();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [formData, setFormData] = useState({
    title: 'My Practice Test',
    subject: '',
    selectedTopics: [],
    difficulty: 'mixed',
    mcqCount: 5,
    programmingCount: 2,
    timeLimit: 60 // minutes
  });
  const [errors, setErrors] = useState({});
  
  // Fetch subjects and topics on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch available subjects (maintags)
        const subjectsResponse = await axios.get(
          `${apiUrl}/practice-arena/subjects`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Fetch available topics (tags)
        const topicsResponse = await axios.get(
          `${apiUrl}/practice-arena/topics`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        setSubjects(subjectsResponse.data || []);
        setTopics(topicsResponse.data || []);
      } catch (error) {
        console.error('Error fetching options:', error);
        toast.error('Failed to load subjects and topics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Handle topic selection
  const handleTopicChange = (event, newValue) => {
    setFormData({
      ...formData,
      selectedTopics: newValue
    });
  };
  
  // Handle slider changes for question counts
  const handleSliderChange = (name) => (event, newValue) => {
    setFormData({
      ...formData,
      [name]: newValue
    });
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }
    
    if (formData.mcqCount === 0 && formData.programmingCount === 0) {
      newErrors.questionCount = 'Please select at least one question';
    }
    
    if (formData.timeLimit < 5) {
      newErrors.timeLimit = 'Time limit must be at least 5 minutes';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setLoading(true);
      
      try {
        // Prepare test parameters
        const testParams = {
          title: formData.title,
          subject: formData.subject,
          topics: formData.selectedTopics,
          difficulty: formData.difficulty,
          questionTypes: {
            mcq: { count: formData.mcqCount },
            programming: { count: formData.programmingCount }
          },
          timeLimit: formData.timeLimit
        };
        
        // Create the test
        const response = await axios.post(
          `${apiUrl}/practice-arena/tests`,
          testParams,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        toast.success('Practice test created! Ready to start.');
        
        // Navigate to the test page
        navigate(`/practice-arena/tests/${response.data.test._id}`);
      } catch (error) {
        console.error('Error creating test:', error);
        
        // Handle specific errors
        if (error.response?.status === 400 && error.response?.data?.message?.includes('Not enough questions')) {
          toast.error(`${error.response.data.message}. Try different criteria.`);
        } else {
          toast.error('Failed to create practice test. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };
  
  return (
    <Box sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          maxWidth: '800px',
          mx: 'auto'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Create Practice Test
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4, color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
          Customize your practice test by selecting subject, topics, and difficulty level. 
          Questions will be randomly selected based on your criteria.
        </Typography>
        
        {errors.questionCount && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.questionCount}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Test Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Test Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            
            {/* Subject Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.subject}>
                <InputLabel>Subject</InputLabel>
                <Select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  label="Subject"
                >
                  {subjects.length === 0 ? (
                    <MenuItem disabled>No subjects available</MenuItem>
                  ) : (
                    subjects.map((subject) => (
                      <MenuItem key={subject} value={subject}>
                        {subject}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.subject && (
                  <FormHelperText>{errors.subject}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Difficulty Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  label="Difficulty"
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                  <MenuItem value="mixed">Mixed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Topics Selection */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="topics"
                options={topics}
                value={formData.selectedTopics}
                onChange={handleTopicChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Topics (Optional)"
                    placeholder="Select Topics"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip 
                      label={option} 
                      {...getTagProps({ index })}
                      sx={{ 
                        backgroundColor: darkMode ? 'primary.dark' : 'primary.light', 
                        color: darkMode ? 'white' : 'primary.dark'
                      }} 
                    />
                  ))
                }
              />
              <FormHelperText>
                Leave empty to include questions from all topics
              </FormHelperText>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Question Distribution
              </Typography>
            </Grid>
            
            {/* MCQ Count */}
            <Grid item xs={12} md={6}>
              <Typography id="mcq-slider" gutterBottom>
                MCQ Questions: {formData.mcqCount}
              </Typography>
              <Slider
                value={formData.mcqCount}
                onChange={handleSliderChange('mcqCount')}
                aria-labelledby="mcq-slider"
                valueLabelDisplay="auto"
                step={1}
                marks
                min={0}
                max={15}
              />
            </Grid>
            
            {/* Programming Count */}
            <Grid item xs={12} md={6}>
              <Typography id="programming-slider" gutterBottom>
                Programming Questions: {formData.programmingCount}
              </Typography>
              <Slider
                value={formData.programmingCount}
                onChange={handleSliderChange('programmingCount')}
                aria-labelledby="programming-slider"
                valueLabelDisplay="auto"
                step={1}
                marks
                min={0}
                max={10}
              />
            </Grid>
            
            {/* Time Limit */}
            <Grid item xs={12}>
              <Typography id="time-slider" gutterBottom>
                Time Limit: {formData.timeLimit} minutes
              </Typography>
              <Slider
                value={formData.timeLimit}
                onChange={handleSliderChange('timeLimit')}
                aria-labelledby="time-slider"
                valueLabelDisplay="auto"
                step={10}
                marks={[
                  { value: 0, label: '0' },
                  { value: 60, label: '1hr' },
                  { value: 120, label: '2hr' },
                  { value: 180, label: '3hr' }
                ]}
                min={10}
                max={180}
              />
              {errors.timeLimit && (
                <FormHelperText error>{errors.timeLimit}</FormHelperText>
              )}
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12} sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ 
                  minWidth: '200px',
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Create Test'
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default PARandomTestForm; 