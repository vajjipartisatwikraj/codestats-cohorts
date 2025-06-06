import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Tooltip,
  Radio,
  RadioGroup,
  FormLabel,
  FormHelperText,
  Alert,
  CircularProgress,
  FormGroup,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  AddCircle as AddCircleIcon,
  Code as CodeIcon,
  QuizOutlined as QuizIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import compilerApi from '../../utils/compilerApi';
import { toast } from 'react-toastify';
import Editor from '@monaco-editor/react';
import axios from '../../utils/axiosConfig'; // Properly configured axios instance

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`question-form-tabpanel-${index}`}
      aria-labelledby={`question-form-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const QuestionForm = ({ initialData, onSave, onCancel, moduleId, isEdit = false }) => {
  // Log initial data to help debug initialization issues
  console.log('QuestionForm initialized with:', { 
    initialData, 
    moduleId, 
    isEdit,
    hasInitialData: !!initialData,
    initialDataKeys: initialData ? Object.keys(initialData) : []
  });

  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'programming',
    difficultyLevel: 'medium',
    marks: 10,
    module: moduleId,
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
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
    companies: [],
    maintag: ''
  });
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newHint, setNewHint] = useState('');
  const [newTestCase, setNewTestCase] = useState({
    input: '',
    output: '',
    hidden: false,
    explanation: ''
  });
  const [newExample, setNewExample] = useState({
    input: '',
    output: '',
    explanation: ''
  });
  const [testRunLanguage, setTestRunLanguage] = useState('java');
  const [testRunInput, setTestRunInput] = useState('');
  const [testRunResult, setTestRunResult] = useState(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [availableRuntimes, setAvailableRuntimes] = useState([]);
  const [isLoadingRuntimes, setIsLoadingRuntimes] = useState(false);
  const [testCaseResults, setTestCaseResults] = useState([]);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Add new state for question search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Language options
  const LANGUAGES = [
    { name: 'java', displayName: 'Java', version: '15.0.2', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}' },
    { name: 'python', displayName: 'Python', version: '3.10.0', defaultCode: '# Your code here' },
    { name: 'javascript', displayName: 'JavaScript', version: '18.15.0', defaultCode: '// Your code here' },
    { name: 'c', displayName: 'C', version: '10.2.0', defaultCode: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}' },
    { name: 'cpp', displayName: 'C++', version: '10.2.0', defaultCode: '#include <iostream>\n\nint main() {\n    // Your code here\n    return 0;\n}' }
  ];

  // Fetch available runtimes from Piston API on component mount
  useEffect(() => {
    const fetchRuntimes = async () => {
      setIsLoadingRuntimes(true);
      try {
        // Instead of calling a non-existent API method, use the predefined languages
        // Map the LANGUAGES array to match the expected format
        const runtimes = LANGUAGES.map(lang => ({
          language: lang.name,
          version: lang.version,
          displayName: lang.displayName
        }));
        setAvailableRuntimes(runtimes);
      } catch (error) {
        console.error('Error setting up runtimes:', error);
        toast.error('Failed to set up available programming languages');
      } finally {
        setIsLoadingRuntimes(false);
      }
    };
    
    fetchRuntimes();
  }, []);

  useEffect(() => {
    if (initialData) {
      console.log('Initializing form with data:', initialData);
      
      // Create a complete form data structure without duplicate keys
      const completeFormData = {
        // Default structure with empty/default values
        title: initialData.title || '',
        description: initialData.description || '',
        type: initialData.type || 'programming',
        difficultyLevel: initialData.difficultyLevel || 'medium',
        marks: initialData.marks ? Number(initialData.marks) : 10,
        module: moduleId || initialData.module,
        options: initialData.options && initialData.options.length > 0 
          ? initialData.options 
          : [
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false }
            ],
        languages: initialData.languages && initialData.languages.length > 0
          ? initialData.languages
          : [
              {
                name: 'java',
                version: '15.0.2',
                boilerplateCode: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
                solutionCode: ''
              }
            ],
        defaultLanguage: initialData.defaultLanguage || 'java',
        testCases: initialData.testCases || [],
        examples: initialData.examples || [],
        constraints: {
          timeLimit: initialData.constraints?.timeLimit ? Number(initialData.constraints.timeLimit) : 1000,
          memoryLimit: initialData.constraints?.memoryLimit ? Number(initialData.constraints.memoryLimit) : 256
        },
        hints: initialData.hints || [],
        tags: initialData.tags || [],
        companies: initialData.companies || [],
        maintag: initialData.maintag || ''
      };
      
      console.log('Initialized form data:', completeFormData);
      setFormData(completeFormData);
      
      // If this is a programming question, set the test run language
      if (completeFormData.type === 'programming' && completeFormData.languages.length > 0) {
        setTestRunLanguage(completeFormData.languages[0].name || 'java');
      }
    }
  }, [initialData, moduleId]);

  // Update useEffect to initialize testRunCode when switching tab or language
  useEffect(() => {
    if (formData.type === 'programming' && formData.languages.length > 0) {
      const defaultLang = formData.languages.find(lang => lang.name === testRunLanguage);
      if (defaultLang) {
        setTestRunLanguage(defaultLang.name || 'java');
      }
    }
  }, [testRunLanguage, formData.type]);

  // Simplified tab change handler
  const handleTabChange = (event, newValue) => {
    // Ensure we don't exceed tab count based on question type
    const maxTabIndex = formData.type === 'mcq' ? 2 : 3;
    if (newValue <= maxTabIndex) {
      setActiveTab(newValue);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for numeric fields
    if (name === 'marks') {
      const numValue = value === '' ? 0 : Number(value);
      // Only set valid numbers
      if (!isNaN(numValue)) {
        setFormData({
          ...formData,
          [name]: numValue
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleNestedInputChange = (e, parentKey, childKey) => {
    const { value } = e.target;
    
    // Special handling for numeric fields in constraints
    if (parentKey === 'constraints' && (childKey === 'timeLimit' || childKey === 'memoryLimit')) {
      const numValue = value === '' ? 0 : Number(value);
      // Only set valid numbers
      if (!isNaN(numValue)) {
        setFormData({
          ...formData,
          [parentKey]: {
            ...formData[parentKey],
            [childKey]: numValue
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        [parentKey]: {
          ...formData[parentKey],
          [childKey]: value
        }
      });
    }
  };

  // Run code to test programming questions using the PISTON API
  const handleTestRun = async () => {
    // Get the selected language
    const selectedLang = formData.languages.find(lang => lang.name === testRunLanguage);
    
    if (!selectedLang) {
      toast.error('Please select a language first');
      return;
    }
    
    // Use the solution code from the selected language
    const solutionCode = selectedLang.solutionCode;
    
    if (!solutionCode || !solutionCode.trim()) {
      toast.error('Please enter a solution in the code editor');
      return;
    }
    
    setIsRunningTest(true);
    setTestRunResult(null);
    
    try {
      // Get version from the language definition directly
      const version = selectedLang.version || '0';
      
      // Use simpleExecution instead of executeCode
      const result = await compilerApi.simpleExecution(
        testRunLanguage,
        version,
        solutionCode,
        testRunInput
      );
      
      setTestRunResult({
        status: result.status?.id === 3 ? 'success' : 'error',
        stdout: result.stdout,
        stderr: result.stderr,
        time: result.time,
        memory: result.memory,
        exitCode: result.exit_code,
        compile: { 
          stdout: '',
          stderr: result.compile_output || ''
        }
      });

      // If the execution was successful, make sure the solution code is up to date
      if (result.status?.id === 3) {
        toast.success('Code execution successful!');
      }
    } catch (error) {
      console.error('Error executing code:', error);
      setTestRunResult({
        status: 'error',
        stderr: `Execution failed: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  // Test if the test case works with the solution code
  const testTestCase = async (testCase) => {
    // Get the default language
    const defaultLang = formData.languages.find(lang => lang.name === formData.defaultLanguage);
    
    if (!defaultLang || !defaultLang.solutionCode) {
      toast.error('Please provide a solution code for the default language in the Languages tab first');
      return;
    }
    
    setIsRunningTest(true);
    
    try {
      const language = LANGUAGES.find(lang => lang.name === defaultLang.name);
      const runtime = availableRuntimes.find(runtime => runtime.language === defaultLang.name);
      const version = language?.version || runtime?.version || '0';
      
      // Use simple execution instead of executeCode
      const result = await compilerApi.simpleExecution(
        defaultLang.name,
        version,
        defaultLang.solutionCode,
        testCase.input
      );
      
      // Check if the output matches the expected output
      const actualOutput = result.stdout?.trim() || '';
      const expectedOutput = testCase.output.trim();
      const matches = actualOutput === expectedOutput;
      
      if (matches) {
        toast.success('Test case passed! Output matches expected result.');
      } else {
        toast.error(`Test case failed. Expected: "${expectedOutput}", Got: "${actualOutput}"`);
      }
    } catch (error) {
      console.error('Error testing test case:', error);
      toast.error('Failed to test the test case');
    } finally {
      setIsRunningTest(false);
    }
  };

  // Simple execution to test a single test case
  const simpleValidateTestCase = async (testCase, language, version, solutionCode) => {
    try {
      // Execute the code using simple execution
      const result = await compilerApi.simpleExecution(
        language,
        version,
        solutionCode,
        testCase.input
      );
      
      // Check if the output matches the expected output
      const actualOutput = result.stdout?.trim() || '';
      const expectedOutput = testCase.output.trim();
      const matches = actualOutput === expectedOutput;
      
      // Check if execution was successful
      const executionSuccessful = result.status?.id === 3; // 3 is "Accepted" in Judge0
      
      return {
        passed: matches && executionSuccessful,
        expected: expectedOutput,
        actual: actualOutput,
        error: result.stderr || result.compile_output || '',
        executionTime: parseFloat(result.time || '0') * 1000, // Convert to ms
        memory: parseInt(result.memory || '0')
      };
    } catch (error) {
      console.error('Error in simple validation:', error);
      return {
        passed: false,
        expected: testCase.output,
        actual: '',
        error: error.message || 'Execution failed',
        executionTime: 0,
        memory: 0
      };
    }
  };

  // Simple execution to validate all test cases
  const simpleValidateAllTestCases = async () => {
    if (formData.testCases.length === 0) {
      toast.error('No test cases to validate');
      return [];
    }
    
    // Get the solution code from the default language
    const defaultLang = formData.languages.find(lang => lang.name === formData.defaultLanguage);
    if (!defaultLang || !defaultLang.solutionCode) {
      toast.error('Please provide a solution code in the Languages tab before validating test cases');
      return [];
    }
    
    setIsRunningTest(true);
    setTestCaseResults([]);
    const newResults = [];
    
    try {
      let allPassed = true;
      // Get the version from the language definition
      const language = LANGUAGES.find(lang => lang.name === defaultLang.name);
      const runtime = availableRuntimes.find(runtime => runtime.language === defaultLang.name);
      const version = language?.version || runtime?.version || '0';
      
      // Test each test case
      for (let i = 0; i < formData.testCases.length; i++) {
        const testCase = formData.testCases[i];
        
        // Simple validation of test case
        const result = await simpleValidateTestCase(
          testCase,
          defaultLang.name,
          version,
          defaultLang.solutionCode
        );
        
        // Add index to result
        result.index = i;
        
        // Store the test result
        newResults.push(result);
        
        if (!result.passed) {
          allPassed = false;
          console.log(`Test case ${i + 1} failed. Expected: "${result.expected}", Got: "${result.actual}"`);
        }
      }
      
      // Set the results state
      setTestCaseResults(newResults);
      
      if (allPassed) {
        toast.success('All test cases passed! This solution is valid.');
      } else {
        toast.error('Some test cases failed. See details below.');
      }
      
      return newResults;
    } catch (error) {
      console.error('Error validating test cases:', error);
      toast.error('Failed to validate test cases');
      return [];
    } finally {
      setIsRunningTest(false);
    }
  };

  // Function to test all test cases against the solution code
  const validateAllTestCases = async () => {
    // Use the simple validation approach instead
    return await simpleValidateAllTestCases();
  };

  // Format execution time
  const formatTime = (ms) => {
    if (ms < 1) return '< 1 ms';
    if (ms < 1000) return `${ms.toFixed(2)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  // Format memory usage
  const formatMemory = (kb) => {
    if (!kb) return 'N/A';
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };
  
  // Render test run result UI
  const renderTestRunResult = () => {
    if (!testRunResult) return null;
    
    const { status, stdout, stderr, time, memory, exitCode, compile } = testRunResult;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderColor: status === 'success' ? 'success.main' : 'error.main',
            bgcolor: status === 'success' ? 'success.light' : 'error.light',
            color: 'white',
            borderRadius: 1
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2">
              {status === 'success' ? 'Execution Successful' : 'Execution Failed'}
            </Typography>
            {time !== undefined && (
              <Chip 
                size="small" 
                label={`Time: ${formatTime(parseFloat(time) * 1000)}`} 
                color="default"
                sx={{ fontWeight: 'bold', bgcolor: 'rgba(255,255,255,0.2)' }}
              />
            )}
            {memory !== undefined && (
              <Chip 
                size="small" 
                label={`Memory: ${formatMemory(memory)}`}
                color="default"
                sx={{ fontWeight: 'bold', bgcolor: 'rgba(255,255,255,0.2)', ml: 1 }}
              />
            )}
          </Box>
          
          {/* Compilation errors */}
          {compile && compile.stderr && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 0.5 }}>
                Compilation Error:
              </Typography>
              <Paper
                sx={{
                  p: 1,
                  bgcolor: 'background.paper',
                  color: 'error.main',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  overflow: 'auto',
                  maxHeight: 200
                }}
              >
                {compile.stderr}
              </Paper>
            </Box>
          )}
          
          {/* Standard output */}
          {stdout && (
            <Box sx={{ mb: stdout && stderr ? 2 : 0 }}>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 0.5 }}>
                Standard Output:
              </Typography>
              <Paper
                sx={{
                  p: 1,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  overflow: 'auto',
                  maxHeight: 200
                }}
              >
                {stdout || '(No output)'}
              </Paper>
            </Box>
          )}
          
          {/* Standard error */}
          {stderr && (
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 0.5 }}>
                Standard Error:
              </Typography>
              <Paper
                sx={{
                  p: 1,
                  bgcolor: 'background.paper',
                  color: 'error.main',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  overflow: 'auto',
                  maxHeight: 200
                }}
              >
                {stderr}
              </Paper>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  // Render test case results
  const renderTestCaseResults = () => {
    if (testCaseResults.length === 0) return null;
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Case Results
        </Typography>
        <Paper variant="outlined" sx={{ p: 0 }}>
          <List sx={{ p: 0 }}>
            {testCaseResults.map((result, index) => (
              <ListItem 
                key={index}
                divider={index < testCaseResults.length - 1}
                sx={{ 
                  bgcolor: result.passed ? 'success.light' : 'error.light',
                  borderRadius: index === 0 ? '4px 4px 0 0' : index === testCaseResults.length - 1 ? '0 0 4px 4px' : 0,
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      {result.passed ? (
                        <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                      ) : (
                        <CancelIcon color="error" sx={{ mr: 1 }} />
                      )}
                      Test Case #{result.index + 1}
                    </Typography>
                    <Chip 
                      label={`${formatTime(result.executionTime)}`} 
                      size="small" 
                      color={result.passed ? "success" : "error"}
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Expected Output:
                      </Typography>
                      <Paper 
                        sx={{ 
                          p: 1, 
                          bgcolor: 'background.paper',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          maxHeight: '100px',
                          overflow: 'auto'
                        }}
                      >
                        {result.expected || '(No output)'}
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Actual Output:
                      </Typography>
                      <Paper 
                        sx={{ 
                          p: 1, 
                          bgcolor: 'background.paper',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          maxHeight: '100px',
                          overflow: 'auto',
                          border: !result.passed ? '1px solid' : 'none',
                          borderColor: 'error.main'
                        }}
                      >
                        {result.actual || '(No output)'}
                      </Paper>
                    </Grid>
                    
                    {result.error && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="error" gutterBottom>
                          Error:
                        </Typography>
                        <Paper 
                          sx={{ 
                            p: 1, 
                            bgcolor: 'background.paper',
                            color: 'error.main',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            maxHeight: '100px',
                            overflow: 'auto'
                          }}
                        >
                          {result.error}
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    );
  };

  // Handle change for MCQ options
  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...formData.options];
    
    if (field === 'isCorrect') {
      // Set all options to false first if selecting a new correct option
      if (value) {
        updatedOptions.forEach(option => option.isCorrect = false);
      }
      updatedOptions[index][field] = value;
    } else {
      updatedOptions[index][field] = value;
    }
    
    setFormData({
      ...formData,
      options: updatedOptions
    });
    
    // Clear option-related errors
    if (errors.options || errors.optionsEmpty) {
      setErrors({
        ...errors,
        options: '',
        optionsEmpty: ''
      });
    }
  };

  // Add a new option for MCQ questions
  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { text: '', isCorrect: false }]
    });
  };

  // Remove an option
  const removeOption = (index) => {
    const updatedOptions = [...formData.options];
    updatedOptions.splice(index, 1);
    setFormData({
      ...formData,
      options: updatedOptions
    });
  };

  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.type === 'mcq') {
      // At least one option must be marked as correct
      const hasCorrectOption = formData.options.some(option => option.isCorrect);
      if (!hasCorrectOption) {
        newErrors.options = 'At least one option must be marked as correct';
      }
      
      // All options should have text
      const emptyOptions = formData.options.some(option => !option.text.trim());
      if (emptyOptions) {
        newErrors.optionsEmpty = 'All options must have text';
      }
    } else if (formData.type === 'programming') {
      // Ensure at least one language is selected
      if (formData.languages.length === 0) {
        newErrors.languages = 'At least one programming language must be selected';
      }
      
      // Validate that there is a default language
      if (!formData.defaultLanguage) {
        newErrors.defaultLanguage = 'A default language must be selected';
      }
      
      // Each language should have a boilerplate code
      const invalidLanguages = formData.languages.some(lang => !lang.boilerplateCode);
      if (invalidLanguages) {
        newErrors.languageCode = 'All languages must have boilerplate code';
      }
      
      // Ensure at least one test case for validation
      if (formData.testCases.length === 0) {
        newErrors.testCases = 'At least one test case is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // For programming questions, validate test cases against solution before submitting
      if (formData.type === 'programming' && formData.testCases.length > 0) {
        setIsRunningTest(true);
        
        try {
          // Get the default language
          const defaultLang = formData.languages.find(lang => lang.name === formData.defaultLanguage);
          
          if (!defaultLang || !defaultLang.solutionCode) {
            toast.error('Please provide a solution code for the default language first');
            setIsRunningTest(false);
            return;
          }
          
          // Use the simple validation approach
          const results = await simpleValidateAllTestCases();
          
          // Check if all test cases pass
          const allPassed = results.every(result => result.passed);
          
          if (allPassed) {
            toast.success('All test cases validated successfully!');
            
            // Create a modified form data with only relevant fields based on question type
            const finalFormData = { ...formData };
            
            // Remove programming-specific fields for MCQ questions
            if (formData.type === 'mcq') {
              delete finalFormData.languages;
              delete finalFormData.defaultLanguage;
              delete finalFormData.testCases;
              delete finalFormData.examples;
              delete finalFormData.constraints;
            }
            
            onSave(finalFormData);
          } else {
            toast.error('Cannot submit question until all test cases pass with your solution code.');
          }
        } catch (error) {
          console.error('Error validating test cases:', error);
          toast.error('Failed to validate test cases');
        } finally {
          setIsRunningTest(false);
        }
      } else {
        // For non-programming questions or if no test cases, submit directly
        // Create a modified form data with only relevant fields based on question type
        const finalFormData = { ...formData };
        
        // Remove programming-specific fields for MCQ questions
        if (formData.type === 'mcq') {
          delete finalFormData.languages;
          delete finalFormData.defaultLanguage;
          delete finalFormData.testCases;
          delete finalFormData.examples;
          delete finalFormData.constraints;
        }
        
        onSave(finalFormData);
      }
    } else {
      toast.error('Please fix the form errors before submitting');
    }
  };

  // Add a new language
  const handleLanguageSelect = (languageName) => {
    // Check if the language is already added
    if (formData.languages.some(lang => lang.name === languageName)) {
      toast.info('This language is already added');
      return;
    }
    
    // Find the language details
    const language = LANGUAGES.find(lang => lang.name === languageName);
    
    if (language) {
      const newLanguage = {
        name: language.name,
        version: language.version,
        boilerplateCode: language.defaultCode,
        solutionCode: ''
      };
      
      // Add the new language
      const updatedLanguages = [...formData.languages, newLanguage];
      setFormData({
        ...formData,
        languages: updatedLanguages,
        // Set as default if it's the first language
        defaultLanguage: formData.defaultLanguage || language.name
      });
    }
  };

  // Remove a language
  const removeLanguage = (index) => {
    const updatedLanguages = [...formData.languages];
    const removedLanguage = updatedLanguages[index];
    updatedLanguages.splice(index, 1);
    
    // Update default language if the removed one was the default
    let newDefaultLanguage = formData.defaultLanguage;
    if (removedLanguage.name === formData.defaultLanguage) {
      newDefaultLanguage = updatedLanguages.length > 0 ? updatedLanguages[0].name : '';
    }
    
    setFormData({
      ...formData,
      languages: updatedLanguages,
      defaultLanguage: newDefaultLanguage
    });
  };

  // Update language boilerplate or solution code
  const handleCodeChange = (index, field, value) => {
    const updatedLanguages = [...formData.languages];
    updatedLanguages[index][field] = value;
    
    setFormData({
      ...formData,
      languages: updatedLanguages
    });
  };

  // Set a language as the default
  const handleSetDefaultLanguage = (languageName) => {
    setFormData({
      ...formData,
      defaultLanguage: languageName
    });
  };

  // Handle test case input changes
  const handleTestCaseChange = (field, value) => {
    setNewTestCase({
      ...newTestCase,
      [field]: value
    });
  };

  // Add a new test case
  const addTestCase = () => {
    if (!newTestCase.input.trim() || !newTestCase.output.trim()) {
      toast.error('Input and output are required for test cases');
      return;
    }
    
    // Add the new test case
    const updatedTestCases = [...formData.testCases, { ...newTestCase }];
    
    setFormData({
      ...formData,
      testCases: updatedTestCases
    });
    
    // Reset the form
    setNewTestCase({
      input: '',
      output: '',
      hidden: false,
      explanation: ''
    });
    
    // Clear test case related errors
    if (errors.testCases) {
      setErrors({
        ...errors,
        testCases: ''
      });
    }
  };

  // Remove a test case
  const removeTestCase = (index) => {
    const updatedTestCases = [...formData.testCases];
    updatedTestCases.splice(index, 1);
    
    setFormData({
      ...formData,
      testCases: updatedTestCases
    });
  };

  // Handle example input changes
  const handleExampleChange = (field, value) => {
    setNewExample({
      ...newExample,
      [field]: value
    });
  };

  // Add a new example
  const addExample = () => {
    if (!newExample.input.trim() || !newExample.output.trim()) {
      toast.error('Input and output are required for examples');
      return;
    }
    
    // Add the new example
    setFormData({
      ...formData,
      examples: [...formData.examples, { ...newExample }]
    });
    
    // Reset the form
    setNewExample({
      input: '',
      output: '',
      explanation: ''
    });
  };

  // Remove an example
  const removeExample = (index) => {
    const updatedExamples = [...formData.examples];
    updatedExamples.splice(index, 1);
    
    setFormData({
      ...formData,
      examples: updatedExamples
    });
  };

  // Add a new hint
  const handleAddHint = () => {
    if (!newHint.trim()) {
      toast.error('Hint text is required');
      return;
    }
    
    setFormData({
      ...formData,
      hints: [...formData.hints, newHint]
    });
    
    setNewHint('');
  };

  // Remove a hint
  const removeHint = (index) => {
    const updatedHints = [...formData.hints];
    updatedHints.splice(index, 1);
    
    setFormData({
      ...formData,
      hints: updatedHints
    });
  };

  // Add a new tag
  const handleAddTag = () => {
    if (!newTag.trim()) {
      toast.error('Tag text is required');
      return;
    }
    
    setFormData({
      ...formData,
      tags: [...formData.tags, newTag]
    });
    
    setNewTag('');
  };

  // Remove a tag
  const removeTag = (index) => {
    const updatedTags = [...formData.tags];
    updatedTags.splice(index, 1);
    
    setFormData({
      ...formData,
      tags: updatedTags
    });
  };

  // Add a new company
  const handleAddCompany = () => {
    if (!newCompany.trim()) {
      toast.error('Company name is required');
      return;
    }
    
    setFormData({
      ...formData,
      companies: [...formData.companies, newCompany]
    });
    
    setNewCompany('');
  };

  // Remove a company
  const removeCompany = (index) => {
    const updatedCompanies = [...formData.companies];
    updatedCompanies.splice(index, 1);
    
    setFormData({
      ...formData,
      companies: updatedCompanies
    });
  };

  // Handle JSON file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const questionData = JSON.parse(content);
        
        console.log('Parsed question data from JSON:', questionData);
        
        // Validate the structure of the JSON file
        if (!questionData.title || !questionData.description || !questionData.type) {
          toast.error('Invalid question format. JSON must include title, description, and type.');
          setIsUploading(false);
          return;
        }
        
        // Create a complete form data from the JSON
        const updatedFormData = {
          // Add module ID and preserve default structure
          module: moduleId,
          
          // These fields should exist in any question JSON
          title: questionData.title || '',
          description: questionData.description || '',
          type: questionData.type || 'programming',
          difficultyLevel: questionData.difficultyLevel || 'medium',
          marks: questionData.marks ? Number(questionData.marks) : 10,
          
          // Type-specific fields
          options: questionData.type === 'mcq' && questionData.options ? 
            questionData.options : 
            [
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false }
            ],
          
          languages: questionData.type === 'programming' && questionData.languages ? 
            questionData.languages : 
            [
              {
                name: 'java',
                version: '15.0.2',
                boilerplateCode: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
                solutionCode: ''
              }
            ],
          
          defaultLanguage: questionData.type === 'programming' ? 
            (questionData.defaultLanguage || 'java') : 'java',
          
          testCases: questionData.type === 'programming' && questionData.testCases ? 
            questionData.testCases : [],
          
          examples: questionData.type === 'programming' && questionData.examples ? 
            questionData.examples : [],
          
          constraints: questionData.type === 'programming' && questionData.constraints ? 
            questionData.constraints : {
              timeLimit: 1000,
              memoryLimit: 256
            },
          
          // Additional fields
          hints: questionData.hints || [],
          tags: questionData.tags || [],
          companies: questionData.companies || [],
          maintag: questionData.maintag || ''
        };
        
        console.log('Setting form data from JSON:', updatedFormData);
        setFormData(updatedFormData);
        
        // Set default test run language based on question data
        if (updatedFormData.type === 'programming' && updatedFormData.languages.length > 0) {
          setTestRunLanguage(updatedFormData.defaultLanguage || updatedFormData.languages[0].name);
        }
        
        toast.success('Question data loaded successfully from JSON');
        setActiveTab(0); // Reset to first tab to show loaded data
        
      } catch (error) {
        console.error('Error parsing JSON:', error);
        toast.error('Failed to parse JSON file. Please check the file format.');
      } finally {
        setIsUploading(false);
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    reader.onerror = () => {
      toast.error('Error reading file');
      setIsUploading(false);
    };
    
    reader.readAsText(file);
  };
  
  const handleUploadButtonClick = () => {
    fileInputRef.current.click();
  };

  // Search for questions
  const handleSearchQuestions = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      console.log('Searching for questions with query:', searchQuery);
      
      // Fix the API endpoint URL to match our backend route
      const response = await axios.get(`/practice-arena/questions/search?q=${encodeURIComponent(searchQuery)}`);
      console.log('Search response:', response.data);
      
      setSearchResults(response.data);
      
      if (response.data.length === 0) {
        toast.info('No questions found matching your search');
      } else {
        toast.success(`Found ${response.data.length} questions matching your search`);
      }
    } catch (error) {
      console.error('Error searching for questions:', error);
      
      // More detailed error logging
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // Check if the error is a 404 (endpoint not found)
        if (error.response.status === 404) {
          toast.error('Search endpoint not found. Please check your API configuration.');
          console.error('API URL being used:', axios.defaults.baseURL);
        } else {
          toast.error(`Search failed: ${error.response.status} ${error.response.data.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        toast.error('Search failed: No response from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error(`Search failed: ${error.message}`);
      }
    } finally {
      setIsSearching(false);
    }
  };
  
  // Load question data into form
  const handleLoadQuestion = (question) => {
    setFormData({
      title: question.title || '',
      description: question.description || '',
      type: question.type || 'programming',
      difficultyLevel: question.difficultyLevel || 'medium',
      marks: question.marks ? Number(question.marks) : 10,
      module: moduleId,
      options: question.options && question.options.length > 0 
        ? question.options 
        : [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ],
      languages: question.languages && question.languages.length > 0
        ? question.languages
        : [
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
      constraints: {
        timeLimit: question.constraints?.timeLimit ? Number(question.constraints.timeLimit) : 1000,
        memoryLimit: question.constraints?.memoryLimit ? Number(question.constraints.memoryLimit) : 256
      },
      hints: question.hints || [],
      tags: question.tags || [],
      companies: question.companies || [],
      maintag: question.maintag || ''
    });
    
    // Set other properties as needed
    if (question.type === 'programming') {
      setTestRunLanguage(question.defaultLanguage || 'java');
    }
    
    setIsSearchDialogOpen(false);
    setSearchResults([]);
    setSearchQuery('');
    toast.success(`Question "${question.title}" loaded successfully`);
  };
  
  // Toggle search dialog
  const toggleSearchDialog = () => {
    setIsSearchDialogOpen(!isSearchDialogOpen);
    if (!isSearchDialogOpen) {
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        {/* Add JSON upload option at the top of the form */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderColor: 'primary.main',
            bgcolor: 'background.paper',
            width: '48%'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Upload Question JSON
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            Upload a JSON file with question details to automatically populate the form.
          </Typography>
          
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          
          <Button
            variant="contained"
            startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            onClick={handleUploadButtonClick}
            disabled={isUploading}
            sx={{ width: 'fit-content' }}
          >
            {isUploading ? 'Processing...' : 'Upload Question JSON'}
          </Button>
        </Paper>
        
        {/* Add search functionality */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderColor: 'secondary.main',
            bgcolor: 'background.paper',
            width: '48%'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Search Existing Questions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            Search for existing questions to load into the form.
          </Typography>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SearchIcon />}
            onClick={toggleSearchDialog}
            sx={{ width: 'fit-content' }}
          >
            Search Questions
          </Button>
          
          {/* Search Dialog */}
          <Dialog 
            open={isSearchDialogOpen} 
            onClose={toggleSearchDialog}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>
              Search Questions
              <IconButton
                aria-label="close"
                onClick={toggleSearchDialog}
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
            <DialogContent>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  label="Search by title, description, or tags"
                  variant="outlined"
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchQuestions();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          edge="end" 
                          onClick={handleSearchQuestions}
                          disabled={isSearching}
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              {isSearching ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : searchResults.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Difficulty</TableCell>
                        <TableCell>Marks</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchResults.map((question) => (
                        <TableRow key={question._id} hover>
                          <TableCell>{question.title}</TableCell>
                          <TableCell>
                            <Chip 
                              size="small" 
                              color={question.type === 'programming' ? 'primary' : 'secondary'}
                              label={question.type === 'programming' ? 'Programming' : 'MCQ'}
                            />
                          </TableCell>
                          <TableCell>{question.difficultyLevel}</TableCell>
                          <TableCell>{question.marks}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<ContentCopyIcon />}
                              onClick={() => handleLoadQuestion(question)}
                            >
                              Load
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
                  No search results. Enter keywords and press search.
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={toggleSearchDialog}>Close</Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Box>
      
      {/* Always show all tabs but disable ones that aren't applicable */}
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        aria-label="question form tabs"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Basic Info" />
        {formData.type === 'mcq' ? (
          <Tab label="Options" />
        ) : (
          <Tab label="Languages" />
        )}
        {formData.type === 'programming' && (
          <Tab label="Test Cases" />
        )}
        <Tab 
          label="Additional Details" 
          disabled={formData.type === 'programming' && activeTab === 1 && formData.languages.length === 0}
        />
      </Tabs>
      
      {/* Basic Info Tab - Always index 0 */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!errors.title}
                helperText={errors.title}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Description*
              </Typography>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={8}
                error={!!errors.description}
                helperText={errors.description}
                placeholder="Enter question description..."
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  label="Question Type"
                >
                  <MenuItem value="programming">Programming</MenuItem>
                  <MenuItem value="mcq">Multiple Choice</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  name="difficultyLevel"
                  value={formData.difficultyLevel}
                  onChange={handleInputChange}
                  label="Difficulty Level"
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                label="Marks"
                name="marks"
                type="number"
                value={formData.marks}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />
            </Grid>
            
            {formData.type === 'programming' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Time Limit (ms)"
                    type="number"
                    value={formData.constraints.timeLimit}
                    onChange={(e) => handleNestedInputChange(e, 'constraints', 'timeLimit')}
                    fullWidth
                    InputProps={{
                      inputProps: { min: 100, max: 10000 }
                    }}
                    helperText="Time limit in milliseconds (100-10000)"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Memory Limit (MB)"
                    type="number"
                    value={formData.constraints.memoryLimit}
                    onChange={(e) => handleNestedInputChange(e, 'constraints', 'memoryLimit')}
                    fullWidth
                    InputProps={{
                      inputProps: { min: 16, max: 512 }
                    }}
                    helperText="Memory limit in megabytes (16-512)"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      )}
      
      {/* Second Tab: Either Options (MCQ) or Languages (Programming) - Always index 1 */}
      {activeTab === 1 && formData.type === 'mcq' && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Options
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add multiple options and mark the correct one(s).
          </Typography>
          
          {errors.options && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              {errors.options}
            </Alert>
          )}
          
          {errors.optionsEmpty && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              {errors.optionsEmpty}
            </Alert>
          )}
          
          <List>
            {formData.options.map((option, index) => (
              <ListItem 
                key={index} 
                sx={{ 
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <FormControlLabel
                  control={
                    <Radio
                      checked={option.isCorrect}
                      onChange={() => handleOptionChange(index, 'isCorrect', true)}
                      color="primary"
                    />
                  }
                  label=""
                />
                
                <TextField
                  value={option.text}
                  onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                  fullWidth
                  placeholder={`Option ${index + 1}`}
                  variant="standard"
                />
                
                <IconButton 
                  edge="end" 
                  onClick={() => removeOption(index)}
                  disabled={formData.options.length <= 2}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
          
          <Button
            startIcon={<AddIcon />}
            onClick={addOption}
            sx={{ mt: 1 }}
          >
            Add Option
          </Button>
        </Box>
      )}
      
      {activeTab === 1 && formData.type === 'programming' && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Supported Languages
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add programming languages that this problem supports, with boilerplate and solution code.
          </Typography>
          
          {errors.languages && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              {errors.languages}
            </Alert>
          )}
          
          {errors.defaultLanguage && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              {errors.defaultLanguage}
            </Alert>
          )}
          
          {errors.languageCode && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              {errors.languageCode}
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add Language
            </Typography>
            <FormControl variant="outlined" fullWidth sx={{ mb: 2 }}>
              <InputLabel id="select-language-label" shrink htmlFor="select-language">Select Language</InputLabel>
              <Select
                labelId="select-language-label"
                id="select-language"
                value=""
                onChange={(e) => handleLanguageSelect(e.target.value)}
                label="Select Language"
                displayEmpty
                disabled={isLoadingRuntimes}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300
                    }
                  }
                }}
                sx={{
                  height: 56,
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    paddingTop: 0,
                    paddingBottom: 0
                  }
                }}
              >
                <MenuItem value="" disabled>
                  {isLoadingRuntimes ? 'Loading languages...' : 'Select a language to add'}
                </MenuItem>
                {LANGUAGES.map((lang) => (
                  <MenuItem 
                    key={lang.name} 
                    value={lang.name}
                    disabled={formData.languages.some(l => l.name === lang.name)}
                  >
                    {lang.displayName} ({lang.version})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {formData.languages.length > 0 ? (
            formData.languages.map((lang, index) => {
              const language = LANGUAGES.find(l => l.name === lang.name);
              return (
                <Box key={index} sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {language?.displayName || lang.name} ({lang.version})
                      </Typography>
                      {formData.defaultLanguage === lang.name && (
                        <Chip 
                          label="Default" 
                          color="primary" 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                    <Box>
                      {formData.defaultLanguage !== lang.name && (
                        <Button
                          size="small"
                          onClick={() => handleSetDefaultLanguage(lang.name)}
                          sx={{ mr: 1 }}
                        >
                          Set as Default
                        </Button>
                      )}
                      <IconButton 
                        color="error" 
                        onClick={() => removeLanguage(index)}
                        disabled={formData.languages.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Boilerplate Code
                  </Typography>
                  <Editor
                    height="200px"
                    defaultLanguage={lang.name}
                    value={lang.boilerplateCode}
                    onChange={(value) => handleCodeChange(index, 'boilerplateCode', value)}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14
                    }}
                  />
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Solution Code
                  </Typography>
                  <Editor
                    height="200px"
                    defaultLanguage={lang.name}
                    value={lang.solutionCode}
                    onChange={(value) => handleCodeChange(index, 'solutionCode', value)}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14
                    }}
                  />
                  
                  {/* Add test functionality directly under the solution code */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Test Input
                    </Typography>
                    <TextField
                      multiline
                      rows={3}
                      fullWidth
                      placeholder="Enter test input to run against the solution"
                      value={lang.name === testRunLanguage ? testRunInput : ''}
                      onChange={(e) => {
                        setTestRunLanguage(lang.name);
                        setTestRunInput(e.target.value);
                      }}
                      sx={{ mb: 2 }}
                      variant="outlined"
                    />
                    
                    <Button
                      variant="contained"
                      onClick={() => {
                        setTestRunLanguage(lang.name);
                        handleTestRun();
                      }}
                      disabled={isRunningTest || !lang.solutionCode}
                      startIcon={isRunningTest && testRunLanguage === lang.name ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                      sx={{ mb: 2 }}
                    >
                      Run Solution
                    </Button>
                    
                    {/* Show test result only for the currently selected language */}
                    {testRunLanguage === lang.name && testRunResult && renderTestRunResult()}
                  </Box>
                </Box>
              );
            })
          ) : (
            <Alert severity="info">
              No languages added yet. Please add at least one language.
            </Alert>
          )}
        </Box>
      )}
      
      {/* Third Tab: Test Cases (Programming only) - Always index 2 */}
      {activeTab === 2 && formData.type === 'programming' && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Test Cases
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add test cases to validate user submissions. Hidden test cases will not be visible to users.
            Test cases will be validated against the solution code provided in the Languages tab.
          </Typography>
          
          {errors.testCases && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              {errors.testCases}
            </Alert>
          )}
          
          <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add Test Case
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Input"
                  value={newTestCase.input}
                  onChange={(e) => handleTestCaseChange('input', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Enter input data"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Expected Output"
                  value={newTestCase.output}
                  onChange={(e) => handleTestCaseChange('output', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Enter expected output"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Explanation"
                  value={newTestCase.explanation}
                  onChange={(e) => handleTestCaseChange('explanation', e.target.value)}
                  fullWidth
                  placeholder="Explain this test case (optional)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newTestCase.hidden}
                      onChange={(e) => handleTestCaseChange('hidden', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Hidden Test Case (not visible to users)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addTestCase}
                  disabled={!newTestCase.input.trim() || !newTestCase.output.trim()}
                >
                  Add Test Case
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Test Cases ({formData.testCases.length})
          </Typography>
          
          {formData.testCases.length > 0 ? (
            <>
              {/* Add note that test cases use solution from Languages tab */}
              <Alert severity="info" sx={{ mb: 2 }}>
                Test cases will be validated against the solution code provided in the Languages tab.
                Make sure you've entered and tested your solution before validating test cases.
              </Alert>
              
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={isRunningTest ? <CircularProgress size={24} /> : <CheckCircleIcon />}
                  onClick={validateAllTestCases}
                  disabled={isRunningTest || !formData.languages.find(lang => lang.name === formData.defaultLanguage)?.solutionCode}
                >
                  Validate All Test Cases
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  This will test all cases using the solution code from the default language ({formData.defaultLanguage})
                </Typography>
              </Box>
              <List>
                {formData.testCases.map((testCase, index) => (
                  <ListItem 
                    key={index} 
                    sx={{ 
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      display: 'block',
                      p: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">
                        Test Case #{index + 1}
                        {testCase.hidden && (
                          <Chip 
                            label="Hidden" 
                            size="small" 
                            sx={{ ml: 1 }} 
                            color="secondary"
                          />
                        )}
                      </Typography>
                      <Box>
                        <Button
                          size="small"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => testTestCase(testCase)}
                          disabled={isRunningTest}
                          sx={{ mr: 1 }}
                        >
                          {isRunningTest ? 'Testing...' : 'Test'}
                        </Button>
                        <IconButton 
                          edge="end" 
                          onClick={() => removeTestCase(index)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Input:
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 1, 
                            bgcolor: 'background.default',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            whiteSpace: 'pre-wrap',
                            minHeight: '50px',
                            maxHeight: '100px',
                            overflow: 'auto'
                          }}
                        >
                          {testCase.input}
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Expected Output:
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 1, 
                            bgcolor: 'background.default',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            whiteSpace: 'pre-wrap',
                            minHeight: '50px',
                            maxHeight: '100px',
                            overflow: 'auto'
                          }}
                        >
                          {testCase.output}
                        </Paper>
                      </Grid>
                      
                      {testCase.explanation && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Explanation:
                          </Typography>
                          <Typography variant="body2">
                            {testCase.explanation}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </ListItem>
                ))}
              </List>
              
              {renderTestCaseResults()}
            </>
          ) : (
            <Alert severity="info">
              No test cases added yet. Please add at least one test case.
            </Alert>
          )}
        </Box>
      )}
      
      {/* Fourth Tab: Additional Details - Index 2 for MCQ, 3 for Programming */}
      {((activeTab === 2 && formData.type === 'mcq') || (activeTab === 3 && formData.type === 'programming')) && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Examples
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Add examples to help users understand the problem.
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      label="Input"
                      value={newExample.input}
                      onChange={(e) => handleExampleChange('input', e.target.value)}
                      multiline
                      rows={2}
                      fullWidth
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={5}>
                    <TextField
                      label="Output"
                      value={newExample.output}
                      onChange={(e) => handleExampleChange('output', e.target.value)}
                      multiline
                      rows={2}
                      fullWidth
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={addExample}
                      disabled={!newExample.input.trim() || !newExample.output.trim()}
                      fullWidth
                    >
                      Add
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Explanation"
                      value={newExample.explanation}
                      onChange={(e) => handleExampleChange('explanation', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>
                
                {formData.examples.length > 0 && (
                  <List>
                    {formData.examples.map((example, index) => (
                      <ListItem 
                        key={index} 
                        sx={{ 
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          display: 'block',
                          p: 2
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2">
                            Example #{index + 1}
                          </Typography>
                          <IconButton 
                            edge="end" 
                            onClick={() => removeExample(index)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Input:
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                              {example.input}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Output:
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                              {example.output}
                            </Typography>
                          </Grid>
                          
                          {example.explanation && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">
                                Explanation:
                              </Typography>
                              <Typography variant="body2">
                                {example.explanation}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Hints
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Provide hints to help users solve the problem.
                </Typography>
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <TextField
                    label="Add Hint"
                    value={newHint}
                    onChange={(e) => setNewHint(e.target.value)}
                    fullWidth
                    sx={{ mr: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddHint}
                    disabled={!newHint.trim()}
                  >
                    Add
                  </Button>
                </Box>
                
                {formData.hints.length > 0 && (
                  <List>
                    {formData.hints.map((hint, index) => (
                      <ListItem 
                        key={index}
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            onClick={() => removeHint(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={`Hint #${index + 1}`}
                          secondary={hint}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Add tags to categorize this question.
                </Typography>
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <TextField
                    label="Add Tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    fullWidth
                    sx={{ mr: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    Add
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => removeTag(index)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Companies
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Add companies that have asked this or similar questions.
                </Typography>
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <TextField
                    label="Add Company"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    fullWidth
                    sx={{ mr: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddCompany}
                    disabled={!newCompany.trim()}
                  >
                    Add
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.companies.map((company, index) => (
                    <Chip
                      key={index}
                      label={company}
                      onDelete={() => removeCompany(index)}
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
        >
          {isEdit ? 'Update Question' : 'Create Question'}
        </Button>
      </Box>
    </Box>
  );
};

export default QuestionForm; 