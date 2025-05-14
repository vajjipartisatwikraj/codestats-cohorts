import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
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
  Save as SaveIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  AddCircle as AddCircleIcon,
  Group as GroupIcon,
  Link as LinkIcon,
  VideoLibrary as VideoIcon,
  Description as DocumentIcon,
  Check as CheckIcon,
  Reorder as ReorderIcon,
  QuestionAnswer as QuestionIcon,
  Code as CodeIcon,
  QuizOutlined as QuizIcon,
  MenuBook as MenuBookIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material';
import axios from 'axios';
import { apiUrl } from '../../config/apiConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import ModuleList from './ModuleList';
import ModuleForm from './ModuleForm';
import QuestionList from './QuestionList';
import QuestionForm from './QuestionForm';
import CohortStats from './CohortStats';
import { alpha } from '@mui/material/styles';
import CohortDetailLeft from './CohortDetailLeft';
import CohortDetailRight from './CohortDetailRight';
import CohortProgress from './CohortProgress';

// Tab panel component
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
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CohortDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [cohort, setCohort] = useState(null);
  const [modules, setModules] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [openModuleDialog, setOpenModuleDialog] = useState(false);
  const [moduleFormData, setModuleFormData] = useState({
    title: '',
    description: '',
    order: 0,
    videoResource: '',
    documentationUrl: '',
    resources: []
  });
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [questionFormData, setQuestionFormData] = useState({
    title: '',
    description: '',
    type: 'programming',
    difficultyLevel: 'medium',
    marks: 10,
    options: [],
    languages: [
      {
        name: 'java',
        version: '15.0.2',
        boilerplateCode: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
        solutionCode: ''
      }
    ],
    defaultLanguage: 'java',
    testCases: [],
    examples: [],
    constraints: {
      timeLimit: 1000,
      memoryLimit: 256
    },
    hints: [],
    tags: [],
    companies: []
  });
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState(null);
  
  // State for tracking which right panel is active
  const [showProgress, setShowProgress] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Add state for showFeedback
  const [showFeedback, setShowFeedback] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user && user.userType === 'admin') {
      setIsAdmin(true);
    }
  }, [user]);

  // Fetch cohort details on component mount
  useEffect(() => {
    fetchCohortDetails();
  }, [id, token, isAdmin]);

  // Add a new effect to refresh data when window gains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing cohort data');
        fetchCohortDetails();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch cohort details
  const fetchCohortDetails = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? `${apiUrl}/cohorts/admin/${id}` : `${apiUrl}/cohorts/${id}`;
      console.log(`Fetching cohort details from: ${endpoint}`);
      
      // Add a more reliable cache buster with both timestamp and random value
      const timestamp = new Date().getTime();
      const cacheBuster = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;
      console.log(`Adding cache-busting parameter: ${cacheBuster}`);
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          _t: cacheBuster
        },
        // Force no caching
        cache: false
      });
      
      console.log('Cohort data fetched:', response.data);
      
      if (response.data.userProgress && response.data.userProgress.questionProgress) {
        console.log('Question progress in response:', response.data.userProgress.questionProgress);
        
        const solvedQuestions = response.data.userProgress.questionProgress.filter(q => q.solved);
        console.log(`Found ${solvedQuestions.length} solved questions in progress data`);
        solvedQuestions.forEach(q => {
          console.log(`Question ${q.question} solved with score ${q.bestScore}`);
        });
      }
      
      setCohort(response.data);
      
      if (!isAdmin && response.data.eligibleUsers?.includes(user.id) && 
         (!response.data.userProgress || response.data.userProgress.status === 'applied')) {
        autoEnroll();
      }
      
      if (response.data.modules && response.data.modules.length > 0) {
        setModules(response.data.modules);
        // Set the first module as selected if none is selected
        if (!currentModuleId && response.data.modules.length > 0) {
          setCurrentModuleId(response.data.modules[0]._id);
        }
        setLoading(false);
      } else {
        fetchModules();
      }

      // Get cohort feedback if the user is enrolled
      if (!isAdmin && response.data.userProgress) {
        try {
          const feedbackResponse = await axios.get(
            `${apiUrl}/cohorts/${id}/feedback`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (feedbackResponse.data) {
            // Update cohort with feedback data
            setCohort(prevCohort => ({
              ...prevCohort,
              feedbacks: feedbackResponse.data.feedbacks,
              averageRating: feedbackResponse.data.averageRating
            }));
          }
        } catch (feedbackError) {
          console.error('Error fetching cohort feedback:', feedbackError);
          // Non-critical error, don't show toast
        }
      }
    } catch (error) {
      console.error('Error fetching cohort details:', error);
      const errorResponse = error.response?.data;
      
      if (error.response) {
        if (error.response.status === 404) {
          if (errorResponse?.reason === 'not_found') {
            toast.error(`Cohort not found. It may have been deleted.`);
            navigate(isAdmin ? '/admin' : '/cohorts');
            return;
          }
        } else if (error.response.status === 403) {
          if (errorResponse?.reason === 'not_eligible') {
            toast.error(`You're not eligible to view this cohort.`);
            navigate('/cohorts');
            return;
          } else if (errorResponse?.reason === 'not_active') {
            toast.error(`This cohort is currently inactive.`);
            navigate('/cohorts');
            return;
          } else if (errorResponse?.reason === 'draft_mode') {
            if (!isAdmin) {
              toast.error(`This cohort is not yet published.`);
              navigate('/cohorts');
              return;
            }
          }
        }
      }
      
      if (error.response && error.response.status === 404) {
        try {
          const fallbackEndpoint = isAdmin ? 
            `http://localhost:5000/api/cohorts/admin/${id}` : 
            `http://localhost:5000/api/cohorts/${id}`;
          
          console.log(`Trying fallback endpoint: ${fallbackEndpoint}`);
          
          const fallbackResponse = await axios.get(fallbackEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            params: { _t: new Date().getTime() }
          });
          
          setCohort(fallbackResponse.data);
          
          if (fallbackResponse.data.modules && fallbackResponse.data.modules.length > 0) {
            setModules(fallbackResponse.data.modules);
            if (!currentModuleId && fallbackResponse.data.modules.length > 0) {
              setCurrentModuleId(fallbackResponse.data.modules[0]._id);
            }
            setLoading(false);
          } else {
            fetchModules(true); // pass true to use fallback URL
          }
        } catch (fallbackError) {
          console.error('Fallback attempt also failed:', fallbackError);
          
          const fallbackErrorResponse = fallbackError.response?.data;
          if (fallbackError.response) {
            if (fallbackError.response.status === 403) {
              if (fallbackErrorResponse?.reason === 'not_eligible') {
                toast.error(`You're not eligible to view this cohort.`);
              } else if (fallbackErrorResponse?.reason === 'not_active') {
                toast.error(`This cohort is currently inactive.`);
              } else if (fallbackErrorResponse?.reason === 'draft_mode') {
                toast.error(`This cohort is not yet published.`);
              } else {
                toast.error('Access denied to this cohort');
              }
            } else {
              toast.error('Failed to fetch cohort details');
            }
          } else {
            toast.error('Failed to fetch cohort details');
          }
          
          navigate(isAdmin ? '/admin' : '/cohorts');
        }
      } else {
        toast.error('Failed to fetch cohort details');
        navigate(isAdmin ? '/admin' : '/cohorts');
      }
      
      setLoading(false);
    }
  };

  // Auto-enroll the user in the cohort if eligible
  const autoEnroll = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/cohorts/${id}/enroll`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      fetchCohortDetails();
      
      toast.success('You have been enrolled in this cohort!');
    } catch (error) {
      console.error('Error enrolling in cohort:', error);
    }
  };

  // Fetch modules for this cohort
  const fetchModules = async (useFallback = false) => {
    try {
      if (cohort && cohort.modules && cohort.modules.length > 0) {
        setModules(cohort.modules);
        if (!currentModuleId && cohort.modules.length > 0) {
          setCurrentModuleId(cohort.modules[0]._id);
        }
        return;
      }
      
      const endpoint = useFallback ? 
        `http://localhost:5000/api/cohorts/${id}/modules` : 
        `${apiUrl}/cohorts/${id}/modules`;
      
      console.log(`Fetching modules from: ${endpoint}`);
      
      // Add cache buster
      const timestamp = new Date().getTime();
      const cacheBuster = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          _t: cacheBuster
        },
        cache: false
      });
      
      if (response.data && response.data.modules) {
        setModules(response.data.modules);
        if (!currentModuleId && response.data.modules.length > 0) {
          setCurrentModuleId(response.data.modules[0]._id);
        }
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      const errorResponse = error.response?.data;
      
      if (error.response) {
        if (error.response.status === 404) {
          if (errorResponse?.reason === 'not_found') {
            toast.error(`Cohort not found. It may have been deleted.`);
            navigate(isAdmin ? '/admin' : '/cohorts');
            return;
          }
        } else if (error.response.status === 403) {
          if (errorResponse?.reason === 'not_eligible') {
            toast.error(`You're not eligible to view this cohort.`);
            navigate('/cohorts');
            return;
          } else if (errorResponse?.reason === 'not_active') {
            toast.error(`This cohort is currently inactive.`);
            navigate('/cohorts');
            return;
          } else if (errorResponse?.reason === 'draft_mode') {
            if (!isAdmin) {
              toast.error(`This cohort is not yet published.`);
              navigate('/cohorts');
              return;
            }
          }
        }
      }
      
      if (!useFallback && error.response && error.response.status === 404) {
        fetchModules(true);
      } else {
        if (error.response && error.response.status !== 404) {
          toast.error('Failed to fetch modules');
        }
        setModules([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Reset other view states
    setShowProgress(false);
    setShowStats(newValue === 1);
  };

  // Handle clicking on a module
  const handleModuleClick = (module) => {
    console.log('Module clicked:', module);
    setCurrentModuleId(module._id);
    
    // Make sure to fetch the full module details if needed
    if (modules.length > 0) {
      // Find the module with all its details
      const fullModule = modules.find(m => m._id === module._id);
      if (fullModule) {
        console.log('Full module found:', fullModule);
      } else {
        console.warn('Module not found in modules array, fetching data again...');
        fetchModules();
      }
    }
    
    // Close other views when selecting a module
    setShowProgress(false);
    setShowStats(false);
    setShowFeedback(false); // Close feedback panel when module is clicked
  };

  // Handle Progress button click
  const handleProgressClick = () => {
    setShowProgress(!showProgress);
    setShowStats(false);
  };

  // Handle Stats button click (admin only)
  const handleStatsClick = () => {
    setShowStats(!showStats);
    setShowProgress(false);
  };

  // Handle solving a question
  const handleSolveQuestion = (question) => {
    if (!currentModuleId) return;
    
    // Open the question in a new tab
    window.open(`/cohorts/${cohort._id}/modules/${currentModuleId}/questions/${question._id}`, '_blank');
  };

  // Open the create module dialog
  const handleOpenModuleDialog = () => {
    setIsEditingModule(false);
    setModuleFormData({
      title: '',
      description: '',
      order: modules.length,
      videoResource: '',
      documentationUrl: '',
      resources: []
    });
    setOpenModuleDialog(true);
  };

  // Open the edit module dialog
  const handleEditModule = (module) => {
    setIsEditingModule(true);
    setModuleFormData({
      title: module.title,
      description: module.description,
      order: module.order || 0,
      videoResource: module.videoResource || '',
      documentationUrl: module.documentationUrl || '',
      resources: module.resources || []
    });
    setSelectedModule(module);
    setOpenModuleDialog(true);
  };

  // Close the module dialog
  const handleCloseModuleDialog = () => {
    setOpenModuleDialog(false);
  };

  // Save a module
  const handleSaveModule = async (moduleData) => {
    setLoading(true);
    try {
      let response;
      let endpoint;
      
      if (isEditingModule) {
        // Update an existing module
        endpoint = `${apiUrl}/cohorts/${id}/modules/${selectedModule._id}`;
        response = await axios.put(
          endpoint,
          moduleData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        toast.success('Module updated successfully');
      } else {
        // Create a new module
        endpoint = `${apiUrl}/cohorts/${id}/modules`;
        response = await axios.post(
          endpoint,
          moduleData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        toast.success('Module created successfully');
      }
      
      // Refresh the modules list
      fetchModules();
      
      // Close the dialog
      handleCloseModuleDialog();
    } catch (error) {
      console.error('Error saving module:', error);
      
      // Try with fallback URL if we got a 404
      if (error.response && error.response.status === 404) {
        try {
          let response;
          let fallbackEndpoint;
          
          if (isEditingModule) {
            fallbackEndpoint = `http://localhost:5000/api/cohorts/${id}/modules/${selectedModule._id}`;
            response = await axios.put(
              fallbackEndpoint,
              moduleData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } else {
            fallbackEndpoint = `http://localhost:5000/api/cohorts/${id}/modules`;
            response = await axios.post(
              fallbackEndpoint,
              moduleData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          }
          
          toast.success(isEditingModule ? 'Module updated successfully' : 'Module created successfully');
          fetchModules(true);
          handleCloseModuleDialog();
        } catch (fallbackError) {
          console.error('Fallback attempt also failed:', fallbackError);
          toast.error(error.response?.data?.message || 'Failed to save module');
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to save module');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete a module
  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module? This will also delete all questions in this module.')) {
      return;
    }
    
    setLoading(true);
    try {
      const endpoint = `${apiUrl}/cohorts/${id}/modules/${moduleId}`;
      await axios.delete(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Module deleted successfully');
      
      // Refresh the modules list
      fetchModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      
      // Try with fallback URL if we got a 404
      if (error.response && error.response.status === 404) {
        try {
          const fallbackEndpoint = `http://localhost:5000/api/cohorts/${id}/modules/${moduleId}`;
          await axios.delete(fallbackEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          toast.success('Module deleted successfully');
          fetchModules(true);
        } catch (fallbackError) {
          console.error('Fallback attempt also failed:', fallbackError);
          toast.error('Failed to delete module');
        }
      } else {
        toast.error('Failed to delete module');
      }
    } finally {
      setLoading(false);
    }
  };

  // Open the create question dialog
  const handleOpenQuestionDialog = (module) => {
    setIsEditingQuestion(false);
    setQuestionFormData({
      title: '',
      description: '',
      type: 'programming',
      difficultyLevel: 'medium',
      marks: 10,
      options: [],
      languages: [
        {
          name: 'java',
          version: '15.0.2',
          boilerplateCode: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
          solutionCode: ''
        }
      ],
      defaultLanguage: 'java',
      testCases: [],
      examples: [],
      constraints: {
        timeLimit: 1000,
        memoryLimit: 256
      },
      hints: [],
      tags: [],
      companies: []
    });
    setSelectedModule(module);
    setOpenQuestionDialog(true);
  };

  // Open the edit question dialog
  const handleEditQuestion = async (module, question) => {
    setLoading(true);
    try {
      // Fetch complete question data directly from backend instead of using potentially incomplete data
      const endpoint = `${apiUrl}/cohorts/${id}/modules/${module._id}/questions/${question._id}/edit`;
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const completeQuestionData = response.data;
      console.log('Fetched complete question data:', completeQuestionData);
      
    setIsEditingQuestion(true);
      // Use the complete question data for the form
    setQuestionFormData({
        title: completeQuestionData.title || '',
        description: completeQuestionData.description || '',
        type: completeQuestionData.type || 'programming',
        difficultyLevel: completeQuestionData.difficultyLevel || 'medium',
        marks: completeQuestionData.marks || 10,
        options: completeQuestionData.options || [],
        languages: completeQuestionData.languages || [
          {
            name: 'java',
            version: '15.0.2',
            boilerplateCode: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
            solutionCode: ''
          }
        ],
        defaultLanguage: completeQuestionData.defaultLanguage || 'java',
        testCases: completeQuestionData.testCases || [],
        examples: completeQuestionData.examples || [],
        constraints: completeQuestionData.constraints ? {
          timeLimit: completeQuestionData.constraints.timeLimit || 1000,
          memoryLimit: completeQuestionData.constraints.memoryLimit || 256
        } : {
          timeLimit: 1000,
          memoryLimit: 256
        },
        hints: completeQuestionData.hints || [],
        tags: completeQuestionData.tags || [],
        companies: completeQuestionData.companies || []
      });
      
      setSelectedModule(module);
      setSelectedQuestion(completeQuestionData);
      setOpenQuestionDialog(true);
      
    } catch (error) {
      console.error('Error fetching complete question data:', error);
      toast.error('Error loading question data. Please try again.');
      
      // Fallback to using the existing data if fetch fails
      setIsEditingQuestion(true);
      setQuestionFormData({
        title: question.title || '',
        description: question.description || '',
        type: question.type || 'programming',
        difficultyLevel: question.difficultyLevel || 'medium',
        marks: question.marks || 10,
      options: question.options || [],
        languages: question.languages || [
          {
            name: 'java',
            version: '15.0.2',
            boilerplateCode: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
            solutionCode: ''
          }
        ],
      defaultLanguage: question.defaultLanguage || 'java',
      testCases: question.testCases || [],
      examples: question.examples || [],
        constraints: question.constraints ? {
          timeLimit: question.constraints.timeLimit || 1000,
          memoryLimit: question.constraints.memoryLimit || 256
        } : {
        timeLimit: 1000,
        memoryLimit: 256
      },
      hints: question.hints || [],
      tags: question.tags || [],
      companies: question.companies || []
    });
    setSelectedModule(module);
    setSelectedQuestion(question);
    setOpenQuestionDialog(true);
    } finally {
      setLoading(false);
    }
  };

  // Close the question dialog
  const handleCloseQuestionDialog = () => {
    setOpenQuestionDialog(false);
    setQuestionFormData({});
    setIsEditingQuestion(false);
    setSelectedModule(null);
    setSelectedQuestion(null);
  };

  // Save a question
  const handleSaveQuestion = async (questionData) => {
    setLoading(true);
    try {
      let response;
      const payload = {
        ...questionData,
        module: selectedModule._id
      };
      
      let endpoint;
      
      if (isEditingQuestion) {
        // Update an existing question
        endpoint = `${apiUrl}/cohorts/${id}/modules/${selectedModule._id}/questions/${selectedQuestion._id}`;
        response = await axios.put(
          endpoint,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        toast.success('Question updated successfully');
      } else {
        // Create a new question
        endpoint = `${apiUrl}/cohorts/${id}/modules/${selectedModule._id}/questions`;
        response = await axios.post(
          endpoint,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        toast.success('Question created successfully');
      }
      
      // Refresh the entire cohort details for complete update
      fetchCohortDetails();
      
      // Close the dialog
      handleCloseQuestionDialog();
    } catch (error) {
      console.error('Error saving question:', error);
      
      // Try with fallback URL if we got a 404
      if (error.response && error.response.status === 404) {
        try {
          let response;
          let fallbackEndpoint;
          const payload = {
            ...questionData,
            module: selectedModule._id
          };
          
          if (isEditingQuestion) {
            fallbackEndpoint = `http://localhost:5000/api/cohorts/${id}/modules/${selectedModule._id}/questions/${selectedQuestion._id}`;
            response = await axios.put(
              fallbackEndpoint,
              payload,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          } else {
            fallbackEndpoint = `http://localhost:5000/api/cohorts/${id}/modules/${selectedModule._id}/questions`;
            response = await axios.post(
              fallbackEndpoint,
              payload,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          }
          
          toast.success(isEditingQuestion ? 'Question updated successfully' : 'Question created successfully');
          // Refresh the entire cohort details for complete update
          fetchCohortDetails();
          handleCloseQuestionDialog();
        } catch (fallbackError) {
          console.error('Fallback attempt also failed:', fallbackError);
          if (error.response?.data?.message) {
            toast.error(`Failed to save question: ${error.response.data.message}`);
          } else {
            toast.error('Failed to save question. Please try again later.');
          }
        }
      } else {
        if (error.response?.data?.message) {
          toast.error(`Failed to save question: ${error.response.data.message}`);
        } else {
          toast.error('Failed to save question. Please try again later.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Navigate back to the cohorts list
  const handleBack = () => {
    navigate(isAdmin ? '/admin' : '/cohorts');
  };

  // Publish or unpublish a cohort
  const handleToggleDraftStatus = async () => {
    setLoading(true);
    try {
      await axios.put(
        `${apiUrl}/cohorts/${id}`,
        { 
          isDraft: !cohort.isDraft 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      toast.success(cohort.isDraft ? 'Cohort published successfully' : 'Cohort unpublished successfully');
      
      // Refresh the cohort details
      fetchCohortDetails();
    } catch (error) {
      console.error('Error updating cohort:', error);
      toast.error('Failed to update cohort');
    } finally {
      setLoading(false);
    }
  };

  // Modify where currentModule is defined in CohortDetail.jsx (right before return statement)
  // Make sure currentModule is correctly set based on currentModuleId and is never null
  // when modules are available
  const currentModule = currentModuleId 
    ? modules.find(m => m._id === currentModuleId)
    : modules.length > 0 ? modules[0] : null;
  
  console.log('Current module ID:', currentModuleId);
  console.log('Available modules:', modules);
  console.log('Current module being passed to CohortDetailRight:', currentModule);

  // Delete a question
  const handleDeleteQuestion = async (module, question) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const endpoint = `${apiUrl}/cohorts/${id}/modules/${module._id}/questions/${question._id}`;
      await axios.delete(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Question deleted successfully');
      
      // Refresh the entire cohort details for complete update
      fetchCohortDetails();
    } catch (error) {
      console.error('Error deleting question:', error);
      
      // Try with fallback URL if we got a 404
      if (error.response && error.response.status === 404) {
        try {
          const fallbackEndpoint = `http://localhost:5000/api/cohorts/${id}/modules/${module._id}/questions/${question._id}`;
          await axios.delete(fallbackEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          toast.success('Question deleted successfully');
          // Refresh the entire cohort details for complete update
          fetchCohortDetails();
        } catch (fallbackError) {
          console.error('Fallback attempt also failed:', fallbackError);
          toast.error('Failed to delete question');
        }
      } else {
        toast.error('Failed to delete question');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add handler for feedback button click
  const handleFeedbackClick = () => {
    setShowFeedback(!showFeedback);
    setShowProgress(false);
    setShowStats(false);
    // Removed setCurrentModuleId(null) to preserve module selection
  };

  return (
    <Box sx={{ bgcolor: '#121212', minHeight: '100vh', color: 'white' }}>
      {loading && !cohort ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : cohort ? (
            <Grid container sx={{ 
              height: 'calc(100vh - 60px)', 
              px: { xs: 2, md: 4 }, 
              py: { xs: 2, md: 3 },
              backgroundColor: theme.palette.mode === 'dark' ? 'black !important' : '#f8f9fa !important',
              overflow: 'hidden',
              position: 'fixed',
              top: '60px',
              left: 0,
              right: 0,
              bottom: 0
            }}>
              <Box sx={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                height: '100%',
                gap: { xs: 1, md: 3 },
                overflow: 'hidden',
                backgroundColor: 'transparent',
                mx: '10%',
                maxWidth: '100%'
              }}>
                {/* Left panel - Cohort info and module list */}
                <Box sx={{ 
                  width: { xs: '100%', md: '320px', lg: '380px' },
                  height: { xs: 'auto', md: '100%' },
                  flexShrink: 0,
                  position: 'relative',
                  backgroundColor: 'transparent'
                }}>
                  <CohortDetailLeft 
                    cohort={cohort} 
                    modules={modules} 
                    userProgress={cohort.userProgress}
                    handleModuleClick={handleModuleClick}
                    currentModuleId={currentModuleId}
                    onProgressClick={handleProgressClick}
                    showProgress={showProgress}
                    isAdmin={isAdmin}
                    onStatsClick={isAdmin ? handleStatsClick : undefined}
                    showStats={showStats}
                    handleEditModule={isAdmin ? handleEditModule : undefined}
                    handleDeleteModule={isAdmin ? handleDeleteModule : undefined}
                    handleOpenModuleDialog={isAdmin ? handleOpenModuleDialog : undefined}
                    handleBack={handleBack}
                    handleToggleDraftStatus={handleToggleDraftStatus}
                    onFeedbackClick={handleFeedbackClick}
                    showFeedback={showFeedback}
                  />
                </Box>
                
            {/* Right panel - Various content based on selection */}
                <Box sx={{ 
                  flexGrow: 1,
                  height: { xs: 'calc(100vh - 380px)', md: '100%' },
                  overflow: 'hidden',
                  backgroundColor: 'transparent',
                  marginLeft: { md: '400px', lg: '440px' },
                  width: { md: 'calc(100% - 420px)', lg: 'calc(100% - 460px)' }
                }}>
                  {showProgress ? (
                    <CohortProgress 
                      cohort={cohort}
                      userProgress={cohort.userProgress}
                    />
              ) : showStats && isAdmin ? (
                <Box sx={{ 
                  p: { xs: 2, md: 2 }, 
                  height: '120%', 
                  bgcolor: theme.palette.mode === 'dark' ? '#000000' : '#FFFFFF',
                  color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#333333',
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
                  <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Cohort Statistics</Typography>
                  <CohortStats cohortId={id} token={token} />
                </Box>
                  ) : currentModule ? (
                    <CohortDetailRight 
                      module={currentModule} 
                      userProgress={cohort.userProgress}
                      handleSolveQuestion={handleSolveQuestion}
                      isAdmin={isAdmin}
                      handleEditQuestion={isAdmin ? handleEditQuestion : undefined}
                      handleOpenQuestionDialog={isAdmin ? handleOpenQuestionDialog : undefined}
                      handleDeleteQuestion={isAdmin ? handleDeleteQuestion : undefined}
                      showFeedback={showFeedback}
                      cohortId={cohort._id}
                    />
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: '100%', 
                      borderRadius: '10px',
                      backgroundColor: theme.palette.mode === 'dark' ? '#0E1117' : '#f2f7fa',
                      position: { md: 'fixed' },
                      width: { md: 'calc(100% - 490px)', lg: 'calc(100% - 520px)' },
                      right: { md: '24px', lg: '40px' },
                      top: { md: 'calc(60px + 24px)' },
                      maxHeight: { md: 'calc(100vh - 60px - 48px)' }
                    }}>
                      <Typography variant="h5" sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                    {isAdmin 
                      ? "Select a module or add a new one to get started" 
                      : "Select a module to view its questions"}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
      ) : (
        <Alert severity="error">
          Cohort not found or you don't have permission to view it.
        </Alert>
          )}
          
      {/* Module dialog */}
          {isAdmin && (
            <Dialog
              open={openModuleDialog}
              onClose={handleCloseModuleDialog}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>
                {isEditingModule ? 'Edit Module' : 'Create Module'}
                <IconButton
                  aria-label="close"
                  onClick={handleCloseModuleDialog}
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
                      value={moduleFormData.title}
                      onChange={(e) => setModuleFormData({ ...moduleFormData, title: e.target.value })}
                      fullWidth
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      name="description"
                      value={moduleFormData.description}
                      onChange={(e) => setModuleFormData({ ...moduleFormData, description: e.target.value })}
                      multiline
                      rows={4}
                      fullWidth
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Order"
                      name="order"
                      type="number"
                      value={moduleFormData.order}
                      onChange={(e) => setModuleFormData({ ...moduleFormData, order: parseInt(e.target.value) })}
                      fullWidth
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Video Resource URL"
                      name="videoResource"
                      value={moduleFormData.videoResource}
                      onChange={(e) => setModuleFormData({ ...moduleFormData, videoResource: e.target.value })}
                      fullWidth
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Documentation URL"
                      name="documentationUrl"
                      value={moduleFormData.documentationUrl}
                      onChange={(e) => setModuleFormData({ ...moduleFormData, documentationUrl: e.target.value })}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              
              <DialogActions>
                <Button onClick={handleCloseModuleDialog} color="inherit">
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSaveModule(moduleFormData)}
                  color="primary"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (isEditingModule ? 'Update Module' : 'Create Module')}
                </Button>
              </DialogActions>
            </Dialog>
          )}
          
      {/* Question Form Dialog */}
            <Dialog
              open={openQuestionDialog}
              onClose={handleCloseQuestionDialog}
              maxWidth="lg"
              fullWidth
            >
              <DialogTitle>
          {isEditingQuestion ? 'Edit Question' : 'Add Question'}
                <IconButton
                  aria-label="close"
                  onClick={handleCloseQuestionDialog}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
              color: (theme) => theme.palette.grey[500]
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
                <QuestionForm
              key={`question-form-${selectedQuestion?._id || 'new'}`}
                  initialData={questionFormData}
                  onSave={handleSaveQuestion}
                  onCancel={handleCloseQuestionDialog}
                  moduleId={selectedModule?._id}
                  isEdit={isEditingQuestion}
                />
          )}
              </DialogContent>
            </Dialog>
    </Box>
  );
};

export default CohortDetail; 