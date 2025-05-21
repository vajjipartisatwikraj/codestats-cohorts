import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Container,
  Tooltip,
  Divider,
  useTheme as useMuiTheme,
  Chip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  InputBase,
  Paper,
  ClickAwayListener,
  Popper,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import { apiUrl } from '../config/apiConfig';

// Common AppBar styles - LinkedIn styling
const appBarStyles = {
  backdropFilter: 'none',
  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.05)'
};

// Add these custom icon components at the top of the file after imports
const CustomSunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M12 19a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z" />
    <path d="M18.313 16.91l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.218 -1.567l.102 .07z" />
    <path d="M7.007 16.993a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z" />
    <path d="M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" />
    <path d="M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" />
    <path d="M6.213 4.81l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.217 -1.567l.102 .07z" />
    <path d="M19.107 4.893a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z" />
    <path d="M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z" />
    <path d="M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
  </svg>
);

const CustomMoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
    <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
  </svg>
);

// Add new notification icon components
const NotificationActiveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M17.451 2.344a1 1 0 0 1 1.41 -.099a12.05 12.05 0 0 1 3.048 4.064a1 1 0 1 1 -1.818 .836a10.05 10.05 0 0 0 -2.54 -3.39a1 1 0 0 1 -.1 -1.41z" />
    <path d="M5.136 2.245a1 1 0 0 1 1.312 1.51a10.05 10.05 0 0 0 -2.54 3.39a1 1 0 1 1 -1.817 -.835a12.05 12.05 0 0 1 3.045 -4.065z" />
    <path d="M14.235 19c.865 0 1.322 1.024 .745 1.668a3.992 3.992 0 0 1 -2.98 1.332a3.992 3.992 0 0 1 -2.98 -1.332c-.552 -.616 -.158 -1.579 .634 -1.661l.11 -.006h4.471z" />
    <path d="M12 2c1.358 0 2.506 .903 2.875 2.141l.046 .171l.008 .043a8.013 8.013 0 0 1 4.024 6.069l.028 .287l.019 .289v2.931l.021 .136a3 3 0 0 0 1.143 1.847l.167 .117l.162 .099c.86 .487 .56 1.766 -.377 1.864l-.116 .006h-16c-1.028 0 -1.387 -1.364 -.493 -1.87a3 3 0 0 0 1.472 -2.063l.021 -.143l.001 -2.97a8 8 0 0 1 3.821 -6.454l.248 -.146l.01 -.043a3.003 3.003 0 0 1 2.562 -2.29l.182 -.017l.176 -.004z" />
  </svg>
);

const NotificationInactiveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
    <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
    <path d="M21 6.727a11.05 11.05 0 0 0 -2.794 -3.727" />
    <path d="M3 6.727a11.05 11.05 0 0 1 2.792 -3.727" />
  </svg>
);

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

