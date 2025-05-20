import React, { useRef, useState } from 'react';
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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Editor from '@monaco-editor/react';
import { toast } from 'react-toastify';

const CodeEditorPanel = ({
  code,
  language,
  darkMode,
  onChange,
  testCasesPanelHeight,
  LANGUAGES,
  onLanguageChange,
  availableLanguages = []
}) => {
  const editorRef = useRef(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

  // Handle editor mounting
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast.info('Code copied to clipboard');
  };
  
  // Download code file
  const handleDownloadCode = () => {
    const fileExtension = LANGUAGES[language]?.extension || 'txt';
    const fileName = `solution.${fileExtension}`;
    
    const element = document.createElement('a');
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.info(`Downloaded as ${fileName}`);
  };
  
  // Toggle fullscreen for code editor
  const handleFullscreen = () => {
    const editorElement = document.querySelector('.monaco-editor');
    if (!editorElement) return;
    
    if (!document.fullscreenElement) {
      editorElement.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
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
            startIcon={<ContentCopyIcon sx={{ fontSize: '0.75rem' }} />}
            onClick={handleCopyCode}
            sx={{
              bgcolor: 'transparent',
              color: darkMode ? '#aaa' : '#555',
              border: '1px solid',
              borderColor: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
              borderRadius: '4px',
              textTransform: 'none',
              fontSize: '0.7rem',
              py: 0.3,
              px: 1,
              minWidth: 'auto',
              minHeight: '24px',
              '&:hover': {
                bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }
            }}
          >
            Copy
          </Button>
          
          <Button
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={handleDownloadCode}
            sx={{
              bgcolor: 'transparent',
              color: darkMode ? '#aaa' : '#555',
              border: '1px solid',
              borderColor: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
              borderRadius: '4px',
              textTransform: 'none',
              fontSize: '0.7rem',
              py: 0.3,
              px: 1,
              minWidth: 'auto',
              minHeight: '24px',
              '&:hover': {
                bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }
            }}
          >
            Download
          </Button>
          
          <Button
            size="small"
            startIcon={<FullscreenIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={handleFullscreen}
            sx={{
              bgcolor: 'transparent',
              color: darkMode ? '#aaa' : '#555',
              border: '1px solid',
              borderColor: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
              borderRadius: '4px',
              textTransform: 'none',
              fontSize: '0.7rem',
              py: 0.3,
              px: 1,
              minWidth: 'auto',
              minHeight: '24px',
              '&:hover': {
                bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }
            }}
          >
            Fullscreen
          </Button>
        </Box>
      </Box>
      
      {/* Line numbers and editor container */}
      <Box sx={{ 
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
      }}>
        <Editor
          height="100%"
          width="100%"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={onChange}
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

export default CodeEditorPanel; 