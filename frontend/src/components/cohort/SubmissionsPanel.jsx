import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  tableCellClasses,
  styled,
  Tabs,
  Tab
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CodeIcon from '@mui/icons-material/Code';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';

// TabPanel component for the submission tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`submissions-tabpanel-${index}`}
      aria-labelledby={`submissions-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Styled components for enhanced table
const StyledTableCell = styled(TableCell)(({ theme, darkMode }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: darkMode ? '#1A1A1A' : '#f5f5f5',
    color: darkMode ? '#fff' : theme.palette.common.black,
    fontWeight: 'bold',
    fontSize: '0.75rem',
    padding: '6px 12px',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: '0.75rem',
    padding: '4px 12px',
    borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme, darkMode }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
  },
  '&:hover': {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    cursor: 'pointer',
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const StatusChip = styled(Chip)(({ theme, status, darkMode }) => ({
  borderRadius: '12px',
  backgroundColor: status === 'accepted' 
    ? (darkMode ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.1)')
    : status === 'pending'
      ? (darkMode ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.1)')
      : (darkMode ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)'),
  color: status === 'accepted' 
    ? '#2e7d32' 
    : status === 'pending'
      ? '#ff9800'
      : '#d32f2f',
  border: `1px solid ${
    status === 'accepted' 
      ? 'rgba(46, 125, 50, 0.5)' 
      : status === 'pending' 
        ? 'rgba(255, 152, 0, 0.5)' 
        : 'rgba(211, 47, 47, 0.5)'
  }`,
  '& .MuiChip-icon': {
    color: 'inherit',
  },
  fontSize: '0.65rem',
  height: '20px',
}));

const SubmissionCard = styled(Card)(({ theme, status, darkMode }) => ({
  marginBottom: theme.spacing(2),
  backgroundColor: darkMode ? '#1A1A1A' : '#fff',
  borderLeft: `4px solid ${status === 'accepted' ? '#2e7d32' : '#d32f2f'}`,
  boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)',
  }
}));

// Simple stats card for submissions overview
const StatsCard = ({ number, label, icon, color, darkMode }) => (
  <Card sx={{ 
    height: '100%', 
    backgroundColor: darkMode ? '#1A1A1A' : '#fff',
    boxShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.1)',
  }}>
    <CardContent sx={{ p: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Avatar sx={{ 
          bgcolor: `${color}15`, 
          color: color,
          width: 32,
          height: 32,
          mr: 1
        }}>
          {React.cloneElement(icon, { fontSize: 'small' })}
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: darkMode ? '#fff' : '#000', fontSize: '1.1rem', lineHeight: 1.2 }}>
            {number}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {label}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const SubmissionsPanel = ({ submissions, allUsersSubmissions = [], darkMode, formatTime, formatMemory }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Calculate stats for personal submissions
  const acceptedCount = submissions.filter(sub => sub.status === 'accepted').length;
  const acceptedPercentage = submissions.length > 0 
    ? Math.round((acceptedCount / submissions.length) * 100) 
    : 0;
  
  // For the progress bar color
  const progressColor = acceptedPercentage >= 80 
    ? '#2e7d32' 
    : acceptedPercentage >= 50 
      ? '#ed6c02' 
      : '#d32f2f';

  // Personal submissions table view
  const renderPersonalTableView = () => (
    <TableContainer 
      component={Paper} 
      sx={{ 
        mt: 1.5, 
        backgroundColor: darkMode ? '#121212' : '#fff',
        boxShadow: darkMode ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.1)',
        borderRadius: '6px',
        overflow: 'auto', 
        maxHeight: 'calc(100vh - 230px)', 
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <StyledTableCell darkMode={darkMode} align="center" width="20%">Status</StyledTableCell>
            <StyledTableCell darkMode={darkMode} align="center" width="20%">Language</StyledTableCell>
            <StyledTableCell darkMode={darkMode} align="center" width="20%">Score</StyledTableCell>
            <StyledTableCell darkMode={darkMode} align="center" width="40%">Submitted At</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {submissions.map((submission, index) => (
            <StyledTableRow key={index} darkMode={darkMode}>
              <StyledTableCell darkMode={darkMode} align="center">
                <StatusChip
                  size="small"
                  icon={
                    submission.status === 'accepted' 
                      ? <CheckIcon fontSize="small" /> 
                      : submission.status === 'pending' 
                        ? <HistoryIcon fontSize="small" /> 
                        : <CloseIcon fontSize="small" />
                  }
                  label={
                    submission.status === 'accepted' 
                      ? 'Accepted' 
                      : submission.status === 'pending'
                        ? 'Pending'
                        : submission.status.replace('_', ' ')
                  }
                  status={
                    submission.status === 'accepted' 
                      ? 'accepted' 
                      : submission.status === 'pending'
                        ? 'pending'
                        : 'failed'
                  }
                  darkMode={darkMode}
                />
              </StyledTableCell>
              <StyledTableCell darkMode={darkMode} align="center">
                <Chip 
                  size="small"
                  label={submission.language?.toUpperCase() || 'N/A'}
                  sx={{
                    backgroundColor: darkMode ? 'rgba(0, 136, 204, 0.1)' : 'rgba(0, 136, 204, 0.08)',
                    color: darkMode ? '#0088CC' : '#0077b6',
                    border: '1px solid',
                    borderColor: 'rgba(0, 136, 204, 0.2)',
                    height: '20px',
                    fontSize: '0.65rem',
                    fontWeight: 'medium',
                  }}
                />
              </StyledTableCell>
              <StyledTableCell darkMode={darkMode} align="center" sx={{ 
                fontWeight: 'medium', 
                color: darkMode ? '#FFD700' : '#B8860B',
                fontSize: '0.75rem'
              }}>
                {submission.score}
              </StyledTableCell>
              <StyledTableCell darkMode={darkMode} align="center" sx={{ 
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                fontSize: '0.75rem'
              }}>
                {new Date(submission.submittedAt).toLocaleString()}
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // All users submissions table view
  const renderAllUsersTableView = () => (
    <TableContainer 
      component={Paper} 
      sx={{ 
        mt: 1.5, 
        backgroundColor: darkMode ? '#121212' : '#fff',
        boxShadow: darkMode ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.1)',
        borderRadius: '6px',
        overflow: 'auto', 
        maxHeight: 'calc(100vh - 230px)', 
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <StyledTableCell darkMode={darkMode} align="center" width="20%">Status</StyledTableCell>
            <StyledTableCell darkMode={darkMode} align="center" width="30%">User</StyledTableCell>
            <StyledTableCell darkMode={darkMode} align="center" width="15%">Language</StyledTableCell>
            <StyledTableCell darkMode={darkMode} align="center" width="15%">Score</StyledTableCell>
            <StyledTableCell darkMode={darkMode} align="center" width="20%">Submitted At</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allUsersSubmissions.map((submission, index) => (
            <StyledTableRow key={index} darkMode={darkMode}>
              <StyledTableCell darkMode={darkMode} align="center">
                <StatusChip
                  size="small"
                  icon={
                    submission.status === 'accepted' 
                      ? <CheckIcon fontSize="small" /> 
                      : submission.status === 'pending' 
                        ? <HistoryIcon fontSize="small" /> 
                        : <CloseIcon fontSize="small" />
                  }
                  label={
                    submission.status === 'accepted' 
                      ? 'Accepted' 
                      : submission.status === 'pending'
                        ? 'Pending'
                        : submission.status.replace('_', ' ')
                  }
                  status={
                    submission.status === 'accepted' 
                      ? 'accepted' 
                      : submission.status === 'pending'
                        ? 'pending'
                        : 'failed'
                  }
                  darkMode={darkMode}
                />
              </StyledTableCell>
              <StyledTableCell darkMode={darkMode} align="center" sx={{ 
                color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                fontWeight: 'medium',
                fontSize: '0.75rem'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {submission.user?.avatar ? (
                    <Avatar 
                      src={submission.user.avatar} 
                      alt={submission.user.name}
                      sx={{ width: 20, height: 20, mr: 0.75 }}
                    />
                  ) : (
                    <Avatar
                      sx={{ width: 20, height: 20, mr: 0.75, fontSize: '0.7rem', bgcolor: '#0088CC' }}
                    >
                      {submission.user?.name?.charAt(0) || 'U'}
                    </Avatar>
                  )}
                  {submission.user?.name || 'Anonymous'}
                </Box>
              </StyledTableCell>
              <StyledTableCell darkMode={darkMode} align="center">
                <Chip 
                  size="small"
                  label={submission.language?.toUpperCase() || 'N/A'}
                  sx={{
                    backgroundColor: darkMode ? 'rgba(0, 136, 204, 0.1)' : 'rgba(0, 136, 204, 0.08)',
                    color: darkMode ? '#0088CC' : '#0077b6',
                    border: '1px solid',
                    borderColor: 'rgba(0, 136, 204, 0.2)',
                    height: '20px',
                    fontSize: '0.65rem',
                    fontWeight: 'medium',
                  }}
                />
              </StyledTableCell>
              <StyledTableCell darkMode={darkMode} align="center" sx={{ 
                fontWeight: 'medium', 
                color: darkMode ? '#FFD700' : '#B8860B',
                fontSize: '0.75rem'
              }}>
                {submission.score}
              </StyledTableCell>
              <StyledTableCell darkMode={darkMode} align="center" sx={{ 
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                fontSize: '0.75rem'
              }}>
                {new Date(submission.submittedAt).toLocaleString()}
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ 
      p: 2, 
      height: '100%',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Typography variant="h5" sx={{ 
        fontWeight: 600, 
        display: 'flex', 
        alignItems: 'center',
        mb: 1.5,
        color: darkMode ? '#fff' : '#000',
        fontSize: '1rem'
      }}>
        <AssignmentTurnedInIcon sx={{ mr: 0.75, fontSize: '1.1rem' }} />
        Submissions
      </Typography>

      {/* Tabs for My Submissions vs All Submissions */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        mb: 1.5
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            minHeight: '36px',
            '& .MuiTab-root': { 
              minWidth: 'auto', 
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              textTransform: 'none',
              fontWeight: 'medium',
              color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              minHeight: '36px'
            },
            '& .Mui-selected': {
              color: darkMode ? '#fff' : '#0088CC',
            },
            '& .MuiTabs-indicator': {
              height: 2
            }
          }}
        >
          <Tab 
            icon={<PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />}
            label="My Submissions" 
            iconPosition="start"
          />
          <Tab 
            icon={<GroupIcon sx={{ fontSize: 16, mr: 0.5 }} />}
            label="All Users" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {submissions.length === 0 ? (
          <Alert 
            severity="info" 
            sx={{ 
              mt: 2,
              backgroundColor: darkMode ? 'rgba(41, 182, 246, 0.1)' : 'rgba(41, 182, 246, 0.08)',
              color: darkMode ? '#29b6f6' : '#0277bd',
              border: '1px solid',
              borderColor: 'rgba(41, 182, 246, 0.3)',
              '& .MuiAlert-icon': {
                color: darkMode ? '#29b6f6' : '#0277bd',
              },
            }}
          >
            You haven't made any submissions yet. Submit your solution to see results here.
          </Alert>
        ) : (
          <>
            {/* Stats Overview Section */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <StatsCard 
                  number={submissions.length}
                  label="Total Submissions"
                  icon={<CodeIcon />}
                  color="#0088CC"
                  darkMode={darkMode}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatsCard 
                  number={acceptedCount}
                  label="Accepted Solutions"
                  icon={<CheckIcon />}
                  color="#2e7d32"
                  darkMode={darkMode}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ 
                  height: '100%', 
                  backgroundColor: darkMode ? '#1A1A1A' : '#fff',
                  boxShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.1)',
                }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                      Acceptance Rate
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: progressColor, fontSize: '1.1rem', lineHeight: 1.2 }}>
                        {acceptedPercentage}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={acceptedPercentage} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: progressColor,
                          borderRadius: 3,
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              pb: 0.75,
              mb: 1
            }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                fontSize: '0.8rem'
              }}>
                Submission History
              </Typography>
            </Box>
            
            {/* Render personal table view */}
            {renderPersonalTableView()}
          </>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {allUsersSubmissions.length === 0 ? (
          <Alert 
            severity="info" 
            sx={{ 
              mt: 1.5,
              backgroundColor: darkMode ? 'rgba(41, 182, 246, 0.1)' : 'rgba(41, 182, 246, 0.08)',
              color: darkMode ? '#29b6f6' : '#0277bd',
              border: '1px solid',
              borderColor: 'rgba(41, 182, 246, 0.3)',
              '& .MuiAlert-icon': {
                color: darkMode ? '#29b6f6' : '#0277bd',
              },
              py: 0.5,
              fontSize: '0.75rem'
            }}
          >
            No submissions found for this problem yet.
          </Alert>
        ) : (
          <>
            {/* Stats Overview Section for All Users */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <StatsCard 
                  number={allUsersSubmissions.length}
                  label="Total Submissions"
                  icon={<CodeIcon />}
                  color="#0088CC"
                  darkMode={darkMode}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatsCard 
                  number={allUsersSubmissions.filter(sub => sub.status === 'accepted').length}
                  label="Accepted Solutions"
                  icon={<CheckIcon />}
                  color="#2e7d32"
                  darkMode={darkMode}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ 
                  height: '100%', 
                  backgroundColor: darkMode ? '#1A1A1A' : '#fff',
                  boxShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.1)',
                }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 0.5, display: 'block' }}>
                      Acceptance Rate
                    </Typography>
                    {(() => {
                      const allUsersAcceptedCount = allUsersSubmissions.filter(sub => sub.status === 'accepted').length;
                      const allUsersAcceptedPercentage = Math.round((allUsersAcceptedCount / allUsersSubmissions.length) * 100);
                      const allUsersProgressColor = allUsersAcceptedPercentage >= 80 
                        ? '#2e7d32' 
                        : allUsersAcceptedPercentage >= 50 
                          ? '#ed6c02' 
                          : '#d32f2f';
                      return (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: allUsersProgressColor, fontSize: '1.1rem', lineHeight: 1.2 }}>
                              {allUsersAcceptedPercentage}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={allUsersAcceptedPercentage} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: allUsersProgressColor,
                                borderRadius: 3,
                              }
                            }}
                          />
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              pb: 0.75,
              mb: 1
            }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                fontSize: '0.8rem'
              }}>
                All Users' Submissions
              </Typography>
              <Typography variant="caption" sx={{ 
                color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                fontSize: '0.7rem'
              }}>
                Total: {allUsersSubmissions.length}
              </Typography>
            </Box>
            
            {/* Render all users table view */}
            {renderAllUsersTableView()}
          </>
        )}
      </TabPanel>
    </Box>
  );
};

export default SubmissionsPanel;
