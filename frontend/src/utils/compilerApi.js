import axios from 'axios';

/**
 * API client for compiler service endpoints
 */
const apiUrl = import.meta.env.VITE_API_URL || '';
const token = localStorage.getItem('token'); // For authenticated requests

const compilerApi = {
  /**
   * Execute code using the backend compiler service
   * @param {string} language - The programming language
   * @param {string} version - The language version (optional)
   * @param {string} code - The code to execute
   * @param {string} stdin - Input to provide to the program
   * @returns {Promise<Object>} Execution result
   */
  executeCode: async (language, version = null, code, stdin = '') => {
    try {
      const response = await axios.post(
        `${apiUrl}/compiler/execute`,
        { language, version, code, stdin },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.result;
    } catch (error) {
      console.error('Error executing code:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to execute code');
    }
  },
  
  /**
   * Run code against test cases
   * @param {string} language - The programming language
   * @param {string} version - The language version (optional)
   * @param {string} code - The code to execute
   * @param {Array} testCases - Array of test cases { input, output, _id, hidden, explanation }
   * @returns {Promise<Array>} Test results
   */
  runTestCases: async (language, version, code, testCases) => {
    try {
      const response = await axios.post(
        `${apiUrl}/compiler/run-test-cases`,
        { language, version, code, testCases },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(response.data.results);
      return response.data.results;
    } catch (error) {
      console.error('Error running test cases:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to run test cases');
    }
  },
  
  /**
   * Simple execution of code without special processing
   * @param {string} language - The programming language
   * @param {string} version - The language version (optional)
   * @param {string} code - The code to execute
   * @param {string} stdin - Input to provide to the program
   * @returns {Promise<Object>} Raw execution result
   */
  simpleExecution: async (language, version = null, code, stdin = '') => {
    try {
      const response = await axios.post(
        `${apiUrl}/compiler/simple-execution`,
        { language, version, code, stdin },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(response.data.result);
      return response.data.result;
    } catch (error) {
      console.error('Error in simple execution:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed in simple execution');
    }
  }
};

export default compilerApi; 