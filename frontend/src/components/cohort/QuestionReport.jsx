import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import { BugReport, Send as SendIcon, Delete as DeleteIcon, ErrorOutline as ErrorIcon, AccessTime as TimeIcon } from '@mui/icons-material';
import axios from 'axios';
import { apiUrl } from '../../config/apiConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const QuestionReport = ({ cohortId, moduleId, questionId, darkMode }) => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');

  // Report type options
  const reportTypes = [
    { value: 'test_case_issue', label: 'Test Case Issue' },
    { value: 'incorrect_question', label: 'Incorrect Question' },
    { value: 'constraints_issue', label: 'Constraints Issue' },
    { value: 'technical_issue', label: 'Technical Issue' },
    { value: 'other', label: 'Other Issue' }
  ];

  // Status color mapping
  const statusColors = {
    pending: {
      color: darkMode ? '#f0c000' : '#b45309',
      bgColor: darkMode ? 'rgba(240, 192, 0, 0.1)' : 'rgba(240, 192, 0, 0.1)'
    },
    in_progress: {
      color: darkMode ? '#0088cc' : '#0066b2',
      bgColor: darkMode ? 'rgba(0, 136, 204, 0.1)' : 'rgba(0, 136, 204, 0.1)'
    },
    resolved: {
      color: darkMode ? '#00c853' : '#2e7d32',
      bgColor: darkMode ? 'rgba(0, 200, 83, 0.1)' : 'rgba(0, 200, 83, 0.1)'
    },
    rejected: {
      color: darkMode ? '#ff5252' : '#d32f2f',
      bgColor: darkMode ? 'rgba(255, 82, 82, 0.1)' : 'rgba(255, 82, 82, 0.1)'
    }
  };

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, [cohortId, moduleId, questionId, token]);

  // Fetch reports from API
  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiUrl}/cohorts/${cohortId}/modules/${moduleId}/questions/${questionId}/reports`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Submit new report
  const handleSubmitReport = async () => {
    if (!reportType || !description) {
      toast.error('Please select a report type and provide a description');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        `${apiUrl}/cohorts/${cohortId}/modules/${moduleId}/questions/${questionId}/report`,
        { reportType, description },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      toast.success('Report submitted successfully');
      
      // Clear form and refresh reports
      setReportType('');
      setDescription('');
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render status chip
  const renderStatusChip = (status) => {
    const statusConfig = statusColors[status] || statusColors.pending;
    const statusLabel = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return (
      <Chip
        label={statusLabel}
        size="small"
        sx={{
          bgcolor: statusConfig.bgColor,
          color: statusConfig.color,
          fontWeight: 'medium',
          borderRadius: '4px',
          height: '20px',
          fontSize: '0.65rem',
          px: 0.5
        }}
      />
    );
  };

  // Add a new function to handle report deletion
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(
        `${apiUrl}/cohorts/${cohortId}/reports/${reportId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      toast.success('Report deleted successfully');
      fetchReports(); // Refresh the report list
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      overflow: 'auto', 
      p: { xs: 2, md: 3 },
      bgcolor: darkMode ? '#121212' : '#f8f9fa',
      color: darkMode ? '#fff' : '#000'
    }}>
      {/* Report Form */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2.5, 
            display: 'flex', 
            alignItems: 'center',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: darkMode ? '#ff5252' : '#d32f2f'
          }}
        >
          <BugReport sx={{ mr: 1, fontSize: '1.1rem' }} />
          Report an Issue
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 200, 
              maxWidth: 300,
              '& .MuiOutlinedInput-root': {
                bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                color: darkMode ? '#fff' : '#000',
                borderRadius: '4px',
                '& fieldset': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.23)',
                }
              }
            }}
          >
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              displayEmpty
              renderValue={selected => selected ? reportTypes.find(t => t.value === selected)?.label : 'Issue Type'}
              sx={{ 
                fontSize: '0.8rem',
                height: '40px'
              }}
            >
              {reportTypes.map((type) => (
                <MenuItem key={type.value} value={type.value} sx={{ fontSize: '0.8rem' }}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
            
          <TextField
            placeholder="Describe the issue"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                color: darkMode ? '#fff' : '#000',
                fontSize: '0.8rem',
                '& fieldset': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.23)',
                }
              }
            }}
          />
            
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="error"
              disabled={submitting || !reportType || !description}
              onClick={handleSubmitReport}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              sx={{ 
                textTransform: 'none', 
                fontSize: '0.8rem',
                py: 0.7,
                px: 2,
                bgcolor: darkMode ? '#d32f2f' : '#f44336',
                '&:hover': {
                  bgcolor: darkMode ? '#b71c1c' : '#d32f2f',
                }
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* Reports List - Only shown if there are reports */}
      {reports.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'
              }}
            >
              Your Reports ({reports.length})
            </Typography>
            
            <Tooltip title="Refresh reports">
              <IconButton size="small" onClick={fetchReports} disabled={loading} sx={{ color: darkMode ? '#aaa' : '#666' }}>
                <TimeIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {reports.map((report) => (
                <Box
                  key={report._id}
                  sx={{
                    p: 1.5,
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    bgcolor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: '0.75rem',
                        color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'
                      }}
                    >
                      {reportTypes.find(t => t.value === report.reportType)?.label || 'Issue Report'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderStatusChip(report.status)}
                      <Tooltip title="Delete report">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteReport(report._id)}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 1, 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.85rem',
                      color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                      lineHeight: 1.5
                    }}
                  >
                    {report.description}
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    alignItems: 'center',
                    mt: 0.5,
                    pt: 0.75,
                    borderTop: '1px solid',
                    borderColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                  }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem',
                        color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <TimeIcon sx={{ fontSize: '0.8rem', mr: 0.5, opacity: 0.7 }} />
                      {formatDate(report.createdAt)}
                    </Typography>
                  </Box>
                  
                  {report.adminResponse && (
                    <Box 
                      sx={{ 
                        mt: 1.5, 
                        p: 1.5, 
                        bgcolor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                      }}
                    >
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          mb: 0.5, 
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <ErrorIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: statusColors.in_progress.color }} />
                        Admin Response:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.85rem',
                          color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                          lineHeight: 1.5
                        }}
                      >
                        {report.adminResponse}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </>
      )}
      
      {!loading && reports.length === 0 && (
        <Alert 
          severity="info" 
          icon={<ErrorIcon sx={{ fontSize: '1rem' }} />}
          sx={{ 
            fontSize: '0.75rem', 
            py: 0.75,
            alignItems: 'center',
            bgcolor: darkMode ? 'rgba(0,136,204,0.1)' : 'rgba(33,150,243,0.1)',
            color: darkMode ? '#0088cc' : '#0277bd',
            border: 'none',
            mt: 2
          }}
        >
          You haven't submitted any reports for this question yet.
        </Alert>
      )}
    </Box>
  );
};

export default QuestionReport; 