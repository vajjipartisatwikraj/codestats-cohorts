import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, TextField, IconButton, InputAdornment, CircularProgress, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { apiUrl } from '../config/apiConfig';

// Animated Placeholder Component
const AnimatedPlaceholder = ({ darkMode }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [animationState, setAnimationState] = useState('visible');
  const searchTerms = ['Users', 'Courses', 'Opportunities', 'Cohorts'];
  
  useEffect(() => {
    // Start with visible state
    setAnimationState('visible');
    
    // After 2 seconds, start fade out
    const fadeOutTimer = setTimeout(() => {
      setAnimationState('fadeOut');
    }, 2000);
    
    // After fade out, change word and fade in
    const changeWordTimer = setTimeout(() => {
      setAnimationState('fadeIn');
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % searchTerms.length);
    }, 2300);
    
    // Clean up timers
    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(changeWordTimer);
    };
  }, [currentWordIndex]);
  
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      <Typography
        variant="body2"
        component="span"
        sx={{ 
          color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          fontSize: '0.9rem',
          whiteSpace: 'nowrap'
        }}
      >
        Find 
      </Typography>
      <Typography
        variant="body2"
        component="span"
        sx={{
          color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          fontSize: '0.9rem',
          width: '110px',
          display: 'inline-block',
          position: 'relative',
          overflow: 'hidden',
          height: '20px',
          ml: '3px'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            opacity: animationState === 'fadeOut' ? 0 : 1,
            transform: animationState === 'fadeIn' 
              ? 'translateY(-100%)' 
              : animationState === 'fadeOut' 
                ? 'translateY(100%)' 
                : 'translateY(0)',
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            whiteSpace: 'nowrap'
          }}
        >
          "{searchTerms[currentWordIndex]}"
        </Box>
      </Typography>
    </Box>
  );
};

