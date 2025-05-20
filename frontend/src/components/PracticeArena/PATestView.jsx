import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Grid,
  Divider,
  Alert,
  IconButton,
  Avatar,
  useMediaQuery
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FlagIcon from '@mui/icons-material/Flag';
import TimerIcon from '@mui/icons-material/Timer';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SchoolIcon from '@mui/icons-material/School';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import QuizIcon from '@mui/icons-material/Quiz';
import CodeIcon from '@mui/icons-material/Code';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import { apiUrl } from '../../config/apiConfig';
import { toast } from 'react-toastify';
import compilerApi from '../../utils/compilerApi';

// Import the components used in the cohort problem solving interface
import TestCasesPanel from '../cohort/TestCasesPanel';
import CodeEditorPanel from '../cohort/CodeEditorPanel';
import SidebarNavigation from '../cohort/SidebarNavigation';

const PATestView = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { darkMode } = useTheme();
  
  // Test state
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);
  
  // UI state
  const [startDialog, setStartDialog] = useState(false);
  const [endDialog, setEndDialog] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  
  // Code editor state (for programming questions)
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [testResults, setTestResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  
  // MCQ state
  const [selectedMcqOption, setSelectedMcqOption] = useState(null);
  
  // Test cases panel state for resizing
  const [testCasesPanelHeight, setTestCasesPanelHeight] = useState(50);
  const [isResizingTestPanel, setIsResizingTestPanel] = useState(false);
  const [resizeStartY, setResizeStartY] = useState(0);
  const testPanelResizerRef = useRef(null);
  
  // Add horizontal resizer state
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const horizontalResizerRef = useRef(null);
  
  // Add state for output
  const [output, setOutput] = useState('');
  
  // Add a state to track if we're in submission mode to prevent overwriting results
  const [isInSubmissionMode, setIsInSubmissionMode] = useState(false);
  
  // Effect to open page in new tab if it's not already in one
  useEffect(() => {
    // Check if this is the specific test page that should open in a new tab
    if (testId === '682a240c9f66f41e5696e2ce' && window.opener === null && !window.sessionStorage.getItem('testPageOpened')) {
      // Set a flag in session storage to prevent infinite loop
      window.sessionStorage.setItem('testPageOpened', 'true');
      
      // Open current URL in new tab
      const newTab = window.open(window.location.href, '_blank');
      
      // If new tab was successfully opened, close the current one
      if (newTab) {
        window.close();
      }
    }
  }, [testId]);
  
  // Constants for editor
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
  
  // Fetch test data
  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      
      try {
        const response = await axios.get(
          `${apiUrl}/practice-arena/tests/${testId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const testData = response.data;
        setTest(testData);
        
        // Initialize questions
        if (testData.questions) {
          setQuestions(testData.questions);
        }
        
        // Initialize submissions
        if (testData.submissions && Array.isArray(testData.submissions)) {
          setSubmissions(testData.submissions);
          
          // If test is in progress, start with the first unanswered/incorrect question
          if (testData.status === 'started' && testData.questions && testData.questions.length > 0) {
            const firstUnansweredIndex = testData.questions.findIndex(q => {
              const sub = testData.submissions.find(s => 
                (s.question._id === q._id) || (s.question === q._id)
              );
              return !sub || !sub.isCorrect;
            });
            
            if (firstUnansweredIndex !== -1) {
              setCurrentQuestionIndex(firstUnansweredIndex);
            }
          }
        }
        
        // Set timer if test is in progress
        if (testData.status === 'started' && testData.startTime) {
          const elapsedTime = Math.floor((new Date() - new Date(testData.startTime)) / 1000);
          const totalTime = testData.parameters.timeLimit * 60;
          const remaining = Math.max(0, totalTime - elapsedTime);
          
          setTimeRemaining(remaining);
          setTimerActive(true);
        } else if (testData.status === 'created') {
          // Set initial time for a new test
          setTimeRemaining(testData.parameters.timeLimit * 60);
          setStartDialog(true);
        } else if (testData.status === 'completed') {
          setTestCompleted(true);
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        toast.error('Failed to load test data');
        navigate('/practice-arena');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTest();
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [testId, token, navigate]);
  
  // Modify the useEffect that initializes the current question to preserve submission results
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const currentQuestion = questions[currentQuestionIndex];
      
      // Set up for MCQ question
      if (currentQuestion.type === 'mcq') {
        // Check if we have a previous submission
        const submission = submissions.find(s => s.question._id === currentQuestion._id || s.question === currentQuestion._id);
        if (submission && submission.selectedOption) {
          setSelectedMcqOption(submission.selectedOption);
        } else {
          setSelectedMcqOption(null);
        }
      } 
      // Set up for programming question
      else if (currentQuestion.type === 'programming') {
        // Set language
        if (currentQuestion.defaultLanguage) {
          setLanguage(currentQuestion.defaultLanguage);
        }
        
        // Check if we have a previous submission
        const submission = submissions.find(s => s.question._id === currentQuestion._id || s.question === currentQuestion._id);
        if (submission && submission.code) {
          setCode(submission.code);
          
          // If we have test results from previous submissions, restore them
          if (submission.testCaseResults && Array.isArray(submission.testCaseResults) && !isInSubmissionMode) {
            // Only restore from submission if we're not currently in submission mode
            // This prevents overwriting our current submission results
            // Process the stored test case results to include all necessary properties
            const processedResults = submission.testCaseResults.map(result => {
              // Find matching test case for additional data
              const testCase = currentQuestion.testCases?.find(tc => tc._id === result.testCaseId) || {};
              
              return {
                ...result,
                input: testCase.input || result.input || '',
                expectedOutput: testCase.output || result.expectedOutput || '',
                actualOutput: result.output || result.actualOutput || '',
                passed: !!result.passed,
                executionTime: result.executionTime || 0,
                memoryUsed: result.memoryUsed || 0,
                hidden: !!testCase.hidden,
                _preventMultiTestParsing: true,
                _isSubmission: true // Mark restored results as submission results
              };
            });
            
            setTestResults(processedResults);
            
            // Set output from the first test result
            if (processedResults.length > 0) {
              const firstResult = processedResults[0];
              const outputText = firstResult.actualOutput || firstResult.actual || firstResult.stdout || '';
              setOutput(outputText);
            }
          }
        } else {
          // Get default code from the question
          const langInfo = currentQuestion.languages?.find(l => l.name === language);
          if (langInfo && langInfo.boilerplateCode) {
            setCode(langInfo.boilerplateCode);
          } else {
            setCode(LANGUAGES[language]?.defaultCode || '// Your code here');
          }
          
          // Reset test results only if we're not in submission mode
          if (!isInSubmissionMode) {
            setTestResults([]);
          }
        }
      }
    }
  }, [currentQuestionIndex, questions, submissions, language]);
  
  // Set up timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up
            clearInterval(timerRef.current);
            endTest(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive]);
  
  // Format time for display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Function to insert runtime calculation code in place of comment markers
  const insertRuntimeCalculationCode = (sourceCode) => {
    // Different implementations based on language
    if (language === 'java') {
      // Replace start marker with the timing start code
      let modifiedCode = sourceCode.replace(
        /\/\*RUNTIME CALC START\*\//g, 
        "long startTime = System.nanoTime();"
      );
      
      // Replace end marker with the timing end code
      modifiedCode = modifiedCode.replace(
        /\/\*RUNTIME CALC END\*\//g, 
        "long endTime = System.nanoTime();\n" +
        "        double elapsedMs = (endTime - startTime) / 1e6;\n" +
        "        System.out.println(elapsedMs);"
      );
      
      return modifiedCode;
    } 
    else if (language === 'python') {
      // Replace start marker with the timing start code for Python
      let modifiedCode = sourceCode.replace(
        /\"\"\"RUNTIME CALC START\"\"\"/g, 
        "import time\nstart_time = time.time()"
      );
      
      // Replace end marker with the timing end code
      modifiedCode = modifiedCode.replace(
        /\"\"\"RUNTIME CALC END\"\"\"/g, 
        "end_time = time.time()\nelapsed_ms = (end_time - start_time) * 1000\nprint(elapsed_ms)"
      );
      
      return modifiedCode;
    }
    else if (language === 'cpp') {
      // Replace start marker with the timing start code for C++ (using exact format)
      let modifiedCode = sourceCode.replace(
        /\/\*RUNTIME CALC START\*\//g, 
        "auto start = std::chrono::high_resolution_clock::now();"
      );
      
      // Replace end marker with the timing end code (using exact format)
      modifiedCode = modifiedCode.replace(
        /\/\*RUNTIME CALC END\*\//g, 
        "auto end = std::chrono::high_resolution_clock::now();\n" +
        "auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);\n" +
        "std::cout << duration.count();"
      );
      
      return modifiedCode;
    }
    
    // For other languages, return the original code
    return sourceCode;
  };
  
  // Start the test
  const startTest = async () => {
    try {
      const response = await axios.put(
        `${apiUrl}/practice-arena/tests/${testId}/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update test data with received questions
      const testData = response.data.test;
      setTest(prevTest => ({ ...prevTest, ...testData }));
      setQuestions(testData.questions || []);
      
      // Start timer
      setTimeRemaining(testData.parameters.timeLimit * 60);
      setTimerActive(true);
      
      setStartDialog(false);
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error('Failed to start the test');
    }
  };
  
  // Modify the handleSubmitAnswer function to preserve submission mode
  const handleSubmitAnswer = async () => {
    if (!questions[currentQuestionIndex]) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    setSubmitting(true);
    
    try {
      if (currentQuestion.type === 'mcq') {
        if (!selectedMcqOption) {
          toast.error('Please select an option');
          setSubmitting(false);
          return;
        }
        
        // Create the submission object
        const submission = {
          questionId: currentQuestion._id,
          submissionType: 'mcq',
          selectedOption: selectedMcqOption
        };
        
        // Submit to server to save
        await submitToServer(submission);
      } 
      else if (currentQuestion.type === 'programming') {
        // Check if code is empty
        if (!code.trim()) {
          toast.error('Please write your code before submitting');
          setSubmitting(false);
          return;
        }
        
        // Run the code against all test cases
        try {
          setRunning(true);
          // Set submission mode flag to true
          setIsInSubmissionMode(true);
          
          // IMPORTANT: Get ONLY hidden test cases for submission
          let hiddenTestCases = currentQuestion.testCases 
            ? currentQuestion.testCases.filter(tc => tc.hidden) 
            : [];
          
          // Fallback if no hidden test cases are found
          if (!hiddenTestCases || hiddenTestCases.length === 0) {
            toast.info('No hidden test cases found. Evaluating all test cases.');
            hiddenTestCases = currentQuestion.testCases || [];
          }
          
          // Process code for execution timing using the comment markers for all supported languages
          let processedCode = insertRuntimeCalculationCode(code);
          
          // Execute hidden test cases
          const compilerResponse = await axios.post(
            `${apiUrl}/compiler/run-test-cases`,
            {
              language,
              version: null, // Use default version
              code: processedCode,
              testCases: hiddenTestCases
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const results = compilerResponse.data.results;
          
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
          
          // Create programming submission
          const submission = {
            questionId: currentQuestion._id,
            submissionType: 'programming',
            code,
            language,
            testCaseResults: processedHiddenResults.map(r => ({
              testCaseId: r.testCaseId,
              passed: !!r.passed,
              executionTime: typeof r.executionTime === 'number' ? r.executionTime : 0,
              memoryUsed: typeof r.memoryUsed === 'number' ? r.memoryUsed : 0,
              output: typeof r.actualOutput === 'string' ? r.actualOutput : '',
              error: typeof r.error === 'string' ? r.error : ''
            })),
            status: allPassed ? 'accepted' : 'wrong_answer',
            isCorrect: allPassed
          };
          
          // Submit to server to save
          await submitToServer(submission);
        } catch (error) {
          console.error('Error running test cases:', error);
          toast.error('Failed to run test cases: ' + (error.message || 'Unknown error'));
          setSubmitting(false);
          setRunning(false);
          setIsInSubmissionMode(false); // Reset submission mode flag on error
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
      setSubmitting(false);
      setIsInSubmissionMode(false); // Reset submission mode flag on error
    }
  };
  
  // Submit to server to save submission
  const submitToServer = async (submission) => {
    try {
      const response = await axios.post(
        `${apiUrl}/practice-arena/tests/${testId}/submit`,
        submission,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update local submissions state with server response
      if (response.data && response.data.submission) {
        // Save the current test results to preserve them
        const currentResults = [...testResults];
        
        // Only update submissions array, do NOT modify testResults
        // This preserves the processed test results with _isSubmission flag
        
        // Add the new submission to the submissions array
        const existingSubmissionIndex = submissions.findIndex(
          s => (s.question._id === submission.questionId) || (s.question === submission.questionId)
        );
        
        if (existingSubmissionIndex >= 0) {
          // Update existing submission
          const updatedSubmissions = [...submissions];
          
          // Ensure server response has testCaseResults field if we're submitting programming
          if (submission.submissionType === 'programming' && 
              !response.data.submission.testCaseResults && 
              currentResults && currentResults.length > 0) {
            // Use our current processed results if server doesn't return any
            response.data.submission.testCaseResults = currentResults.map(r => ({
              testCaseId: r.testCaseId,
              passed: !!r.passed,
              executionTime: r.executionTime || 0,
              memoryUsed: r.memoryUsed || 0,
              output: r.actualOutput || '',
              error: r.error || '',
              hidden: true
            }));
          }
          
          updatedSubmissions[existingSubmissionIndex] = response.data.submission;
          setSubmissions(updatedSubmissions);
        } else {
          // Add new submission - same handling for testCaseResults
          if (submission.submissionType === 'programming' && 
              !response.data.submission.testCaseResults && 
              currentResults && currentResults.length > 0) {
            response.data.submission.testCaseResults = currentResults.map(r => ({
              testCaseId: r.testCaseId,
              passed: !!r.passed,
              executionTime: r.executionTime || 0,
              memoryUsed: r.memoryUsed || 0,
              output: r.actualOutput || '',
              error: r.error || '',
              hidden: true
            }));
          }
          
          setSubmissions([...submissions, response.data.submission]);
        }
        
        // IMPORTANT: Do NOT reset or modify testResults here
        // This preserves the _isSubmission flag and proper test result handling
        
        // Show result
        if (response.data.submission.isCorrect) {
          toast.success('Correct answer!');
        } else {
          toast.error('Incorrect answer. You can try again.');
        }
      }
    } catch (error) {
      console.error('Error saving submission:', error);
      toast.error('Failed to save your submission');
    } finally {
      setSubmitting(false);
      setRunning(false);
      // Do NOT reset testResults here
      // Do NOT reset isInSubmissionMode here - we want to keep the submission state
    }
  };
  
  // End the test
  const endTest = async (isTimeout = false) => {
    setTimerActive(false);
    
    if (isTimeout) {
      toast.warning('Time\'s up! Your test is being submitted automatically.');
    }
    
    try {
      // The server already has all our submissions, so we just need to mark the test as completed
      const response = await axios.put(
        `${apiUrl}/practice-arena/tests/${testId}/end`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Always mark test as completed when user explicitly ends it
      setTestCompleted(true);
      
      if (isTimeout) {
        // Automatically navigate to results
        navigate('/practice-arena');
        toast.info('Test completed. View your results in the practice arena.');
      } else {
        setEndDialog(false);
      }
    } catch (error) {
      console.error('Error ending test:', error);
      toast.error('Failed to end the test');
    }
  };
  
  // Modify the navigateToQuestion function to preserve submission mode when navigating
  const navigateToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      // Preserve submission mode and results when navigating between questions
      const preserveSubmissionMode = isInSubmissionMode;
      const preserveTestResults = [...testResults];
      
      // First set the new index
      setCurrentQuestionIndex(index);
      
      // If we were in submission mode, make sure it's preserved
      if (preserveSubmissionMode) {
        // Use a timeout to ensure the state changes in the right order
        setTimeout(() => {
          setIsInSubmissionMode(true);
          setTestResults(preserveTestResults);
        }, 50);
      }
    }
  };
  
  // Handle MCQ option selection
  const handleSelectMcqOption = (optionId) => {
    setSelectedMcqOption(optionId);
  };
  
  // Handle running code for programming questions
  const handleRunCode = async () => {
    if (!questions[currentQuestionIndex] || questions[currentQuestionIndex].type !== 'programming') {
      return;
    }
    
    setRunning(true);
    setOutput(''); // Clear previous output
    setTestResults([]); // Clear previous test results
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      
      // Only use visible test cases for running (non-hidden)
      const visibleTestCases = currentQuestion.testCases.filter(tc => !tc.hidden);
      
      if (!visibleTestCases || visibleTestCases.length === 0) {
        toast.info('No visible test cases available to run');
        setRunning(false);
        return;
      }
      
      // Process code for execution timing using the comment markers for all supported languages
      let processedCode = insertRuntimeCalculationCode(code);
      
      // Execute test cases
      const compilerResponse = await axios.post(
        `${apiUrl}/compiler/run-test-cases`,
        {
          language,
          version: null, // Use default version
          code: processedCode,
          testCases: visibleTestCases
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const results = compilerResponse.data.results;
      
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

  // Add horizontal resizing functions
  const startHorizontalResize = (e) => {
    setIsResizingHorizontal(true);
    setResizeStartX(e.clientX);
  };

  const stopHorizontalResize = () => {
    setIsResizingHorizontal(false);
  };

  const resizeHorizontal = (e) => {
    if (!isResizingHorizontal) return;
    
    const containerWidth = document.body.clientWidth;
    const delta = e.clientX - resizeStartX;
    const deltaPercent = (delta / containerWidth) * 100;
    
    // Ensure we keep reasonable minimum widths for both panels
    const newLeftWidth = Math.min(Math.max(30, leftPanelWidth + deltaPercent), 70);
    setLeftPanelWidth(newLeftWidth);
    setResizeStartX(e.clientX);
  };
  
  // Add event listeners for mouse movements (for both resizers)
  useEffect(() => {
    if (isResizingTestPanel) {
      document.addEventListener('mousemove', resizeTestPanel);
      document.addEventListener('mouseup', stopTestPanelResize);
    }
    
    if (isResizingHorizontal) {
      document.addEventListener('mousemove', resizeHorizontal);
      document.addEventListener('mouseup', stopHorizontalResize);
    }
    
    return () => {
      document.removeEventListener('mousemove', resizeTestPanel);
      document.removeEventListener('mouseup', stopTestPanelResize);
      document.removeEventListener('mousemove', resizeHorizontal);
      document.removeEventListener('mouseup', stopHorizontalResize);
    };
  }, [isResizingTestPanel, resizeTestPanel, stopTestPanelResize, testCasesPanelHeight, resizeStartY,
      isResizingHorizontal, resizeHorizontal, stopHorizontalResize, leftPanelWidth, resizeStartX]);
  
  // Effect to log and track submission status for debugging
  useEffect(() => {
    // When testResults change, log debug information
    if (testResults && testResults.length > 0) {
      const isSubmission = testResults.some(r => r._isSubmission === true || r.hidden === true);
    }
  }, [testResults]);
  
  // Render the current question
  const renderCurrentQuestion = () => {
    if (loading || !questions.length || currentQuestionIndex >= questions.length) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      );
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    const hasSubmission = submissions.find(s => (s.question._id === currentQuestion._id) || (s.question === currentQuestion._id));
    
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Question Content */}
        <Box sx={{ flex: 1, display: 'flex', height: 'calc(100% - 60px)', overflow: 'hidden' }}>
          {/* Description Panel */}
          <Box sx={{ 
            width: `${leftPanelWidth}%`, 
            height: '100%', 
            overflow: 'auto', 
            p: 2, 
            borderRight: '1px solid', 
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' 
          }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              Question {currentQuestionIndex + 1}: {currentQuestion.title}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <Chip 
                label={currentQuestion.difficultyLevel} 
                color={
                  currentQuestion.difficultyLevel === 'easy' ? 'success' :
                  currentQuestion.difficultyLevel === 'medium' ? 'warning' : 'error'
                }
                size="small"
              />
              <Chip 
                label={`${currentQuestion.marks} pt${currentQuestion.marks !== 1 ? 's' : ''}`} 
                color="primary"
                size="small"
              />
            </Box>
            
            <Typography variant="body1" sx={{ mb: 3 }} dangerouslySetInnerHTML={{ __html: currentQuestion.description }} />
            
            {/* Examples */}
            {currentQuestion.examples && currentQuestion.examples.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Examples:
                </Typography>
                {currentQuestion.examples.map((example, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: darkMode ? '#121620' : '#F5F7FA', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Example {index + 1}:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                        <strong>Input:</strong> {example.input}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
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
          </Box>
          
          {/* Horizontal Resizer */}
          <Box
            ref={horizontalResizerRef}
            sx={{
              width: '5px',
              height: '100%',
              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              cursor: 'col-resize',
              '&:hover': {
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              },
              zIndex: 10,
              transition: isResizingHorizontal ? 'none' : 'background-color 0.2s'
            }}
            onMouseDown={startHorizontalResize}
          />
          
          {/* Answer Panel */}
          <Box sx={{ 
            width: `calc(100% - ${leftPanelWidth}% - 5px)`, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            {currentQuestion.type === 'mcq' ? (
              /* MCQ Options */
              <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Select the correct answer:
                </Typography>
                
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedMcqOption === option._id;
                  
                  // Additional styling for selected option
                  const optionStyle = {
                    border: '1px solid',
                    borderColor: isSelected 
                      ? 'primary.main' 
                      : darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                    p: 2,
                    mb: 2,
                    borderRadius: 1,
                    cursor: 'pointer',
                    bgcolor: isSelected 
                      ? (darkMode ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)')
                      : 'transparent',
                    '&:hover': {
                      bgcolor: isSelected 
                        ? (darkMode ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.1)')
                        : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)')
                    }
                  };
                  
                  return (
                    <Box 
                      key={option._id} 
                      sx={optionStyle}
                      onClick={() => handleSelectMcqOption(option._id)}
                    >
                      <Typography variant="body1">
                        {String.fromCharCode(65 + index)}. {option.text}
                      </Typography>
                    </Box>
                  );
                })}
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!selectedMcqOption || submitting}
                    onClick={handleSubmitAnswer}
                    sx={{ px: 4, py: 1 }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Answer'}
                  </Button>
                </Box>
              </Box>
            ) : (
              /* Programming Question */
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Code Editor Header */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 1,
                  borderBottom: '1px solid',
                  borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }}>
                  <Typography variant="subtitle1">
                    Code Editor
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleRunCode}
                      disabled={running || submitting}
                      startIcon={<PlayArrowIcon />}
                    >
                      Run
                    </Button>
                    
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSubmitAnswer}
                      disabled={running || submitting}
                      color="primary"
                    >
                      Submit
                    </Button>
                  </Box>
                </Box>
                
                {/* Code Editor Panel and Test Cases Panel Section */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <CodeEditorPanel
                    code={code}
                    language={language}
                    darkMode={darkMode}
                    onChange={setCode}
                    testCasesPanelHeight={testCasesPanelHeight}
                    LANGUAGES={LANGUAGES}
                    onLanguageChange={setLanguage}
                    availableLanguages={currentQuestion?.languages || []}
                  />
                  
                  {/* Test Cases Panel - Always visible */}
                  <TestCasesPanel
                    question={currentQuestion}
                    testResults={testResults}
                    darkMode={darkMode}
                    testCasesPanelHeight={testCasesPanelHeight}
                    testPanelResizerRef={testPanelResizerRef}
                    startTestPanelResize={startTestPanelResize}
                    isResizingTestPanel={isResizingTestPanel}
                    output={output}
                    isSubmission={isInSubmissionMode && testResults?.some(r => r._isSubmission === true)}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  };
  
  // Render test completion screen
  const renderCompletionScreen = () => {
    if (!test) return null;
    
    // Calculate scores
    const totalQuestions = test.questions?.length || 0;
    const completedQuestions = submissions.length;
    const correctAnswers = submissions.filter(s => s.isCorrect).length;
    
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'success.main' }}>
          Test Completed!
        </Typography>
        
        <Typography variant="h6" sx={{ mb: 3 }}>
          You scored {test.totalScore || 0} out of {test.maxPossibleScore || 0} points
        </Typography>
        
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            maxWidth: '500px',
            mx: 'auto',
            bgcolor: darkMode ? '#1a1a1a' : '#f8f8f8'
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body1" align="left">Completed:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" align="right">
                {completedQuestions}/{totalQuestions} questions
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body1" align="left">Correct Answers:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" align="right">
                {correctAnswers}/{completedQuestions} ({Math.round((correctAnswers / totalQuestions) * 100)}%)
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body1" align="left">Time Taken:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" align="right">
                {test.totalTimeTaken 
                  ? `${Math.floor(test.totalTimeTaken / 60)}m ${test.totalTimeTaken % 60}s` 
                  : 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
        
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/practice-arena')}
          sx={{ mt: 2 }}
        >
          Return to Practice Arena
        </Button>
      </Box>
    );
  };
  
  // Check if all questions have been answered correctly
  const areAllQuestionsCompleted = () => {
    if (!questions.length || !submissions.length) return false;
    
    // Check if all questions have submissions and they are correct
    return questions.every(question => {
      const submission = submissions.find(
        s => (s.question._id === question._id) || (s.question === question._id)
      );
      return submission && submission.isCorrect;
    });
  };
  
  // Render test interface
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: darkMode ? '#0e1117' : '#f5f7fa',
        display: 'flex',
        zIndex: 1200,
      }}
    >
      {/* Sidebar Navigation - Always shown except for specific test ID */}
      {testId !== '682a240c9f66f41e5696e2ce' && <SidebarNavigation darkMode={darkMode} />}
      
      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          height: '100%',
          ...(testId !== '682a240c9f66f41e5696e2ce' ? {
            ml: '60px', // Match the width of SidebarNavigation
            width: 'calc(100% - 60px)',
          } : {
            width: '100%',
          }),
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Bar with Timer and Navigation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1,
            borderBottom: '1px solid',
            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            bgcolor: darkMode ? '#1a1a1a' : '#ffffff'
          }}
        >
          {/* Left Side: Back button and Test Info */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/practice-arena')} size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ ml: 1 }}>
              {test?.title || 'Practice Test'}
            </Typography>
          </Box>
          
          {/* Center: Question Navigation */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!testCompleted && questions.map((question, index) => {
              // Determine if this question has been answered correctly
              const submission = submissions.find(
                s => (s.question._id === question._id) || (s.question === question._id)
              );
              const isCompleted = submission && submission.isCorrect;
              
              return (
                <Button
                  key={index}
                  variant={currentQuestionIndex === index ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => navigateToQuestion(index)}
                  sx={{ 
                    minWidth: '36px', 
                    height: '36px', 
                    p: 0,
                    borderRadius: '50%',
                    bgcolor: isCompleted && currentQuestionIndex !== index ? 
                      (darkMode ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.1)') : 
                      undefined,
                    borderColor: isCompleted && currentQuestionIndex !== index ? 
                      '#2e7d32' : undefined,
                    color: isCompleted && currentQuestionIndex !== index ? 
                      '#2e7d32' : undefined
                  }}
                >
                  {index + 1}
                </Button>
              );
            })}
          </Box>
          
          {/* Right Side: Timer and End Button */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {timerActive && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                height: '36px',
                p: '6px 12px',
                borderRadius: 1,
                mr: 2,
                bgcolor: timeRemaining < 300 ? 'error.main' : 'primary.main',
                color: 'white'
              }}>
                <TimerIcon sx={{ mr: 0.5, fontSize: '20px' }} />
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {formatTime(timeRemaining)}
                </Typography>
              </Box>
            )}
            
            {!testCompleted && (
              <Button
                variant="contained"
                color={areAllQuestionsCompleted() ? "success" : "error"}
                onClick={() => setEndDialog(true)}
                sx={{
                  position: 'relative',
                  height: '36px',
                  p: '6px 12px',
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
                startIcon={<FlagIcon sx={{ fontSize: '20px' }} />}
              >
                End Test
                {areAllQuestionsCompleted() && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      border: '2px solid',
                      borderColor: darkMode ? '#1a1a1a' : '#ffffff'
                    }}
                  />
                )}
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Main Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
              <CircularProgress />
            </Box>
          ) : testCompleted ? (
            renderCompletionScreen()
          ) : (
            renderCurrentQuestion()
          )}
        </Box>
      </Box>
      
      {/* Start Test Dialog */}
      <Dialog
        open={startDialog}
        aria-labelledby="start-test-dialog-title"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
            background: darkMode ? 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
          }
        }}
      >
        <Box sx={{ 
          position: 'relative', 
          pb: 2,
          borderBottom: '1px solid',
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          background: darkMode ? 'rgba(0, 136, 204, 0.1)' : 'rgba(0, 136, 204, 0.05)',
        }}>
          <IconButton
            aria-label="close"
            onClick={() => navigate('/practice-arena')}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
            <Avatar
              sx={{
                bgcolor: '#0088CC',
                width: 48,
                height: 48,
                mr: 2,
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              <AssignmentIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" component="h2" fontWeight="700" id="start-test-dialog-title">
              Start Practice Test
            </Typography>
          </Box>
        </Box>
        
        <DialogContent sx={{ px: 3, py: 4 }}>
          <Typography variant="body1" sx={{ mb: 3, fontWeight: 500, color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)' }}>
            You are about to start a practice test with the following parameters:
          </Typography>
          
          <Paper elevation={0} sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            border: '1px solid',
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SchoolIcon sx={{ color: '#0088CC', mr: 1.5 }} />
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Subject</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {test?.parameters?.subject || 'Not specified'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SignalCellularAltIcon sx={{ color: '#0088CC', mr: 1.5 }} />
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Difficulty</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {test?.parameters?.difficulty || 'Mixed'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <QuizIcon sx={{ color: '#0088CC', mr: 1.5 }} />
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Questions</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {test?.questions?.length || 0} total
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ ml: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 1,
                    color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'
                  }}>
                    <Box 
                      component="span" 
                      sx={{ 
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        bgcolor: 'rgba(0, 136, 204, 0.15)',
                        border: '1px solid',
                        borderColor: 'rgba(0, 136, 204, 0.6)',
                        mr: 1.5
                      }}
                    />
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CodeIcon sx={{ fontSize: '0.9rem', mr: 0.8, color: '#0088CC' }} />
                      {test?.parameters?.questionTypes?.programming?.count || 0} Programming
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'
                  }}>
                    <Box 
                      component="span" 
                      sx={{ 
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        bgcolor: 'rgba(0, 136, 204, 0.15)',
                        border: '1px solid',
                        borderColor: 'rgba(0, 136, 204, 0.6)',
                        mr: 1.5
                      }}
                    />
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <QuizIcon sx={{ fontSize: '0.9rem', mr: 0.8, color: '#0088CC' }} />
                      {test?.parameters?.questionTypes?.mcq?.count || 0} MCQ
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScheduleIcon sx={{ color: '#0088CC', mr: 1.5 }} />
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Time Limit</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {test?.parameters?.timeLimit || 60} minutes
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          <Alert 
            severity="info" 
            variant="outlined"
            icon={<TimerIcon fontSize="inherit" />}
            sx={{ 
              borderRadius: 2,
              border: '1px solid',
              borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              background: darkMode ? 'rgba(5, 133, 224, 0.1)' : 'rgba(0, 0, 0, 0.02)',
              '& .MuiAlert-icon': { 
                alignItems: 'center',
                color: '#0585E0' 
              },
              '& .MuiAlert-message': {
                color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)'
              }
            }}
          >
            <Typography variant="body2">
              Once you start, the timer will begin counting down. You can submit answers for each question
              and navigate between questions freely.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', bgcolor: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)' }}>
          <Button 
            onClick={() => navigate('/practice-arena')} 
            sx={{ 
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              '&:hover': {
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={startTest} 
            variant="contained" 
            sx={{ 
              bgcolor: '#0088CC',
              '&:hover': {
                bgcolor: 'rgba(0, 136, 204, 0.9)'
              },
              px: 3,
              py: 1,
              borderRadius: 1.5
            }}
            startIcon={<PlayArrowIcon />}
          >
            Start Test
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* End Test Dialog */}
      <Dialog
        open={endDialog}
        onClose={() => setEndDialog(false)}
        aria-labelledby="end-test-dialog-title"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
            background: darkMode ? 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
          }
        }}
      >
        <Box sx={{ 
          position: 'relative', 
          pb: 2,
          borderBottom: '1px solid',
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          background: areAllQuestionsCompleted() 
            ? (darkMode ? 'rgba(46, 125, 50, 0.1)' : 'rgba(46, 125, 50, 0.05)')
            : (darkMode ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)'),
        }}>
          <IconButton
            aria-label="close"
            onClick={() => setEndDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
            <Avatar
              sx={{
                bgcolor: areAllQuestionsCompleted() ? '#4caf50' : '#f44336',
                width: 48,
                height: 48,
                mr: 2,
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              <FlagIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" component="h2" fontWeight="700" id="end-test-dialog-title">
              End Test{areAllQuestionsCompleted() ? ' - Complete!' : ''}
            </Typography>
          </Box>
        </Box>
        
        <DialogContent sx={{ px: 3, py: 4 }}>
          <Typography variant="body1" sx={{ 
            mb: 3, 
            fontWeight: 500, 
            color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'
          }}>
            Are you sure you want to end this test? Your current progress will be saved,
            but the test will be marked as completed and you won't be able to continue.
          </Typography>
          
          <Paper elevation={0} sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            border: '1px solid',
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Test Summary
            </Typography>
            
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mt: 2, 
                mb: 3,
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  mx: 'auto'
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={submissions.filter(s => s.isCorrect).length / questions.length * 100}
                  size={120}
                  thickness={4}
                  sx={{
                    color: areAllQuestionsCompleted() ? '#4caf50' : '#0088CC',
                    circle: {
                      strokeLinecap: 'round',
                    }
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="h4"
                    component="div"
                    color="text.secondary"
                    fontWeight="bold"
                  >
                    {`${submissions.filter(s => s.isCorrect).length}/${questions.length}`}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Typography 
              variant="body2" 
              align="center" 
              sx={{ 
                mb: 1,
                color: areAllQuestionsCompleted() 
                  ? '#4caf50'
                  : darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: 600
              }}
            >
              {areAllQuestionsCompleted() 
                ? 'All questions completed!' 
                : `${submissions.filter(s => s.isCorrect).length} of ${questions.length} questions completed`
              }
            </Typography>
          </Paper>
          
          {!areAllQuestionsCompleted() && (
            <Alert 
              severity="info" 
              variant="outlined"
              icon={<QuizIcon fontSize="inherit" />}
              sx={{ 
                borderRadius: 2,
                mb: 2,
                '& .MuiAlert-icon': { 
                  alignItems: 'center',
                  color: '#0088CC' 
                },
                '& .MuiAlert-message': {
                  color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)'
                }
              }}
            >
              <Typography variant="body2">
                You still have some unanswered or incorrect questions. You can continue working on them before ending the test.
              </Typography>
            </Alert>
          )}
          
          {areAllQuestionsCompleted() && (
            <Alert 
              severity="success" 
              variant="outlined"
              icon={<CheckCircleIcon fontSize="inherit" />}
              sx={{ 
                borderRadius: 2,
                mb: 2,
                '& .MuiAlert-icon': { 
                  alignItems: 'center',
                  color: '#4caf50' 
                },
                '& .MuiAlert-message': {
                  color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)'
                }
              }}
            >
              <Typography variant="body2" fontWeight="500">
                Congratulations! You've correctly answered all questions.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', bgcolor: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)' }}>
          <Button 
            onClick={() => setEndDialog(false)} 
            sx={{ 
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              '&:hover': {
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Continue Test
          </Button>
          <Button 
            onClick={() => endTest(false)} 
            variant="contained" 
            color={areAllQuestionsCompleted() ? "success" : "error"}
            sx={{ 
              px: 3,
              py: 1,
              borderRadius: 1.5
            }}
            startIcon={<FlagIcon />}
          >
            End Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PATestView; 