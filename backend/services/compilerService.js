/**
 * Compiler Service
 * 
 * This service handles code execution using the Judge0 API
 */
const axios = require('axios');

// RapidAPI Judge0 API endpoint
const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_BATCH_SIZE = 10; // Max batch size for submissions

// Headers for RapidAPI Judge0
const JUDGE0_API_HEADERS = {
  'Content-Type': 'application/json',
  'X-RapidAPI-Key': 'b317308be0mshdab1610a191e059p12c673jsn4de4146c5086',
  'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
};

/**
 * Simple service for executing code using the Judge0 API
 */
const compilerService = {
  /**
   * Execute code using the Judge0 API
   * @param {string} language - The programming language
   * @param {string} version - The language version (optional) - Note: Judge0 uses language_id
   * @param {string} code - The code to execute
   * @param {string} stdin - Input to provide to the program
   * @returns {Promise<Object>} Execution result
   */
  executeCode: async (language, version = null, code, stdin = '') => {
    try {
      const languageIds = {
        'c': 50, 'cpp': 54, 'java': 62, 'python': 71, 'javascript': 63
      };
      const languageId = languageIds[language];
      if (!languageId) throw new Error(`Unsupported language: ${language}`);

      // Log the original code from user
      console.warn('===== ORIGINAL USER CODE =====');
      console.warn(code);
      console.warn('============================');

      // No special handling here - use code as is
      // The code combination should be done at component level before calling this function
      const payload = { source_code: code, language_id: languageId, stdin };
      
      // Log the code being sent to Judge0
      console.warn('===== CODE SENT TO JUDGE0 =====');
      console.warn(code);
      console.warn('==============================');

      const createResponse = await axios.post(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, payload, {
        headers: JUDGE0_API_HEADERS
      });
      
      // When wait=true, the response directly contains the execution result
      const finalResult = createResponse.data;

      // Print the full response from Judge0 for debugging
      console.warn('===== JUDGE0 RESPONSE =====');
      console.warn(JSON.stringify(finalResult, null, 2));
      console.warn('===========================');

      if (!finalResult || finalResult.status?.id <= 2) { // status id > 2 means processed
         // This case should ideally not happen with wait=true if server is configured correctly
         // but as a fallback, attempt to fetch if token is present.
        if(finalResult.token) {
            return await compilerService.getSubmissionResult(finalResult.token);
        }
        throw new Error(finalResult.status?.description || 'Execution failed or was queued without wait.');
      }
      
      // Get raw output without any modification initially
      let stdout = finalResult.stdout || '';
      let executionTime = parseFloat(finalResult.time) || 0;
      let memoryUsed = parseInt(finalResult.memory) || 0;
      
      // ONLY For Java with RUNTIME CALC markers, extract execution time if it's the last line
      if (language === 'java' && stdout && code.includes("/*RUNTIME CALC")) {
        // Print the full output for Java code with timing markers
        console.warn('===== JAVA OUTPUT WITH TIMING MARKERS =====');
        console.warn(stdout);
        console.warn('=========================================');
        
        // Split the output by lines to get the last line
        const outputLines = stdout.trim().split('\n');
        if (outputLines.length > 0) {
          const lastLine = outputLines[outputLines.length - 1];
          
          // Try to parse the last line as a number (the runtime in ms)
          const parsedTime = parseFloat(lastLine);
          if (!isNaN(parsedTime)) {
            // If successful, set this as the execution time
            executionTime = parsedTime;
            
            // Print the detected runtime
            console.warn(`DETECTED RUNTIME FROM MARKERS: ${parsedTime}ms`);
            console.log("CRITICAL - RUNTIME VALUE SET:", parsedTime);
            
            // Remove the last line from stdout - return only the actual output
            // Join all lines except the last one
            const trimmedOutput = outputLines.slice(0, -1).join('\n');
            console.warn('===== TRIMMED OUTPUT (WITHOUT RUNTIME) =====');
            console.warn(trimmedOutput);
            console.warn('==========================================');
            
            // Update stdout to the trimmed version without the runtime line
            stdout = trimmedOutput;
          }
        }
      }

      // Log the final result that will be returned to PATestView
      console.log("FINAL RESULT BEING RETURNED FROM COMPILER SERVICE:", {
        time: executionTime,
        memory: memoryUsed,
        stdout: stdout.substring(0, 100) + (stdout.length > 100 ? '...' : '')
      });
        
      return {
        run: {
          stdout: stdout,
          stderr: finalResult.stderr || finalResult.compile_output || '',
          output: stdout || finalResult.compile_output || finalResult.stderr || '',
          code: finalResult.status?.id === 3 ? 0 : (finalResult.exit_code || 1), // status 3 is "Accepted"
          time: executionTime, // Use extracted time or fallback to Judge0 time
          memory: memoryUsed // Ensure memory is a number
        },
        compile: { // Add compile information if available
          stdout: finalResult.compile_output || '', // Judge0 puts compile output here or in stderr
          stderr: finalResult.compile_output && finalResult.stderr ? finalResult.stderr : '' // if compile_output is present, stderr might be runtime
        }
      };
    } catch (error) {
      return {
        run: { stdout: '', stderr: error.message || 'Error executing code', output: error.message || 'Error executing code', code: 1, time:0, memory:0 },
        compile: { stdout: '', stderr: error.message || 'Compilation/Execution failed'}
      };
    }
  },

  /**
   * Helper to get submission result by token if needed.
   */
  getSubmissionResult: async (token) => {
    let attempts = 0;
    const maxAttempts = 10;
    let submissionData = null;

    while (attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        const resultResponse = await axios.get(`${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,time,memory,status,exit_code,token,language_id`, {
          headers: JUDGE0_API_HEADERS
        });
        submissionData = resultResponse.data;
        
        if (submissionData.status && submissionData.status.id > 2) { // Processed (Accepted, Wrong Answer, TLE etc.)
            // Print the complete submission result
            console.warn('===== COMPLETE JUDGE0 SUBMISSION RESULT =====');
            console.warn(JSON.stringify(submissionData, null, 2));
            console.warn('============================================');
            
            // Get raw output without modification
            const stdout = submissionData.stdout || '';
            const executionTime = parseFloat(submissionData.time) || 0;
            const memoryUsed = parseInt(submissionData.memory) || 0;
            
            // Print full submission data
            console.warn('===== JUDGE0 SUBMISSION RESULT =====');
            console.warn(JSON.stringify(submissionData, null, 2));
            console.warn('===================================');
            
            // Check if this is Java code with runtime markers (by searching the token context)
            let finalStdout = stdout;
            let finalExecutionTime = executionTime;
            
            // Try to detect if this is Java with runtime markers
            if (stdout && stdout.split('\n').length > 0) {
                // Split the output by lines to get the last line
                const outputLines = stdout.trim().split('\n');
                if (outputLines.length > 0) {
                    const lastLine = outputLines[outputLines.length - 1];
                    
                    // Try to parse the last line as a number (the runtime in ms)
                    const parsedTime = parseFloat(lastLine);
                    if (!isNaN(parsedTime)) {
                        // If successful, use this as the execution time
                        finalExecutionTime = parsedTime;
                        
                        // Print the detected runtime
                        console.warn(`DETECTED RUNTIME FROM MARKERS IN SUBMISSION: ${parsedTime}ms`);
                        
                        // Remove the last line from stdout - return only the actual output
                        finalStdout = outputLines.slice(0, -1).join('\n');
                        console.warn('===== TRIMMED SUBMISSION OUTPUT (WITHOUT RUNTIME) =====');
                        console.warn(finalStdout);
                        console.warn('===================================================');
                    }
                }
            }
            
            return {
                run: {
                    stdout: finalStdout,
                    stderr: submissionData.stderr || submissionData.compile_output || '',
                    output: finalStdout || submissionData.compile_output || submissionData.stderr || '',
                    code: submissionData.status?.id === 3 ? 0 : (submissionData.exit_code || 1),
                    time: finalExecutionTime,
                    memory: memoryUsed
                },
                compile: {
                    stdout: submissionData.compile_output || '',
                    stderr: submissionData.compile_output && submissionData.stderr ? submissionData.stderr : ''
                }
            };
        }
    }
    throw new Error(`Execution timed out or failed for token ${token}. Last status: ${submissionData?.status?.description}`);
  },
  
  /**
   * Execute a batch of code submissions using Judge0 API
   * @param {Array<Object>} submissions - Array of submission payloads
   * @returns {Promise<Array<Object>>} Array of execution results
   */
  executeCodeBatch: async (submissions) => {
    try {
      const response = await axios.post(`${JUDGE0_API_URL}/submissions/batch?base64_encoded=false`, { submissions }, {
        headers: JUDGE0_API_HEADERS
      });
      
      // Response is an array of {token: "..."}
      const tokens = response.data.map(s => s.token).join(',');
      
      // Poll for batch results
      let attempts = 0;
      const maxAttempts = 20; // Increased attempts for batch
      let batchResults = null;
      
      while (attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts)); // Longer delay for batches
        const resultResponse = await axios.get(`${JUDGE0_API_URL}/submissions/batch?tokens=${tokens}&base64_encoded=false&fields=stdout,stderr,compile_output,time,memory,status,exit_code,token,language_id,stdin`, {
          headers: JUDGE0_API_HEADERS
        });
        
        batchResults = resultResponse.data.submissions;
        
        // Check if all submissions in the batch are processed
        const allProcessed = batchResults.every(result => result.status && result.status.id > 2);
        
        if (allProcessed) {
          // Print the complete batch results
          console.warn('===== COMPLETE BATCH RESULTS =====');
          console.warn(JSON.stringify(batchResults, null, 2));
          console.warn('=================================');
          
          // Map results to the desired format
          return batchResults.map(result => {
            // Get the raw output without any modification
            const stdout = result.stdout || '';
            const executionTime = parseFloat(result.time) || 0;
            const memoryUsed = parseInt(result.memory) || 0;
            
            // DO NOT try to extract execution time from the output
            // Keep the original stdout to avoid removing valid output lines
          
            return {
              token: result.token, // Keep token for mapping if necessary
              language_id: result.language_id,
              stdin: result.stdin,
              run: {
                stdout: stdout,
                stderr: result.stderr || result.compile_output || '',
                output: stdout || result.compile_output || result.stderr || '',
                code: result.status?.id === 3 ? 0 : (result.exit_code || 1), // status 3 is "Accepted"
                time: executionTime,
                memory: memoryUsed
              },
              compile: {
                stdout: result.compile_output || '',
                stderr: result.compile_output && result.stderr ? result.stderr : ''
              },
              status: result.status
            };
          });
        }
      }
      
      throw new Error('Batch execution timed out or some submissions failed to process.');
      
    } catch (error) {
      // Return an array of error objects matching the expected structure
      return submissions.map(() => ({
        run: { stdout: '', stderr: error.message || 'Error executing batch', output: error.message || 'Error executing batch', code: 1, time: 0, memory: 0 },
        compile: { stdout: '', stderr: error.message || 'Batch compilation/execution failed' },
        status: { description: 'Batch Error' }
      }));
    }
  },

  /**
   * Run code against test cases, using batching
   * @param {string} language - The programming language
   * @param {string} version - The language version (optional)
   * @param {string} code - The code to execute
   * @param {Array} testCases - Array of test cases { input, output, _id, hidden, explanation }
   * @returns {Promise<Array>} Test results
   */
  runTestCases: async (language, version, code, testCases) => {
    const languageIds = {
      'c': 50, 'cpp': 54, 'java': 62, 'python': 71, 'javascript': 63
    };
    const languageId = languageIds[language];
    if (!languageId) {
      return testCases.map((tc, idx) => ({
          index: idx, // Add original index
          passed: false,
          actual: '',
          expected: tc.output,
          error: `Unsupported language: ${language}`,
          executionTime: 0,
          memory: 0,
          _originalTestCase: { ...tc, index: idx }
      }));
    }

    // Log the original code submitted by user
    console.warn('===== ORIGINAL USER CODE FOR TEST CASES =====');
    console.warn(code);
    console.warn('==========================================');

    const allProcessedResults = []; // Renamed from allResults for clarity
    // Prepare submission payloads with original test case and its index
    const submissionPayloads = testCases.map((tc, index) => ({
      source_code: code,
      language_id: languageId,
      stdin: tc.input,
      _originalTestCase: { ...tc, index } // Ensure original test case and its index are here
    }));

    // Log the first test case submission to show what's going to Judge0
    if (submissionPayloads.length > 0) {
      console.warn('===== CODE SENT TO JUDGE0 FOR TEST CASE 1 =====');
      console.warn(submissionPayloads[0].source_code);
      console.warn('============================================');
    }

    for (let i = 0; i < submissionPayloads.length; i += JUDGE0_BATCH_SIZE) {
      const currentBatchPayloads = submissionPayloads.slice(i, i + JUDGE0_BATCH_SIZE);
      const currentBatchProcessedResults = []; // To store detailed results for *this* batch

      try {
        // Send only necessary fields for batch submission
        const batchSubmissionData = currentBatchPayloads.map(p => ({
            source_code: p.source_code,
            language_id: p.language_id,
            stdin: p.stdin
        }));
        const batchExecutionResults = await compilerService.executeCodeBatch(batchSubmissionData);

        // Map batch results back to original test cases for this batch
        batchExecutionResults.forEach((judge0Result, indexInBatch) => {
          const originalPayload = currentBatchPayloads[indexInBatch];
          const originalTC = originalPayload._originalTestCase; // This has { ...testCase, index }
          
          // Print Judge0 result for each test case during submission
          console.warn(`===== JUDGE0 RESULT FOR TEST CASE ${indexInBatch + 1} =====`);
          console.warn(JSON.stringify(judge0Result, null, 2));
          console.warn('==========================================');
          
          // Get output
          let stdout = judge0Result.run?.stdout || '';
          let executionTime = (parseFloat(judge0Result.run?.time) * 1000) || 0; // Convert s to ms
          let stderr = judge0Result.run?.stderr || '';
          let compileOutput = judge0Result.compile_output || '';
          
          // Get the raw expected and actual outputs without any trimming yet
          const expectedOutput = originalTC.output?.trim() || '';
          let fullOutput = stdout?.trim() || '';
          
          // Check if this is Java with runtime markers by examining the last line
          if (stdout) {
              // Split the output by lines to get the last line
              const outputLines = stdout.trim().split('\n');
              if (outputLines.length > 0) {
                  const lastLine = outputLines[outputLines.length - 1];
                  
                  // Try to parse the last line as a number (the runtime in ms)
                  const parsedTime = parseFloat(lastLine);
                  if (!isNaN(parsedTime)) {
                      // If successful, use this as the execution time instead of Judge0's time
                      executionTime = parsedTime;
                      
                      // Print the detected runtime
                      console.warn(`DETECTED RUNTIME FROM MARKERS IN BATCH: ${parsedTime}ms`);
                      
                      // Remove the last line from stdout - return only the actual output
                      stdout = outputLines.slice(0, -1).join('\n');
                      fullOutput = stdout.trim();
                      
                      console.warn('===== TRIMMED BATCH OUTPUT (WITHOUT RUNTIME) =====');
                      console.warn(stdout);
                      console.warn('==================================================');
                  }
              }
          }
          
          // Check for exact match first
          let isOutputMatch = fullOutput === expectedOutput;
          
          // If not an exact match, check if the output starts with the expected output
          // This handles cases where there might be extra info at the end
          if (!isOutputMatch && fullOutput.startsWith(expectedOutput)) {
            isOutputMatch = true;
          }
          
          // DO NOT extract execution time or modify the output - keep the original output
          // This ensures we don't accidentally remove valid output lines

          const judge0Status = judge0Result.status; // Full status object {id, description}

          // `passed` criteria: Judge0 says "Accepted" (status 3) AND output matches.
          const passed = judge0Status?.id === 3 && isOutputMatch;

          let errorMsg = '';

          if (!passed) {
            if (judge0Status?.id === 3 && !isOutputMatch) { // Judge0 accepted, but output mismatch
              // Make sure to handle potentially long outputs gracefully if displayed in UI
              // For now, including full expected/actual. UI might need to truncate/scroll.
              errorMsg = `Output mismatch.\n--- Expected Output (length: ${originalTC.output.length}) ---\n${originalTC.output}\n--- Actual Output (length: ${stdout.length}) ---\n${stdout}\n---`;
            } else if (judge0Status?.description) { // Other Judge0 error (Compilation, Runtime, TLE, etc.)
              errorMsg = judge0Status.description;
              if (stderr) {
                errorMsg += `\nDetails (stderr):\n${stderr}`;
              }
              if (compileOutput && compileOutput !== stderr) { // Add compile_output if different from stderr and present
                errorMsg += `\nDetails (compile_output):\n${compileOutput}`;
              }
            } else if (stderr) { // Fallback if no Judge0 status description but stderr exists
              errorMsg = `Runtime Error or Compilation Error:\n${stderr}`;
            } else if (compileOutput) { // Fallback for compile output if no stderr
              errorMsg = `Compilation Error:\n${compileOutput}`;
            } else {
              errorMsg = 'Test failed for an unknown reason. No output or error details provided by execution engine.';
            }
          }

          const processedResult = {
            index: originalTC.index, // Critical: original index of the test case
            passed: passed,
            actual: stdout, // Field name 'actual' as expected by PAQuestionForm's spread
            expected: originalTC.output, // Field name 'expected'
            error: errorMsg, // This 'error' field will be used by PAQuestionForm
            executionTime: executionTime,
            memory: parseInt(judge0Result.run?.memory) || 0, // Field name 'memory', in KB
            _originalTestCase: originalTC, // Keep for PAQuestionForm's final mapping if needed
            statusObject: judge0Status // Keep the original status object for more detailed inspection if needed
          };
          currentBatchProcessedResults.push(processedResult);
          allProcessedResults.push(processedResult); // Accumulate all results
        });

      } catch (batchError) {
        // For a failed batch, mark all corresponding test cases in this batch as errored
        currentBatchPayloads.forEach(payloadInError => {
            const originalTC = payloadInError._originalTestCase;
            const errorResult = {
                index: originalTC.index,
                passed: false,
                actual: '',
                expected: originalTC.output,
                error: batchError.message || 'Batch processing error',
                executionTime: 0,
                memory: 0,
                _originalTestCase: originalTC,
            };
            currentBatchProcessedResults.push(errorResult);
            allProcessedResults.push(errorResult);
        });
      }
    }
    
    // Log what's being returned to the caller
    console.log("CRITICAL - Final results being returned from runTestCases:", 
      allProcessedResults.map(r => ({
        executionTime: r.executionTime,
        memory: r.memory,
        passed: r.passed
      }))
    );
    
    return allProcessedResults; // Return all fully processed results
  },

  /**
   * Simple execution of code without special processing for runtime markers or output extraction
   * @param {string} language - The programming language
   * @param {string} version - The language version (optional) - Note: Judge0 uses language_id
   * @param {string} code - The code to execute
   * @param {string} stdin - Input to provide to the program
   * @returns {Promise<Object>} Raw execution result
   */
  simpleExecution: async (language, version = null, code, stdin = '') => {
    try {
      const languageIds = {
        'c': 50, 'cpp': 54, 'java': 62, 'python': 71, 'javascript': 63
      };
      const languageId = languageIds[language];
      if (!languageId) throw new Error(`Unsupported language: ${language}`);

      const payload = { source_code: code, language_id: languageId, stdin };

      const createResponse = await axios.post(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, payload, {
        headers: JUDGE0_API_HEADERS
      });
      
      // When wait=true, the response directly contains the execution result
      const finalResult = createResponse.data;

      // Print the full response from Judge0 for debugging
      console.warn('===== JUDGE0 RESPONSE =====');
      console.warn(JSON.stringify(finalResult, null, 2));
      console.warn('===========================');

      if (!finalResult || finalResult.status?.id <= 2) { // status id > 2 means processed
        if(finalResult.token) {
            const result = await compilerService.getSubmissionResultRaw(finalResult.token);
            return result;
        }
        throw new Error(finalResult.status?.description || 'Execution failed or was queued without wait.');
      }
      
      // Return raw output without any special processing
      return {
        stdout: finalResult.stdout || '',
        stderr: finalResult.stderr || '',
        compile_output: finalResult.compile_output || '',
        status: finalResult.status,
        exit_code: finalResult.exit_code,
        time: finalResult.time,
        memory: finalResult.memory,
        // Add extracted time from markers if applicable
        extractedTime: (language === 'java' && finalResult.stdout && code.includes("/*RUNTIME CALC")) ? (() => {
          const outputLines = (finalResult.stdout || '').trim().split('\n');
          if (outputLines.length > 0) {
            const lastLine = outputLines[outputLines.length - 1];
            const parsedTime = parseFloat(lastLine);
            if (!isNaN(parsedTime)) {
              console.warn(`SimpleExecution: Using extracted runtime: ${parsedTime}ms from last line: "${lastLine}"`);
              
              // Also provide the trimmed output
              const trimmedOutput = outputLines.slice(0, -1).join('\n');
              console.warn('===== SIMPLE EXECUTION TRIMMED OUTPUT =====');
              console.warn(trimmedOutput);
              console.warn('==========================================');
              
              // Update the stdout property
              finalResult.stdout = trimmedOutput;
              
              return parsedTime;
            }
          }
          return null;
        })() : null
      };
    } catch (error) {
      return {
        stdout: '',
        stderr: error.message || 'Error executing code',
        compile_output: '',
        status: { id: -1, description: 'Error' },
        exit_code: 1,
        time: 0,
        memory: 0
      };
    }
  },

  /**
   * Helper to get raw submission result by token
   */
  getSubmissionResultRaw: async (token) => {
    let attempts = 0;
    const maxAttempts = 10;
    let submissionData = null;

    while (attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        const resultResponse = await axios.get(`${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,time,memory,status,exit_code,token,language_id`, {
          headers: JUDGE0_API_HEADERS
        });
        submissionData = resultResponse.data;
        
        if (submissionData.status && submissionData.status.id > 2) { // Processed
            // Return raw output without any processing
            return {
                stdout: submissionData.stdout || '',
                stderr: submissionData.stderr || '',
                compile_output: submissionData.compile_output || '',
                status: submissionData.status,
                exit_code: submissionData.exit_code,
                time: submissionData.time,
                memory: submissionData.memory
            };
        }
    }
    throw new Error(`Execution timed out or failed for token ${token}. Last status: ${submissionData?.status?.description}`);
  }
};

module.exports = compilerService; 