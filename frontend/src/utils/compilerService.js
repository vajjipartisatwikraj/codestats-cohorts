import axios from 'axios';

// Piston API endpoint (we'll use the public one)
const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

/**
 * Simple service for executing code using the Piston API
 */
const compilerService = {
  /**
   * Execute code using the Piston API
   * @param {string} language - The programming language
   * @param {string} version - The language version (optional)
   * @param {string} code - The code to execute
   * @param {string} stdin - Input to provide to the program
   * @returns {Promise<Object>} Execution result
   */
  executeCode: async (language, version = null, code, stdin = '') => {
    try {
      // Map common language names to versions
      const versions = {
        'c': '10.2.0',
        'cpp': '10.2.0',
        'java': '15.0.2',
        'python': '3.10.0',
        'javascript': '18.15.0'
      };
      
      // Get appropriate version if not specified
      const actualVersion = version || versions[language] || '';
      
      // Prepare filename based on language
      let fileName = `main.${language}`;
      if (language === 'cpp') fileName = 'main.cpp';
      if (language === 'javascript') fileName = 'main.js';
      if (language === 'python') fileName = 'main.py';
      if (language === 'java') fileName = 'Main.java';
      
      // Simple payload
      const payload = {
        language,
        version: actualVersion,
        files: [
          {
            name: fileName,
            content: code
          }
        ],
        stdin
      };
      
      // Make the API call
      console.log(`Executing ${language} code with Piston API`);
      const response = await axios.post(`${PISTON_API_URL}/execute`, payload);
      
      return response.data;
    } catch (error) {
      console.error('Error executing code:', error);
      
      // Return error in a consistent format
      return {
        run: {
          stdout: '',
          stderr: error.message || 'Error executing code',
          output: error.message || 'Error executing code',
          code: 1
        }
      };
    }
  },
  
  /**
   * Run code against test cases
   * @param {string} language - The programming language
   * @param {string} version - The language version (optional)
   * @param {string} code - The code to execute
   * @param {Array} testCases - Array of test cases
   * @returns {Promise<Array>} Test results
   */
  runTestCases: async (language, version, code, testCases) => {
    const results = [];
    
    // Run each test case individually
    for (const testCase of testCases) {
      try {
        // Execute the code with this test case input
        const result = await compilerService.executeCode(
          language,
          version,
          code,
          testCase.input
        );
        
        // Extract stdout and stderr
        const stdout = result.run?.stdout || '';
        const stderr = result.run?.stderr || '';
        
        // Check if output matches expected
        const passed = stdout.trim() === testCase.output.trim() && !stderr;
        
        results.push({
          testCaseId: testCase._id,
          passed,
          actualOutput: stdout,
          expectedOutput: testCase.output,
          error: stderr,
          input: testCase.input,
          hidden: testCase.hidden,
          explanation: testCase.explanation,
          // Add some basic metrics (actual values come from the API)
          executionTime: result.run?.time ? result.run.time * 1000 : 0, // convert to ms
          memoryUsed: result.run?.memory || 0
        });
        
        // Stop after first failure if it's a compilation error
        if (stderr && stderr.includes('error') && stderr.toLowerCase().includes('compil')) {
          break;
        }
      } catch (error) {
        results.push({
          testCaseId: testCase._id,
          passed: false,
          actualOutput: '',
          expectedOutput: testCase.output,
          error: error.message || 'Error executing code',
          input: testCase.input,
          hidden: testCase.hidden,
          explanation: testCase.explanation,
          executionTime: 0,
          memoryUsed: 0
        });
      }
    }
    
    return results;
  }
};

export default compilerService; 