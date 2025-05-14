import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  IconButton,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  VideoLibrary as VideoIcon,
  Description as DocumentIcon,
  MenuBook as MenuBookIcon,
  Link as LinkIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const ModuleForm = ({ initialData, onSave, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    videoResource: '',
    documentationUrl: '',
    resources: []
  });
  const [newResource, setNewResource] = useState({
    title: '',
    url: '',
    type: 'article'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        resources: initialData.resources || []
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleResourceChange = (e) => {
    const { name, value } = e.target;
    setNewResource({
      ...newResource,
      [name]: value
    });
  };

  const addResource = () => {
    if (!newResource.title.trim() || !newResource.url.trim()) {
      return;
    }

    setFormData({
      ...formData,
      resources: [...formData.resources, { ...newResource }]
    });

    // Reset new resource form
    setNewResource({
      title: '',
      url: '',
      type: 'article'
    });
  };

  const removeResource = (index) => {
    const updatedResources = [...formData.resources];
    updatedResources.splice(index, 1);
    setFormData({
      ...formData,
      resources: updatedResources
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.videoResource && !isValidUrl(formData.videoResource)) {
      newErrors.videoResource = 'Please enter a valid URL';
    }
    
    if (formData.documentationUrl && !isValidUrl(formData.documentationUrl)) {
      newErrors.documentationUrl = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Module Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            error={!!errors.title}
            helperText={errors.title}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={4}
            error={!!errors.description}
            helperText={errors.description}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Order"
            name="order"
            type="number"
            value={formData.order}
            onChange={handleInputChange}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Video Resource URL"
            name="videoResource"
            value={formData.videoResource}
            onChange={handleInputChange}
            placeholder="https://example.com/video"
            error={!!errors.videoResource}
            helperText={errors.videoResource}
            InputProps={{
              startAdornment: <VideoIcon color="action" sx={{ mr: 1 }} />
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Documentation URL"
            name="documentationUrl"
            value={formData.documentationUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/docs"
            error={!!errors.documentationUrl}
            helperText={errors.documentationUrl}
            InputProps={{
              startAdornment: <DocumentIcon color="action" sx={{ mr: 1 }} />
            }}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Additional Resources
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              label="Resource Title"
              name="title"
              value={newResource.title}
              onChange={handleResourceChange}
              placeholder="e.g., Java Documentation"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="URL"
              name="url"
              value={newResource.url}
              onChange={handleResourceChange}
              placeholder="https://example.com"
              InputProps={{
                startAdornment: <LinkIcon color="action" sx={{ mr: 1 }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={newResource.type}
                onChange={handleResourceChange}
                label="Type"
              >
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="document">Document</MenuItem>
                <MenuItem value="tutorial">Tutorial</MenuItem>
                <MenuItem value="article">Article</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={1}>
            <Button
              variant="contained"
              color="primary"
              onClick={addResource}
              disabled={!newResource.title || !newResource.url}
              sx={{ minWidth: 'auto' }}
            >
              <AddIcon />
            </Button>
          </Grid>
        </Grid>
        
        {formData.resources.length > 0 ? (
          <List sx={{ mt: 2 }}>
            {formData.resources.map((resource, index) => (
              <ListItem 
                key={index}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemText
                  primary={resource.title}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'inherit' }}
                      >
                        {resource.url}
                      </a>
                      <Chip 
                        label={resource.type} 
                        size="small"
                        icon={
                          resource.type === 'video' ? <VideoIcon fontSize="small" /> :
                          resource.type === 'document' ? <DocumentIcon fontSize="small" /> :
                          <MenuBookIcon fontSize="small" />
                        }
                      />
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="delete" 
                    onClick={() => removeResource(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            No additional resources added yet.
          </Typography>
        )}
      </Box>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} variant="outlined">
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          startIcon={<SaveIcon />}
        >
          {isEdit ? 'Update Module' : 'Create Module'}
        </Button>
      </Box>
    </Box>
  );
};

export default ModuleForm; 