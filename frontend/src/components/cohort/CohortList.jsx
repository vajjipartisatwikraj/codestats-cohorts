import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField, 
  InputAdornment,
  Button,
  Tabs,
  Tab,
  Divider,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import axios from 'axios';
import CohortListLeft from './CohortListLeft';
import CohortListRight from './CohortListRight';
import { he } from 'date-fns/locale';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

const CohortList = () => {
  const muiTheme = useTheme();
  const { darkMode } = useAppTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('Active');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [cohorts, setCohorts] = useState([]);
  const [filteredCohorts, setFilteredCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cohorts from the API
  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/cohorts');
        console.log(response.data);
        setCohorts(response.data);
        setFilteredCohorts(response.data);
        
        // Set the first cohort as selected by default if there are cohorts
        if (response.data.length > 0) {
          setSelectedCohort(response.data[0]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching cohorts:', err);
        setError('Failed to load cohorts. Please try again later.');
        setLoading(false);
      }
    };

    fetchCohorts();
  }, []);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle search input change
  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    // Filter cohorts based on search query
    if (query.trim() === '') {
      setFilteredCohorts(cohorts);
    } else {
      const filtered = cohorts.filter(cohort => 
        cohort.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCohorts(filtered);
    }
  };

  // Handle search button click
  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      setFilteredCohorts(cohorts);
    } else {
      const filtered = cohorts.filter(cohort => 
        cohort.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCohorts(filtered);
    }
  };

  // Handle cohort selection
  const handleCohortClick = (cohort) => {
    setSelectedCohort(cohort);
  };

  // Handle status filter change
  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    // Apply status filter logic here if needed
  };

  // Handle difficulty filter change
  const handleDifficultyChange = (event) => {
    setDifficulty(event.target.value);
    // Apply difficulty filter logic here if needed
  };
    
    return (
            <Box 
              sx={{ 
                height: '100vh', 
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                px: { xs: 2, sm: 3, md: 4, lg: 6 },
                pt: 3,
                pb: { xs: 4, sm: 6 },
                overflow: 'auto',
              }}
            >
      {/* Main Heading (Centered) */}
      <Box sx={{ mb: 2, mt: 2, textAlign: 'center' }}>
              <Typography 
          variant="h2" 
          component="h1" 
                sx={{ 
                  fontWeight: 700,
            color: '#0088CC',
            fontSize: '2.5rem',
            mt: 2
                }}
              >
          Programming Cohorts
                </Typography>
              
              <Typography 
          variant="body1" 
          sx={{ 
            color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(15,15,15,0.7)',
            fontSize: '1.1rem',
            maxWidth: '800px',
            mx: 'auto',
            mb: 4
          }}
        >
          Enhance your programming skills with guided learning paths and practical problem-solving.
                </Typography>
            </Box>
            
      {/* Search and Filter Section */}
      <Box sx={{ 
                display: 'flex',
        justifyContent: 'space-between', 
                alignItems: 'center',
        mb: 4
      }}>
        {/* Left - Search Box */}
        <Box sx={{ display: 'flex', alignItems: 'center', width: '500px' }}>
          <TextField
            placeholder="Search Cohorts..."
            size="medium"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(15,15,15,0.5)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                color: darkMode ? 'white' : '#0F0F0F',
                bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'white',
                borderRadius: '8px 0 0 8px',
                height: '48px',
                '& fieldset': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,15,15,0.1)',
                },
                '&:hover fieldset': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(15,15,15,0.2)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0088CC',
                }
              }
            }}
          />
              <Button
                variant="contained"
            onClick={handleSearch}
                sx={{
              bgcolor: '#0088CC', 
              color: 'white',
              borderRadius: '0 8px 8px 0',
              height: '48px',
              '&:hover': {
                bgcolor: '#0077b6',
              }
            }}
          >
            Search
              </Button>
        </Box>
        
        {/* Right - Filter Dropdowns */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl 
            variant="outlined" 
            size="medium"
                  sx={{
              width: '150px',
              '& .MuiOutlinedInput-root': {
                color: darkMode ? 'white' : '#0F0F0F',
                bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'white',
                height: '48px',
                '& fieldset': { borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,15,15,0.1)' },
                '&:hover fieldset': { borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(15,15,15,0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#0088CC' }
              },
              '& .MuiInputLabel-root': { 
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(15,15,15,0.7)',
                transform: 'translate(14px, 14px) scale(1)'
              },
              '& .MuiInputLabel-shrink': {
                transform: 'translate(14px, -6px) scale(0.75)'
              }
            }}
          >
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              onChange={handleStatusChange}
              label="Status"
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl 
              variant="outlined"
              size="medium"
              sx={{ 
              width: '150px',
              '& .MuiOutlinedInput-root': {
                color: darkMode ? 'white' : '#0F0F0F',
                bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'white',
                height: '48px',
                '& fieldset': { borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,15,15,0.1)' },
                '&:hover fieldset': { borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(15,15,15,0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#0088CC' }
              },
              '& .MuiInputLabel-root': { 
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(15,15,15,0.7)',
                transform: 'translate(14px, 14px) scale(1)'
              },
              '& .MuiInputLabel-shrink': {
                transform: 'translate(14px, -6px) scale(0.75)'
              }
            }}
          >
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={difficulty}
              onChange={handleDifficultyChange}
              label="Difficulty"
            >
              <MenuItem value="Beginner">Beginner</MenuItem>
              <MenuItem value="Intermediate">Intermediate</MenuItem>
              <MenuItem value="Advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
          </Box>
      </Box>
      
      {/* Main Content Area */}
      <Box 
        sx={{ 
          flex: 1, 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '0.8fr 1.6fr' },
          gap: { xs: 4, md: 3 },
          height: 'auto',
          overflow: 'visible',
          position: 'relative',
        }}
      >
        {/* Show loading, error, or content */}
      {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gridColumn: 'span 2' }}>
            <CircularProgress sx={{ color: '#0088CC' }} />
          </Box>
        ) : error ? (
          <Box sx={{ gridColumn: 'span 2' }}>
            <Alert severity="error">{error}</Alert>
        </Box>
      ) : (
        <>
            {/* Left Panel - Scrollable list of cohorts */}
            <Box sx={{ 
              height: 'auto',
              position: 'relative',
              overflow: 'visible', 
              pr: 1,
            }}>
              <CohortListLeft 
                cohorts={filteredCohorts}
                handleCohortClick={handleCohortClick}
                selectedCohortId={selectedCohort?._id}
              />
              </Box>
              
            {/* Right Panel - Fixed position to stay in place while scrolling */}
            <Box sx={{ 
              position: 'sticky',
              top: 0,
              height: 'auto',
              alignSelf: 'flex-start',
              display: { xs: 'block', md: 'block' },
              maxHeight: 'calc(100vh - 0px)',
            }}>
              <CohortListRight selectedCohort={selectedCohort} />
            </Box>
            </>
          )}
          <Box sx={{ height: '1px' }}/>

      </Box>
    </Box>
  );
};

export default CohortList; 
