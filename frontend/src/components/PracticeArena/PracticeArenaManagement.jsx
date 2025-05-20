import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  useTheme,
  alpha,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  TableSortLabel,
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CodeIcon from '@mui/icons-material/Code';
import QuizIcon from '@mui/icons-material/Quiz';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CategoryIcon from '@mui/icons-material/Category';
import TagIcon from '@mui/icons-material/Tag';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { apiUrl } from '../../config/apiConfig';
import { Link } from 'react-router-dom';
import PAQuestionForm from './PAQuestionForm';
import { toast } from 'react-toastify';

// Extract unique topics from questions
const extractTopics = (questions) => {
  const topicsSet = new Set();
  questions.forEach(question => {
    if (question.topics && Array.isArray(question.topics)) {
      question.topics.forEach(topic => topicsSet.add(topic));
    }
  });
  return [...topicsSet];
};

// Extract unique tags from questions
const extractTags = (questions) => {
  const tagsSet = new Set();
  questions.forEach(question => {
    if (question.tags && Array.isArray(question.tags)) {
      question.tags.forEach(tag => tagsSet.add(tag));
    }
  });
  return [...tagsSet];
};

const PracticeArenaManagement = () => {
  const { palette } = useTheme();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  // State for questions
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for the question form
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);

  // State for search, sort, and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({
    difficulty: '',
    type: '',
    topic: '',
    tag: ''
  });
  
  // Computed values for stats
  const totalQuestions = questions.length;
  const topics = useMemo(() => extractTopics(questions), [questions]);
  const tags = useMemo(() => extractTags(questions), [questions]);
  
  // Calculate difficulty counts
  const easyQuestions = useMemo(() => questions.filter(q => q.difficultyLevel === 'easy').length, [questions]);
  const mediumQuestions = useMemo(() => questions.filter(q => q.difficultyLevel === 'medium').length, [questions]);
  const hardQuestions = useMemo(() => questions.filter(q => q.difficultyLevel === 'hard').length, [questions]);
  
  // Calculate question type counts
  const mcqQuestions = useMemo(() => questions.filter(q => q.type === 'mcq').length, [questions]);
  const programmingQuestions = useMemo(() => questions.filter(q => q.type === 'programming').length, [questions]);
  
  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);
  
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/practice-arena/questions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Fetched questions:', response.data);
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setFormOpen(true);
  };
  
  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setFormOpen(true);
  };
  
  const handleDeleteQuestion = (questionId) => {
    setDeletingQuestionId(questionId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteQuestion = async () => {
    try {
      await axios.delete(`${apiUrl}/practice-arena/questions/${deletingQuestionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      fetchQuestions(); // Refresh questions after deletion
      toast.success('Question deleted successfully');
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingQuestionId(null);
    }
  };
  
  const handleFormClose = (refreshNeeded = false) => {
    setFormOpen(false);
    setEditingQuestion(null);
    
    if (refreshNeeded) {
      fetchQuestions();
    }
  };
  
  const saveQuestion = async (questionData) => {
    console.log('Saving question data:', questionData);
    try {
      let dataToSend = { ...questionData };
      
      // Clean up data based on question type to avoid validation errors
      if (dataToSend.type === 'programming') {
        // For programming questions, remove options field entirely to avoid validation errors
        delete dataToSend.options;
      } else if (dataToSend.type === 'mcq') {
        // For MCQ questions, remove programming-specific fields
        delete dataToSend.languages;
        delete dataToSend.defaultLanguage;
        delete dataToSend.testCases;
        delete dataToSend.examples;
        delete dataToSend.constraints;
      }
      
      if (editingQuestion) {
        // Update existing question
        await axios.put(`${apiUrl}/practice-arena/questions/${editingQuestion._id}`, dataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success('Question updated successfully');
      } else {
        // Create new question
        const response = await axios.post(`${apiUrl}/practice-arena/questions`, dataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Question created successfully:', response.data);
        toast.success('Question created successfully');
      }
      
      // Close the form and refresh the questions list
      handleFormClose(true);
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error(error.response?.data?.message || 'Failed to save question');
    }
  };
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle sort
  const handleSort = (property) => {
    const isAsc = sortBy === property && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  // Handle filter change
  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value
    });
    setPage(0);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      difficulty: '',
      type: '',
      topic: '',
      tag: ''
    });
  };

  // Filter and sort the questions
  const filteredAndSortedQuestions = useMemo(() => {
    return questions
      .filter(question => {
        // Apply search
        const searchFields = [
          question.title,
          question.description,
          question.maintag
        ];
        const searchMatches = searchTerm === '' || 
          searchFields.some(field => 
            field && field.toLowerCase().includes(searchTerm.toLowerCase())
          );
        
        // Apply filters
        const difficultyMatches = filters.difficulty === '' || question.difficultyLevel === filters.difficulty;
        const typeMatches = filters.type === '' || question.type === filters.type;
        
        const topicMatches = filters.topic === '' || 
          (question.topics && question.topics.includes(filters.topic));
        
        const tagMatches = filters.tag === '' || 
          (question.tags && question.tags.includes(filters.tag));
        
        return searchMatches && difficultyMatches && typeMatches && topicMatches && tagMatches;
      })
      .sort((a, b) => {
        // Handle sorting
        if (sortBy === 'marks') {
          return sortDirection === 'asc' ? a.marks - b.marks : b.marks - a.marks;
        }
        
        const valueA = (a[sortBy] || '').toString().toLowerCase();
        const valueB = (b[sortBy] || '').toString().toLowerCase();
        
        if (sortDirection === 'asc') {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      });
  }, [questions, searchTerm, sortBy, sortDirection, filters]);

  return (
    <Box>
      <Container maxWidth="xl">
        {/* Header */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, md: 3 }, 
            mb: 3, 
            borderRadius: 2, 
            background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
            color: 'white'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Practice Arena Management
              </Typography>
              <Typography variant="subtitle1">
                Create and manage practice questions for users to enhance their skills
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', mt: { xs: 1, md: 0 } }}>
              <Tooltip title="Refresh data">
                <IconButton 
                  onClick={fetchQuestions} 
                  sx={{ 
                    color: 'white', 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                    mr: 2
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddQuestion}
                sx={{ 
                  bgcolor: 'white', 
                  color: '#2E7D32',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                  px: 3,
                  py: 1.2,
                  fontWeight: 'bold',
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
                }}
              >
                Add Question
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              height: '100%',
              background: palette.mode === 'dark' ? '#1E1E1E' : '#121212',
              color: 'white',
              position: 'relative'
            }}>
              <Box sx={{ height: 5, bgcolor: '#4CAF50', position: 'absolute', top: 0, left: 0, right: 0 }} />
              <Box sx={{ p: 2, pt: 2.5 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1,
                  color: '#4CAF50'
                }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(76, 175, 80, 0.2)', 
                      color: '#4CAF50',
                      width: 32, 
                      height: 32,
                      mr: 1.5,
                    }}
                  >
                    <LibraryBooksIcon sx={{ fontSize: '1.2rem' }} />
                  </Avatar>
                  <Typography variant="body1" fontWeight="medium">
                    Total Questions
                  </Typography>
                </Box>
                
                <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                  {totalQuestions}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Box>
                    <Typography variant="body2" color="#4fc3f7" fontWeight="medium">
                      Programming
                    </Typography>
                    <Typography variant="subtitle1" color="white">
                      {programmingQuestions}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="#ce93d8" fontWeight="medium">
                      MCQ
                    </Typography>
                    <Typography variant="subtitle1" color="white">
                      {mcqQuestions}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              height: '100%',
              background: palette.mode === 'dark' ? '#1E1E1E' : '#121212',
              color: 'white',
              position: 'relative'
            }}>
              <Box sx={{ height: 5, bgcolor: '#673AB7', position: 'absolute', top: 0, left: 0, right: 0 }} />
              <Box sx={{ p: 2, pt: 2.5 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1,
                  color: '#673AB7'
                }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(103, 58, 183, 0.2)', 
                      color: '#673AB7',
                      width: 32, 
                      height: 32,
                      mr: 1.5,
                    }}
                  >
                    <CategoryIcon sx={{ fontSize: '1.2rem' }} />
                  </Avatar>
                  <Typography variant="body1" fontWeight="medium">
                    Topics
                  </Typography>
                </Box>
                
                <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                  {topics.length}
                </Typography>
                
                <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
                  Categorizing questions across {topics.length} different topics
                </Typography>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              height: '100%',
              background: palette.mode === 'dark' ? '#1E1E1E' : '#121212',
              color: 'white',
              position: 'relative'
            }}>
              <Box sx={{ height: 5, bgcolor: '#2196F3', position: 'absolute', top: 0, left: 0, right: 0 }} />
              <Box sx={{ p: 2, pt: 2.5 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1,
                  color: '#2196F3'
                }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(33, 150, 243, 0.2)', 
                      color: '#2196F3',
                      width: 32, 
                      height: 32,
                      mr: 1.5,
                    }}
                  >
                    <TagIcon sx={{ fontSize: '1.2rem' }} />
                  </Avatar>
                  <Typography variant="body1" fontWeight="medium">
                    Tags
                  </Typography>
                </Box>
                
                <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                  {tags.length}
                </Typography>
                
                <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
                  {totalQuestions > 0 ? `${(tags.length / totalQuestions * 100).toFixed(1)}% tag coverage ratio` : 'No questions with tags'}
                </Typography>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              height: '100%',
              background: palette.mode === 'dark' ? '#1E1E1E' : '#121212',
              color: 'white',
              position: 'relative'
            }}>
              <Box sx={{ height: 5, bgcolor: '#F44336', position: 'absolute', top: 0, left: 0, right: 0 }} />
              <Box sx={{ p: 2, pt: 2.5 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1,
                  color: '#F44336'
                }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(244, 67, 54, 0.2)', 
                      color: '#F44336',
                      width: 32, 
                      height: 32,
                      mr: 1.5,
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: '1.2rem' }} />
                  </Avatar>
                  <Typography variant="body1" fontWeight="medium">
                    Avg. Difficulty
                  </Typography>
                </Box>
                
                <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                  {questions.length > 0 ? (
                    (() => {
                      const difficultyCount = {
                        easy: questions.filter(q => q.difficultyLevel === 'easy').length,
                        medium: questions.filter(q => q.difficultyLevel === 'medium').length,
                        hard: questions.filter(q => q.difficultyLevel === 'hard').length
                      };
                      const mostCommon = Object.entries(difficultyCount).sort((a, b) => b[1] - a[1])[0][0];
                      return mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1);
                    })()
                  ) : 'N/A'}
                </Typography>
                
                <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
                  {easyQuestions} easy, {mediumQuestions} medium, {hardQuestions} hard
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
        
        {/* Difficulty Breakdown */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={12} md={12}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              background: alpha(palette.background.paper, 0.8),
              backdropFilter: 'blur(8px)'
            }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <FilterListIcon sx={{ mr: 1 }} /> Difficulty Breakdown
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha('#4CAF50', 0.1),
                      border: '1px solid',
                      borderColor: alpha('#4CAF50', 0.2)
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        bgcolor: '#4CAF50',
                        color: 'white',
                        width: 40,
                        height: 40,
                        mr: 2,
                        fontWeight: 'bold'
                      }}
                    >
                      E
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Easy Questions
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="#4CAF50">
                        {easyQuestions}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha('#FF9800', 0.1),
                      border: '1px solid',
                      borderColor: alpha('#FF9800', 0.2)
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        bgcolor: '#FF9800',
                        color: 'white',
                        width: 40,
                        height: 40,
                        mr: 2,
                        fontWeight: 'bold'
                      }}
                    >
                      M
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Medium Questions
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="#FF9800">
                        {mediumQuestions}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha('#F44336', 0.1),
                      border: '1px solid',
                      borderColor: alpha('#F44336', 0.2)
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        bgcolor: '#F44336',
                        color: 'white',
                        width: 40,
                        height: 40,
                        mr: 2,
                        fontWeight: 'bold'
                      }}
                    >
                      H
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Hard Questions
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="#F44336">
                        {hardQuestions}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Filter and Search Section */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search questions..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulty</InputLabel>
                <Select
                  name="difficulty"
                  value={filters.difficulty}
                  onChange={handleFilterChange}
                  label="Difficulty"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  label="Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="programming">Programming</MenuItem>
                  <MenuItem value="mcq">MCQ</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Topic</InputLabel>
                <Select
                  name="topic"
                  value={filters.topic}
                  onChange={handleFilterChange}
                  label="Topic"
                >
                  <MenuItem value="">All</MenuItem>
                  {topics.map(topic => (
                    <MenuItem key={topic} value={topic}>
                      {topic}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={resetFilters}
                sx={{ height: '40px' }}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress size={50} thickness={4} />
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: alpha(palette.primary.main, 0.08) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      <TableSortLabel
                        active={sortBy === 'title'}
                        direction={sortBy === 'title' ? sortDirection : 'asc'}
                        onClick={() => handleSort('title')}
                      >
                        Title
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      <TableSortLabel
                        active={sortBy === 'maintag'}
                        direction={sortBy === 'maintag' ? sortDirection : 'asc'}
                        onClick={() => handleSort('maintag')}
                      >
                        Main Tag
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      Tags
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      <TableSortLabel
                        active={sortBy === 'type'}
                        direction={sortBy === 'type' ? sortDirection : 'asc'}
                        onClick={() => handleSort('type')}
                      >
                        Type
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      <TableSortLabel
                        active={sortBy === 'difficultyLevel'}
                        direction={sortBy === 'difficultyLevel' ? sortDirection : 'asc'}
                        onClick={() => handleSort('difficultyLevel')}
                      >
                        Difficulty
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      <TableSortLabel
                        active={sortBy === 'marks'}
                        direction={sortBy === 'marks' ? sortDirection : 'asc'}
                        onClick={() => handleSort('marks')}
                      >
                        Marks
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedQuestions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((question) => (
                    <TableRow 
                      key={question._id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: alpha(palette.primary.main, 0.04),
                          transition: 'background-color 0.2s ease' 
                        }
                      }}
                    >
                      <TableCell sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                        {question.title}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={question.maintag || 'Unspecified'} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            borderRadius: 1,
                            fontWeight: 500,
                            px: 0.5,
                            borderColor: palette.primary.light,
                            color: palette.primary.main,
                            backgroundColor: alpha(palette.primary.main, 0.05)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {question.tags && question.tags.length > 0 ? (
                            question.tags.map((tag, index) => (
                              <Chip 
                                key={index}
                                label={tag} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  borderRadius: 1,
                                  fontWeight: 500,
                                  fontSize: '0.7rem',
                                  height: 20,
                                  borderColor: alpha(palette.info.main, 0.4),
                                  color: palette.info.main,
                                  backgroundColor: alpha(palette.info.main, 0.05),
                                  mb: 0.5
                                }}
                              />
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No tags
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={question.type === 'programming' ? <CodeIcon fontSize="small" /> : <QuizIcon fontSize="small" />}
                          label={question.type === 'programming' ? 'Programming' : 'MCQ'} 
                          size="small"
                          sx={{
                            borderRadius: 1,
                            backgroundColor: question.type === 'programming' 
                              ? alpha(palette.info.main, 0.1) 
                              : alpha(palette.secondary.main, 0.1),
                            color: question.type === 'programming' 
                              ? palette.info.main 
                              : palette.secondary.main,
                            fontWeight: 500,
                            border: 'none'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={question.difficultyLevel} 
                          color={getDifficultyColor(question.difficultyLevel)}
                          size="small"
                          sx={{ 
                            borderRadius: 1,
                            fontWeight: 500,
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{question.marks}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditQuestion(question)}
                              sx={{ 
                                color: palette.primary.main,
                                bgcolor: alpha(palette.primary.main, 0.1),
                                '&:hover': {
                                  bgcolor: alpha(palette.primary.main, 0.2)
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteQuestion(question._id)}
                              sx={{ 
                                color: palette.error.main,
                                bgcolor: alpha(palette.error.main, 0.1),
                                '&:hover': {
                                  bgcolor: alpha(palette.error.main, 0.2)
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAndSortedQuestions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: 2,
                            py: 4 
                          }}
                        >
                          <LibraryBooksIcon sx={{ fontSize: 60, color: alpha(palette.text.secondary, 0.3) }} />
                          <Typography color="textSecondary" sx={{ mb: 1 }}>
                            {questions.length === 0 ? 'No questions available' : 'No matching questions found'}
                          </Typography>
                          {questions.length === 0 && (
                            <Button 
                              variant="outlined" 
                              size="small" 
                              onClick={handleAddQuestion}
                              startIcon={<AddIcon />}
                            >
                              Add your first question
                            </Button>
                          )}
                          {questions.length > 0 && (
                            <Button 
                              variant="outlined" 
                              size="small" 
                              onClick={resetFilters}
                              startIcon={<FilterListIcon />}
                            >
                              Reset Filters
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={filteredAndSortedQuestions.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ 
                borderTop: `1px solid ${alpha(palette.divider, 0.1)}`,
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontWeight: 500
                }
              }}
            />
          </Paper>
        )}
      
        {/* Question Form Dialog */}
        <Dialog 
          open={formOpen} 
          onClose={() => handleFormClose()} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }
          }}
        >
          <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            <PAQuestionForm
              initialData={editingQuestion}
              onSave={saveQuestion}
              onCancel={() => handleFormClose()}
              isEdit={!!editingQuestion}
            />
          </DialogContent>
        </Dialog>
      
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              p: 1
            }
          }}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="bold">
              Confirm Deletion
            </Typography>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              sx={{ 
                color: palette.text.secondary,
                '&:hover': {
                  backgroundColor: alpha(palette.text.secondary, 0.1)
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDeleteQuestion} 
              variant="contained" 
              color="error"
              sx={{ 
                px: 2,
                boxShadow: '0 4px 8px rgba(211, 47, 47, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 12px rgba(211, 47, 47, 0.3)'
                }
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default PracticeArenaManagement; 