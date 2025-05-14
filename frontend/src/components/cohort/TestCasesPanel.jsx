import React, { useState } from 'react';
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
  Tab,
  Tabs,
  Badge
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const TestCasesPanel = ({ 
  question, 
  testResults, 
  darkMode, 
  testCasesPanelHeight, 
  testPanelResizerRef, 
  startTestPanelResize, 
  isResizingTestPanel
}) => {
  // Only render if we have test cases
  if (!question || !question.testCases || question.testCases.length === 0) {
    return null;
  }

  // State to track active test case
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);

  // Get visible and hidden test cases
  const visibleTestCases = question.testCases.filter(tc => !tc.hidden);
  const hiddenTestCases = question.testCases.filter(tc => tc.hidden);
  
  // Get the current test case to display
  const currentTestCase = question.testCases[activeTestCaseIndex] || question.testCases[0];

  // Get current test result if available
  const currentTestResult = testResults && Array.isArray(testResults) 
    ? testResults.find(tr => tr.testCaseId === currentTestCase._id) || testResults[activeTestCaseIndex] || null
    : null;

  // Handle test case tab click
  const handleTestCaseClick = (index) => {
    setActiveTestCaseIndex(index);
  };

  // Get test case result
  const getTestCaseResult = (testCase, index) => {
    if (!testResults || !Array.isArray(testResults)) return null;
    
    return testResults.find(r => r.testCaseId === testCase._id) || 
           (testResults.length > index ? testResults[index] : null);
  };

  return (
    <>
      {/* Test Cases Panel Resizer */}
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
        {/* Fixed Tab Header Section */}
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
              TEST CASES
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
                {question.testCases.map((testCase, index) => {
                  // Find the test result
                  const testResult = getTestCaseResult(testCase, index);
                  const isActive = activeTestCaseIndex === index;
                  const isPassed = testResult && testResult.passed;
                  const isFailed = testResult && !testResult.passed;
                  
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
                      (darkMode ? '#ff8a80' : '#ffcdd2');
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
                      {testCase.hidden ? (
                        <>
                          <LockIcon sx={{ fontSize: '0.9rem', mr: 0.75 }} />
                          Hidden {index + 1}
                        </>
                      ) : (
                        <>
                          Case {index + 1}
                        </>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Results Summary Chip */}
            {testResults && Array.isArray(testResults) && testResults.length > 0 && (
              <Box sx={{ px: 2 }}>
                <Chip
                  size="small"
                  icon={testResults.every(r => r.passed) ? 
                    <CheckCircleIcon fontSize="small" /> : 
                    <CancelIcon fontSize="small" />
                  }
                  label={`${testResults.filter(r => r.passed).length}/${testResults.length}`}
                  color={testResults.every(r => r.passed) ? "success" : "error"}
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
          {/* Test Case Content with input and output sections */}
          {question.testCases.length > 0 && (
            <Box sx={{ 
              px: 2, 
              pt: 2, 
              pb: 3,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Show lock and message for hidden test cases */}
              {currentTestCase.hidden && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    my: 2,
                    gap: 1.5,
                    color: darkMode ? '#ffb74d' : '#f57c00',
                    bgcolor: darkMode ? 'rgba(255, 183, 77, 0.1)' : 'rgba(245, 124, 0, 0.05)',
                    border: '1px dashed',
                    borderColor: darkMode ? 'rgba(255, 183, 77, 0.3)' : 'rgba(245, 124, 0, 0.2)',
                    borderRadius: '8px',
                    p: 3,
                  }}
                >
                  <LockIcon sx={{ fontSize: '2.5rem' }} />
                  <Typography variant="body1" align="center" sx={{ fontWeight: 'medium' }}>
                    This is a hidden test case. The input and expected output will not be revealed.
                  </Typography>
                  {currentTestResult && (
                    <Typography variant="body2" align="center" sx={{ 
                      fontWeight: 'medium',
                      color: currentTestResult.passed ? (darkMode ? '#66bb6a' : '#2e7d32') : (darkMode ? '#ff8a80' : '#d32f2f'),
                      mt: 1
                    }}>
                      {currentTestResult.passed ? 'Your solution passed this test case.' : 'Your solution failed this test case.'}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Input section - simplified to just show the input directly */}
              {!currentTestCase.hidden && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ 
                    mb: 1.5, 
                    color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    Input
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
                    {currentTestResult?.input || currentTestCase.input}
                  </Box>
                </Box>
              )}
              
              {/* Expected Output section */}
              {!currentTestCase.hidden && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ 
                    mb: 1.5, 
                    color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    Expected Output
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
                    {currentTestResult?.expectedOutput || currentTestCase.output || 'No expected output provided'}
                  </Box>
                </Box>
              )}
          
              {/* Your Output section - only shown after running */}
              {currentTestResult && !currentTestCase.hidden && (
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
                      Your Output
                    </Typography>
                
                    <Typography 
                      variant="body2" 
                      color={currentTestResult.passed ? "success.main" : "error.main"}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontWeight: 'medium',
                        fontSize: '0.9rem'
                      }}
                    >
                      {currentTestResult.passed ? <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} /> : <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />}
                      {currentTestCase.hidden ? 'Hidden Test' : 'Test'} Case {activeTestCaseIndex + 1} {currentTestResult.passed ? 'Passed' : 'Failed'}
                    </Typography>
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
                    {currentTestResult.actualOutput || '(No output)'}
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
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Test Results
        <Chip 
          label={`${passedCount}/${totalCount} Passed`}
          color={passedCount === totalCount ? "success" : "warning"}
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
              {!testResults.some(r => r.hidden) && <TableCell>Input</TableCell>}
              {!testResults.some(r => r.hidden) && <TableCell>Expected Output</TableCell>}
              {!testResults.some(r => r.hidden) && <TableCell>Actual Output</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {testResults.map((result, index) => (
              <TableRow key={index} sx={{ 
                bgcolor: result.passed ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)'
              }}>
                <TableCell>
                  {result.hidden ? `Hidden Test ${index + 1}` : `Test ${index + 1}`}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={result.passed ? "Pass" : "Fail"}
                    color={result.passed ? "success" : "error"}
                  />
                </TableCell>
                {!result.hidden && <TableCell>
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
                    {result.input}
                  </Box>
                </TableCell>}
                {!result.hidden && <TableCell>
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
                </TableCell>}
                {!result.hidden && <TableCell>
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
                    {result.actualOutput || 'Run code to see output'}
                  </Box>
                </TableCell>}
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