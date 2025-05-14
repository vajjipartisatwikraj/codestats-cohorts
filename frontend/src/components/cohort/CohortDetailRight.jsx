import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Card,
  CardContent,
  alpha,
  TextField,
  InputAdornment,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import BugReportIcon from '@mui/icons-material/BugReport';
import { useNavigate } from 'react-router-dom';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import CohortFeedback from './CohortFeedback';

const CohortDetailRight = ({ 
  module, 
  userProgress, 
  handleSolveQuestion, 
  isAdmin = false,
  handleEditQuestion,
  handleOpenQuestionDialog,
  handleDeleteQuestion,
  showFeedback = false,
  cohortId
}) => {
  const theme = useTheme();
  const { darkMode } = useAppTheme();
  const navigate = useNavigate();
  
  // Initialize all state variables here, before any conditional returns
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState([]);

  // Handle filter changes
  const handleStatusFilterChange = (event, newValue) => {
    if (newValue !== null) {
      setStatusFilter(newValue);
    }
  };

  const handleDifficultyFilterChange = (event) => {
    const {
      target: { value },
    } = event;
    setDifficultyFilter(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  // Navigate to reports page (admin only)
  const handleViewReports = () => {
    if (module && module.cohort) {
      navigate(`/cohorts/${module.cohort}/reports`);
    }
  };

  // Function to check if a question is solved - defined before any conditional returns
  const isQuestionSolved = (questionId) => {
    if (!userProgress || !userProgress.questionProgress) return false;
    
    const questionProgress = userProgress.questionProgress.find(
      qp => qp.question.toString() === questionId.toString()
    );
    
    return questionProgress && questionProgress.solved;
  };
  
  if (showFeedback && !isAdmin) {
    return (
      <Box sx={{ 
        p: { xs: 2, md: 2 }, 
        height: '120%', 
        bgcolor: darkMode ? '#000000' : '#FFFFFF',
        color: darkMode ? '#FFFFFF' : '#333333',
        borderRadius: { xs: 0, md: '10px' },
        ml: { xs: 0, md: 0 },
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        position: { md: 'fixed' },
        width: { md: 'calc(100% - 490px)', lg: 'calc(100% - 520px)' },
        right: { md: '24px', lg: '40px' },
        top: { md: 'calc(60px + 24px)' },
        maxHeight: { md: 'calc(100vh - 60px - 48px)' },
        overflowY: 'auto'
      }}>
        <CohortFeedback cohortId={cohortId} />
      </Box>
    );
  }
  
  if (!module) return null;
  
  // Get progress data for the current module
  const moduleProgress = userProgress?.moduleProgress?.find(mp => mp.module === module._id);
  const questionProgressList = userProgress?.questionProgress || [];
  
  // Calculate progress stats
  const totalQuestions = module.questions?.length || 0;
  const completedQuestions = moduleProgress?.questionsCompleted || 0;
  const progressPercent = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
  
  // Group questions by difficulty
  const easyQuestions = module.questions?.filter(q => q.difficultyLevel === 'easy') || [];
  const mediumQuestions = module.questions?.filter(q => q.difficultyLevel === 'medium') || [];
  const hardQuestions = module.questions?.filter(q => q.difficultyLevel === 'hard') || [];
  
  // Calculate difficulty-wise completion
  const getCompletedCount = (questions) => {
    return questions.filter(q => {
      const qProgress = questionProgressList.find(qp => qp.question === q._id);
      return qProgress?.solved;
    }).length;
  };
  
  const easyCompleted = getCompletedCount(easyQuestions);
  const mediumCompleted = getCompletedCount(mediumQuestions);
  const hardCompleted = getCompletedCount(hardQuestions);

  // Filter questions based on search query and filters
  const filteredQuestions = module.questions?.filter(question => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (question.description && question.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Status filter
    const questionProgress = questionProgressList.find(qp => qp.question === question._id);
    const isSolved = questionProgress?.solved || false;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'solved' && isSolved) || 
      (statusFilter === 'unsolved' && !isSolved);
    
    // Difficulty filter
    const matchesDifficulty = difficultyFilter.length === 0 || 
      difficultyFilter.includes(question.difficultyLevel);
    
    return matchesSearch && matchesStatus && matchesDifficulty;
  }) || [];
  
  return (
    <Box sx={{ 
      p: { xs: 2, md: 2 }, 
      height: '120%', 
      bgcolor: darkMode ? '#000000' : '#FFFFFF',
      color: darkMode ? '#FFFFFF' : '#333333',
      borderRadius: { xs: 0, md: '10px' },
      ml: { xs: 0, md: 0 },
      boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      position: { md: 'fixed' },
      width: { md: 'calc(100% - 490px)', lg: 'calc(100% - 520px)' },
      right: { md: '24px', lg: '40px' },
      top: { md: 'calc(60px + 24px)' },
      maxHeight: { md: 'calc(100vh - 60px - 48px)' }
    }}>
      {/* Module Title and Description */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 2
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            fontSize: '1.8rem',
            my: 0, // Remove any top/bottom margin
            lineHeight: 1.2
          }}>
            {module.title}
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1 
          }}>
            {isAdmin && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<BugReportIcon />}
                onClick={handleViewReports}
                sx={{ 
                  bgcolor: 'transparent', 
                  color: '#f44336',
                  border: '1.6px solid #f44336',
                  borderRadius: '8px',
                  minWidth: 'auto',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  height: '28px',
                  '&:hover': { 
                    bgcolor: '#f44336',
                    color: 'white'
                  }
                }}
              >
                Issues
              </Button>
            )}
            {module.videoResource && (
              <Tooltip title="Video Resource">
              <Button
                  href={module.videoResource}
                  target="_blank"
                size="small"
                  sx={{ 
                    bgcolor: 'transparent', 
                    color: '#0088CC',
                    border: '1.6px solid #0088CC',
                    borderRadius: '8px',
                    minWidth: 'auto',
                    padding: '3px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    height: '28px',
                    '&:hover': { 
                      bgcolor: '#0088CC',
                      color: 'white'
                    }
                  }}
              >
                  Video
              </Button>
              </Tooltip>
            )}
            
            {module.documentationUrl && (
              <Tooltip title="Documentation">
              <Button
                  href={module.documentationUrl}
                  target="_blank"
                size="small"
                  sx={{ 
                    bgcolor: 'transparent', 
                    color: '#0088CC',
                    border: '1.6px solid #0088CC',
                    borderRadius: '8px',
                    minWidth: 'auto',
                    padding: '3px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    height: '28px',
                    '&:hover': { 
                      bgcolor: '#0088CC',
                      color: 'white'
                    }
                  }}
              >
                  Notes
              </Button>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.85, maxWidth: '90%', fontSize: '0.8rem' }}>
          {module.description}
        </Typography>
        
        {/* Progress bars - Only show for non-admin users */}
        {!isAdmin && (
          <Box sx={{ mb: 3 }}>
            {/* Difficulty progress bars in horizontal layout */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}>
              {/* Easy */}
              <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mb: 1, 
                  alignItems: 'center' 
                }}>
                  <Typography variant="subtitle2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                    Easy
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkMode ? 'text.secondary' : 'rgba(0, 0, 0, 0.6)' }}>
                    {easyCompleted} / {easyQuestions.length} completed
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={easyQuestions.length > 0 ? (easyCompleted / easyQuestions.length) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha('#4caf50', darkMode ? 0.15 : 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#4caf50',
                    }
                  }}
                />
              </Box>
              
              {/* Medium */}
              <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mb: 1, 
                  alignItems: 'center' 
                }}>
                  <Typography variant="subtitle2" sx={{ color: '#ff9800', fontWeight: 600 }}>
                    Medium
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkMode ? 'text.secondary' : 'rgba(0, 0, 0, 0.6)' }}>
                    {mediumCompleted} / {mediumQuestions.length} completed
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={mediumQuestions.length > 0 ? (mediumCompleted / mediumQuestions.length) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha('#ff9800', darkMode ? 0.15 : 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#ff9800',
                    }
                  }}
                />
              </Box>
              
              {/* Hard */}
              <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mb: 1, 
                  alignItems: 'center' 
                }}>
                  <Typography variant="subtitle2" sx={{ color: '#f44336', fontWeight: 600 }}>
                    Hard
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkMode ? 'text.secondary' : 'rgba(0, 0, 0, 0.6)' }}>
                    {hardCompleted} / {hardQuestions.length} completed
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={hardQuestions.length > 0 ? (hardCompleted / hardQuestions.length) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha('#f44336', darkMode ? 0.15 : 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#f44336',
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* Search and Filter Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'center' }}>
            {/* Search with Button */}
            <Box sx={{ 
              display: 'flex', 
              flex: { xs: '1 1 auto', md: '0 1 auto' },
              maxWidth: { md: '400px' }
            }}>
              <Box sx={{ 
                position: 'relative', 
                display: 'flex', 
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                bgcolor: darkMode ? 'rgba(20, 20, 20, 0.6)' : 'rgba(0, 0, 0, 0.05)',
                border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  pl: 1.5,
                  color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'
                }}>
                  <SearchIcon fontSize="small" />
                </Box>
                <TextField
                  variant="standard"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    flex: 1,
                    '& .MuiInputBase-root': {
                      px: 1,
                      py: 0.5,
                      '&::before, &::after': {
                        display: 'none',
                      }
                    },
                    '& .MuiInputBase-input': {
                      color: darkMode ? '#ffffff' : '#333333',
                      fontSize: '0.9rem',
                      py: 0.75,
                      height: 'auto'
                    }
                  }}
                  InputProps={{
                    disableUnderline: true
                  }}
                />
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: '#0088CC',
                    color: '#ffffff',
                    borderRadius: 0,
                    '&:hover': {
                      bgcolor: alpha('#0088CC', 0.9),
                    },
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 3
                  }}
                >
                  Search
                </Button>
              </Box>
            </Box>

            {/* Title and Add Question Button - REMOVED */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', mr: { xs: 0, md: 2 } }}>
              {/* Admin add question button removed - moved to dedicated row */}
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Status Label */}
              <Typography variant="body2" sx={{ display: { xs: 'none', lg: 'block' }, color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                Status
              </Typography>
              
              {/* Solved/Unsolved Filter Dropdown */}
              <FormControl sx={{ minWidth: '110px' }} size="small">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    color: darkMode ? '#ffffff' : '#333333',
                    bgcolor: darkMode ? 'rgba(20, 20, 20, 0.4)' : 'rgba(0, 0, 0, 0.03)',
                    height: '40px',
                    fontSize: '0.9rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)',
                      borderWidth: '1px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.25)',
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: darkMode ? '#121212' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#333333'
                      }
                    }
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="solved">Solved</MenuItem>
                  <MenuItem value="unsolved">Unsolved</MenuItem>
                </Select>
              </FormControl>
              
              {/* Difficulty Label */}
              <Typography variant="body2" sx={{ display: { xs: 'none', lg: 'block' }, color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                Difficulty
              </Typography>

              {/* Difficulty Filter Dropdown */}
              <FormControl sx={{ minWidth: '110px' }} size="small">
                <Select
                  value={difficultyFilter.length === 1 ? difficultyFilter[0] : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setDifficultyFilter([]);
                    } else {
                      setDifficultyFilter([value]);
                    }
                  }}
                  displayEmpty
                  sx={{
                    color: darkMode ? '#ffffff' : '#333333',
                    bgcolor: darkMode ? 'rgba(20, 20, 20, 0.4)' : 'rgba(0, 0, 0, 0.03)',
                    height: '40px',
                    fontSize: '0.9rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)',
                      borderWidth: '1px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.25)',
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: darkMode ? '#121212' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#333333'
                      }
                    }
                  }}
                  renderValue={(selected) => {
                    if (selected === '') {
                      return 'All';
                    }
                    
                    const color = 
                      selected === 'easy' ? '#4caf50' :
                      selected === 'medium' ? '#ff9800' : '#f44336';
                      
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                        {selected.charAt(0).toUpperCase() + selected.slice(1)}
                      </Box>
                    );
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="easy">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50' }} />
                      Easy
                    </Box>
                  </MenuItem>
                  <MenuItem value="medium">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ff9800' }} />
                      Medium
                    </Box>
                  </MenuItem>
                  <MenuItem value="hard">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f44336' }} />
                      Hard
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>

        {/* Questions Title Row with Add Button - Only visible to admins */}
        {isAdmin && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 1,
            borderBottom: '1px solid',
            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            mb: 1
          }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 700, 
                color: darkMode ? '#ffffff' : '#333333', 
                fontSize: '1rem'
              }}
            >
              Questions
            </Typography>
            
            {handleOpenQuestionDialog && (
              <Tooltip title="Add Question">
                <IconButton
                  onClick={() => handleOpenQuestionDialog(module)}
                  size="small"
                  sx={{ 
                    color: darkMode ? '#0088CC' : '#0088CC',
                    '&:hover': {
                      bgcolor: alpha('#0088CC', 0.1)
                    }
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
      
      {/* Question Cards - Only this part scrollable */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto',
        backgroundColor: 'transparent',
        pr: 1,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(darkMode ? '#ffffff' : '#000000', 0.2),
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: alpha(darkMode ? '#ffffff' : '#000000', 0.3),
        },
        scrollbarWidth: 'thin',
        scrollbarColor: `${alpha(darkMode ? '#ffffff' : '#000000', 0.2)} transparent`
      }}>
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question, index) => {
            const questionProgress = questionProgressList.find(qp => qp.question === question._id);
            const isSolved = questionProgress?.solved || false;
            
            // Define colors based on difficulty
            const difficultyColor = 
              question.difficultyLevel === 'easy' ? '#4caf50' :
              question.difficultyLevel === 'medium' ? '#ff9800' : 
              '#f44336';
            
            // Blur color based on solved status
            const blurColor = isSolved ? 'rgba(76, 175, 80, 0.7)' : 'rgba(0, 136, 204, 0.7)';
            
            return (
              <Card 
                key={question._id} 
                sx={{ 
                  mb: 1.5,
                  border: '0px solid',
                  borderRadius: '10px',
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: darkMode ? '#000D16' : '#f5f8fa',
                  minHeight: '120px'
                }}
              >
                {/* Gaussian blur effect */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '70%',
                    height: '140%',
                    background: `radial-gradient(circle at bottom right, ${blurColor} 10%, transparent 80%)`,
                    filter: 'blur(70px)',
                    zIndex: 0,
                    opacity: darkMode ? 1 : 0.5
                  }}
                />
                
                <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        mb: 0.5,
                        display: 'flex', 
                        alignItems: 'center', 
                        fontSize: '1.1rem', 
                        color: darkMode ? '#ffffff' : '#333333' 
                      }}>
                        {question.title}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 2, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: difficultyColor,
                            fontWeight: 'medium',
                            fontSize: '0.8rem'
                          }}
                        >
                          {question.difficultyLevel.charAt(0).toUpperCase() + question.difficultyLevel.slice(1)}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: darkMode ? '#ffffff' : '#555555',
                            opacity: darkMode ? 0.8 : 1,
                            fontSize: '0.8rem'
                          }}
                        >
                          Acceptance Rate: {Math.round((question.stats?.acceptedSubmissions / question.stats?.totalSubmissions) * 100) || 0}%
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: darkMode ? '#ffffff' : '#555555',
                            opacity: darkMode ? 0.8 : 1,
                            fontSize: '0.8rem'
                          }}
                        >
                          Points: {question.marks || 10}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {isAdmin && handleEditQuestion && (
                        <>
                          <Tooltip title="Edit Question">
                            <IconButton
                              size="small"
                              onClick={() => handleEditQuestion(module, question)}
                              sx={{ 
                                bgcolor: alpha('#0088CC', 0.1),
                                color: '#0088CC',
                                '&:hover': {
                                  bgcolor: alpha('#0088CC', 0.2)
                                },
                                width: 30,
                                height: 30
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete Question">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteQuestion(module, question)}
                              sx={{
                                bgcolor: alpha('#f44336', 0.1),
                                color: '#f44336',
                                '&:hover': {
                                  bgcolor: alpha('#f44336', 0.2)
                                },
                                width: 30,
                                height: 30
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    
                      {/* Only show Solve Challenge button for non-admin users */}
                      {!isAdmin && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleSolveQuestion(question)}
                          sx={{
                            bgcolor: isSolved ? '#01780F' : '#0088CC',
                            color: '#ffffff',
                            '&:hover': {
                              bgcolor: isSolved ? alpha('#01780F', 0.9) : alpha('#0088CC', 0.9)
                            },
                            fontWeight: 'medium',
                            textTransform: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            py: 0.5,
                            px: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          {isSolved && <CheckCircleIcon sx={{ fontSize: '0.9rem' }} />}
                          {isSolved ? 'Solved' : 'Solve Challenge'}
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '200px',
            color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
          }}>
            <Typography variant="body1">
              {module.questions?.length === 0 && isAdmin
                ? "No questions in this module. Click the '+' button to create one."
                : "No questions match your filters"}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CohortDetailRight;