// Search component
const SearchComponent = () => {
  const { token } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const searchBarRef = useRef(null);
  const theme = useMuiTheme();

  // Get theme-aware colors
  const themeColors = {
    searchBg: darkMode ? 'rgba(23, 23, 23, 0.45)' : 'rgba(0, 0, 0, 0.05)',
    searchHoverBg: darkMode ? 'rgba(35, 35, 35, 0.4)' : 'rgba(0, 0, 0, 0.08)',
    searchText: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
    searchPlaceholder: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    resultsBg: darkMode ? '#0A0A0A' : '#ffffff',
    resultsHoverBg: darkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.04)',
    resultsBorder: darkMode ? '#131313' : 'rgba(0, 0, 0, 0.1)',
    searchBorder: darkMode ? '#232323' : 'rgba(0, 0, 0, 0.1)',
    sectionTitle: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
    scrollbarThumb: darkMode ? 'rgba(61, 61, 61, 0.5)' : 'rgba(0, 0, 0, 0.3)',
    scrollbarTrack: darkMode ? 'transparent' : 'rgba(0, 0, 0, 0.05)',
  };

  // Fetch search results when user types
  useEffect(() => {
    if (!token || !searchQuery.trim()) {
      setSearchResults(null);
      setLoading(false);
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a delay to avoid making too many requests
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${apiUrl}/search?query=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms delay

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, token]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setAnchorEl(searchBarRef.current);
  };

  const handleItemClick = (type, item) => {
    // Clear search results and query
    setSearchResults(null);
    setSearchQuery('');
    setIsFocused(false);

    // Navigate to appropriate page based on item type
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

  const handleClickAway = () => {
    setSearchResults(null);
    setAnchorEl(null);
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setAnchorEl(searchBarRef.current);
  };

  const handleBlur = () => {
    if (!searchQuery) {
      setIsFocused(false);
    }
  };

  const open = Boolean(anchorEl) && Boolean(searchResults);

  const showAnimation = !isFocused && !searchQuery;

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

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 350 }}>
        <Paper
          ref={searchBarRef}
          component="form"
          onSubmit={(e) => e.preventDefault()}
          sx={{
            p: '0px 4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '20px',
            backgroundColor: themeColors.searchBg,
            border: `1px solid ${themeColors.searchBorder}`,
            '&:hover': {
              backgroundColor: themeColors.searchHoverBg,
            },
            boxShadow: 'none',
            height: '40px',
            position: 'relative',
          }}
        >
          <IconButton sx={{ p: '5px', color: darkMode ? '#ffffff' : themeColors.searchPlaceholder }} aria-label="search">
            <SearchIcon sx={{ fontSize: 20 }} />
          </IconButton>
          {showAnimation && (
            <Box 
              sx={{ 
                position: 'absolute', 
                left: '40px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                pointerEvents: 'none' 
              }}
            >
              <AnimatedPlaceholder darkMode={darkMode} />
            </Box>
          )}
          <InputBase
            ref={inputRef}
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            sx={{
              ml: 0.5,
              flex: 1,
              color: themeColors.searchText,
              fontSize: '0.9rem',
              '& input': {
                padding: '0px',
              }
            }}
          />
          {loading && (
            <CircularProgress 
              size={16} 
              sx={{ 
                mr: 1, 
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' 
              }} 
            />
          )}
        </Paper>
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom"
          sx={{
            width: anchorEl ? anchorEl.clientWidth : 'auto',
            zIndex: theme.zIndex.drawer + 10,
            mt: '5px',
          }}
          modifiers={[
            {
              name: 'preventOverflow',
              enabled: true,
              options: {
                altAxis: true,
                boundary: document.body,
              },
            },
            {
              name: 'offset',
              options: {
                offset: [0, 5],
              },
            },
            {
              name: 'sameWidth',
              enabled: true,
              phase: 'beforeWrite',
              requires: ['computeStyles'],
              fn: ({ state }) => {
                state.styles.popper.width = `${state.rects.reference.width}px`;
              },
            }
          ]}
        >
          <Paper
            sx={{
              p: 1,
              backgroundColor: themeColors.resultsBg,
              boxShadow: darkMode 
                ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
                : '0 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: '10px',
              border: `1px solid ${themeColors.resultsBorder}`,
              maxHeight: '60vh',
              overflow: 'auto',
              ...customScrollbarStyle
            }}
          >
            {/* Users Section */}
            {searchResults?.users?.length > 0 && (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{
                    px: 2,
                    py: 0.5,
                    color: themeColors.sectionTitle,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Users
                </Typography>
                <List dense disablePadding>
                  {searchResults.users.map((user) => (
                    <ListItem
                      key={`user-${user._id}`}
                      button
                      onClick={() => handleItemClick('user', user)}
                      sx={{
                        borderRadius: '4px',
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: themeColors.resultsHoverBg
                        }
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar
                          src={user.profilePicture}
                          alt={user.name}
                          sx={{ width: 28, height: 28 }}
                        >
                          {!user.profilePicture && <PersonIcon sx={{ fontSize: 16 }} />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={`${user.department || 'CSE'}-${user.section || 'A'}`}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: 500,
                          color: darkMode ? 'white' : 'text.primary'
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          color: 'text.secondary'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 1 }} />
              </>
            )}

            {/* Cohorts Section */}
            {searchResults?.cohorts?.length > 0 && (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{
                    px: 2,
                    py: 0.5,
                    color: themeColors.sectionTitle,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Cohorts
                </Typography>
                <List dense disablePadding>
                  {searchResults.cohorts.map((cohort) => (
                    <ListItem
                      key={`cohort-${cohort._id}`}
                      button
                      onClick={() => handleItemClick('cohort', cohort)}
                      sx={{
                        borderRadius: '4px',
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: themeColors.resultsHoverBg
                        }
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#3f51b5' }}>
                          <GroupIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={cohort.title}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: 500,
                          color: darkMode ? 'white' : 'text.primary'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 1 }} />
              </>
            )}

            {/* Opportunities Section */}
            {searchResults?.opportunities?.length > 0 && (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{
                    px: 2,
                    py: 0.5,
                    color: themeColors.sectionTitle,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Opportunities
                </Typography>
                <List dense disablePadding>
                  {searchResults.opportunities.map((opportunity) => (
                    <ListItem
                      key={`opportunity-${opportunity._id}`}
                      button
                      onClick={() => handleItemClick('opportunity', opportunity)}
                      sx={{
                        borderRadius: '4px',
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: themeColors.resultsHoverBg
                        }
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#f50057' }}>
                          <WorkIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={opportunity.title}
                        secondary={opportunity.company}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: 500,
                          color: darkMode ? 'white' : 'text.primary'
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          color: 'text.secondary'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 1 }} />
              </>
            )}

            {/* Courses Section */}
            {searchResults?.courses?.length > 0 && (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{
                    px: 2,
                    py: 0.5,
                    color: themeColors.sectionTitle,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Courses
                </Typography>
                <List dense disablePadding>
                  {searchResults.courses.map((course) => (
                    <ListItem
                      key={`course-${course._id}`}
                      button
                      onClick={() => handleItemClick('course', course)}
                      sx={{
                        borderRadius: '4px',
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: themeColors.resultsHoverBg
                        }
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#4caf50' }}>
                          <SchoolIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={course.title}
                        secondary={course.instructor}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: 500,
                          color: darkMode ? 'white' : 'text.primary'
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          color: 'text.secondary'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {/* No results state */}
            {searchResults && 
             searchResults.users.length === 0 && 
             searchResults.cohorts.length === 0 && 
             searchResults.opportunities.length === 0 && 
             searchResults.courses.length === 0 && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <img 
                    src="/notFound.png" 
                    alt="No results found" 
                    style={{ 
                      width: '120px', 
                      height: 'auto',
                      marginBottom: '8px'
                    }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    No results found for "{searchQuery}"
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

const Navbar = () => {
  const { token, user, logout } = useAuth();
  const { theme, darkMode, toggleTheme } = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Add notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Prevent duplicate notification requests
  const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);
  
  // Check if current path is an auth page
  const isAuthPage = ['/login', '/register'].includes(location.pathname) || location.pathname.startsWith('/register');

  // Add a check for mobile screens
  const isMobileForNotifications = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Listen to sidebar state changes
  useEffect(() => {
    const handleSidebarChange = (e) => {
      if (e.detail) {
        setIsSidebarOpen(e.detail.isOpen);
      }
    };

    window.addEventListener('sidebarStateChange', handleSidebarChange);
    return () => window.removeEventListener('sidebarStateChange', handleSidebarChange);
  }, []);
  
  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token || isAuthPage || isRequestingNotifications) return;
    
    try {
      setIsRequestingNotifications(true);
      setLoading(true);
      const response = await axios.get(`${apiUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      // Add a slight delay before allowing the next request
      setTimeout(() => setIsRequestingNotifications(false), 1000);
    }
  };
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${apiUrl}/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update the local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await axios.put(`${apiUrl}/notifications/read-all`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update the local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Get notifications on component mount and when token changes
  useEffect(() => {
    if (token && !isAuthPage) {
      // Fetch notifications initially
      fetchNotifications();
      
      // Set up a refresh interval for notifications - use a longer interval to reduce server load
      // Polling every 120 seconds (2 minutes) to minimize server requests while maintaining reasonable update frequency
      const interval = setInterval(fetchNotifications, 240000);
      
      // Don't refetch notifications when the tab is inactive
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && token && !isAuthPage) {
          fetchNotifications();
        }
      };
      
      // Listen for visibility changes
      document.addEventListener("visibilitychange", handleVisibilityChange);
      
      return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [token, isAuthPage, location.pathname]);
  
  const handleOpenNotificationsMenu = (event) => {
    setAnchorElNotifications(event.currentTarget);
    // If we have unread notifications, mark them as read when opening the menu
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  // Format date for notifications
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (diffDays === 0) {
      // Today
      return `Today, ${time}`;
    } else if (diffDays === 1) {
      // Yesterday
      return `Yesterday, ${time}`;
    } else if (diffDays < 7) {
      // Within a week - show day name and time
      return `${date.toLocaleDateString(undefined, { weekday: 'short' })}, ${time}`;
    } else {
      // More than a week ago - show full date and time
      return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}, ${time}`;
    }
  };

  const handleLogout = () => {
    const logoutSuccessful = logout();
    
    if (logoutSuccessful) {
      navigate('/login');
    }
    
    handleCloseUserMenu();
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null);
  };

  // Theme-aware colors
  const themeColors = {
    appBar: darkMode 
      ? 'rgba(26, 26, 26, 0.8)'
      : '#ffffff',
    text: darkMode ? '#ffffff' : '#191919',
    border: darkMode 
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.08)',
    menuHover: darkMode
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.04)',
    iconColor: darkMode ? '#ffffff' : '#00000099',
    menuBg: darkMode ? '#1e1e1e' : '#ffffff',
    activeItem: darkMode ? '#0088cc' : '#0a66c2',
  };

  // Render simplified navbar for auth pages or when not authenticated
  if (!token || isAuthPage) {
    return (
      <AppBar position="fixed" sx={{
        ...appBarStyles,
        background: themeColors.appBar,
        borderBottom: `1px solid ${themeColors.border}`,
        zIndex: theme.zIndex.drawer - 1, // Make sure navbar is below sidebar
      }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box sx={{ flexGrow: 1 }}>
              {/* Logo has been removed here */}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
                {darkMode ? (
                  <Brightness7Icon sx={{ color: themeColors.iconColor }} />
                ) : (
                  <Brightness4Icon sx={{ color: themeColors.iconColor }} />
                )}
              </IconButton>
              <Button
                color="inherit"
                component={RouterLink}
                to="/login"
                sx={{
                  color: location.pathname === '/login' ? themeColors.activeItem : themeColors.text,
                  fontWeight: 600,
                  borderRadius: '4px',
                  padding: '6px 16px',
                  '&:hover': { 
                    color: themeColors.activeItem,
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(10, 102, 194, 0.04)' 
                  }
                }}
              >
                Login
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="outlined"
                sx={{
                  borderColor: location.pathname.includes('/register') ? themeColors.activeItem : themeColors.border,
                  color: location.pathname.includes('/register') ? themeColors.activeItem : themeColors.activeItem,
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: '1px solid',
                  '&:hover': {
                    borderColor: themeColors.activeItem,
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(10, 102, 194, 0.04)',
                    border: '1px solid'
                  }
                }}
              >
                Register
              </Button>
            </Box>
        </Toolbar>
        </Container>
      </AppBar>
    );
  }

  // Main navbar for authenticated users
  return (
    <AppBar position="fixed" sx={{ 
      background: themeColors.appBar,
      backdropFilter: 'blur(10px)',
      boxShadow: 'none',
      borderBottom: 'none',
      zIndex: theme.zIndex.drawer - 1,
      width: {
        xs: '100%',
        md: isSidebarOpen ? 'calc(100% - 280px)' : 'calc(100% - 73px)'
      },
      ml: {
        xs: 0,
        md: isSidebarOpen ? '280px' : '73px'
      },
      transition: 'width 0.3s ease, margin-left 0.3s ease'
    }}>
      <Container 
        maxWidth={false}
        sx={{
          maxWidth: 'none',
          px: { xs: 3, md: 3 } // Consistent padding on mobile and desktop
        }}
      >
        <Toolbar 
          disableGutters 
          sx={{ 
            minHeight: { xs: '64px !important', md: '75px !important' },
            height: { xs: '64px', md: '75px' },
            justifyContent: 'space-between'
          }}
        >
          {/* Left side - Search */}
          <Box sx={{ 
            display: 'flex', 
            flexGrow: 1,
            mr: 2,
            justifyContent: { xs: 'center', md: 'flex-start' } 
          }}>
            {!isMobile && <SearchComponent />}
          </Box>
            
          {/* User menu, notifications, and theme toggle */}
          <Box sx={{ 
            flexGrow: { xs: 0, md: 0 }, // No flex grow on mobile
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'flex-end' // Always right-aligned
          }}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                onClick={handleOpenNotificationsMenu}
                id="notification-button"
                aria-controls={Boolean(anchorElNotifications) ? 'notification-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={Boolean(anchorElNotifications) ? 'true' : undefined}
                sx={{ 
                  color: themeColors.iconColor, 
                  mr: 2,
                  position: 'relative',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                  }
                }}
              >
                <Badge 
                  color="primary" 
                  variant={unreadCount > 0 ? "dot" : "standard"}
                  sx={{ 
                    '& .MuiBadge-badge': {
                      backgroundColor: '#0088cc', 
                      color: '#fff'
                    } 
                  }}
                >
                  {unreadCount > 0 ? <NotificationActiveIcon /> : <NotificationInactiveIcon />}
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Mobile Search Icon */}
            {isMobile && (
              <Tooltip title="Search">
                <IconButton
                  onClick={() => navigate('/search')}
                  sx={{ 
                    color: themeColors.iconColor,
                    mr: 2,
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                    }
                  }}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Theme Toggle */}
            <Tooltip title="Toggle Theme">
              <IconButton
                onClick={toggleTheme}
                sx={{ 
                  color: themeColors.iconColor,
                  mr: 2,
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                  }
                }}
              >
                {darkMode ? <CustomMoonIcon /> : <CustomSunIcon />}
              </IconButton>
            </Tooltip>

            {/* Notifications Menu */}
            <Menu
              id="notification-menu"
              anchorEl={anchorElNotifications}
              open={Boolean(anchorElNotifications)}
              onClose={handleCloseNotificationsMenu}
              sx={{ 
                mt: 0.5,
                '& .MuiPaper-root': {
                  width: {
                    xs: 'calc(100vw - 32px)', // Full width minus margins on mobile
                    sm: '450px',              // Wider width
                    md: '480px',              // Wider width
                  },
                  maxWidth: {
                    xs: 'calc(100vw - 32px)', // Prevent overflow on mobile
                    sm: '450px',              // Wider max width
                    md: '480px',              // Wider max width
                  },
                  maxHeight: 'calc(100vh - 100px)',
                  borderRadius: '8px',
                  boxShadow: darkMode 
                    ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
                    : '0 0 0 1px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(0, 0, 0, 0.08)',
                  backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                  color: themeColors.text,
                  overflow: 'visible',
                  display: 'flex',
                  flexDirection: 'column'
                }
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
              MenuListProps={{
                style: {
                  padding: 0
                }
              }}
              keepMounted
              container={() => document.getElementById('dialog-container') || document.body}
              disableEnforceFocus
            >
              {/* Fixed Header */}
              <Box 
                sx={{ 
                  p: { xs: 1, sm: 1.5 }, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderBottom: `1px solid ${themeColors.border}`,
                  backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                  zIndex: 2,
                  flexShrink: 0
                }}
              >
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600, 
                  fontSize: { xs: '0.95rem', sm: '1.05rem' },
                  color: darkMode ? '#ffffff' : '#000000'
                }}>
                  Notifications
                </Typography>
                {notifications.length > 0 && (
                  <Button 
                    size="small" 
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    sx={{ 
                      fontSize: '0.75rem',
                      padding: '3px 8px',
                      minWidth: 'auto',
                      opacity: unreadCount === 0 ? 0.6 : 1,
                      color: '#1976d2',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                  >
                    Mark all as read
                  </Button>
                )}
              </Box>

              {/* Scrollable Content */}
              <Box sx={{ 
                flex: 1,
                minHeight: 0,
                maxHeight: '450px',
                overflowY: 'auto',
                overflowX: 'hidden',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  display: 'block',
                },
                '&::-webkit-scrollbar-track': {
                  background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                  }
                },
                scrollbarWidth: 'thin',
                scrollbarColor: darkMode 
                  ? 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.05)',
              }}>
                {loading ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : notifications.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        mb: 1,
                        backgroundColor: 'transparent',
                        border: 'none'
                      }}
                    >
                      <img 
                        src="/codestats.png" 
                        alt="CodeStats" 
                        style={{ 
                          width: 24, 
                          height: 24,
                          objectFit: 'contain'
                        }} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      {notifications.length === 0 ? 'No notifications' : 'Loading...'}
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {notifications.map((notification, index) => (
                      <React.Fragment key={notification._id}>
                        <ListItem 
                          sx={{ 
                            p: 0,
                            backgroundColor: !notification.read ? 
                              (darkMode ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)') : 
                              'transparent',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: darkMode ? 
                                'rgba(255, 255, 255, 0.05)' : 
                                'rgba(0, 0, 0, 0.02)'
                            }
                          }}
                          onClick={() => markAsRead(notification._id)}
                        >
                          <Box sx={{ 
                            width: '100%', 
                            p: { xs: 1.5, sm: 1.8 }, 
                            display: 'flex', 
                            gap: { xs: 1.2, sm: 1.5 } 
                          }}>
                            {/* Icon */}
                            <Box
                              sx={{
                                width: 30,
                                height: 30,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                backgroundColor: 'transparent',
                                border: 'none'
                              }}
                            >
                              <img 
                                src="/codestats.png" 
                                alt="CodeStats" 
                                style={{ 
                                  width: 22, 
                                  height: 22,
                                  objectFit: 'contain'
                                }} 
                              />
                            </Box>
                            
                            {/* Content */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ 
                                    fontWeight: notification.read ? 500 : 600,
                                    fontSize: '0.9rem',
                                    color: !notification.read ? 
                                      (darkMode ? '#ffffff' : '#000000') : 
                                      (darkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'),
                                    mr: 1,
                                    paddingRight: '4px'
                                  }}
                                >
                                  {notification.title}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    flexShrink: 0,
                                    minWidth: '65px',
                                    textAlign: 'right'
                                  }}
                                >
                                  {formatNotificationDate(notification.createdAt)}
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{ 
                                  color: notification.read ? 
                                    (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)') : 
                                    (darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'),
                                  lineHeight: 1.5,
                                  fontSize: '0.85rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'normal',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  maxHeight: '3.4rem',
                                  pr: { xs: 0.5, sm: 1 }
                                }}
                              >
                                {notification.message}
                              </Typography>
                            </Box>
                          </Box>
                        </ListItem>
                        {index < notifications.length - 1 && (
                          <Divider 
                            sx={{ 
                              borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
                            }} 
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            </Menu>
            
            {/* User Profile Section with Details */}
            <Box 
              onClick={() => navigate('/profile?setup=true')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                cursor: 'pointer',
                p: 1,
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              {/* Vertical Separator */}
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center',
                mr: 2
              }}>
                <Divider 
                  orientation="vertical"
                  sx={{ 
                    height: '24px',
                    borderRightWidth: 1,
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
                  }} 
                />
              </Box>
              
              <Avatar 
                alt={user?.name || 'User'} 
                src={user?.profilePicture} 
                sx={{ 
                  width: 40, 
                  height: 40,
                  border: `2px solid ${themeColors.border}`,
                  '&:hover': {
                    boxShadow: '0 0 5px #0088cc'
                  }
                }} 
              />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="subtitle1" sx={{ 
                  color: darkMode ? '#ffffff' : '#000000', 
                  fontWeight: 600,
                  lineHeight: 1.2,
                  fontSize: '0.95rem',
                  textTransform: 'capitalize'
                }}>
                  {(user?.name || "User").split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  ).join(' ')}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 400
                }}>
                  {`${user?.year || 'II'} Year, ${user?.department || 'CSE'}-${user?.section || 'E'}`}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Toolbar>
      </Container>
      
      {/* Centered horizontal divider */}
      <Box 
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          height: '1px',
          transform: 'translateX(-50%)',
          width: '97%'
        }}
      >
        <Divider 
          sx={{
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)'
          }}
        />
      </Box>
    </AppBar>
  );
};

export default Navbar;
