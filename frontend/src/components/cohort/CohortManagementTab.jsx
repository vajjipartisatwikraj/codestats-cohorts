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
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar
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
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
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
  
  // State for tracking if we're fetching eligible users
  const [fetchingEligibleUsers, setFetchingEligibleUsers] = useState(false);
  
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
  
  // Updated fetchTopUsers to return the actual user objects
  const fetchTopUsers = async (count) => {
    setLoadingUsers(true);
    try {
      const response = await axios.get(`${apiUrl}/leaderboard/top/${count}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.leaderboard) {
        const users = response.data.leaderboard.map(entry => ({
          _id: entry.user._id,
          name: entry.user.name || 'Unknown',
          email: entry.user.email || 'No email',
          department: entry.user.department || 'No department',
          rollNumber: entry.user.rollNumber || '',
          score: entry.totalScore || 0
        }));
        setSelectedUsers(users);
        return users;
      }
      return [];
    } catch (error) {
      console.error('Error fetching top users:', error);
      toast.error('Failed to fetch top users');
      return [];
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // Search for users by name or email
  const searchUsers = async (query) => {
    setIsSearching(true);
    try {
      const response = await axios.get(`${apiUrl}/users/search?q=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.users) {
        const users = response.data.users.map(user => ({
          _id: user._id,
          name: user.name || 'Unknown',
          email: user.email || 'No email',
          department: user.department || 'No department',
          rollNumber: user.rollNumber || '',
          score: user.totalScore || 0
        }));
        setSearchResults(users);
        return users;
      }
      return [];
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      return [];
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle adding a user from search results to the selected users
  const handleAddUserToSelection = (user) => {
    // Check if the user is already in the selection
    if (!selectedUsers.some(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
    } else {
      toast.info(`${user.name} is already in your selection`);
    }
  };
  
  // Handle removing a user from the selection
  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };
  
  // Load top users based on selected shortcut
  const handleLoadTopUsers = (count) => {
    setTopUserCount(count);
    fetchTopUsers(count);
  };
  
  // Open the dialog for adding top users
  const handleOpenAddUsersDialog = async (cohort) => {
    setSelectedCohort(cohort);
    setSearchResults([]);
    setSearchQuery('');
    setAddingTopUsers(true);
    
    // Fetch existing eligible users for this cohort
    setFetchingEligibleUsers(true);
    try {
      // First get all eligible users for this cohort
      const eligibleResponse = await axios.get(
        `${apiUrl}/cohorts/${cohort._id}/eligible-users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (eligibleResponse.data && eligibleResponse.data.users) {
        const eligibleUsers = eligibleResponse.data.users.map(user => ({
          _id: user._id,
          name: user.name || 'Unknown',
          email: user.email || 'No email',
          department: user.department || 'No department',
          rollNumber: user.rollNumber || '',
          score: user.totalScore || 0
        }));
        setSelectedUsers(eligibleUsers);
      }
    } catch (error) {
      console.error('Error fetching eligible users:', error);
      toast.error('Failed to fetch current eligible users');
      setSelectedUsers([]);
    } finally {
      setFetchingEligibleUsers(false);
    }
  };
  
  // Perform the actual update of eligible users for the cohort
  const handleConfirmAddUsers = async (cohort) => {
    setAddingTopUsers(true);
    try {
      const userIds = selectedUsers.map(user => user._id);
      
      // Update the eligible users list for this cohort
      const response = await axios.put(
        `${apiUrl}/cohorts/${cohort._id}/eligible-users`, 
        { userIds: userIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      toast.success(`Updated eligible users for the cohort`);
      
      // Refresh the cohort list to show updated numbers
      fetchCohorts();
      
      // Close the dialog
      setAddingTopUsers(false);
    } catch (error) {
      console.error('Error updating eligible users:', error);
      toast.error('Failed to update eligible users for the cohort');
    }
  };
  
  // Cancel adding users
  const handleCancelAddUsers = () => {
      setAddingTopUsers(false);
    setSelectedUsers([]);
    setSearchResults([]);
    setSearchQuery('');
  };
  
  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length >= 3) {
      searchUsers(e.target.value);
    } else {
      setSearchResults([]);
    }
  };
  
  // Replace the previous renderTopUsersSelector with a button to open the dialog
  const renderAddTopUsersButton = (cohort) => (
    <Button
      variant="outlined"
      size="small"
      onClick={() => handleOpenAddUsersDialog(cohort)}
      startIcon={<AddCircleIcon />}
      sx={{ mr: 1 }}
    >
      Manage Eligible Users
    </Button>
  );
  
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
  
  return (
    <Box>
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
                        {renderAddTopUsersButton(cohort)}
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
                          {renderAddTopUsersButton(cohort)}
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
        onClose={handleCancelAddUsers}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Manage Eligible Users: {selectedCohort?.title}
          <IconButton
            aria-label="close"
            onClick={handleCancelAddUsers}
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
          <Grid container spacing={2}>
            {/* Quick selection options */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Quick Selection
          </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip 
                  label="Top 10" 
                  onClick={() => handleLoadTopUsers(10)} 
                  color="primary" 
                  variant={topUserCount === 10 ? "filled" : "outlined"}
                  clickable
                />
                <Chip 
                  label="Top 25" 
                  onClick={() => handleLoadTopUsers(25)} 
                  color="primary" 
                  variant={topUserCount === 25 ? "filled" : "outlined"}
                  clickable
                />
                <Chip 
                  label="Top 50" 
                  onClick={() => handleLoadTopUsers(50)} 
                  color="primary" 
                  variant={topUserCount === 50 ? "filled" : "outlined"}
                  clickable
                />
                <Chip 
                  label="Top 100" 
                  onClick={() => handleLoadTopUsers(100)} 
                  color="primary" 
                  variant={topUserCount === 100 ? "filled" : "outlined"}
                  clickable
                />
                <Chip 
                  label="Top 200" 
                  onClick={() => handleLoadTopUsers(200)} 
                  color="primary" 
                  variant={topUserCount === 200 ? "filled" : "outlined"}
                  clickable
                />
                <Chip 
                  label="Top 300" 
                  onClick={() => handleLoadTopUsers(300)} 
                  color="primary" 
                  variant={topUserCount === 300 ? "filled" : "outlined"}
                  clickable
                />
                <Chip 
                  label="Top 500" 
                  onClick={() => handleLoadTopUsers(500)} 
                  color="primary" 
                  variant={topUserCount === 500 ? "filled" : "outlined"}
                  clickable
                />
                <Chip 
                  label="Top 1000" 
                  onClick={() => handleLoadTopUsers(1000)} 
                  color="primary" 
                  variant={topUserCount === 1000 ? "filled" : "outlined"}
                  clickable
                />
              </Box>
            </Grid>
            
            {/* Search for users */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Search Users
              </Typography>
              <TextField
                fullWidth
                label="Search by name or email"
                variant="outlined"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Type at least 3 characters"
                InputProps={{
                  endAdornment: isSearching ? (
                    <CircularProgress size={20} />
                  ) : null
                }}
              />
              {searchResults.length > 0 && (
                <Paper variant="outlined" sx={{ mt: 1, maxHeight: '200px', overflow: 'auto' }}>
                  <List dense>
                    {searchResults.map(user => (
                      <ListItem
                        key={user._id}
                        secondaryAction={
                          <IconButton edge="end" onClick={() => handleAddUserToSelection(user)}>
                            <AddIcon />
                          </IconButton>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {user.name?.charAt(0) || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.name}
                          secondary={user.email}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
              {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No users found matching "{searchQuery}"
                </Alert>
              )}
            </Grid>
            
            {/* Selected users list */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Current Eligible Users ({selectedUsers.length})
                </Typography>
                {selectedUsers.length > 0 && (
                  <Button 
                    size="small" 
                    onClick={() => setSelectedUsers([])}
                    color="error"
                    variant="outlined"
                  >
                    Clear All
                  </Button>
                )}
              </Box>
              
              {fetchingEligibleUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Loading eligible users...</Typography>
                </Box>
              ) : loadingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress />
                </Box>
              ) : selectedUsers.length === 0 ? (
                <Alert severity="info">
                  No users are currently eligible for this cohort. Use the quick selection options or search for users to add them.
                </Alert>
              ) : (
                <Paper variant="outlined" sx={{ maxHeight: '300px', overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Roll Number</TableCell>
                        <TableCell align="right">Score</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedUsers.map(user => (
                        <TableRow key={user._id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.department}</TableCell>
                          <TableCell>{user.rollNumber}</TableCell>
                          <TableCell align="right">{user.score}</TableCell>
                          <TableCell align="center">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleRemoveUser(user._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCancelAddUsers} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={() => handleConfirmAddUsers(selectedCohort)}
            color="primary"
            variant="contained"
            startIcon={<GroupIcon />}
            disabled={fetchingEligibleUsers || loadingUsers}
          >
            Update Eligible Users
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CohortManagementTab; 