import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Paper,
  Typography,
  Tooltip,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import axios from 'axios';
import { apiUrl } from '../../config/apiConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const Notes = ({ cohortId, moduleId, questionId }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();

  // Load notes when component mounts
  useEffect(() => {
    fetchNotes();
  }, [cohortId, moduleId, questionId, token]);

  // Fetch notes from API
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiUrl}/cohorts/${cohortId}/modules/${moduleId}/questions/${questionId}/notes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.notes) {
        setNotes(response.data.notes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      // Don't show error toast, just set empty notes if there's no data yet
    } finally {
      setLoading(false);
    }
  };

  // Save notes to API
  const saveNotes = async () => {
    setSaving(true);
    try {
      await axios.post(
        `${apiUrl}/cohorts/${cohortId}/modules/${moduleId}/questions/${questionId}/notes`,
        { notes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      toast.success('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            Your Notes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Write down your thoughts, solutions approaches, or any helpful information about this problem.
          </Typography>
          
          <Paper variant="outlined" sx={{ mb: 2 }}>
            <TextField
              multiline
              fullWidth
              minRows={10}
              maxRows={20}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your notes here..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    border: 'none',
                  },
                },
              }}
            />
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title="Save your notes for this question">
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={saveNotes}
                disabled={saving}
              >
                Save
              </Button>
            </Tooltip>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Notes; 