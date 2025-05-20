import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  useTheme,
  alpha,
  Paper,
  Stack,
  Tooltip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CodeIcon from '@mui/icons-material/Code';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';
import StadiumRoundedIcon from '@mui/icons-material/StadiumRounded';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { apiUrl } from '../../config/apiConfig';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import PARandomTestForm from './PARandomTestForm';

const PracticeArena = () => {
  const theme = useTheme();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    fetchTests();
  }, []);
  
  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiUrl}/practice-arena/tests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setTests(response.data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleViewTest = (testId) => {
    if (!testId) {
      toast.error('Invalid test ID');
      return;
    }
    
    navigate(`/practice-arena/tests/${testId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return theme.palette.success.main;
      case 'started': return theme.palette.warning.main;
      default: return theme.palette.info.main;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'started': return 'In Progress';
      default: return 'Not Started';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'started': return <PlayArrowIcon />;
      default: return <ErrorOutlineIcon />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const renderTestHistoryCards = () => {
    if (tests.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 8,
          bgcolor: theme.palette.mode === 'dark' ? 'transparent' : 'rgba(15, 15, 15, 0.02)',
          borderRadius: 2,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 15, 15, 0.08)'}`,
        }}>
          <HistoryIcon sx={{ fontSize: 80, color: alpha(theme.palette.text.secondary, 0.2), mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No practice tests found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3, maxWidth: 400, textAlign: 'center' }}>
            Create your first practice test to start improving your coding skills
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleCreateTest}
            sx={{
              bgcolor: '#0088CC',
              color: 'white',
              px: 3,
              py: 1,
              borderRadius: 2,
              '&:hover': {
                bgcolor: alpha('#0088CC', 0.9)
              }
            }}
          >
            Create New Test
          </Button>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {tests.map((test) => (
          <Grid item xs={12} sm={6} md={4} key={test._id}>
            <Box sx={{ position: 'relative', height: '100%' }}>
              <Card 
                sx={{ 
                  borderRadius: '10px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  background: theme.palette.mode === 'dark' ? 'transparent' : '#FFFFFF',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 15, 15, 0.08)'}`,
                  position: 'relative',
                  overflow: 'visible',
                  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 4px 12px rgba(15, 15, 15, 0.06)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    padding: '1px',
                    background: 'linear-gradient(120deg, rgba(0,136,204,0.2), rgba(0,136,204,0))',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    zIndex: 1,
                    opacity: theme.palette.mode === 'dark' ? 1 : 0.3
                  }
                }}
              >
                <Box 
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    overflow: 'hidden',
                    zIndex: 1,
                    '&::after': theme.palette.mode === 'dark' ? {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '300px',
                      height: '300px',
                      background: 'rgba(30, 111, 169, 0.45)',
                      filter: 'blur(100px)',
                      borderRadius: '50%',
                      transform: 'translate(25%, 25%)',
                      pointerEvents: 'none'
                    } : {}
                  }}
                />

                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: -10,
                    right: 16,
                    bgcolor: '#0088CC',
                    color: '#fff',
                    borderRadius: '20px',
                    px: 2,
                    py: 0.75,
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)',
                    zIndex: 3,
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content'
                  }}
                >
                  {getStatusIcon(test.status)}
                  {getStatusText(test.status)}
                </Box>

                <CardContent 
                  sx={{ 
                    flexGrow: 1, 
                    pt: 4, 
                    position: 'relative', 
                    zIndex: 2,
                    height: '100%',
                  }}
                >
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '1.4rem',
                      lineHeight: 1.3,
                      color: theme.palette.mode === 'dark' ? 'white' : '#0F0F0F',
                      mb: 1
                    }}
                  >
                    {test.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
                    <Chip 
                      icon={<CodeIcon fontSize="small" sx={{ color: '#0088CC !important' }} />}
                      label={`${test.parameters?.subject || 'Mixed'}`}
                      size="small"
                      sx={{ 
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 136, 204, 0.1)',
                        borderRadius: '10px',
                        color: theme.palette.mode === 'dark' ? 'white' : '#0F0F0F',
                        border: 'none',
                      }}
                    />
                    <Chip 
                      label={`${test.parameters?.difficulty || 'Mixed'}`}
                      size="small"
                      sx={{ 
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 136, 204, 0.1)',
                        borderRadius: '10px',
                        color: theme.palette.mode === 'dark' ? 'white' : '#0F0F0F',
                        textTransform: 'capitalize',
                        border: 'none',
                      }}
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2, opacity: 0.1 }} />
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 15, 15, 0.7)',
                          display: 'flex', 
                          alignItems: 'center'
                        }}
                      >
                        Time Limit:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {test.parameters?.timeLimit || 60} min
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 15, 15, 0.7)',
                          display: 'flex', 
                          alignItems: 'center'
                        }}
                      >
                        Questions:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {test.questions?.length || 0} total
                      </Typography>
                    </Box>
                    
                    {test.status === 'completed' && (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 15, 15, 0.7)',
                              display: 'flex', 
                              alignItems: 'center'
                            }}
                          >
                            Score:
                          </Typography>
                          <Box 
                            sx={{
                              bgcolor: '#0088CC',
                              color: 'white',
                              borderRadius: '4px',
                              px: 1.5,
                              py: 0.5,
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              lineHeight: 1.5
                            }}
                          >
                            {test.totalScore || 0} / {test.maxPossibleScore || 0}
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 15, 15, 0.7)',
                              display: 'flex', 
                              alignItems: 'center'
                            }}
                          >
                            Completed:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatDate(test.endTime)}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Stack>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end', position: 'relative', zIndex: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => handleViewTest(test._id)}
                    endIcon={<ChevronRightIcon />}
                    sx={{ 
                      borderRadius: '20px',
                      textTransform: 'none',
                      bgcolor: '#0088CC',
                      color: 'white',
                      px: 2.5,
                      py: 1,
                      '&:hover': {
                        bgcolor: alpha('#0088CC', 0.9),
                      }
                    }}
                  >
                    {test.status === 'created' ? 'Start Test' : 
                     test.status === 'started' ? 'Continue' : 
                     'View Results'}
                  </Button>
                </CardActions>
              </Card>
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <>
      <Box 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          m:10,
          zIndex: -1,
        }}
      />
      
      <Box sx={{ minHeight: '100vh',p:5, bgcolor: 'transparent' }}>
        {/* Hero Section */}
        <Box 
          sx={{ 
            py: 12,
            px: { xs: 2, sm: 3, md: 6 },
            color: theme.palette.mode === 'dark' ? 'white' : '#0F0F0F',
          }}
        >
          <Grid 
            container 
            spacing={4} 
            alignItems="center" 
            justifyContent="space-between"
          >
            {/* Left side - Content */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography 
                  variant="h2" 
                  component="h1" 
                  fontWeight="bold"
                  sx={{ 
                    fontSize: { xs: '2rem', md: '2.75rem' },
                    color: theme.palette.mode === 'dark' ? '#fff' : '#0F0F0F'
                  }}
                >
                  Practice Arena
                </Typography>
                <StadiumRoundedIcon sx={{ 
                  color: '#0088CC', 
                  fontSize: { xs: '2rem', md: '2.75rem' }
                }} />
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 4,
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 15, 15, 0.9)',
                  lineHeight: 1.6,
                  maxWidth: '600px',
                  fontSize: '1rem',
                  position: 'relative',
                }}
              >
                Welcome to the Practice Arena - your dedicated space for mastering coding challenges. 
                Take on curated problems, track your progress, and enhance your problem-solving skills. 
                With a diverse range of difficulty levels and topics, you'll find the perfect challenge 
                to level up your coding expertise. Start practicing now and watch your skills grow!
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleCreateTest}
                sx={{
                  bgcolor: '#0088CC',
                  color: 'white',
                  px: 3,
                  py: 1.2,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  '&:hover': {
                    bgcolor: alpha('#0088CC', 0.9)
                  }
                }}
              >
                New Random Test
              </Button>
            </Grid>
            
            {/* Right side - Image */}
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box 
                component="img"
                src="/practiceArena.png"
                alt="Practice Arena"
                sx={{
                  width: '88%',
                  maxWidth: '550px',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'none',
                  transform: 'scale(0.9)',
                  ml: 'auto',
                  display: 'block'
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* History Section */}
        <Container maxWidth="xl" sx={{ py: 6 }}>
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h4" 
              fontWeight="bold"
              sx={{ 
                mb: 2,
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <HistoryIcon sx={{ fontSize: 32 }} />
              Practice History
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track your progress and continue where you left off
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={40} thickness={4} />
            </Box>
          ) : renderTestHistoryCards()}
        </Container>

        {/* Test Creation Modal */}
        <Dialog 
          open={isModalOpen} 
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
              backgroundImage: 'none'
            }
          }}
        >
          <DialogTitle 
            sx={{ 
              pb: 1,
              pt: 2,
              px: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="h5" component="h2" fontWeight="bold">
              Create Random Test
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <PARandomTestForm onClose={handleCloseModal} />
          </DialogContent>
        </Dialog>
      </Box>
    </>
  );
};

export default PracticeArena; 