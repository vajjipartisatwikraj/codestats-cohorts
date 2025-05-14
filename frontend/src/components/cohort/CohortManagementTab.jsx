import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  Alert,
  Tab,
  Tabs,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
  BarChart as BarChartIcon,
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Group as GroupIcon,
  VisibilityOff as VisibilityOffIcon,
  Visibility as VisibilityIcon,
  AddCircle as AddCircleIcon,
  DeleteForever as DeleteForeverIcon,
  Create as CreateIcon,
  Event as EventIcon,
  CalendarToday as CalendarTodayIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import axios from 'axios';
import { apiUrl } from '../../config/apiConfig';
import { toast } from 'react-toastify';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { format } from 'date-fns';

// Tabs for the cohort management view
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cohort-tabpanel-${index}`}
      aria-labelledby={`cohort-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CohortManagementTab = ({ token }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [cohorts, setCohorts] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [topUserCount, setTopUserCount] = useState(50);
  const [addingTopUsers, setAddingTopUsers] = useState(false);
  
  // Form state for creating/editing cohort
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    videoResource: '',
    documentationUrl: '',
    isActive: true,
    isDraft: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Fetch cohorts on component mount
  useEffect(() => {
    fetchCohorts();
  }, [token]);
  
  // Fetch all cohorts
  const fetchCohorts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/cohorts/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setCohorts(response.data);
    } catch (error) {
      console.error('Error fetching cohorts:', error);
      toast.error('Failed to fetch cohorts');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Open the create cohort dialog
  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setFormData({
      title: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      videoResource: '',
      documentationUrl: '',
      isActive: true,
      isDraft: true
    });
    setFormErrors({});
    setOpenCreateDialog(true);
  };
  
  // Open the edit cohort dialog
  const handleEditCohort = (cohort) => {
    setIsEditMode(true);
    setFormData({
      title: cohort.title,
      description: cohort.description,
      startDate: new Date(cohort.startDate),
      endDate: new Date(cohort.endDate),
      videoResource: cohort.videoResource || '',
      documentationUrl: cohort.documentationUrl || '',
      isActive: cohort.isActive,
      isDraft: cohort.isDraft
    });
    setSelectedCohort(cohort);
    setFormErrors({});
    setOpenCreateDialog(true);
  };
  
  // Close the create/edit dialog
  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };
  
  // Open the delete confirmation dialog
  const handleOpenDeleteDialog = (cohort) => {
    setSelectedCohort(cohort);
    setOpenDeleteDialog(true);
  };
  
  // Close the delete dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };
  
  // Validate the form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      errors.endDate = 'End date must be after start date';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear the error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Handle date picker changes
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date
    });
    
    // Clear the error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Create or update a cohort
  const handleSaveCohort = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      let response;
      
      if (isEditMode) {
        // Update an existing cohort
        response = await axios.put(
          `${apiUrl}/cohorts/${selectedCohort._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        toast.success('Cohort updated successfully');
      } else {
        // Create a new cohort
        response = await axios.post(
          `${apiUrl}/cohorts`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        toast.success('Cohort created successfully');
      }
      
      // Refresh the cohorts list
      fetchCohorts();
      
      // Close the dialog
      handleCloseCreateDialog();
    } catch (error) {
      console.error('Error saving cohort:', error);
      toast.error(error.response?.data?.message || 'Failed to save cohort');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a cohort
  const handleDeleteCohort = async () => {
    setLoading(true);
    try {
      await axios.delete(`${apiUrl}/cohorts/${selectedCohort._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Cohort deleted successfully');
      
      // Refresh the cohorts list
      fetchCohorts();
      
      // Close the dialog
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting cohort:', error);
      toast.error('Failed to delete cohort');
    } finally {
      setLoading(false);
    }
  };
  
  // Navigate to cohort detail page
  const handleManageCohort = (cohort) => {
    // Redirect to cohort detail management page
    window.location.href = `/admin/cohorts/${cohort._id}`;
  };
  
  // Fetch top users based on their scores
  const fetchTopUsers = async (count) => {
    try {
      const response = await axios.get(`${apiUrl}/leaderboard/top/${count}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.leaderboard) {
        return response.data.leaderboard.map(entry => entry.user._id);
      }
      return [];
    } catch (error) {
      console.error('Error fetching top users:', error);
      toast.error('Failed to fetch top users');
      return [];
    }
  };
  
  // Handle adding top users to a cohort
  const handleAddTopUsers = async (cohort) => {
    setAddingTopUsers(true);
    try {
      // Fetch top users
      const topUserIds = await fetchTopUsers(topUserCount);
      
      if (topUserIds.length === 0) {
        toast.error('No users found in the leaderboard');
        return;
      }
      
      // Add these users to the cohort
      const response = await axios.post(
        `${apiUrl}/cohorts/${cohort._id}/eligible-users`, 
        { userIds: topUserIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      toast.success(`Added top ${topUserIds.length} users to the cohort`);
      
      // Refresh the cohort list
      fetchCohorts();
    } catch (error) {
      console.error('Error adding top users:', error);
      toast.error('Failed to add top users to the cohort');
    } finally {
      setAddingTopUsers(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Calculate cohort status
  const getCohortStatus = (cohort) => {
    const now = new Date();
    const startDate = new Date(cohort.startDate);
    const endDate = new Date(cohort.endDate);
    
    if (cohort.isDraft) {
      return { text: 'Draft', color: 'default' };
    } if (!cohort.isActive) {
      return { text: 'Inactive', color: 'error' };
    } else if (now < startDate) {
      return { text: 'Upcoming', color: 'info' };
    } else if (now > endDate) {
      return { text: 'Ended', color: 'warning' };
    } else {
      return { text: 'Active', color: 'success' };
    }
  };
  
  // UI for adding top users
  const renderTopUsersSelector = (cohort) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
      <FormControl size="small" sx={{ width: 120 }}>
        <InputLabel>Top Users</InputLabel>
        <Select
          value={topUserCount}
          label="Top Users"
          onChange={(e) => setTopUserCount(e.target.value)}
        >
          <MenuItem value={10}>Top 10</MenuItem>
          <MenuItem value={50}>Top 50</MenuItem>
          <MenuItem value={100}>Top 100</MenuItem>
          <MenuItem value={300}>Top 300</MenuItem>
        </Select>
      </FormControl>
      <Button 
        variant="contained" 
        size="small"
        onClick={() => handleAddTopUsers(cohort)}
        disabled={addingTopUsers}
        startIcon={addingTopUsers ? <CircularProgress size={16} /> : <GroupIcon />}
      >
        Add Users
      </Button>
    </Box>
  );
  
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
            Cohort Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create Cohort
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Create and manage programming cohorts with modules, learning paths, and problem sets.
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="All Cohorts" />
            <Tab label="Active Cohorts" />
            <Tab label="Drafts" />
          </Tabs>
        </Box>
      </Box>
      
      {/* All Cohorts Tab */}
      <TabPanel value={currentTab} index={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : cohorts.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No cohorts found. Create a new cohort to get started.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {cohorts.map((cohort) => {
              const status = getCohortStatus(cohort);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={cohort._id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: theme.shadows[10]
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 'medium' }}>
                          {cohort.title}
                        </Typography>
                        <Chip 
                          label={status.text} 
                          color={status.color} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          height: '4.5em'
                        }}
                      >
                        {cohort.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon color="action" sx={{ mr: 1, fontSize: '0.9rem' }} />
                          <Typography variant="body2" color="text.secondary">
                            Start: {formatDate(cohort.startDate)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DateRangeIcon color="action" sx={{ mr: 1, fontSize: '0.9rem' }} />
                          <Typography variant="body2" color="text.secondary">
                            End: {formatDate(cohort.endDate)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <GroupIcon color="action" sx={{ mr: 1, fontSize: '0.9rem' }} />
                          <Typography variant="body2" color="text.secondary">
                            Eligible Users: {cohort.eligibleUsers?.length || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CreateIcon color="action" sx={{ mr: 1, fontSize: '0.9rem' }} />
                          <Typography variant="body2" color="text.secondary">
                            Created by: {cohort.createdBy?.name || 'Admin'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ justifyContent: 'space-between', p: 1.5 }}>
                      <Box>
                        <Tooltip title="Edit Cohort">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditCohort(cohort)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Cohort">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDeleteDialog(cohort)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleAddTopUsers(cohort)}
                          startIcon={<AddCircleIcon />}
                          sx={{ mr: 1 }}
                        >
                          Add Top Users
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          onClick={() => handleManageCohort(cohort)}
                          endIcon={<ArrowForwardIcon />}
                        >
                          Manage
                        </Button>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </TabPanel>
      
      {/* Active Cohorts Tab */}
      <TabPanel value={currentTab} index={1}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : cohorts.filter(c => c.isActive && !c.isDraft).length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No active cohorts found.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {cohorts
              .filter(c => c.isActive && !c.isDraft)
              .map((cohort) => {
                const status = getCohortStatus(cohort);
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={cohort._id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: theme.shadows[10]
                        }
                      }}
                    >
                      {/* Card content - same as in All Cohorts tab */}
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" component="h3" sx={{ fontWeight: 'medium' }}>
                            {cohort.title}
                          </Typography>
                          <Chip 
                            label={status.text} 
                            color={status.color} 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            height: '4.5em'
                          }}
                        >
                          {cohort.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarTodayIcon color="action" sx={{ mr: 1, fontSize: '0.9rem' }} />
                            <Typography variant="body2" color="text.secondary">
                              Start: {formatDate(cohort.startDate)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DateRangeIcon color="action" sx={{ mr: 1, fontSize: '0.9rem' }} />
                            <Typography variant="body2" color="text.secondary">
                              End: {formatDate(cohort.endDate)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <GroupIcon color="action" sx={{ mr: 1, fontSize: '0.9rem' }} />
                            <Typography variant="body2" color="text.secondary">
                              Eligible Users: {cohort.eligibleUsers?.length || 0}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                      
                      <Divider />
                      
                      <CardActions sx={{ justifyContent: 'space-between', p: 1.5 }}>
                        <Box>
                          <Tooltip title="Edit Cohort">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditCohort(cohort)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        
                        <Box>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleAddTopUsers(cohort)}
                            startIcon={<AddCircleIcon />}
                            sx={{ mr: 1 }}
                          >
                            Add Users
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={() => handleManageCohort(cohort)}
                            endIcon={<ArrowForwardIcon />}
                          >
                            Manage
                          </Button>
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        )}
      </TabPanel>
      
      {/* Drafts Tab */}
      <TabPanel value={currentTab} index={2}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : cohorts.filter(c => c.isDraft).length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No draft cohorts found.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {cohorts
              .filter(c => c.isDraft)
              .map((cohort) => {
                const status = getCohortStatus(cohort);
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={cohort._id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: theme.shadows[10]
                        }
                      }}
                    >
                      {/* Card content - same as in All Cohorts tab */}
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" component="h3" sx={{ fontWeight: 'medium' }}>
                            {cohort.title}
                          </Typography>
                          <Chip 
                            label={status.text} 
                            color={status.color} 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            height: '4.5em'
                          }}
                        >
                          {cohort.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarTodayIcon color="action" sx={{ mr: 1, fontSize: '0.9rem' }} />
                            <Typography variant="body2" color="text.secondary">
                              Start: {formatDate(cohort.startDate)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DateRangeIcon color="action" sx={{ mr: 1, fontSize: '0.9rem' }} />
                            <Typography variant="body2" color="text.secondary">
                              End: {formatDate(cohort.endDate)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                      
                      <Divider />
                      
                      <CardActions sx={{ justifyContent: 'space-between', p: 1.5 }}>
                        <Box>
                          <Tooltip title="Edit Cohort">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditCohort(cohort)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Cohort">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDeleteDialog(cohort)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          onClick={() => handleManageCohort(cohort)}
                          endIcon={<ArrowForwardIcon />}
                        >
                          Edit Draft
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        )}
      </TabPanel>
      
      {/* Create/Edit Cohort Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditMode ? 'Edit Cohort' : 'Create New Cohort'}
          <IconButton
            aria-label="close"
            onClick={handleCloseCreateDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.title}
                helperText={formErrors.title}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                fullWidth
                required
                error={!!formErrors.description}
                helperText={formErrors.description}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(date) => handleDateChange('startDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!formErrors.startDate,
                      helperText: formErrors.startDate
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(date) => handleDateChange('endDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!formErrors.endDate,
                      helperText: formErrors.endDate
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Video Resource URL"
                name="videoResource"
                value={formData.videoResource}
                onChange={handleInputChange}
                fullWidth
                placeholder="https://youtu.be/example"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Documentation URL"
                name="documentationUrl"
                value={formData.documentationUrl}
                onChange={handleInputChange}
                fullWidth
                placeholder="https://example.com/docs"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="active-status-label">Status</InputLabel>
                <Select
                  labelId="active-status-label"
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleInputChange}
                  label="Status"
                >
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>Inactive</MenuItem>
                </Select>
                <FormHelperText>
                  Active cohorts are visible to eligible users
                </FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="draft-status-label">Publication Status</InputLabel>
                <Select
                  labelId="draft-status-label"
                  name="isDraft"
                  value={formData.isDraft}
                  onChange={handleInputChange}
                  label="Publication Status"
                >
                  <MenuItem value={true}>Draft</MenuItem>
                  <MenuItem value={false}>Published</MenuItem>
                </Select>
                <FormHelperText>
                  Draft cohorts are only visible to administrators
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleCloseCreateDialog}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCohort}
            color="primary"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Cohort' : 'Create Cohort')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Cohort</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the cohort "{selectedCohort?.title}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action will permanently delete the cohort and all associated modules, questions, and user progress. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteCohort} 
            color="error"
            variant="contained"
            startIcon={<DeleteForeverIcon />}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Top Users Dialog */}
      <Dialog
        open={!!selectedCohort && addingTopUsers}
        onClose={() => setAddingTopUsers(false)}
      >
        <DialogTitle>Add Top Users to Cohort</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Add top-performing users to the cohort "{selectedCohort?.title}".
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="top-user-count-label">Number of Top Users</InputLabel>
            <Select
              labelId="top-user-count-label"
              value={topUserCount}
              onChange={(e) => setTopUserCount(e.target.value)}
              label="Number of Top Users"
            >
              <MenuItem value={10}>Top 10</MenuItem>
              <MenuItem value={25}>Top 25</MenuItem>
              <MenuItem value={50}>Top 50</MenuItem>
              <MenuItem value={100}>Top 100</MenuItem>
              <MenuItem value={250}>Top 250</MenuItem>
              <MenuItem value={500}>Top 500</MenuItem>
            </Select>
            <FormHelperText>
              Users will be selected based on their total score across all platforms
            </FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddingTopUsers(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={() => handleAddTopUsers(selectedCohort)}
            color="primary"
            variant="contained"
            startIcon={<GroupIcon />}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Users'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CohortManagementTab; 