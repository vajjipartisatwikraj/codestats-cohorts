import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import SpeedIcon from '@mui/icons-material/Speed';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import ScoreIcon from '@mui/icons-material/Score';

const TestCasesPanel = ({ 
  question, 
  testResults, 
  darkMode, 
  testCasesPanelHeight, 
  testPanelResizerRef, 
  startTestPanelResize, 
  isResizingTestPanel,
  output,
  isSubmission = false // Flag to indicate submission mode (for UI styling only)
}) => {
  
  // State to track active test case
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);

  // Function to parse multi-test case input format - memoized to prevent recomputation
  const parseMultiTestCaseInput = useCallback((rawInput) => {
    if (!rawInput) return [];
    
    // Split the input by newlines
    const lines = rawInput.trim().split('\n');
    
    // First line should contain the number of test cases T
    const numTestCases = parseInt(lines[0], 10);
    
    if (isNaN(numTestCases) || numTestCases <= 0) {
      console.error("Invalid number of test cases:", lines[0]);
      return [];
    }
    
    // For each test case, we just need to get the corresponding line after T
    let parsedTestCases = [];
    
    // Starting from index 1 (after T) take the next numTestCases lines
    for (let i = 0; i < numTestCases; i++) {
      const lineIndex = i + 1; // Skip the first line (T)
      if (lineIndex < lines.length) {
        parsedTestCases.push(lines[lineIndex]);
      } else {
        console.error("Not enough lines for test case", i + 1);
      }
    }
    
    return parsedTestCases;
  }, []);
  
  // Function to parse multi-test case output format - memoized
  const parseMultiTestCaseOutput = useCallback((rawOutput) => {
    if (!rawOutput) return [];
    
    // Split the output by newlines to get individual test case outputs
    const outputLines = rawOutput.trim().split('\n');
    return outputLines;
  }, []);
  
  // Memoize the processed test cases to prevent recalculation on each render
  const processedTestCases = useMemo(() => {
    // Process the original test cases into individual test cases
    const processTestCases = () => {
      // Get the test cases to process
      let testCasesToProcess = question.testCases;
      
      // If we only have testResults with specific testCaseIds, make sure we only process those
      if (testResults && testResults.length > 0) {
        // Get the test cases that match the testCaseIds in testResults
        const matchingTestCases = question.testCases.filter(tc => {
          return testResults.some(r => r.testCaseId === tc._id);
        });
        
        if (matchingTestCases.length > 0) {
          testCasesToProcess = matchingTestCases;
        }
      }
      
      // Process each test case
      let allProcessedTestCases = [];
      
      for (const testCase of testCasesToProcess) {
        // Skip if there's no input
        if (!testCase || !testCase.input) continue;
        
        try {
          // Try to parse the input as a multi-test case format
          const parsedInputs = parseMultiTestCaseInput(testCase.input);
          const parsedOutputs = parseMultiTestCaseOutput(testCase.output);
          
          // If we successfully parsed multiple test cases
          if (parsedInputs.length > 0) {
            const parsedTestCases = parsedInputs.map((input, index) => ({
              ...testCase,
              _id: `${testCase._id}-${index}`,
              input: input,
              output: index < parsedOutputs.length ? parsedOutputs[index] : '',
              _isGeneratedTestCase: true,
              _originalIndex: index,
              _originalTestCaseId: testCase._id, // Store the original test case ID
              hidden: testCase.hidden // Preserve the hidden flag
            }));
            
            allProcessedTestCases = [...allProcessedTestCases, ...parsedTestCases];
          } else {
            // If parsing fails, keep the original test case
            allProcessedTestCases.push(testCase);
          }
        } catch (error) {
          // If parsing fails, keep the original test case
          allProcessedTestCases.push(testCase);
        }
      }
      
      return allProcessedTestCases;
    };
    
    return processTestCases();
  }, [question.testCases, testResults, parseMultiTestCaseInput, parseMultiTestCaseOutput]);
  
  // Memoize the relevant test cases to prevent recalculation
  const relevantTestCases = useMemo(() => {
    // Filter test cases based on the isSubmission flag
    return isSubmission 
      ? processedTestCases.filter(tc => tc.hidden) 
      : processedTestCases.filter(tc => !tc.hidden);
  }, [processedTestCases, isSubmission]);
  
  // Memoize the processed test results
  const processedTestResults = useMemo(() => {
    // Process test results to match the individual test cases
    const processTestResults = () => {
      if (!testResults || !Array.isArray(testResults) || testResults.length === 0) {
        return [];
      }
      
      // No filtering by hidden status - use all results
      const relevantResults = testResults;
      
      // Create a map of processed test cases by original test case ID
      const processedTestCasesByOriginal = {};
      relevantTestCases.forEach(tc => {
        const originalId = tc._originalTestCaseId || tc._id;
        if (!processedTestCasesByOriginal[originalId]) {
          processedTestCasesByOriginal[originalId] = [];
        }
        processedTestCasesByOriginal[originalId].push(tc);
      });
      
      let allProcessedResults = [];
      
      // Process each test result
      for (const result of relevantResults) {
        const testCaseId = result.testCaseId;
        
        // Find all processed test cases for this original test case
        const matchingTestCases = processedTestCasesByOriginal[testCaseId] || [];
        
        if (matchingTestCases.length > 1) {
          // This was a multi-test case that got split into multiple ones
          
          // For output, split by newlines
          const outputLines = result.actual ? result.actual.trim().split('\n') : [];
          const numLines = outputLines.length;
          
          // Create individual results for each processed test case
          const individualResults = matchingTestCases.map((tc, index) => {
            // Compare the actual output with expected output to determine if passed
            const expectedOutput = tc.output.trim();
            const actualOutput = index < numLines ? outputLines[index].trim() : '';
            
            // Determine if this specific test case passed
            const passed = expectedOutput === actualOutput;
            
            return {
              ...result,
              testCaseId: tc._id,
              passed: passed, // Each test case has its own pass status
              input: tc.input,
              expectedOutput: expectedOutput,
              actualOutput: actualOutput,
              _originalIndex: index,
              _originalTestCaseId: testCaseId,
              hidden: tc.hidden,
              executionTime: result.executionTime, // Use full execution time without dividing
              memoryUsed: result.memoryUsed // Keep same memory usage
            };
          });
          
          allProcessedResults = [...allProcessedResults, ...individualResults];
        } else if (matchingTestCases.length === 1) {
          // Single test case or couldn't be parsed
          const tc = matchingTestCases[0];
          
          allProcessedResults.push({
            ...result,
            testCaseId: tc._id,
            input: tc.input || result.input,
            expectedOutput: tc.output || result.expected,
            actualOutput: result.actual || '',
            _originalIndex: tc._originalIndex || 0,
            _originalTestCaseId: testCaseId,
            hidden: tc.hidden
          });
        } else {
          // No matching test cases found, just add the result as is
          allProcessedResults.push(result);
        }
      }
      
      return allProcessedResults;
    };
    
    return processTestResults();
  }, [testResults, relevantTestCases]);
  
  // Get the current test case to display
  const currentTestCase = relevantTestCases[activeTestCaseIndex] || relevantTestCases[0];

  // Get current test result if available
  const currentTestResult = processedTestResults && Array.isArray(processedTestResults)
    ? processedTestResults.find(tr => tr.testCaseId === currentTestCase?._id) ||
      processedTestResults.find(tr => tr._originalIndex === activeTestCaseIndex) ||
      processedTestResults[activeTestCaseIndex] || null
    : null;

  // Handle test case tab click
  const handleTestCaseClick = useCallback((index) => {
    setActiveTestCaseIndex(index);
  }, []);

  // Get test case result - memoized
  const getTestCaseResult = useCallback((testCase, index) => {
    if (!processedTestResults || !Array.isArray(processedTestResults)) return null;
    
    return processedTestResults.find(r => r.testCaseId === testCase._id) ||
           processedTestResults.find(r => r._originalIndex === index) ||
           (processedTestResults.length > index ? processedTestResults[index] : null);
  }, [processedTestResults]);
  
  // Calculate number of passed test cases - memoized
  const { passedCount, totalCount } = useMemo(() => {
    const passed = processedTestResults ? processedTestResults.filter(r => r.passed).length : 0;
    const total = relevantTestCases ? relevantTestCases.length : 0;
    return { passedCount: passed, totalCount: total };
  }, [processedTestResults, relevantTestCases]);

  // Function to clean and format the test case input for display - memoized
  const formatTestCaseInput = useCallback((input) => {
    if (!input) return '';
    
    // If the input is already an array (e.g., "[1,2,3]"), return it directly
    if (input.trim().startsWith('[') && input.trim().endsWith(']')) {
      return input.trim();
    }
    
    // Split the input by lines
    const lines = input.trim().split('\n');
    
    // For multi-test case format, we've already parsed it into individual test cases
    // So we just need to return the current input as is
    return input.trim();
  }, []);

  // Add a component to display performance statistics - memoized
  const PerformanceStats = useMemo(() => {
    return ({ testResults, darkMode }) => {
      if (!testResults || !Array.isArray(testResults) || testResults.length === 0) {
        return null;
      }
      
      // Use the exact raw runtime value from the first test result with NO manipulation
      const rawExecutionTime = testResults.length > 0 ? (testResults[0].executionTime || 0) : 0;
      
      // Get max memory used - check multiple possible property names
      let maxMemoryUsed = 0;
      testResults.forEach(result => {
        // Check various properties where memory data might be stored
        const memValue = result.memoryUsed || result.memory || 
                        (result.run && result.run.memory) || 0;
        if (memValue > maxMemoryUsed) {
          maxMemoryUsed = memValue;
        }
      });
      
      // Use the passed and total counts from the parent component
      const passedCount = testResults.filter(r => r.passed).length;
      const totalCount = testResults.length;
      
      return (
        <Box sx={{ 
          width: '100%',
          mt: 1
        }}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 1,
                bgcolor: darkMode ? 'rgba(0, 136, 204, 0.1)' : 'rgba(0, 136, 204, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <SpeedIcon sx={{ color: darkMode ? '#0088cc' : '#0077b6' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                    Runtime
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', color: darkMode ? '#0088cc' : '#0077b6' }}>
                    {rawExecutionTime} ms
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={4}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 1,
                bgcolor: darkMode ? 'rgba(156, 39, 176, 0.1)' : 'rgba(156, 39, 176, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <DeveloperBoardIcon sx={{ color: darkMode ? '#9c27b0' : '#7b1fa2' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                    Memory Used
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', color: darkMode ? '#9c27b0' : '#7b1fa2' }}>
                    {maxMemoryUsed} KB
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={4}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 1,
                bgcolor: passedCount === totalCount ?
                  (darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)') :
                  (darkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)'),
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <ScoreIcon sx={{ 
                  color: passedCount === totalCount ?
                    (darkMode ? '#4caf50' : '#2e7d32') :
                    (darkMode ? '#ff9800' : '#ed6c02')
                }} />
                <Box>
                  <Typography variant="caption" sx={{ color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                    Test Cases
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 'medium', 
                    color: passedCount === totalCount ?
                      (darkMode ? '#4caf50' : '#2e7d32') :
                      (darkMode ? '#ff9800' : '#ed6c02')
                  }}>
                    {isSubmission ? `${passedCount}/${totalCount} passed` : `${passedCount}/${totalCount} passed`}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      );
    };
  }, []);

  return (
    <>
      {/* Test panel resizer */}
      <Box
        ref={testPanelResizerRef}
        sx={{
          height: '4px',
          width: '100%',
          bgcolor: darkMode ? '#1A1A1A' : '#f0f2f5',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'row-resize',
          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          zIndex: 20,
          m: 0,
          p: 0,
          position: 'relative',
          top: '-10px',
          '&:hover': {
            bgcolor: darkMode ? '#252525' : '#e0e0e0',
          }
        }}
        onMouseDown={startTestPanelResize}
      >
        <Box
          sx={{
            width: '50px',
            height: '2px',
            borderRadius: '2px',
            bgcolor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
            '&:hover': {
              bgcolor: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
            }
          }}
        />
      </Box>

      {/* Test Cases Panel */}
      <Box sx={{ 
        borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        bgcolor: darkMode ? '#121212' : '#F5F7FA',
        height: `${testCasesPanelHeight}%`, 
        display: 'flex',
        flexDirection: 'column',
        m: 0,
        mt: -1,
        p: 0,
        position: 'relative',
        transition: isResizingTestPanel ? 'none' : 'height 0.1s ease',
      }}>
        {/* Fixed Tab Header Section - Only show for non-submission mode */}
        {!isSubmission && (
          <Box sx={{ 
            display: 'flex', 
            borderBottom: '1px solid', 
            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            left: 0,
            right: 0,
            bgcolor: darkMode ? '#1A1A1A' : '#FFFFFF',
            zIndex: 50,
            width: '100%',
            flexShrink: 0,
            minHeight: '40px',
            maxHeight: '40px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}>
            <Box sx={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              {/* Test Label */}
              <Typography
                variant="subtitle2"
                sx={{
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                }}
              >
                {isSubmission ? 'HIDDEN TEST CASES' : 'TEST CASES'}
              </Typography>

              {/* Tab Container */}
              <Box sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                overflow: 'auto',
                '::-webkit-scrollbar': {
                  height: '4px'
                },
                '::-webkit-scrollbar-thumb': {
                  backgroundColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                  borderRadius: '4px'
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                  {relevantTestCases.map((testCase, index) => {
                    // Find the test result
                    const testResult = getTestCaseResult(testCase, index);
                    const isActive = activeTestCaseIndex === index;
                    const isPassed = testResult && testResult.passed === true;
                    const isFailed = testResult && testResult.passed === false;
                    const isHiddenCase = testCase.hidden;
                    
                    // Determine the appropriate colors based on state
                    let bgColor = 'transparent';
                    let textColor = darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
                    
                    if (isPassed) {
                      // Passed test case
                      bgColor = isActive ? 
                        (darkMode ? '#1b5e20' : '#2e7d32') :  // Dark green for active passed
                        (darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.3)'); // Light green for inactive passed
                      textColor = isActive ? '#ffffff' : (darkMode ? '#66bb6a' : '#2e7d32');
                    } else if (isFailed) {
                      // Failed test case
                      bgColor = isActive ?
                        (darkMode ? '#b71c1c' : '#c62828') : // Dark red for active failed
                        (darkMode ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.4)'); // Light red for inactive failed
                      textColor = isActive ? 
                        '#ffffff' : 
                        (darkMode ? '#ff8a80' : '#c62828');
                    } else if (isActive) {
                      // Active tab with no result
                      bgColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)';
                    }
                    
                    return (
                      <Box
                        key={index}
                        onClick={() => handleTestCaseClick(index)}
                        sx={{
                          px: 2,
                          py: 1,
                          mx: 0.5,
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          bgcolor: bgColor,
                          color: textColor,
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.8rem',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            filter: 'brightness(110%)'
                          }
                        }}
                      >
                        <>
                          {/* Remove check/cross icons as requested */}
                          {isHiddenCase && <LockIcon sx={{ fontSize: '0.9rem', mr: 0.75 }} />}
                          Case {index + 1}
                        </>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* Results Summary Chip */}
              {processedTestResults && Array.isArray(processedTestResults) && processedTestResults.length > 0 && (
                <Box sx={{ px: 2 }}>
                  <Chip
                    size="small"
                    label={`${passedCount}/${totalCount}`}
                    color={passedCount === totalCount ? "success" : passedCount > 0 ? "warning" : "error"}
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: '24px',
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Submission mode header */}
        {isSubmission && (
          <Box sx={{ 
            display: 'flex', 
            borderBottom: '1px solid', 
            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            left: 0,
            right: 0,
            bgcolor: darkMode ? '#1A1A1A' : '#FFFFFF',
            zIndex: 50,
            width: '100%',
            flexShrink: 0,
            minHeight: '40px',
            maxHeight: '40px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            alignItems: 'center',
            px: 2
          }}>
            <Typography
              variant="subtitle2"
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              }}
            >
              HIDDEN TEST CASES
            </Typography>
            {processedTestResults && Array.isArray(processedTestResults) && processedTestResults.length > 0 && (
              <Chip
                size="small"
                label={`${passedCount}/${totalCount}`}
                color={passedCount === totalCount ? "success" : "error"}
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: '24px',
                  ml: 2
                }}
              />
            )}
          </Box>
        )}
        
        {/* Scrollable Content Section */}
        <Box 
          sx={{ 
            height: 'calc(100% - 40px)',
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
              borderRadius: '4px'
            }
          }}
        >
          {/* For submission mode, always show the performance summary */}
          {isSubmission && processedTestResults && processedTestResults.length > 0 && (
            <Box sx={{ px: 2, pt: 2, pb: 3 }}>
              <Typography variant="subtitle2" sx={{ 
                mb: 2,
                color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                Performance Summary
              </Typography>
              <PerformanceStats 
                testResults={processedTestResults} 
                darkMode={darkMode}
              />
            </Box>
          )}

          {/* Test Case Content with input and output sections - only for non-submission mode */}
          {!isSubmission && relevantTestCases.length > 0 && currentTestCase && (
            <Box sx={{ 
              px: 2, 
              pt: 2, 
              pb: 3,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Special message for hidden test case */}
              {currentTestCase.hidden && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 2, 
                    mb: 2,
                    bgcolor: darkMode ? 'rgba(0, 136, 204, 0.1)' : 'rgba(0, 136, 204, 0.05)',
                    border: '1px solid',
                    borderColor: darkMode ? 'rgba(0, 136, 204, 0.2)' : 'rgba(0, 136, 204, 0.1)',
                    borderRadius: 1,
                    color: darkMode ? '#0088cc' : '#0077b6',
                  }}
                >
                  <LockIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    This is a hidden test case used to evaluate your solution. 
                    {currentTestResult && (
                      currentTestResult.passed ? 
                        " Your solution passed this hidden test case." :
                        " Your solution failed this hidden test case."
                    )}
                  </Typography>
                </Box>
              )}

              {/* Input section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 1.5, 
                  color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  Input {currentTestCase.hidden && <LockIcon sx={{ ml: 1, fontSize: '0.9rem' }} />}
                </Typography>
                
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 1,
                    bgcolor: darkMode ? '#1E1E1E' : '#FFFFFF',
                    border: '1px solid',
                    borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    fontFamily: 'monospace',
                    color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {formatTestCaseInput(currentTestResult?.input || currentTestCase?.input) || 'No input provided'}
                </Box>
              </Box>
              
              {/* Expected Output section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 1.5, 
                  color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  Expected Output {currentTestCase.hidden && <LockIcon sx={{ ml: 1, fontSize: '0.9rem' }} />}
                </Typography>
                
                <Box 
                  sx={{
                    p: 1, 
                    borderRadius: 1,
                    bgcolor: darkMode ? '#1E1E1E' : '#FFFFFF',
                    border: '1px solid',
                    borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    fontFamily: 'monospace',
                    color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {currentTestResult?.expectedOutput || currentTestCase?.output || 'No expected output provided'}
                </Box>
              </Box>
          
              {/* Your Output section - only shown after running tests */}
              {currentTestResult && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      Your Output {currentTestCase.hidden && <LockIcon sx={{ ml: 1, fontSize: '0.9rem' }} />}
                    </Typography>
                
                    {/* Removing the passed/failed text as requested */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center'
                      }}
                    >
                      {/* Remove check/cross icons */}
                    </Box>
                  </Box>
                
                  {/* Your Output from test results */}
                  <Box 
                    sx={{
                      p: 1, 
                      borderRadius: 1,
                      bgcolor: darkMode ? '#1E1E1E' : '#FFFFFF',
                      border: '1px solid',
                      borderColor: currentTestResult.passed ? 
                        (darkMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.3)') : 
                        (darkMode ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.3)'),
                      fontFamily: 'monospace',
                      color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                      fontSize: '0.85rem',
                      whiteSpace: 'pre-wrap',
                      overflowX: 'auto',
                      minHeight: '40px'
                    }}
                  >
                    {currentTestResult.actualOutput || currentTestResult.actual || '(No output)'}
                  </Box>
                  
                  {/* Error messages if test failed */}
                  {currentTestResult && currentTestResult.error && (
                    <Box sx={{ mt: 2 }}>
                      <Typography 
                        variant="body2" 
                        color="error.main"
                        sx={{ fontWeight: 'bold', mb: 0.5 }}
                      >
                        Error:
                      </Typography>
                      <Box 
                        sx={{ 
                          p: 1, 
                          borderRadius: 1,
                          bgcolor: darkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)',
                          border: '1px solid',
                          borderColor: 'error.main',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          whiteSpace: 'pre-wrap',
                          overflowX: 'auto',
                          color: 'error.main'
                        }}
                      >
                        {currentTestResult.error}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

                              {/* Performance summary is now shown at the top of the panel when in submission mode */}
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

// Render test results UI with simplified display
const renderTestResults = ({ testResults, darkMode }) => {
  if (!testResults || testResults.length === 0) return null;
  
  const passedCount = testResults.filter(r => r.passed).length;
  const totalCount = testResults.length;
  
  if (totalCount === 0) return null;
  
  // Function to format test case input (copied from the main component)
  const formatTestCaseInput = (input) => {
    if (!input) return '';
    
    // Split the input by lines
    const lines = input.trim().split('\n');
    
    // If it looks like a multi-test case format (first line is a number)
    if (lines.length > 1 && /^\d+$/.test(lines[0].trim())) {
      // Remove the first line which is the number of test cases
      lines.shift();
      
      // Join the remaining lines
      return lines.join('\n');
    }
    
    // Return the original input if it doesn't match the pattern
    return input;
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Test Results
        <Chip 
          label={`${passedCount}/${totalCount} Passed`}
          color={passedCount === totalCount ? "success" : passedCount > 0 ? "warning" : "error"}
          size="small"
          sx={{ ml: 2, fontWeight: 'bold' }}
        />
      </Typography>
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Test Case</TableCell>
              <TableCell>Result</TableCell>
              <TableCell>Input</TableCell>
              <TableCell>Expected Output</TableCell>
              <TableCell>Actual Output</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {testResults.map((result, index) => (
              <TableRow key={index} sx={{ 
                bgcolor: result.passed ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)'
              }}>
                <TableCell>
                  {result.hidden ? <LockIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} /> : null}
                  Test {index + 1}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={result.passed ? "Pass" : "Fail"}
                    color={result.passed ? "success" : "error"}
                  />
                </TableCell>
                <TableCell>
                  <Box component="pre" sx={{ 
                    m: 0, 
                    p: 1, 
                    bgcolor: 'background.paper', 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '150px',
                    overflowX: 'auto'
                  }}>
                    {formatTestCaseInput(result.input)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box component="pre" sx={{ 
                    m: 0, 
                    p: 1, 
                    bgcolor: 'background.paper', 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    color: 'success.main',
                    fontWeight: 'medium',
                    maxWidth: '150px',
                    overflowX: 'auto'
                  }}>
                    {result.expectedOutput}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box 
                    sx={{
                      p: 1, 
                      borderRadius: 1,
                      bgcolor: darkMode ? '#1E1E1E' : '#FFFFFF',
                      border: '1px solid',
                      borderColor: result.passed ? 
                        (darkMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.3)') : 
                        (darkMode ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.3)'),
                      fontFamily: 'monospace',
                      color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                      fontSize: '0.85rem',
                      whiteSpace: 'pre-wrap',
                      overflowX: 'auto',
                      minHeight: '40px'
                    }}
                  >
                    {result.actualOutput || result.actual || 'Run code to see output'}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

TestCasesPanel.renderTestResults = renderTestResults;

export default TestCasesPanel; 