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
  AccordionDetails,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  FormHelperText,
  Radio
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
import compilerApi from '../../utils/compilerApi';
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
    
    // Check for saved state from previous submission
    const savedState = sessionStorage.getItem('cohortProblem_state');
    const submissionSuccess = sessionStorage.getItem('submission_success_flag');
    
    if (savedState && submissionSuccess && savedState !== 'undefined') {
      try {
        const parsedState = JSON.parse(savedState);
        
        // Verify this is the same question/cohort/module
        if (parsedState.questionId === questionId && 
            parsedState.cohortId === cohortId && 
            parsedState.moduleId === moduleId) {
          
          // Restore code and language
          if (parsedState.code) {
            setCode(parsedState.code);
          }
          
          if (parsedState.language) {
            setLanguage(parsedState.language);
          }
          
          // Restore test results
          if (parsedState.testResults) {
            setTestResults(parsedState.testResults);
          }
          
          // Add the new submission to the submissions array
          if (parsedState.submission) {
            setSubmissions(prev => {
              // Check if submission already exists to avoid duplicates
              if (!prev.some(s => s._id === parsedState.submission._id)) {
                return [parsedState.submission, ...prev];
              }
              return prev;
            });
          }
          
          // Show success message
          if (parsedState.allPassed) {
            toast.success('Submission saved successfully! All test cases passed.', {
              autoClose: 3000,
              delay: 1000 // Slight delay to ensure it appears after page load
            });
          } else {
            toast.warn('Submission saved, but some test cases failed.', {
              autoClose: 3000,
              delay: 1000
            });
          }
        }
      } catch (error) {
        console.error('Error restoring submission state:', error);
      }
    }
    
    // Clear the success flag but keep the state for potential future use
    sessionStorage.removeItem('submission_success_flag');
  }, [cohortId, moduleId, questionId, token, setCode, setLanguage, setTestResults, setSubmissions]);
  
  // Update code when language changes
  useEffect(() => {
    if (!code || code === '') {
      // Only set default code if there's no code already (from previous submission)
      if (question && question.languages) {
        const languageInfo = question.languages.find(l => l.name === language);
        if (languageInfo && languageInfo.boilerplateCode) {
          const initialCode = languageInfo.boilerplateCode;
          // If it's Java, extract only the Solution class to display
          if (language === 'java') {
            setCode(initialCode);
          } else {
            setCode(initialCode);
          }
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
        const submissionCode = mostRecentSubmission.code;
        setCode(submissionCode);
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
  
  // Function to insert runtime calculation code in place of comment markers
  const insertRuntimeCalculationCode = (sourceCode) => {
    // Different implementations based on language
    if (language === 'java') {
      // Capture the indentation of the markers
      const startMarkerMatch = sourceCode.match(/([ \t]*)\/\*RUNTIME CALC START\*\//);
      const endMarkerMatch = sourceCode.match(/([ \t]*)\/\*RUNTIME CALC END\*\//);
      
      // Get indentation or default to empty string if not found
      const startIndent = startMarkerMatch ? startMarkerMatch[1] : '';
      const endIndent = endMarkerMatch ? endMarkerMatch[1] : '';
      
      // Replace start marker with the timing start code
      let modifiedCode = sourceCode.replace(
        /([ \t]*)\/\*RUNTIME CALC START\*\//g, 
        `${startIndent}long startTime = System.nanoTime();`
      );
      
      // Replace end marker with the timing end code
      modifiedCode = modifiedCode.replace(
        /([ \t]*)\/\*RUNTIME CALC END\*\//g, 
        `${endIndent}long endTime = System.nanoTime();\n` +
        `${endIndent}double elapsedMs = (endTime - startTime) / 1e6;\n` +
        `${endIndent}System.out.println(elapsedMs);`
      );
      
      return modifiedCode;
    } 
    else if (language === 'python') {
      // Handle both comment styles: triple quotes and hash comments
      
      // First try to match triple quotes format
      let startMarkerMatch = sourceCode.match(/([ \t]*)"""RUNTIME CALC START"""/);
      let endMarkerMatch = sourceCode.match(/([ \t]*)"""RUNTIME CALC END"""/);
      
      // If not found, try the hash comment format
      if (!startMarkerMatch) {
        startMarkerMatch = sourceCode.match(/([ \t]*)#\s*RUNTIME CALC START/);
      }
      if (!endMarkerMatch) {
        endMarkerMatch = sourceCode.match(/([ \t]*)#\s*RUNTIME CALC END/);
      }
      
      // Get indentation or default to empty string if not found
      const startIndent = startMarkerMatch ? startMarkerMatch[1] : '';
      const endIndent = endMarkerMatch ? endMarkerMatch[1] : '';
      
            // Replace start marker (triple quotes format)
      let modifiedCode = sourceCode.replace(
        /([ \t]*)"""RUNTIME CALC START"""/g, 
        `${startIndent}import time\n${startIndent}start_time = time.perf_counter()`
      );

      // Also handle hash comment format for start marker
      modifiedCode = modifiedCode.replace(
        /([ \t]*)#\s*RUNTIME CALC START/g, 
        `${startIndent}import time\n${startIndent}start_time = time.perf_counter()`
      );

      // Replace end marker (triple quotes format)
      modifiedCode = modifiedCode.replace(
        /([ \t]*)"""RUNTIME CALC END"""/g, 
        `${endIndent}end_time = time.perf_counter()\n${endIndent}elapsed_microseconds = int((end_time - start_time) * 1_000_000)\n${endIndent}print(elapsed_microseconds)`
      );

      // Also handle hash comment format for end marker
      modifiedCode = modifiedCode.replace(
        /([ \t]*)#\s*RUNTIME CALC END/g, 
        `${endIndent}end_time = time.perf_counter()\n${endIndent}elapsed_microseconds = int((end_time - start_time) * 1_000_000)\n${endIndent}print(elapsed_microseconds)`
      );

      
      return modifiedCode;
    }
    else if (language === 'cpp') {
      // Capture the indentation of the markers
      const startMarkerMatch = sourceCode.match(/([ \t]*)\/\*RUNTIME CALC START\*\//);
      const endMarkerMatch = sourceCode.match(/([ \t]*)\/\*RUNTIME CALC END\*\//);
      
      // Get indentation or default to empty string if not found
      const startIndent = startMarkerMatch ? startMarkerMatch[1] : '';
      const endIndent = endMarkerMatch ? endMarkerMatch[1] : '';
      
      // Replace start marker with the timing start code for C++ (preserving indentation)
      let modifiedCode = sourceCode.replace(
        /([ \t]*)\/\*RUNTIME CALC START\*\//g, 
        `${startIndent}auto start = std::chrono::high_resolution_clock::now();`
      );
      
      // Replace end marker with the timing end code (preserving indentation)
      modifiedCode = modifiedCode.replace(
        /([ \t]*)\/\*RUNTIME CALC END\*\//g, 
        `${endIndent}auto end = std::chrono::high_resolution_clock::now();\n` +
        `${endIndent}auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);\n` +
        `${endIndent}std::cout << duration.count() / 1000.0;`
      );
      
      return modifiedCode;
    }
    
    // For other languages, return the original code
    return sourceCode;
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
      
      // Process code for execution timing using the comment markers for all supported languages
      let processedCode = insertRuntimeCalculationCode(code);
      
      const results = [];
      
      // Run each test case
      for (const testCase of testCasesToRun) {
        try {
          // UPDATED: Use the compilerApi to call the backend endpoint
          const executionResponse = await compilerApi.executeCode(
            language, 
            version,
            processedCode,
            testCase.input
          );
          console.log(executionResponse);
          
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
  
  // Handle running code - only passes unhidden test cases to TestCasesPanel
  const handleRunCode = async () => {
    setRunning(true);
    setOutput('');
    setTestResults([]);
    
    try {
      // Only get visible test cases (non-hidden)
      const visibleTestCases = question.testCases ? question.testCases.filter(tc => !tc.hidden) : [];
      
      if (!visibleTestCases || visibleTestCases.length === 0) {
        toast.info('No visible test cases available to run');
        setRunning(false);
        return;
      }
      
      // Process code for execution timing using the comment markers for all supported languages
      let processedCode = insertRuntimeCalculationCode(code);
      
      // Execute test cases
      const results = await compilerApi.runTestCases(
        language,
        null, // version (null means use default)
        processedCode,
        visibleTestCases
      );
      console.log(results);
      // Make sure results is an array before we use it
      const safeResults = Array.isArray(results) ? results : [];
      
      // Process each result to ensure it has the correct passed property
      const processedResults = safeResults.map((result, index) => {
        // Get the corresponding test case
        const testCase = visibleTestCases[index];
        if (!testCase) return result;
        
        // Determine if test passed by comparing expected and actual output directly
        let actualOutput = result.actual || result.actualOutput || '';
        let expectedOutput = testCase.output || result.expected || result.expectedOutput || '';
        
        // Trim whitespace for comparison
        actualOutput = typeof actualOutput === 'string' ? actualOutput.trim() : actualOutput;
        expectedOutput = typeof expectedOutput === 'string' ? expectedOutput.trim() : expectedOutput;
        
        // Get execution time directly from the executionTime property
        const executionTime = typeof result.executionTime === 'number' ? result.executionTime : 0;
        
        // Explicitly set the passed property based on comparison
        const passed = actualOutput === expectedOutput;
        
        // Return the processed result with all necessary properties
        return {
          ...result,
          passed: passed,
          expectedOutput: expectedOutput,
          actualOutput: actualOutput,
          testCaseId: testCase._id,
          input: testCase.input,
          hidden: testCase.hidden,
          _isSubmission: false, // Explicitly mark as NOT submission
          executionTime: executionTime
        };
      });
      
      // Extract the actual output from test results and set it to display
      if (processedResults.length > 0) {
        // Look for output in different possible properties
        const firstResult = processedResults[0];
        let outputText = '';
        
        if (firstResult.actual) {
          outputText = firstResult.actual;
        } else if (firstResult.actualOutput) {
          outputText = firstResult.actualOutput;
        } else if (firstResult.stdout) {
          outputText = firstResult.stdout;
        } else if (firstResult.run && firstResult.run.output) {
          outputText = firstResult.run.output;
        }
        
        setOutput(outputText);
      }
      
      // Set test results for display in TestCasesPanel
      setTestResults(processedResults);
      
      // Show success/failure toast
      const passedTests = processedResults.filter(r => r.passed === true).length;
      if (passedTests === processedResults.length && processedResults.length > 0) {
        toast.success(`All testcases passed..!`);
      } else if (processedResults.length > 0) {
        toast.warn(`${passedTests}/${processedResults.length} test cases passed`);
      } else {
        toast.warn('No test results to display');
      }
    } catch (error) {
      toast.error('Failed to execute code: ' + (error.message || 'Unknown error'));
    } finally {
      setRunning(false);
    }
  };

  // Handle submitting solution - only passes hidden test cases to TestCasesPanel
  const handleSubmitSolution = async () => {
    if (question.type === 'mcq') {
      await handleSubmitMcqAnswer();
    } else if (question.type === 'programming') {
      setSubmitting(true);
      
      try {
        // Only run hidden test cases when submitting
        let hiddenTestCases = question.testCases ? question.testCases.filter(tc => tc.hidden) : [];
        
        if (!hiddenTestCases || hiddenTestCases.length === 0) {
          toast.info('No hidden test cases found. Evaluating all test cases.');
          hiddenTestCases = question.testCases || [];
        }
        
        // Process code for execution timing using the comment markers for all supported languages
        let processedCode = insertRuntimeCalculationCode(code);
        
        // Execute hidden test cases
        const results = await compilerApi.runTestCases(
          language,
          null, // Use default version
          processedCode,
          hiddenTestCases
        );
        console.log(results);
        // Ensure results is an array before processing
        const hiddenResults = Array.isArray(results) ? results : [];
        
        // Process hidden test results
        const processedHiddenResults = hiddenResults.map((result, index) => {
          const testCase = hiddenTestCases[index];
          if (!testCase) return result;
          
          // Determine if test passed by comparing expected and actual output directly
          let actualOutput = result.actual || result.actualOutput || '';
          let expectedOutput = testCase.output || result.expected || result.expectedOutput || '';
          
          // Trim whitespace for comparison
          actualOutput = typeof actualOutput === 'string' ? actualOutput.trim() : actualOutput;
          expectedOutput = typeof expectedOutput === 'string' ? expectedOutput.trim() : expectedOutput;
          
          // Get execution time directly from the executionTime property
          const executionTime = typeof result.executionTime === 'number' ? result.executionTime : 0;
          console.log(executionTime);
          // Explicitly set the passed property based on comparison
          const passed = actualOutput === expectedOutput;
          
          // Add a special flag to mark this as a submission result
          return {
            ...result,
            passed: passed,
            expectedOutput: expectedOutput,
            actualOutput: actualOutput,
            testCaseId: testCase._id,
            input: testCase.input,
            hidden: true, // Explicitly mark as hidden
            _preventMultiTestParsing: true, // Add this flag to prevent parsing
            _isSubmission: true, // Mark as submission result
            executionTime: executionTime
          };
        });
        
        // Set test results for display in TestCasesPanel
        setTestResults(processedHiddenResults);
        
        // Extract output to display
        if (processedHiddenResults.length > 0) {
          const firstResult = processedHiddenResults[0];
          const outputText = firstResult.actualOutput || firstResult.actual || '';
          
          setOutput(outputText);
        }
        
        // Check if all tests passed
        const allPassed = processedHiddenResults.length > 0 && 
                         processedHiddenResults.every(r => r.passed === true);
        
        // Prepare submission data for backend
        const submission = {
          code,
          language,
          submissionType: 'programming',
          testCaseResults: processedHiddenResults.map(r => ({
            testCaseId: r.testCaseId,
            passed: !!r.passed,
            executionTime: typeof r.executionTime === 'number' ? r.executionTime : 0,
            memoryUsed: typeof r.memoryUsed === 'number' ? r.memoryUsed : 0,
            output: typeof r.actualOutput === 'string' ? r.actualOutput : '',
            error: typeof r.error === 'string' ? r.error : ''
          })),
          status: allPassed ? 'accepted' : 'wrong_answer',
          isCorrect: allPassed,
        };
        
        // Submit to backend - this part is unchanged
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
        
        // Update submissions state directly instead of refetching everything
        const newSubmission = response.data;
        
        if (newSubmission) {
          // Save state to sessionStorage before refreshing
          const stateToSave = {
            code,
            language,
            questionId,
            cohortId,
            moduleId,
            testResults: processedHiddenResults,
            submission: newSubmission,
            allPassed
          };
          
          // Save state to sessionStorage
          sessionStorage.setItem('cohortProblem_state', JSON.stringify(stateToSave));
          sessionStorage.setItem('submission_success_flag', 'true');
          
          // Show success toast before refresh
          if (allPassed) {
            toast.success('Solution accepted! All hidden test cases passed.');
          } else {
            toast.warn('Some hidden test cases failed. Your solution was not accepted.');
          }
          
          // Refresh the page
          window.location.reload();
        } else {
          // Add the new submission to the existing submissions array
          setSubmissions(prevSubmissions => [newSubmission, ...prevSubmissions]);
          
          // Show success/failure toast
          if (allPassed) {
            toast.success('Solution accepted! All hidden test cases passed.');
          } else {
            toast.warn('Some hidden test cases failed. Your solution was not accepted.');
          }
        }
      } catch (error) {
        toast.error('Failed to submit solution: ' + (error.message || 'Unknown error'));
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Handle submitting MCQ answer
  const handleSubmitMcqAnswer = async () => {
    if (!selectedMcqOption) {
      toast.warn('Please select an answer first');
      return;
    }

    setSubmitting(true);
    try {
      // Find the option object with the matching text
      const selectedOption = question.options.find(opt => opt.text === selectedMcqOption);
      
      if (!selectedOption) {
        toast.error('Invalid option selected');
        return;
      }

      // Prepare submission data
      const submission = {
        submissionType: 'mcq',
        selectedOption: selectedOption._id,
        isCorrect: selectedOption.isCorrect
      };

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

      // Save result for displaying feedback
      setMcqSubmissionResult({
        isCorrect: selectedOption.isCorrect,
        feedback: selectedOption.isCorrect ? 'Correct answer! 🎉' : 'Incorrect answer',
        selectedOption: selectedOption.text
      });

      // Update submissions state directly
      const newSubmission = response.data;
      if (newSubmission) {
        setSubmissions(prevSubmissions => [newSubmission, ...prevSubmissions]);
      }

      // Show success/failure toast
      if (selectedOption.isCorrect) {
        toast.success('Correct answer! 🎉');
      } else {
        toast.warn('Incorrect answer');
      }

      // Don't call these methods that cause page refresh
      // fetchQuestionDetails();
      // fetchAllSubmissions();
    } catch (error) {
      toast.error('Failed to submit answer: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Keep track of test case runs and submissions in the useEffect
  useEffect(() => {
    // When testResults change, log debug information
    if (testResults && testResults.length > 0) {
      const isSubmission = testResults.some(r => r._isSubmission === true || r.hidden === true);
    }
  }, [testResults]);

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

  const renderMcqOptions = () => {
    if (!question || question.type !== 'mcq') return null;
    const isSubmitted = !!mcqSubmissionResult;
    const correctOption = question.options.find(opt => opt.isCorrect);

    return (
      <Box sx={{ 
        maxWidth: '90%', 
        width: '800px',
        mx: 'auto', 
        mt: 4, 
        mb: 4
      }}>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ 
            fontSize: '1.25rem', 
            mb: 3, 
            color: darkMode ? '#fff' : '#222', 
            fontWeight: 600,
            textAlign: 'center'
          }}>
            Select the correct answer:
          </FormLabel>
          
          <RadioGroup
            name="mcqOption"
            value={selectedMcqOption || ''}
            onChange={e => handleSelectMcqOption(e.target.value)}
          >
            {question.options.map((option, idx) => {
              const isSelected = selectedMcqOption === option.text;
              const isCorrectOption = option.isCorrect === true;
              const showCorrect = isSubmitted && isCorrectOption;
              const showIncorrect = isSubmitted && isSelected && !isCorrectOption;
              
              return (
                <Box 
                  key={idx} 
                  sx={{ 
                    mb: 2.5, 
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Paper
                    elevation={isSelected ? 4 : 1}
                    sx={{
                      border: '1px solid',
                      borderColor: showCorrect ? '#4caf50' : 
                                 showIncorrect ? '#f44336' : 
                                 isSelected ? (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') : 
                                 'transparent',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      bgcolor: showCorrect ? (darkMode ? 'rgba(76,175,80,0.15)' : 'rgba(76,175,80,0.08)') :
                               showIncorrect ? (darkMode ? 'rgba(244,67,54,0.15)' : 'rgba(244,67,54,0.08)') :
                               darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                      '&:hover': {
                        bgcolor: isSubmitted ? undefined : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)'),
                        borderColor: isSubmitted ? undefined : theme.palette.primary.main,
                      }
                    }}
                  >
                    <FormControlLabel
                      value={option.text}
                      control={
                        <Radio
                          color={showCorrect ? 'success' : showIncorrect ? 'error' : 'primary'}
                          disabled={isSubmitted}
                          sx={{ ml: 2 }}
                        />
                      }
                      label={
                        <Typography 
                          sx={{ 
                            fontWeight: isSelected ? 600 : 400, 
                            color: darkMode ? '#fff' : '#222',
                            fontSize: '1rem',
                            ml: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            '& svg': {
                              ml: 1,
                              fontSize: '1.2rem'
                            }
                          }}
                        >
                          {option.text}
                          {showCorrect && <CheckIcon color="success" />}
                          {showIncorrect && <CloseIcon color="error" />}
                        </Typography>
                      }
                      sx={{
                        py: 0.8,
                        px: 1,
                        m: 0,
                        width: '100%'
                      }}
                    />
                  </Paper>
                </Box>
              );
            })}
          </RadioGroup>
          
          {isSubmitted && (
            <Alert 
              severity={mcqSubmissionResult?.isCorrect ? "success" : "error"}
              sx={{ mt: 2, mb: 3 }}
            >
              <Typography variant="body1" fontWeight={500}>
                {mcqSubmissionResult?.isCorrect ? 
                  'Correct! 🎉' : 
                  `Incorrect. The correct answer is: ${correctOption?.text}`
                }
              </Typography>
            </Alert>
          )}
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitted || !selectedMcqOption || submitting}
              onClick={handleSubmitMcqAnswer}
              sx={{ 
                minWidth: 180, 
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 4px 10px rgba(0, 136, 204, 0.3)'
              }}
            >
              {submitting ? 'Submitting...' : isSubmitted ? 'Submitted' : 'Submit'}
            </Button>
          </Box>
        </FormControl>
      </Box>
    );
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
                            ? Math.round(question.stats.acceptanceRate) 
                            : '35'}%
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
                          bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          border: '0px solid',
                          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
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
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            flexDirection: 'row',
                            '& .MuiAccordionSummary-content': {
                              margin: '12px 0',
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CategoryIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                            <Typography sx={{ 
                              fontWeight: 'medium',
                              color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
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
                                    bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                    color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                                    border: '1px solid',
                                    borderColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
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
                          bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          border: '0px solid',
                          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
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
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            flexDirection: 'row',
                            '& .MuiAccordionSummary-content': {
                              margin: '12px 0',
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BusinessIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                            <Typography sx={{ 
                              fontWeight: 'medium',
                              color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
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
                                    bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                    color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                                    border: '1px solid',
                                    borderColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
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
                            onChange={(newCode) => setCode(newCode)}
                            testCasesPanelHeight={testCasesPanelHeight}
                            LANGUAGES={LANGUAGES}
                            onLanguageChange={selectLanguage}
                            availableLanguages={question.languages || []}
                          />
                          
                          {question && question.testCases && question.testCases.length > 0 && (
                            <TestCasesPanel 
                              question={question} 
                              testResults={testResults}
                              darkMode={darkMode}
                              testCasesPanelHeight={testCasesPanelHeight}
                              testPanelResizerRef={testPanelResizerRef}
                              startTestPanelResize={startTestPanelResize}
                              isResizingTestPanel={isResizingTestPanel}
                              output={output}
                              isSubmission={testResults?.some(r => r._isSubmission === true)}
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