const SearchPage = () => {
  const { darkMode } = useTheme();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Get theme-aware colors
  const themeColors = {
    searchBg: darkMode ? 'rgba(23, 23, 23, 0.3)' : 'rgba(0, 0, 0, 0.05)',
    searchHoverBg: darkMode ? 'rgba(35, 35, 35, 0.4)' : 'rgba(0, 0, 0, 0.08)',
    searchText: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
    searchPlaceholder: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    resultsBg: darkMode ? '#070707' : '#ffffff',
    resultsHoverBg: darkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.04)',
    resultsBorder: darkMode ? '#131313' : 'rgba(0, 0, 0, 0.1)',
    searchBorder: darkMode ? 'rgba(46, 46, 46, 0.5)' : 'rgba(0, 0, 0, 0.1)',
    scrollbarThumb: darkMode ? 'rgba(61, 61, 61, 0.5)' : 'rgba(0, 0, 0, 0.3)',
    scrollbarTrack: darkMode ? 'transparent' : 'rgba(0, 0, 0, 0.05)',
  };

  // Custom scrollbar style
  const customScrollbarStyle = {
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-track': {
      background: themeColors.scrollbarTrack,
      marginTop: '4px',
      marginBottom: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: themeColors.scrollbarThumb,
      borderRadius: '10px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: darkMode ? 'rgba(61, 61, 61, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    },
    scrollbarWidth: 'thin',
    scrollbarColor: `${themeColors.scrollbarThumb} ${themeColors.scrollbarTrack}`
  };

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      setIsFocused(true);
    }
  }, []);

  // Handle search
  useEffect(() => {
    if (!token || !query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${apiUrl}/search?query=${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, token]);

  const handleItemClick = (type, item) => {
    switch (type) {
      case 'user':
        navigate(`/user-view/${item.username}`);
        break;
      case 'cohort':
        navigate(`/cohorts/${item._id}`);
        break;
      case 'opportunity':
        navigate(`/opportunities/${item._id}`);
        break;
      case 'course':
        navigate(`/courses/${item._id}`);
        break;
      default:
        break;
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    if (!query) {
      setIsFocused(false);
    }
  };

  const showAnimation = !isFocused && !query;

  return (
    <Container maxWidth="md" sx={{ pt: 2, pb: 8 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        pt: 8, // Account for navbar height
        pb: 2,
        backgroundColor: darkMode ? '#121212' : '#ffffff',
      }}>
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ position: 'relative', width: '100%' }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                backgroundColor: themeColors.searchBg,
                height: '40px',
                borderColor: themeColors.searchBorder,
                '&:hover': {
                  backgroundColor: themeColors.searchHoverBg,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: themeColors.searchBorder,
                  borderWidth: '1px',
                },
              },
              '& .MuiInputBase-input': {
                fontSize: '0.9rem',
                padding: '8px 14px 8px 40px',
                color: themeColors.searchText,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: themeColors.searchBorder,
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: darkMode ? '#ffffff' : 'action.active' }} />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  {loading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <IconButton size="small" onClick={() => setQuery('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </InputAdornment>
              ) : null
            }}
          />
          {showAnimation && (
            <Box 
              sx={{ 
                position: 'absolute', 
                left: '45px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            >
              <AnimatedPlaceholder darkMode={darkMode} />
            </Box>
          )}
        </Box>
      </Box>

      {!query && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Search for users, cohorts, opportunities, or courses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Type in the search box above to find what you're looking for
          </Typography>
        </Box>
      )}

      {query && !loading && !results && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="body1" color="text.secondary">
            Enter at least 2 characters to search
          </Typography>
        </Box>
      )}

      {query && results && (
        <Paper 
          elevation={0} 
          sx={{ 
            bgcolor: 'transparent',
            mt: 2,
            maxHeight: '80vh',
            overflow: 'auto',
            ...customScrollbarStyle
          }}
        >
          {/* If there are results, show them */}
          {(results.users.length > 0 || 
            results.cohorts.length > 0 || 
            results.opportunities.length > 0 || 
            results.courses.length > 0) ? (
            <>
              {/* Users Section */}
              {results?.users?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      px: 2 
                    }}
                  >
                    Users ({results.users.length})
                  </Typography>
                  <List disablePadding>
                    {results.users.map((user) => (
                      <ListItem
                        key={user._id}
                        button
                        onClick={() => handleItemClick('user', user)}
                        sx={{ 
                          borderRadius: 1,
                          mb: 0.5,
                          backgroundColor: darkMode ? 'rgba(23, 23, 23, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                          '&:hover': {
                            backgroundColor: themeColors.resultsHoverBg,
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar src={user.profilePicture} alt={user.name}>
                            {!user.profilePicture && user.name?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={user.name} 
                          secondary={`${user.department || 'Department'} - ${user.section || 'Section'}`} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Cohorts Section */}
              {results?.cohorts?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      px: 2 
                    }}
                  >
                    Cohorts ({results.cohorts.length})
                  </Typography>
                  <List disablePadding>
                    {results.cohorts.map((cohort) => (
                      <ListItem
                        key={cohort._id}
                        button
                        onClick={() => handleItemClick('cohort', cohort)}
                        sx={{ 
                          borderRadius: 1,
                          mb: 0.5,
                          backgroundColor: darkMode ? 'rgba(23, 23, 23, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                          '&:hover': {
                            backgroundColor: themeColors.resultsHoverBg,
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#3f51b5' }}>
                            <GroupIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={cohort.title} 
                          secondary={cohort.description?.substring(0, 60) + (cohort.description?.length > 60 ? '...' : '')} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Opportunities Section */}
              {results?.opportunities?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      px: 2 
                    }}
                  >
                    Opportunities ({results.opportunities.length})
                  </Typography>
                  <List disablePadding>
                    {results.opportunities.map((opportunity) => (
                      <ListItem
                        key={opportunity._id}
                        button
                        onClick={() => handleItemClick('opportunity', opportunity)}
                        sx={{ 
                          borderRadius: 1,
                          mb: 0.5,
                          backgroundColor: darkMode ? 'rgba(23, 23, 23, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                          '&:hover': {
                            backgroundColor: themeColors.resultsHoverBg,
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#f50057' }}>
                            <WorkIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={opportunity.title} 
                          secondary={opportunity.company} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Courses Section */}
              {results?.courses?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      px: 2 
                    }}
                  >
                    Courses ({results.courses.length})
                  </Typography>
                  <List disablePadding>
                    {results.courses.map((course) => (
                      <ListItem
                        key={course._id}
                        button
                        onClick={() => handleItemClick('course', course)}
                        sx={{ 
                          borderRadius: 1,
                          mb: 0.5,
                          backgroundColor: darkMode ? 'rgba(23, 23, 23, 0.5)' : 'rgba(0, 0, 0, 0.02)',
                          '&:hover': {
                            backgroundColor: themeColors.resultsHoverBg,
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#4caf50' }}>
                            <SchoolIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={course.title} 
                          secondary={course.instructor} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </>
          ) : (
            /* No results */
            <Box sx={{ textAlign: 'center', mt: 6, mb: 6 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/notFound.png" 
                  alt="No results found" 
                  style={{ 
                    width: '160px', 
                    height: 'auto',
                    marginBottom: '16px'
                  }} 
                />
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  No results found for "{query}"
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default SearchPage; 