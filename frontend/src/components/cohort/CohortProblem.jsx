import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  Chip,
  Tab,
  Tabs,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Alert,
  Tooltip,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  alpha,
  Menu,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TimerIcon from '@mui/icons-material/Timer';
import MemoryIcon from '@mui/icons-material/Memory';
import DeleteIcon from '@mui/icons-material/Delete';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import FlagCircleIcon from '@mui/icons-material/FlagCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import TerminalIcon from '@mui/icons-material/Terminal';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { apiUrl } from '../../config/apiConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { isJavaScriptExecutionDisabled } from '../../utils/security';
import { formatTime, formatMemory } from '../../utils/formatting';
import compilerService from '../../utils/compilerService';
import Notes from './Notes';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import TestCasesPanel from './TestCasesPanel';
import CodeEditorPanel from './CodeEditorPanel';
import SidebarNavigation from './SidebarNavigation';
import SubmissionsPanel from './SubmissionsPanel';
import HistoryIcon from '@mui/icons-material/History';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import QuestionReport from './QuestionReport';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`problem-tabpanel-${index}`}
      aria-labelledby={`problem-tab-${index}`}
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

const CohortProblem = () => {
  const { cohortId, moduleId, questionId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { darkMode } = useAppTheme();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [question, setQuestion] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [allUsersSubmissions, setAllUsersSubmissions] = useState([]);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const resizerRef = useRef(null);
  
  // Add state for test cases panel height
  const [testCasesPanelHeight, setTestCasesPanelHeight] = useState(50);
  const [isResizingTestPanel, setIsResizingTestPanel] = useState(false);
  const [resizeStartY, setResizeStartY] = useState(0);
  const testPanelResizerRef = useRef(null);
  
  // Language options from the CodePad component
  const LANGUAGES = {
    'c': { 
      extension: 'c', 
      name: 'C',
      defaultCode: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}',
      version: '10.2.0'
    },
    'cpp': { 
      extension: 'cpp', 
      name: 'C++',
      defaultCode: '#include <iostream>\n\nint main() {\n    // Your code here\n    return 0;\n}',
      version: '10.2.0'
    },
    'java': { 
      extension: 'java', 
      name: 'Java',
      defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
      version: '15.0.2'
    },
    'python': { 
      extension: 'py', 
      name: 'Python',
      defaultCode: '# Your code here',
      version: '3.10.0'
    },
    'javascript': { 
      extension: 'js', 
      name: 'JavaScript',
      defaultCode: '// Your code here',
      version: '18.15.0'
    }
  };
  
  // Add state for MCQ
  const [selectedMcqOption, setSelectedMcqOption] = useState(null);
  const [mcqSubmissionResult, setMcqSubmissionResult] = useState(null);
  
  // Fetch question details on component mount
  useEffect(() => {
    fetchQuestionDetails();
    fetchAllSubmissions();
  }, [cohortId, moduleId, questionId, token]);
  
  // Update code when language changes
  useEffect(() => {
    if (!code || code === '') {
      // Only set default code if there's no code already (from previous submission)
      if (question && question.languages) {
        const languageInfo = question.languages.find(l => l.name === language);
        if (languageInfo && languageInfo.boilerplateCode) {
          setCode(languageInfo.boilerplateCode);
        } else if (LANGUAGES[language]) {
          setCode(LANGUAGES[language].defaultCode);
        }
      } else if (LANGUAGES[language]) {
        setCode(LANGUAGES[language].defaultCode);
      }
    } else {
      // If language changes and there's already code, check if we should load from current submission
      const mostRecentSubmission = submissions && submissions.length > 0 ? 
        submissions.find(sub => sub.language === language) : null;
      
      if (mostRecentSubmission && mostRecentSubmission.code) {
        setCode(mostRecentSubmission.code);
      } else if (question && question.languages) {
        const languageInfo = question.languages.find(l => l.name === language);
        if (languageInfo && languageInfo.boilerplateCode) {
          setCode(languageInfo.boilerplateCode);
        } else if (LANGUAGES[language]) {
          setCode(LANGUAGES[language].defaultCode);
        }
      }
    }
  }, [language, question, submissions]);
  
  // Fetch question details
  const fetchQuestionDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiUrl}/cohorts/${cohortId}/modules/${moduleId}/questions/${questionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Question data:", response.data);
      
      // Get the question data object
      const questionData = response.data;
      
      // Handle submissions - ensure it's an array
      if (questionData.submissions && Array.isArray(questionData.submissions)) {
        setSubmissions(questionData.submissions);
        
        // Get most recent submission for the current language if available
        const mostRecentSubmission = questionData.submissions[0]; // Submissions are sorted by date DESC
        if (mostRecentSubmission && mostRecentSubmission.code) {
          // Save user's submitted code to use instead of boilerplate
          setCode(mostRecentSubmission.code);
          setLanguage(mostRecentSubmission.language);
        }
      }
      
      // Set the question object with all data
      setQuestion(questionData);
      
      // Set default language
      if (questionData.defaultLanguage) {
        setLanguage(questionData.defaultLanguage);
      }
      
    } catch (error) {
      console.error('Error fetching question details:', error);
      toast.error('Failed to fetch question details');
      navigate(`/cohorts/${cohortId}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a new function to fetch all users' submissions
  const fetchAllSubmissions = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/cohorts/${cohortId}/modules/${moduleId}/questions/${questionId}/all-submissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setAllUsersSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching all submissions:', error);
      // Don't show an error toast as this is not critical
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle language change
  const handleLanguageClick = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageAnchorEl(null);
  };

  const selectLanguage = (lang) => {
    setLanguage(lang);
    handleLanguageMenuClose();
  };
  
  // Enhanced function to run against test cases
  const runTestCases = async (submitSolution = false) => {
    if (!question || !question.testCases || question.testCases.length === 0) {
      toast.error('No test cases available for this question');
      return null;
    }
    
    setRunning(true);
    
    try {
      const languageInfo = question.languages.find(l => l.name === language) || LANGUAGES[language];
      const version = languageInfo.version || '0';
      
      // Get all test cases, or just the visible ones if not submitting
      const testCasesToRun = submitSolution 
        ? question.testCases 
        : question.testCases.filter(tc => !tc.hidden);
      
      if (testCasesToRun.length === 0) {
        toast.info('No visible test cases to run');
        setRunning(false);
        return null;
      }
      
      console.log(`Running ${testCasesToRun.length} test cases for ${language} code...`);
      const results = [];
      
      // Run each test case
      for (const testCase of testCasesToRun) {
        console.log(`Executing test case: ${testCase._id}`);
        
        try {
          // UPDATED: Instead of using the backend endpoint, use compilerService directly
          const executionResponse = await compilerService.executeCode(
            language, 
            version,
            code,
            testCase.input
          );
          
          console.log(`Execution result for test case ${testCase._id}:`, executionResponse);
          
          // Handle compilation errors specifically
          if (executionResponse.compile && executionResponse.compile.stderr) {
            results.push({
              testCaseId: testCase._id,
              passed: false,
              executionTime: 0,
              memoryUsed: 0,
              actualOutput: '',
              expectedOutput: testCase.output,
              input: testCase.input,
              hidden: testCase.hidden,
              explanation: testCase.explanation,
              error: `Compilation error: ${executionResponse.compile.stderr}`
            });
            
            // If there's a compilation error, just run one test case
            break;
          }
          
          // Extract metrics from the response
          const execution = executionResponse.run || {};
          const executionTime = execution.time ? execution.time * 1000 : 0; // convert to ms
          const memoryUsed = execution.memory || 0;
          
          // Get actual output and expected output for comparison
          const actualOutput = (execution.stdout || '').trim();
          const expectedOutput = testCase.output.trim();
          
          // Check if the output matches the expected output
          const passed = actualOutput === expectedOutput && !execution.stderr && execution.code === 0;
          
          results.push({
            testCaseId: testCase._id,
            passed,
            executionTime,
            memoryUsed,
            actualOutput,
            expectedOutput,
            input: testCase.input,
            hidden: testCase.hidden,
            explanation: testCase.explanation,
            error: execution.stderr || ''
          });
        } catch (error) {
          console.error(`Error executing test case ${testCase._id}:`, error);
          results.push({
            testCaseId: testCase._id,
            passed: false,
            executionTime: 0,
            memoryUsed: 0,
            actualOutput: '',
            expectedOutput: testCase.output,
            input: testCase.input,
            hidden: testCase.hidden,
            explanation: testCase.explanation,
            error: error.message || 'Execution failed'
          });
        }
      }
      
      // Calculate results
      const allPassed = results.every(r => r.passed);
      
      setTestResults(results);
      
      return {
        results,
        allPassed
      };
    } catch (error) {
      console.error('Error running test cases:', error);
      toast.error(`Error: ${error.message || 'Failed to execute code'}`);
      return null;
    } finally {
      setRunning(false);
    }
  };

  // Handle selecting an MCQ option
  const handleSelectMcqOption = (optionId) => {
    setSelectedMcqOption(optionId);
    setMcqSubmissionResult(null); // Clear previous result when selecting a new option
  };

  // Submit MCQ answer
  const handleSubmitMcqAnswer = async () => {
    if (!selectedMcqOption) {
      toast.error('Please select an option before submitting');
      return;
    }
    
    setSubmitting(true);
    try {
      // Prepare submission data
      const submissionData = {
        selectedOption: selectedMcqOption,
        submissionType: 'mcq',
        isCorrect: null // Let server determine if correct
      };
      
      console.log('Submitting MCQ answer with data:', submissionData);
      
      // Submit to server
      const response = await axios.post(
        `${apiUrl}/cohorts/${cohortId}/modules/${moduleId}/questions/${questionId}/submit`,
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('MCQ Submission response:', response.data);
      
      // Extract the submission from response data
      const submission = response.data.submission;
      
      // Make sure we're using the correct isCorrect value from the submission
      // and ensure it's a boolean, not an object
      const isCorrect = typeof submission.isCorrect === 'boolean' ? submission.isCorrect : false;
      const submissionStatus = typeof submission.status === 'string' ? submission.status : 'pending'; 
      
      console.log('MCQ submission isCorrect:', isCorrect);
      console.log('MCQ submission status:', submissionStatus);
      console.log('Module progress after submission:', response.data.userProgress?.moduleProgress);
      console.log('Question progress after submission:', response.data.userProgress?.questionProgress);
      console.log('Total score after submission:', response.data.userProgress?.totalScore);
      
      // Save the result with the correct isCorrect value and status as primitives
      setMcqSubmissionResult({
        ...response.data,
        isCorrect: isCorrect,
        status: submissionStatus
      });
      
      // Show toast for the result
      if (isCorrect) {
        toast.success('Correct answer!');
      } else {
        toast.error('Incorrect answer. Try again!');
      }
      
      // Always refresh data regardless of correctness
      fetchQuestionDetails();
      fetchAllSubmissions();
    } catch (error) {
      console.error('Error submitting MCQ answer:', error);
      
      // Add more detailed error logging
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      
      toast.error('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render MCQ options
  const renderMcqOptions = () => {
    if (!question || !question.options || question.type !== 'mcq') return null;
    
    // Check if user has a correct submission already
    const hasCorrectSubmission = submissions && submissions.some(sub => sub.isCorrect === true);
    
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2, 
          width: '100%', 
          maxWidth: '800px',
          mx: 'auto',
          mt: 4,
          px: 2
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Select the correct option:
        </Typography>
        
        {question.options.map((option, index) => {
          const isSelected = selectedMcqOption === option._id;
          let bgColor = undefined;
          let borderColor = isSelected ? theme.palette.primary.main : (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)');
          
          // Add visual feedback based on submission result
          if (mcqSubmissionResult && selectedMcqOption === option._id) {
            // Get isCorrect and status from mcqSubmissionResult
            const isCorrect = !!mcqSubmissionResult.isCorrect;
            const status = typeof mcqSubmissionResult.status === 'string' ? 
              mcqSubmissionResult.status : 
              (isCorrect ? 'accepted' : 'wrong_answer');
            
            console.log(`Option ${option.text} selected, isCorrect: ${isCorrect}, status: ${status}`);
            
            // Use status for visual feedback
            if (status === 'accepted') {
              borderColor = theme.palette.success.main;
              bgColor = alpha(theme.palette.success.main, 0.1);
            } else if (status === 'pending') {
              borderColor = theme.palette.warning.main;
              bgColor = alpha(theme.palette.warning.main, 0.1);
            } else {
              borderColor = theme.palette.error.main;
              bgColor = alpha(theme.palette.error.main, 0.1);
            }
          }
          
          // If there's a previous correct submission, highlight that option
          if (hasCorrectSubmission && submissions) {
            // Find the correct submission
            const correctSub = submissions.find(sub => sub.isCorrect === true);
            if (correctSub && correctSub.selectedOption === option._id) {
              borderColor = theme.palette.success.main;
              bgColor = alpha(theme.palette.success.main, 0.1);
            }
          }
          
          return (
            <Button
              key={option._id || index}
              variant={isSelected ? "contained" : "outlined"}
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                p: 2,
                borderRadius: '8px',
                borderWidth: 2,
                borderColor: borderColor,
                backgroundColor: bgColor,
                '&:hover': {
                  borderColor: isSelected ? 
                    borderColor : 
                    (darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'),
                  backgroundColor: isSelected && bgColor ? 
                    alpha(bgColor, 1.5) : // slightly intensify the existing color
                    (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                },
                position: 'relative'
              }}
              onClick={() => handleSelectMcqOption(option._id)}
              disabled={submitting}
            >
              <Typography variant="body1" sx={{ fontSize: '1rem' }}>
                {String.fromCharCode(65 + index)}. {option.text || ''}
              </Typography>
              
              {/* Show appropriate icon based on submission status */}
              {mcqSubmissionResult && selectedMcqOption === option._id && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    right: 16,
                    display: 'flex',
                    alignItems: 'center',
                    color: mcqSubmissionResult.status === 'accepted' ? 
                      theme.palette.success.main : 
                      mcqSubmissionResult.status === 'pending' ?
                        theme.palette.warning.main :
                        theme.palette.error.main
                  }}
                >
                  {mcqSubmissionResult.status === 'accepted' ? 
                    <CheckCircleIcon /> : 
                    mcqSubmissionResult.status === 'pending' ?
                      <HistoryIcon /> :
                      <CloseIcon />
                  }
                </Box>
              )}
              
              {/* Show check mark for previously correct answer */}
              {hasCorrectSubmission && submissions && 
                submissions.find(sub => sub.isCorrect === true)?.selectedOption === option._id && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    right: 16,
                    display: 'flex',
                    alignItems: 'center',
                    color: theme.palette.success.main
                  }}
                >
                  <CheckCircleIcon />
                </Box>
              )}
            </Button>
          );
        })}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          {/* Always show Submit button */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSubmitMcqAnswer}
            disabled={!selectedMcqOption || submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{ 
              height: 36, 
              textTransform: 'none',
              borderRadius: '4px',
              px: 2,
              backgroundColor: '#2e7d32',
              '&:hover': {
                backgroundColor: '#1b5e20'
              }
            }}
          >
            Submit Answer
          </Button>
        </Box>
      </Box>
    );
  };

  // Update the handleRunCode function
  const handleRunCode = async () => {
    setRunning(true);
    setOutput('');
    setTestResults([]);
    
    try {
      // Get visible test cases only (hide hidden test cases during normal run)
      const visibleTestCases = question.testCases ? question.testCases.filter(tc => !tc.hidden) : [];
      
      if (!visibleTestCases || visibleTestCases.length === 0) {
        toast.info('No test cases available to run');
        return;
      }
      
      console.log(`Running ${visibleTestCases.length} test cases...`);
      
      // Use the simplified compilerService to run test cases
      const results = await compilerService.runTestCases(
        language,
        null, // version (null means use default)
        code,
        visibleTestCases
      );
      
      console.log('Test case results:', results);
      
      // Make sure results is an array before we use it
      const safeResults = Array.isArray(results) ? results : [];
      setTestResults(safeResults);
      
      // Show success/failure toast
      const passedTests = safeResults.filter(r => r.passed === true).length;
      if (passedTests === safeResults.length && safeResults.length > 0) {
        toast.success(`✅ All ${safeResults.length} test cases passed!`);
      } else if (safeResults.length > 0) {
        toast.warn(`${passedTests}/${safeResults.length} test cases passed`);
      } else {
        toast.warn('No test results to display');
      }
    } catch (error) {
      console.error('Error running test cases:', error);
      toast.error('Failed to execute code: ' + (error.message || 'Unknown error'));
    } finally {
      setRunning(false);
    }
  };

  // Now also fix the testResults structure in the handleSubmitSolution function
  const handleSubmitSolution = async () => {
    if (question.type === 'mcq') {
      await handleSubmitMcqAnswer();
    } else if (question.type === 'programming') {
      setSubmitting(true);
      
      try {
        // Run the code against all test cases (including hidden ones)
        const results = await compilerService.runTestCases(
          language,
          null, // Use default version
          code,
          question.testCases
        );
        
        // Ensure results is an array before setting it
        setTestResults(Array.isArray(results) ? results : []);
        
        // Check if all tests passed
        const allPassed = Array.isArray(results) && results.every(r => r.passed === true);
        
        // Submit to backend for recording in database
        const submission = {
          code,
          language,
          submissionType: 'programming',
          testCaseResults: Array.isArray(results) ? results.map(r => ({
            testCaseId: r.testCaseId,
            passed: !!r.passed,
            executionTime: typeof r.executionTime === 'number' ? r.executionTime : 0,
            memoryUsed: typeof r.memoryUsed === 'number' ? r.memoryUsed : 0,
            output: typeof r.actualOutput === 'string' ? r.actualOutput : '',
            error: typeof r.error === 'string' ? r.error : ''
          })) : [],
          status: allPassed ? 'accepted' : 'wrong_answer',
          isCorrect: allPassed,
        };
        
        console.log('Submitting solution:', submission);
        
        // Submit to backend
        const response = await axios.post(
          `${apiUrl}/cohorts/${cohortId}/modules/${moduleId}/questions/${questionId}/submit`,
          submission,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Submission response:', response.data);
        
        // Show success/failure toast
        if (allPassed) {
          toast.success('Solution accepted! All test cases passed.');
        } else {
          toast.warn('Some test cases failed. Your solution was not accepted.');
        }
        
        // Refresh submissions
        fetchQuestionDetails();
        fetchAllSubmissions();
      } catch (error) {
        console.error('Error submitting solution:', error);
        toast.error('Failed to submit solution: ' + (error.message || 'Unknown error'));
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Render test results UI with improved metrics display - using the one from TestCasesPanel
  const renderTestResults = () => {
    if (!testResults) {
      return null;
    }

    // Make sure we format the test results in a way that TestCasesPanel expects
    // Here we map our internal test results format to what TestCasesPanel component expects
    let formattedTestResults = [];
    
    // Check if testResults is an array or has a results property that's an array
    if (Array.isArray(testResults)) {
      formattedTestResults = testResults.map(result => ({
        passed: !!result.passed,
        actualOutput: typeof result.actualOutput === 'string' ? result.actualOutput : '',
        expectedOutput: typeof result.expectedOutput === 'string' ? result.expectedOutput : '',
        executionTime: typeof result.executionTime === 'number' ? result.executionTime : 0,
        memoryUsed: typeof result.memoryUsed === 'number' ? result.memoryUsed : 0,
        error: typeof result.error === 'string' ? result.error : '',
        hidden: !!result.hidden,
        input: typeof result.input === 'string' ? result.input : '',
        explanation: typeof result.explanation === 'string' ? result.explanation : '',
        testCaseId: result.testCaseId || ''
      }));
    } else if (testResults.results && Array.isArray(testResults.results)) {
      formattedTestResults = testResults.results.map(result => ({
        passed: !!result.passed,
        actualOutput: typeof result.actualOutput === 'string' ? result.actualOutput : '',
        expectedOutput: typeof result.expectedOutput === 'string' ? result.expectedOutput : '',
        executionTime: typeof result.executionTime === 'number' ? result.executionTime : 0,
        memoryUsed: typeof result.memoryUsed === 'number' ? result.memoryUsed : 0,
        error: typeof result.error === 'string' ? result.error : '',
        hidden: !!result.hidden,
        input: typeof result.input === 'string' ? result.input : '',
        explanation: typeof result.explanation === 'string' ? result.explanation : '',
        testCaseId: result.testCaseId || ''
      }));
    }

    if (formattedTestResults.length === 0) {
      return null;
    }

    return (
      <TestCasesPanel
        question={question}
        testResults={formattedTestResults}
        darkMode={darkMode}
        testCasesPanelHeight={testCasesPanelHeight}
        testPanelResizerRef={testPanelResizerRef}
        startTestPanelResize={startTestPanelResize}
        isResizingTestPanel={isResizingTestPanel}
      />
    );
  };

  // Navigate back to cohort page
  const handleBack = () => {
    navigate(`/cohorts/${cohortId}`);
  };
  
  // Add drag handling functions
  const startResize = (e) => {
    setIsResizing(true);
    setResizeStartX(e.clientX);
  };

  const stopResize = () => {
    setIsResizing(false);
  };

  const resize = (e) => {
    if (!isResizing) return;
    
    const containerWidth = document.body.clientWidth;
    const delta = e.clientX - resizeStartX;
    const deltaPercent = (delta / containerWidth) * 100;
    
    const newLeftWidth = Math.min(Math.max(20, leftPanelWidth + deltaPercent), 80);
    setLeftPanelWidth(newLeftWidth);
    setResizeStartX(e.clientX);
  };

  // Add drag handling functions for test panel height
  const startTestPanelResize = (e) => {
    setIsResizingTestPanel(true);
    setResizeStartY(e.clientY);
  };

  const stopTestPanelResize = () => {
    setIsResizingTestPanel(false);
  };

  const resizeTestPanel = (e) => {
    if (!isResizingTestPanel) return;
    
    const containerHeight = document.body.clientHeight - 48; // Accounting for header
    const delta = resizeStartY - e.clientY;
    const deltaPercent = (delta / containerHeight) * 100;
    
    // Increase panel height when dragging up, decrease when dragging down
    // Ensure we have enough space for tabs (min 20%)
    const newHeight = Math.min(Math.max(20, testCasesPanelHeight + deltaPercent), 70);
    setTestCasesPanelHeight(newHeight);
    setResizeStartY(e.clientY);
  };

  // Add event listeners for mouse movements (for both resizers)
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
    }
    
    if (isResizingTestPanel) {
      document.addEventListener('mousemove', resizeTestPanel);
      document.addEventListener('mouseup', stopTestPanelResize);
    }
    
    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      document.removeEventListener('mousemove', resizeTestPanel);
      document.removeEventListener('mouseup', stopTestPanelResize);
    };
  }, [isResizing, resize, stopResize, leftPanelWidth, resizeStartX, 
      isResizingTestPanel, resizeTestPanel, stopTestPanelResize, testCasesPanelHeight, resizeStartY]);

  // Add a quick collapse/expand function
  const togglePanelSize = () => {
    if (leftPanelWidth > 25) {
      // If panel is expanded, collapse it
      setLeftPanelWidth(15);
    } else {
      // If panel is collapsed, expand it
      setLeftPanelWidth(50);
    }
  };

  // Add a double-click handler for the left panel resizer
  const handleLeftResizerDoubleClick = () => {
    togglePanelSize();
  };
  
  // Check language display and dropdown based on question type
  const renderLanguageSelector = () => {
    if (!question) return null;
    
    // For MCQ questions, don't show language selector
    if (question.type === 'mcq') {
      return (
        <Button 
          variant="outlined"
          size="small"
          disabled={true}
          sx={{
            height: 36,
            borderRadius: '4px',
            color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            textTransform: 'none',
            px: 2,
            backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
          }}
        >
          MCQ Question
        </Button>
      );
    }
    
    return (
      <>
        <Button 
          variant="outlined"
          size="small"
          endIcon={<KeyboardArrowDownIcon />}
          sx={{
            height: 36,
            borderRadius: '4px',
            color: darkMode ? '#fff' : '#000',
            borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
            textTransform: 'none',
            px: 2,
            backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
            }
          }}
          onClick={handleLanguageClick}
        >
          {language?.toUpperCase() || 'CPP'}
        </Button>
        
        <Menu
          anchorEl={languageAnchorEl}
          open={Boolean(languageAnchorEl)}
          onClose={handleLanguageMenuClose}
        >
          {Object.keys(LANGUAGES).map((lang) => (
            <MenuItem 
              key={lang} 
              onClick={() => selectLanguage(lang)}
              selected={language === lang}
            >
              {LANGUAGES[lang].name}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  };
  
  const handleFormatCode = () => {
    // TODO: Implement code formatting
    toast.info('Code formatting not implemented yet');
  };

  return (
    <Box sx={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      zIndex: 1200,
      m: 0,
      p: 0,
      bgcolor: darkMode ? '#0e1117' : '#f5f7fa',
      display: 'flex',
    }}>
      {/* Add Sidebar Navigation */}
      <SidebarNavigation darkMode={darkMode} />
      
      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        height: '100%',
        ml: '60px', // Updated from 90px to match the new sidebar width
        width: 'calc(100% - 80px)', // Updated from 90px to match the new sidebar width
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Navigation Bar */}
        <Box sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          bgcolor: darkMode ? '#1A1A1A' : '#FFFFFF',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 0.5,
          backgroundImage: darkMode ? 
            'linear-gradient(to right, rgba(12, 13, 16, 0.7), rgba(8, 9, 12, 0.7))' :
            'linear-gradient(to right, rgba(248, 250, 252, 0.9), rgba(255, 255, 255, 0.9))'
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ 
              '& .MuiTab-root': { 
                minWidth: 'auto', 
                px: 2,
                fontSize: '0.875rem',
                textTransform: 'none',
                fontWeight: 'medium',
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                minHeight: '48px'
              },
              '& .Mui-selected': {
                color: darkMode ? '#fff' : theme.palette.primary.main,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: darkMode ? '#fff' : theme.palette.primary.main,
                height: 2
              }
            }}
          >
            <Tab 
              icon={<CodeIcon sx={{ fontSize: 16, mr: 1 }} />} 
              label="Problem" 
              iconPosition="start" 
              sx={{ 
                borderBottom: activeTab === 0 ? 
                  `2px solid ${darkMode ? '#fff' : theme.palette.primary.main}` : 
                  'none'
              }}
            />
            <Tab label="Editorial" />
            <Tab label="Submissions" />
            <Tab 
              icon={<ReportProblemIcon sx={{ fontSize: 16, mr: 1 }} />}
              label="Report" 
              iconPosition="start"
            />
            <Tab label="Notes" />
          </Tabs>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Removed language selector */}
            
            {/* Add Run and Submit buttons to top navigation - only for programming questions */}
            {question?.type === 'programming' && (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={handleRunCode}
                  disabled={running || submitting}
                  startIcon={<PlayArrowIcon />}
                  sx={{ 
                    height: 36, 
                    textTransform: 'none',
                    borderRadius: '4px',
                    px: 2,
                    bgcolor: darkMode ? 'rgba(0, 136, 204, 0.05)' : 'rgba(0, 136, 204, 0.02)'
                  }}
                >
                  {running ? 'Running...' : 'Run Code'}
                </Button>
                
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSubmitSolution}
                  disabled={running || submitting}
                  sx={{ 
                    height: 36, 
                    textTransform: 'none',
                    borderRadius: '4px',
                    px: 2,
                    backgroundColor: '#01780F',
                    '&:hover': {
                      backgroundColor: '#015c0c'
                    }
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </>
            )}
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexGrow: 1, 
            overflow: 'hidden', 
            height: 'calc(100vh - 48px)',
            width: '100%',
            m: 0,
            p: 0
          }}>
          {question && (
              <>
              {/* Problem Description Panel */}
                <Box sx={{ 
                  width: `${leftPanelWidth}%`, 
                  height: '100%',
                  borderRight: '1px solid',
                  borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  overflow: 'auto',
                  bgcolor: darkMode ? '#0a0c10' : '#FFFFFF',
                  p: 0,
                  m: 0,
                  transition: isResizing ? 'none' : 'width 0.1s ease',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                    border: '2px solid',
                    borderColor: darkMode ? '#0a0b0f' : '#ffffff',
                  }
                }}>
                  {/* Problem Title and Difficulty */}
                  <Box sx={{ 
                    p: 2, 
                    borderBottom: '1px solid', 
                    borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 'bold',
                        color: darkMode ? '#fff' : '#000'
                      }}>
                        {question.title}
                      </Typography>
                    </Box>
                    
                    {/* Statistics bar similar to the image */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 3,
                      mt: 1.5,
                      color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                      fontSize: '0.75rem'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography component="span" sx={{ fontWeight: 'medium', fontSize: '0.75rem', color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>
                          Difficulty:
                        </Typography>
                        <Typography component="span" sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '0.75rem',
                          color: 
                            question.difficultyLevel === 'easy' ? '#4caf50' : 
                            question.difficultyLevel === 'medium' ? '#ff9800' : '#f44336' 
                        }}>
                          {question.difficultyLevel ? (question.difficultyLevel.charAt(0).toUpperCase() + question.difficultyLevel.slice(1)) : 'Medium'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography component="span" sx={{ fontWeight: 'medium', fontSize: '0.75rem', color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>
                          Accuracy:
                        </Typography>
                        <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                          {question.stats && typeof question.stats.acceptanceRate === 'number' 
                            ? question.stats.acceptanceRate 
                            : '35.0'}%
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography component="span" sx={{ fontWeight: 'medium', fontSize: '0.75rem', color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>
                          Submissions:
                        </Typography>
                        <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                          {question.stats && typeof question.stats.totalSubmissions === 'number' 
                            ? question.stats.totalSubmissions 
                            : '324K+'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography component="span" sx={{ fontWeight: 'medium', fontSize: '0.75rem', color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>
                          Points:
                        </Typography>
                        <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                          {typeof question.marks === 'number' ? question.marks : '4'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Problem Description - removed company and tag chips */}
                  <Box sx={{ p: 2 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                        lineHeight: 1.6,
                        fontSize: '0.85rem',
                        mb: 3
                      }} 
                      dangerouslySetInnerHTML={{ __html: question.description }} 
                    />
                    
                    {/* Examples Section */}
                      {question.examples && question.examples.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ 
                          fontWeight: 600, 
                          fontSize: '1.1rem',
                          color: darkMode ? '#fff' : '#000'
                        }}>
                          Examples:
                          </Typography>
                          {question.examples.map((example, index) => (
                          <Box 
                            key={index} 
                            sx={{ 
                              mb: 2, 
                              p: 2, 
                              bgcolor: darkMode ? '#121620' : '#F5F7FA',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                            }}
                          >
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                mb: 1, 
                                fontWeight: 600, 
                                color: darkMode ? '#fff' : '#000'
                              }}
                            >
                              Example {index + 1}:
                            </Typography>
                              <Box sx={{ pl: 2 }}>
                              <Typography variant="body2" sx={{ 
                                fontFamily: 'monospace', 
                                mb: 1,
                                color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'
                              }}>
                                  <strong>Input:</strong> {example.input}
                                </Typography>
                              <Typography variant="body2" sx={{ 
                                fontFamily: 'monospace', 
                                mb: 1,
                                color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'
                              }}>
                                  <strong>Output:</strong> {example.output}
                                </Typography>
                                {example.explanation && (
                                <Typography variant="body2" sx={{ color: darkMode ? '#E0E0E0' : '#616161' }}>
                                    <strong>Explanation:</strong> {example.explanation}
                                  </Typography>
                                )}
                              </Box>
                          </Box>
                          ))}
                        </Box>
                      )}
                      
                    {/* Hints section */}
                    {question.hints && question.hints.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 2,
                          color: darkMode ? '#fff' : '#000',
                          fontWeight: 600,
                          fontSize: '1.1rem'
                        }}>
                          <LightbulbOutlinedIcon sx={{ mr: 1, color: '#FFD700' }} />
                          Hints:
                        </Typography>
                        
                          {question.hints.map((hint, index) => (
                          <Accordion 
                            key={index}
                            sx={{
                              mb: 1,
                              bgcolor: darkMode ? 'rgba(255, 215, 0, 0.05)' : 'rgba(255, 215, 0, 0.1)',
                              border: '0px solid',
                              borderColor: '#FFD700',
                              borderRadius: '4px',
                              '&:before': {
                                display: 'none',
                              },
                              '& .MuiAccordionSummary-root': {
                                minHeight: '48px',
                                '&.Mui-expanded': {
                                  minHeight: '48px',
                                }
                              }
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon sx={{ color: '#FFD700' }} />}
                              sx={{
                                flexDirection: 'row',
                                '& .MuiAccordionSummary-content': {
                                  margin: '12px 0',
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LightbulbIcon sx={{ mr: 1, color: '#FFD700', fontSize: '1.1rem' }} />
                                <Typography sx={{ 
                                  fontWeight: 'medium',
                                  color: darkMode ? '#FFD700' : '#B8860B',
                                }}>
                                  Hint {index + 1}
                                </Typography>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ 
                              pt: 0, 
                              pb: 2,
                              px: 3,
                            }}>
                              <Typography sx={{ 
                                color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                              }}>
                                {hint}
                              </Typography>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Box>
                    )}
                    
                    {/* Tags and Companies Dropdown */}
                    <Box sx={{ mb: 3 }}>
                      {/* Topics Dropdown - Heading */}
                      
                      
                      {/* Topics Accordion */}
                      <Accordion 
                        sx={{
                          mb: 1,
                          bgcolor: darkMode ? 'rgba(0, 136, 204, 0.05)' : 'rgba(0, 136, 204, 0.1)',
                          border: '0px solid',
                          borderColor: '#0088CC',
                          borderRadius: '4px',
                          '&:before': {
                            display: 'none',
                          },
                          '& .MuiAccordionSummary-root': {
                            minHeight: '48px',
                            '&.Mui-expanded': {
                              minHeight: '48px',
                            }
                          }
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon sx={{ color: '#0088CC' }} />}
                          sx={{
                            flexDirection: 'row',
                            '& .MuiAccordionSummary-content': {
                              margin: '12px 0',
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CategoryIcon sx={{ mr: 1, color: '#0088CC', fontSize: '1.1rem' }} />
                            <Typography sx={{ 
                              fontWeight: 'medium',
                              color: darkMode ? '#0088CC' : '#0077b6',
                            }}>
                              Topics
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0, pb: 2, px: 3 }}>
                          {/* Topic Tags */}
                          {question.tags && question.tags.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
                              {question.tags.map((tag, index) => (
                                <Chip 
                                  key={index}
                                  label={tag}
                                  size="small"
                                  sx={{ 
                                    height: '24px',
                                    fontSize: '0.75rem',
                                    bgcolor: darkMode ? 'rgba(0, 136, 204, 0.1)' : 'rgba(0, 136, 204, 0.05)',
                                    color: darkMode ? '#0088CC' : '#0077b6',
                                    border: '1px solid',
                                    borderColor: darkMode ? 'rgba(0, 136, 204, 0.2)' : 'rgba(0, 136, 204, 0.2)',
                                    mb: 0.5,
                                  }}
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                              No topics available for this question.
                            </Typography>
                          )}
                        </AccordionDetails>
                      </Accordion>
                      
                      
                      
                      {/* Companies Dropdown */}
                      <Accordion
                        sx={{
                          mb: 1,
                          bgcolor: darkMode ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.1)',
                          border: '0px solid',
                          borderColor: '#8b5cf6',
                          borderRadius: '4px',
                          '&:before': {
                            display: 'none',
                          },
                          '& .MuiAccordionSummary-root': {
                            minHeight: '48px',
                            '&.Mui-expanded': {
                              minHeight: '48px',
                            }
                          }
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon sx={{ color: '#8b5cf6' }} />}
                          sx={{
                            flexDirection: 'row',
                            '& .MuiAccordionSummary-content': {
                              margin: '12px 0',
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BusinessIcon sx={{ mr: 1, color: '#8b5cf6', fontSize: '1.1rem' }} />
                            <Typography sx={{ 
                              fontWeight: 'medium',
                              color: darkMode ? '#8b5cf6' : '#7c3aed',
                            }}>
                              Companies
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0, pb: 2, px: 3 }}>
                          {/* Company Tags */}
                          {question.companies && question.companies.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
                              {question.companies.map((company, index) => (
                                <Chip 
                                  key={index}
                                  label={company}
                                  size="small"
                                  sx={{ 
                                    height: '24px',
                                    fontSize: '0.75rem',
                                    bgcolor: darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                                    color: darkMode ? '#8b5cf6' : '#7c3aed',
                                    border: '1px solid',
                                    borderColor: darkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                                    mb: 0.5,
                                  }}
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                              No company tags available for this question.
                            </Typography>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                </Box>
          </Box>
                
                {/* Resizer */}
                <Box
                  ref={resizerRef}
                  sx={{
                    width: '6px',
                    height: '100%',
                    bgcolor: darkMode ? '#1A1A1A' : '#f0f2f5',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'col-resize',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    zIndex: 10,
                    '&:hover': {
                      bgcolor: darkMode ? '#252525' : '#e0e0e0',
                    }
                  }}
                  onMouseDown={startResize}
                  onDoubleClick={handleLeftResizerDoubleClick}
                />
              
                {/* Code Editor Panel */}
                <Box sx={{ 
                  flexGrow: 1, 
                  width: `${100 - leftPanelWidth}%`,
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  bgcolor: darkMode ? '#0a0c10' : '#FAFAFA',
                  overflow: 'hidden',
                  m: 0,
                  p: 0,
                  transition: isResizing ? 'none' : 'width 0.1s ease'
                }}>
                <TabPanel value={activeTab} index={0}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      height: '100%', 
                      overflow: 'hidden',
                      m: 0,
                      p: 0,
                      "& > *": { mb: 0 }  // Ensure no margin between child components
                    }}>
                      {question?.type === 'mcq' ? (
                        // Render MCQ options
                        renderMcqOptions()
                      ) : (
                        // Render programming editor
                        <>
                          <CodeEditorPanel
                            code={code}
                            language={language}
                            darkMode={darkMode}
                            onChange={setCode}
                            testCasesPanelHeight={testCasesPanelHeight}
                            LANGUAGES={LANGUAGES}
                            onLanguageChange={selectLanguage}
                          />
                          
                          {question && question.testCases && question.testCases.length > 0 && (
                            <TestCasesPanel
                              question={question}
                              testResults={testResults}
                              darkMode={darkMode}
                              formatTime={formatTime}
                              formatMemory={formatMemory}
                              testCasesPanelHeight={testCasesPanelHeight}
                              testPanelResizerRef={testPanelResizerRef}
                              startTestPanelResize={startTestPanelResize}
                              isResizingTestPanel={isResizingTestPanel}
                            />
                          )}
                        </>
                      )}
                    </Box>
                  </TabPanel>
                  
                  {/* Other tab panels */}
                <TabPanel value={activeTab} index={1}>
                    <Box sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Typography variant="body1" color="textSecondary">
                        Editorial content will be available here
                    </Typography>
                    </Box>
                  </TabPanel>
                  
                  <TabPanel value={activeTab} index={2}>
                    <SubmissionsPanel 
                      submissions={submissions}
                      allUsersSubmissions={allUsersSubmissions}
                      darkMode={darkMode}
                      formatTime={formatTime}
                      formatMemory={formatMemory}
                    />
                  </TabPanel>
                  
                  <TabPanel value={activeTab} index={3}>
                    <QuestionReport 
                      cohortId={cohortId}
                      moduleId={moduleId}
                      questionId={questionId}
                      darkMode={darkMode}
                    />
                  </TabPanel>
                  
                  <TabPanel value={activeTab} index={4}>
                    <Box sx={{ p: 3, height: '100%' }}>
                    <Notes 
                      cohortId={cohortId}
                      moduleId={moduleId}
                      questionId={questionId}
                    />
                    </Box>
                  </TabPanel>
                </Box>
              </>
          )}
        </Box>
      )}
      </Box>
    </Box>
  );
};

const CohortProblemComponent = CohortProblem;
export default CohortProblemComponent;

