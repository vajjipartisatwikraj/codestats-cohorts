import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItemButton,
  alpha,
  useTheme as useMuiTheme,
  Avatar,
  AvatarGroup,
  Rating
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import StarRateRoundedIcon from '@mui/icons-material/StarRateRounded';

const CohortCard = styled(ListItemButton)(({ theme, isActive, darkMode }) => ({
  borderRadius: '10px',
  marginBottom: '16px',
  padding: '12px',
  transition: 'all 0.3s ease',
  background: 'transparent',
  border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -180,
    right: -100,
    width: '300px',
    height: '300px',
    background: darkMode 
      ? 'rgba(30, 111, 169, 0.65)'
      : 'rgba(30, 111, 169, 0.35)',
    filter: 'blur(100px)',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 1
  },
  '&:hover': {
    backgroundColor: darkMode 
      ? 'rgba(255, 255, 255, 0.03)'
      : 'rgba(0, 0, 0, 0.03)',
  }
}));

const CohortListLeft = ({ 
  cohorts, 
  activeTab, 
  handleCohortClick, 
  selectedCohortId,
}) => {
  const muiTheme = useMuiTheme();
  const { darkMode } = useAppTheme();

  // Function to render individual cohort card
  const renderCohortCard = (cohort) => {
    const isActive = selectedCohortId === cohort._id;
    
    return (
      <CohortCard 
        key={cohort._id} 
        isActive={isActive}
        darkMode={darkMode}
        onClick={() => handleCohortClick(cohort)}
      >
        <Box sx={{ width: '100%', position: 'relative' }}>
          {/* Removing the blue top bar as requested */}
          
          <Box sx={{ p: 2, position: 'relative', zIndex: 2 }}>
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 700,
                fontSize: '1.4rem',
                lineHeight: 1.3,
                color: darkMode ? 'white' : '#333333',
                mb: 1
              }}
            >
              {cohort.title || "Object Oriented Programming"}
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                mb: 2,
                fontSize: '1rem',
                opacity: 0.8
              }}
            >
              {cohort.modules?.length || 35} Modules
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: darkMode ? 'white' : '#333333',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    mr: 1
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12.75C13.63 12.75 15.07 13.14 16.24 13.65C17.32 14.13 18 15.21 18 16.38V17C18 17.55 17.55 18 17 18H7C6.45 18 6 17.55 6 17V16.39C6 15.21 6.68 14.13 7.76 13.66C8.93 13.14 10.37 12.75 12 12.75ZM4 13C5.1 13 6 12.1 6 11C6 9.9 5.1 9 4 9C2.9 9 2 9.9 2 11C2 12.1 2.9 13 4 13ZM5.13 14.1C4.76 14.04 4.39 14 4 14C3.01 14 2.07 14.21 1.22 14.58C0.48 14.9 0 15.62 0 16.43V17C0 17.55 0.45 18 1 18H4.5V16.39C4.5 15.56 4.73 14.78 5.13 14.1ZM20 13C21.1 13 22 12.1 22 11C22 9.9 21.1 9 20 9C18.9 9 18 9.9 18 11C18 12.1 18.9 13 20 13ZM24 16.43C24 15.62 23.52 14.9 22.78 14.58C21.93 14.21 20.99 14 20 14C19.61 14 19.24 14.04 18.87 14.1C19.27 14.78 19.5 15.56 19.5 16.39V18H23C23.55 18 24 17.55 24 17V16.43ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6Z" fill={darkMode ? "white" : "#333333"} />
                  </svg>
                </Box>
                {cohort.eligibleUsers?.length || 0}+ Users Enrolled
              </Typography>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box 
                  sx={{
                    bgcolor: '#0088CC',
                    color: 'white',
                    borderRadius: '4px',
                    px: 1,
                    py: 0.2,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    lineHeight: 1.5
                  }}
                >
                  {cohort.averageRating?.toFixed(1) || '0.0'}
                </Box>
                <Rating 
                  value={cohort.averageRating || 0} 
                  readOnly 
                  size="small" 
                  precision={0.5} 
                  icon={<StarRateRoundedIcon fontSize="small" sx={{ color: darkMode ? 'white' : '#FFC107' }} />}
                  emptyIcon={<StarRateRoundedIcon fontSize="small" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)' }} />}
                  sx={{ fontSize: '1.1rem' }} 
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </CohortCard>
    );
  };

  // Filter cohorts based on activeTab (if needed)
  const getDisplayedCohorts = () => {
    return cohorts.length > 0 ? cohorts : [
      { 
        _id: '1', 
        title: 'Python', 
        modules: [1,2,3,4,5,6,7,8], 
        eligibleUsers: new Array(250), 
        averageRating: 4.5 
      },
      { 
        _id: '2', 
        title: 'xyz', 
        modules: new Array(35), 
        eligibleUsers: new Array(250), 
        averageRating: 4.5 
      },
      { 
        _id: '3', 
        title: 'Java Beginner Cohort', 
        modules: [1,2,3,4,5,6,7,8], 
        eligibleUsers: new Array(250), 
        averageRating: 4.5 
      }
    ];
  };

  return (
    <Box 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: 'calc(100% - 20px)',
        maxWidth: '400px',
        maxHeight: '650px'
      }}
    >
      {/* Scrollable Cohort List */}
      <Box 
        sx={{ 
          flex: 1, 
          overflowY: 'auto',
          height: '100%',
          maxHeight: '800px',
          pr: 1,
          '&::-webkit-scrollbar': {
            width: '5px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: darkMode 
              ? 'rgba(61, 61, 61, 0.50)'
              : 'rgba(0, 0, 0, 0.20)',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: darkMode 
              ? 'rgba(61, 61, 61, 0.50)'
              : 'rgba(0, 0, 0, 0.30)',
          }
        }}
      >
        <List sx={{ p: 0 }}>
          {getDisplayedCohorts().map(cohort => renderCohortCard(cohort))}
        </List>
      </Box>
    </Box>
  );
};

export default CohortListLeft;
