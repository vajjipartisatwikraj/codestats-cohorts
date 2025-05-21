import React, { useRef, useState, useEffect, forwardRef } from 'react';
import {
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  Menu
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Editor from '@monaco-editor/react';
import { toast } from 'react-toastify';

// Storage keys for persisting editor state
const EDITOR_STATE_KEY = 'codeEditor_state';
const SUBMISSION_SUCCESS_KEY = 'submission_success';
const BACKUP_LANGUAGE_KEY = 'last_used_language';

const CodeEditorPanel = ({
  code,
  language,
  darkMode,
  onChange,
  testCasesPanelHeight,
  LANGUAGES,
  onLanguageChange,
  availableLanguages = [],
  testResults = null
}, ref) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  const [displayCode, setDisplayCode] = useState('');
  const [fullCode, setFullCode] = useState(code);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extract solution class/function from the complete code
  useEffect(() => {
    setFullCode(code);
    
    // Extract the solution class/function based on language
    const extractSolutionCode = () => {
      if (!code) return '';
      
      try {
        // Language-specific extraction
        if (language === 'java') {
          // For Java, extract the Solution class
          const solutionClassRegex = /(class\s+Solution\s*{[\s\S]*?})\s*(\r?\n)*\s*(public\s+class|class)/;
          const match = code.match(solutionClassRegex);
          if (match && match[1]) {
            return match[1];
          }
        } else if (language === 'python') {
          // For Python, extract the Solution class or specific functions
          const solutionClassRegex = /(class\s+Solution[\s\S]*?)(?=\nclass\s+\w+|\n\s*if\s+__name__|$)/;
          const match = code.match(solutionClassRegex);
          if (match && match[1]) {
            return match[1];
          }
        } else if (language === 'javascript') {
          // For JavaScript, extract the Solution class or function
          const solutionRegex = /(class\s+Solution[\s\S]*?})|(function\s+\w+\s*\([\s\S]*?})/;
          const match = code.match(solutionRegex);
          if (match && (match[1] || match[2])) {
            return match[1] || match[2];
          }
        } else if (language === 'cpp' || language === 'c') {
          // For C/C++, extract the Solution class or specific functions
          const solutionRegex = /(class\s+Solution[\s\S]*?};)|([\w\*]+\s+\w+\s*\([\s\S]*?\)\s*{[\s\S]*?})/;
          const match = code.match(solutionRegex);
          if (match && (match[1] || match[2])) {
            return match[1] || match[2];
          }
        }
        
        // If we reach here, we couldn't extract a Solution class with the regex
        // Try a more aggressive approach to find any solution-related code
        const lines = code.split('\n');
        const solutionLines = [];
        let inSolutionBlock = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Check for solution class/function definition
          if (!inSolutionBlock && 
              (line.includes('class Solution') || 
               line.includes('function solution') || 
               line.includes('def solution'))) {
            inSolutionBlock = true;
            solutionLines.push(line);
          } 
          // If we're in a solution block, keep adding lines
          else if (inSolutionBlock) {
            solutionLines.push(line);
            
            // Check for end of solution block (closing brace on its own line)
            if (line.trim() === '}' || line.trim() === '};') {
              break;
            }
          }
        }
        
        // If we found solution lines, return them
        if (solutionLines.length > 0) {
          return solutionLines.join('\n');
        }
      } catch (error) {
        console.error("Error extracting solution code:", error);
      }
      
      // If all extraction methods fail, return a placeholder
      return "// Solution class not found.\n// Please write your solution here.";
    };
    
    const extracted = extractSolutionCode();
    setDisplayCode(extracted);
  }, [code, language]);

  // When the language changes, store it in localStorage as a backup
  useEffect(() => {
    localStorage.setItem(BACKUP_LANGUAGE_KEY, language);
  }, [language]);

  // Check for persisted state on mount and restore if present
  useEffect(() => {
    const savedState = sessionStorage.getItem(EDITOR_STATE_KEY);
    const submissionSuccess = sessionStorage.getItem(SUBMISSION_SUCCESS_KEY);
    
    console.log("Initial component mount, current language:", language);
    
    if (savedState && submissionSuccess) {
      try {
        const parsedState = JSON.parse(savedState);
        console.log("Restoring from saved state, saved language:", parsedState.language);
        
        // First restore language if available
        // Store the saved language to use it for code extraction
        const savedLanguage = parsedState.language || localStorage.getItem(BACKUP_LANGUAGE_KEY) || language;
        
        // Restore language in the parent component
        if (savedLanguage && onLanguageChange && savedLanguage !== language) {
          console.log("Changing language to:", savedLanguage);
          // Use setTimeout to ensure this happens after the component has fully mounted
          // This helps resolve race conditions with parent component state
          setTimeout(() => {
            onLanguageChange(savedLanguage);
          }, 0);
        }
        
        // Restore code state
        if (parsedState.code) {
          setFullCode(parsedState.code);
        }
        
        // Restore solution code if available
        if (parsedState.displayCode) {
          setDisplayCode(parsedState.displayCode);
        } else {
          // If no displayCode is saved, extract it from the full code
          // Use the saved language for extraction
          const extractedCode = extractSolutionCode(parsedState.code, savedLanguage);
          if (extractedCode) {
            setDisplayCode(extractedCode);
          }
        }
        
        // Call onChange to notify parent components
        if (onChange && parsedState.code) {
          onChange(parsedState.code);
        }
        
        // Show success message with slight delay to ensure UI is ready
        setTimeout(() => {
          toast.success('Code submitted successfully!');
        }, 500);
        
        // Clear the success flag (but keep the state for potential future use)
        sessionStorage.removeItem(SUBMISSION_SUCCESS_KEY);
      } catch (error) {
        console.error('Error restoring editor state:', error);
      }
    }
    
    // Helper function to extract solution code
    function extractSolutionCode(code, lang) {
      if (!code) return '';
      
      try {
        // Language-specific extraction
        if (lang === 'java') {
          const solutionClassRegex = /(class\s+Solution\s*{[\s\S]*?})\s*(\r?\n)*\s*(public\s+class|class)/;
          const match = code.match(solutionClassRegex);
          if (match && match[1]) return match[1];
        } else if (lang === 'python') {
          const solutionClassRegex = /(class\s+Solution[\s\S]*?)(?=\nclass\s+\w+|\n\s*if\s+__name__|$)/;
          const match = code.match(solutionClassRegex);
          if (match && match[1]) return match[1];
        } else if (lang === 'javascript') {
          const solutionRegex = /(class\s+Solution[\s\S]*?})|(function\s+\w+\s*\([\s\S]*?})/;
          const match = code.match(solutionRegex);
          if (match && (match[1] || match[2])) return match[1] || match[2];
        } else if (lang === 'cpp' || lang === 'c') {
          const solutionRegex = /(class\s+Solution[\s\S]*?};)|([\w\*]+\s+\w+\s*\([\s\S]*?\)\s*{[\s\S]*?})/;
          const match = code.match(solutionRegex);
          if (match && (match[1] || match[2])) return match[1] || match[2];
        }
      } catch (error) {
        console.error("Error extracting solution code during restore:", error);
      }
      
      return "// Solution class not found.\n// Please write your solution here.";
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle editor mounting
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // When the user edits the solution code, update both displayCode and merge changes back into fullCode
  const handleCodeChange = (newDisplayCode) => {
    setDisplayCode(newDisplayCode);
    
    // Merge the changes back into the full code
    const updatedFullCode = mergeCodeChanges(fullCode, displayCode, newDisplayCode);
    setFullCode(updatedFullCode);
    
    // Call the parent's onChange with the full code
    if (onChange) {
      onChange(updatedFullCode);
    }
  };
  
  // Function to merge changes from solution code back into the full code
  const mergeCodeChanges = (fullOriginalCode, originalSolution, newSolution) => {
    if (!fullOriginalCode) return newSolution;
    
    try {
      // Update the solution part in the full code
      if (language === 'java') {
        // For Java, replace the Solution class
        return fullOriginalCode.replace(
          /(class\s+Solution\s*{[\s\S]*?})\s*(\r?\n)*\s*(public\s+class|class)/,
          `${newSolution}\n\n$3`
        );
      } else if (language === 'python') {
        // For Python
        return fullOriginalCode.replace(
          /(class\s+Solution[\s\S]*?)(?=\nclass\s+\w+|\n\s*if\s+__name__|$)/,
          newSolution
        );
      } else if (language === 'javascript') {
        // For JavaScript
        const jsResult = fullOriginalCode.replace(
          /(class\s+Solution[\s\S]*?})|(function\s+\w+\s*\([\s\S]*?})/,
          newSolution
        );
        return jsResult;
      } else if (language === 'cpp' || language === 'c') {
        // For C/C++
        return fullOriginalCode.replace(
          /(class\s+Solution[\s\S]*?};)|([\w\*]+\s+\w+\s*\([\s\S]*?\)\s*{[\s\S]*?})/,
          newSolution
        );
      }
    } catch (error) {
      console.error("Error merging code changes:", error);
      // If replacement fails, try a different approach
      // Look for the solution class and replace it
      const lines = fullOriginalCode.split('\n');
      let startIndex = -1;
      let endIndex = -1;
      
      // Find the solution class/function
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('class Solution') || 
            lines[i].includes('function solution') || 
            lines[i].includes('def solution')) {
          startIndex = i;
          break;
        }
      }
      
      // If we found the start, look for the end
      if (startIndex !== -1) {
        let braceCount = 0;
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;
          
          if (braceCount === 0 && i > startIndex) {
            endIndex = i;
            break;
          }
        }
        
        // If we found both start and end, replace the solution
        if (startIndex !== -1 && endIndex !== -1) {
          const newLines = [...lines];
          newLines.splice(startIndex, endIndex - startIndex + 1, ...newSolution.split('\n'));
          return newLines.join('\n');
        }
      }
    }
    
    // Default: return the full code with the new solution appended
    // This is a fallback and shouldn't normally be reached
    console.warn("Failed to replace solution code. Using fallback method.");
    return fullOriginalCode;
  };

  // Copy code to clipboard (using the full code)
  const handleCopyCode = () => {
    navigator.clipboard.writeText(fullCode);
    toast.info('Code copied to clipboard');
  };
  
  // Download code file (using the full code)
  const handleDownloadCode = () => {
    const fileExtension = LANGUAGES[language]?.extension || 'txt';
    const fileName = `solution.${fileExtension}`;
    
    const element = document.createElement('a');
    const file = new Blob([fullCode], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.info(`Downloaded as ${fileName}`);
  };
  
  // Toggle fullscreen for code editor
  const handleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      // Create a temporary div for fullscreen that will contain our editor
      const fsElement = document.createElement('div');
      fsElement.id = 'fullscreen-editor-container';
      fsElement.style.width = '100%';
      fsElement.style.height = '100%';
      fsElement.style.backgroundColor = darkMode ? '#121212' : '#ffffff';
      fsElement.style.position = 'fixed';
      fsElement.style.top = '0';
      fsElement.style.left = '0';
      fsElement.style.right = '0';
      fsElement.style.bottom = '0';
      fsElement.style.zIndex = '9999';
      fsElement.style.display = 'flex';
      fsElement.style.flexDirection = 'column';
      
      // Create a toolbar for the fullscreen mode
      const toolbar = document.createElement('div');
      toolbar.style.display = 'flex';
      toolbar.style.justifyContent = 'flex-end';
      toolbar.style.padding = '8px';
      toolbar.style.backgroundColor = darkMode ? '#1e1e1e' : '#f5f5f5';
      toolbar.style.borderBottom = `1px solid ${darkMode ? '#333' : '#ddd'}`;
      
      // Add exit fullscreen button
      const exitButton = document.createElement('button');
      exitButton.innerHTML = '✕';
      exitButton.style.background = 'transparent';
      exitButton.style.border = 'none';
      exitButton.style.cursor = 'pointer';
      exitButton.style.fontSize = '16px';
      exitButton.style.color = darkMode ? '#fff' : '#000';
      exitButton.style.padding = '4px 8px';
      exitButton.onclick = () => document.exitFullscreen();
      
      toolbar.appendChild(exitButton);
      fsElement.appendChild(toolbar);
      
      // Create a container for the editor with full height
      const editorContainer = document.createElement('div');
      editorContainer.style.flexGrow = '1';
      editorContainer.style.height = 'calc(100% - 40px)';  // Subtract toolbar height
      editorContainer.style.overflow = 'hidden';
      fsElement.appendChild(editorContainer);
      
      // Store references for cleanup
      const originalParent = containerRef.current.parentNode;
      const editorElement = editorRef.current.getContainerDomNode();
      
      // Get the current editor state
      const currentState = editorRef.current.saveViewState();
      const currentValue = displayCode;
      
      // Add the fullscreen container to the body
      document.body.appendChild(fsElement);
      
      // Create a new Monaco editor instance for fullscreen
      const fullscreenEditor = monaco.editor.create(editorContainer, {
        value: currentValue, // This is already displayCode which contains only the solution
        language: getMonacoLanguage(language),
        theme: darkMode ? 'vs-dark' : 'light',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        automaticLayout: true,
        tabSize: 2,
        padding: { top: 8, bottom: 8 },
        fontFamily: '"Consolas", "Source Code Pro", monospace',
        fontLigatures: true
      });
      
      // Restore view state
      if (currentState) {
        fullscreenEditor.restoreViewState(currentState);
      }
      
      // Set up change handler
      fullscreenEditor.onDidChangeModelContent(e => {
        const newValue = fullscreenEditor.getValue();
        setDisplayCode(newValue);
        
        // Merge changes back into full code
        const updatedFullCode = mergeCodeChanges(fullCode, displayCode, newValue);
        setFullCode(updatedFullCode);
        
        // Call the parent's onChange with the full code
        if (onChange) {
          onChange(updatedFullCode);
        }
      });
      
      // Request fullscreen mode
      fsElement.requestFullscreen().catch(err => {
        // If fullscreen fails, clean up
        toast.error(`Error attempting to enable fullscreen: ${err.message}`);
        document.body.removeChild(fsElement);
      });
      
      // Add fullscreen exit handler
      const handleFullscreenExit = () => {
        if (!document.fullscreenElement && document.body.contains(fsElement)) {
          // Get the current value before destroying
          const finalValue = fullscreenEditor.getValue();
          
          // Dispose of the fullscreen editor
          fullscreenEditor.dispose();
          
          // Remove the fullscreen container
          document.body.removeChild(fsElement);
          
          // Update the original editor with the latest content
          setDisplayCode(finalValue);
          
          // Update the full code
          const updatedFullCode = mergeCodeChanges(fullCode, displayCode, finalValue);
          setFullCode(updatedFullCode);
          
          // Call the parent's onChange
          if (onChange) {
            onChange(updatedFullCode);
          }
          
          // Clean up the event listener
          document.removeEventListener('fullscreenchange', handleFullscreenExit);
        }
      };
      
      document.addEventListener('fullscreenchange', handleFullscreenExit);
    } else {
      document.exitFullscreen();
    }
  };
  
  // Get Monaco editor language
  const getMonacoLanguage = (lang) => {
    // Map Piston API language IDs to Monaco editor language IDs
    const languageMap = {
      'c': 'c',
      'cpp': 'cpp',
      'java': 'java',
      'python': 'python',
      'javascript': 'javascript'
    };
    return languageMap[lang] || lang;
  };

  // Language dropdown handlers
  const handleLanguageClick = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };
  
  const handleLanguageMenuClose = () => {
    setLanguageAnchorEl(null);
  };
  
  const selectLanguage = (lang) => {
    if (onLanguageChange) {
      console.log("Selecting new language:", lang);
      onLanguageChange(lang);
    }
    setLanguageAnchorEl(null);
  };
  
  // Get available languages based on what the admin has provided
  const getAvailableLanguages = () => {
    // If no specific available languages are provided, use all LANGUAGES
    if (!availableLanguages || availableLanguages.length === 0) {
      return Object.keys(LANGUAGES);
    }
    
    // Filter languages to only those that exist in both LANGUAGES object and availableLanguages array
    return Object.keys(LANGUAGES).filter(langKey => 
      availableLanguages.some(avLang => avLang.name === langKey)
    );
  };

  const availableLangs = getAvailableLanguages();

  // Function to handle successful submission with page refresh
  // This should be called by the parent component when submission is successful
  const handleSuccessfulSubmission = (results) => {
    // Save current state
    const stateToSave = {
      code: fullCode,         // Save the full code with boilerplate
      displayCode: displayCode, // Save only the solution code
      language: language,     // Make sure to save the current language
      results: results // Save test results if provided
    };
    
    console.log("Saving language before refresh:", language);
    
    // Also store language in localStorage as a backup
    localStorage.setItem(BACKUP_LANGUAGE_KEY, language);
    
    // Clear any previous state to avoid conflicts
    localStorage.removeItem(EDITOR_STATE_KEY);
    
    // Store in sessionStorage
    sessionStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(stateToSave));
    sessionStorage.setItem(SUBMISSION_SUCCESS_KEY, 'true');
    
    // Refresh the page
    window.location.reload();
  };

  // Expose the submission handler to parent components
  React.useImperativeHandle(ref, () => ({
    handleSuccessfulSubmission
  }));

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      overflow: 'hidden',
      m: 0,
      p: 0
    }}>
      {/* Editor Header with Action Buttons */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1,
        borderBottom: '1px solid',
        borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        bgcolor: darkMode ? '#121212' : '#f8f9fa',
      }}>
        {/* Language Selector on left */}
        <Box>
          <Button 
            variant="outlined"
            size="small"
            endIcon={<KeyboardArrowDownIcon />}
            sx={{
              height: '24px',
              borderRadius: '4px',
              color: darkMode ? '#fff' : '#000',
              borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
              textTransform: 'none',
              px: 1.5,
              backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
              },
              fontSize: '0.75rem',
              fontWeight: 500
            }}
            onClick={handleLanguageClick}
          >
            {LANGUAGES && LANGUAGES[language] ? LANGUAGES[language].name : language.toUpperCase()}
          </Button>
          
          <Menu
            anchorEl={languageAnchorEl}
            open={Boolean(languageAnchorEl)}
            onClose={handleLanguageMenuClose}
          >
            {availableLangs.map((lang) => (
              <MenuItem 
                key={lang} 
                onClick={() => selectLanguage(lang)}
                selected={language === lang}
              >
                {LANGUAGES[lang].name}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {/* Action buttons on right */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            aria-label="Copy code"
            onClick={handleCopyCode}
            sx={{
              minWidth: 'auto',
              p: 0.5,
              bgcolor: 'transparent',
              color: darkMode ? '#aaa' : '#555',
              border: 'none',
              '&:hover': {
                bgcolor: 'transparent',
                color: darkMode ? '#fff' : '#000',
              }
            }}
          >
            <ContentCopyIcon sx={{ fontSize: '1.1rem' }} />
          </Button>
          
          <Button
            size="small"
            aria-label="Download code"
            onClick={handleDownloadCode}
            sx={{
              minWidth: 'auto',
              p: 0.5,
              bgcolor: 'transparent',
              color: darkMode ? '#aaa' : '#555',
              border: 'none',
              '&:hover': {
                bgcolor: 'transparent',
                color: darkMode ? '#fff' : '#000',
              }
            }}
          >
            <DownloadIcon sx={{ fontSize: '1.2rem' }} />
          </Button>
          
          <Button
            size="small"
            aria-label="Fullscreen"
            onClick={handleFullscreen}
            sx={{
              minWidth: 'auto',
              p: 0.5,
              bgcolor: 'transparent',
              color: darkMode ? '#aaa' : '#555',
              border: 'none',
              '&:hover': {
                bgcolor: 'transparent',
                color: darkMode ? '#fff' : '#000',
              }
            }}
          >
            {isFullscreen ? 
              <FullscreenExitIcon sx={{ fontSize: '1.2rem' }} /> : 
              <FullscreenIcon sx={{ fontSize: '1.2rem' }} />
            }
          </Button>
        </Box>
      </Box>
      
      {/* Line numbers and editor container */}
      <Box 
        ref={containerRef}
        sx={{ 
          display: 'flex',
          flexGrow: 1,
          overflow: 'hidden',
          position: 'relative',
          m: 0,
          p: 0,
          height: `calc(100% - ${testCasesPanelHeight}%)`,
          '& .monaco-editor': {
            '.margin': {
              background: darkMode ? '#121212 !important' : '#f8fafc !important'
            },
            '.monaco-editor-background': {
              background: darkMode ? '#121212 !important' : '#ffffff !important'
            },
            '.monaco-editor .line-numbers': {
              color: darkMode ? '#606060 !important' : 'inherit'
            }
          }
        }}
      >
        <Editor
          height="100%"
          width="100%"
          language={getMonacoLanguage(language)}
          value={displayCode}
          onChange={handleCodeChange}
          theme={darkMode ? 'vs-dark' : 'light'}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 8, bottom: 8 },
            fontFamily: '"Consolas", "Source Code Pro", monospace', // VS Code default font
            fontLigatures: true,
            scrollbar: {
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
            }
          }}
        />
      </Box>
    </Box>
  );
};

// Convert to forwardRef to expose methods to parent components
export default forwardRef(CodeEditorPanel); 