import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Drawer,
  Typography,
  useMediaQuery,
  SwipeableDrawer,
  Backdrop
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import ViewCarouselRoundedIcon from '@mui/icons-material/ViewCarouselRounded';
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined';
import WorkIcon from '@mui/icons-material/Work';
import StadiumOutlinedIcon from '@mui/icons-material/StadiumOutlined';
import StadiumRoundedIcon from '@mui/icons-material/StadiumRounded';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Create a custom Dashboard icon component
const CustomDashboardIcon = ({ isActive }) => {
  if (isActive) {
    // Render filled version when active
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        stroke="none"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M9 3a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2zm0 12a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2zm10 -4a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2zm0 -8a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2z" />
      </svg>
    );
  }
  
  // Render outline version when not active
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
      <path d="M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
      <path d="M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
      <path d="M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
    </svg>
  );
};

// Create a custom Opportunities icon component
const CustomOpportunitiesIcon = ({ isActive }) => {
  if (isActive) {
    // Render filled version when active
    return (
      <svg  
        xmlns="http://www.w3.org/2000/svg"  
        width="24"  
        height="24"  
        viewBox="0 0 24 24"  
        fill="currentColor"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M22 13.478v4.522a3 3 0 0 1 -3 3h-14a3 3 0 0 1 -3 -3v-4.522l.553 .277a20.999 20.999 0 0 0 18.897 -.002l.55 -.275zm-8 -11.478a3 3 0 0 1 3 3v1h2a3 3 0 0 1 3 3v2.242l-1.447 .724a19.002 19.002 0 0 1 -16.726 .186l-.647 -.32l-1.18 -.59v-2.242a3 3 0 0 1 3 -3h2v-1a3 3 0 0 1 3 -3h4zm-2 8a1 1 0 0 0 -1 1a1 1 0 1 0 2 .01c0 -.562 -.448 -1.01 -1 -1.01zm2 -6h-4a1 1 0 0 0 -1 1v1h6v-1a1 1 0 0 0 -1 -1z" />
      </svg>
    );
  }
  
  // Render outline version when not active
  return (
    <svg  
      xmlns="http://www.w3.org/2000/svg"  
      width="24"  
      height="24"  
      viewBox="0 0 24 24"  
      fill="none"  
      stroke="currentColor"  
      strokeWidth="2"  
      strokeLinecap="round"  
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M3 7m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
      <path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2" />
      <path d="M12 12l0 .01" />
      <path d="M3 13a20 20 0 0 0 18 0" />
    </svg>
  );
};

// Create a custom Courses icon component
const CustomCoursesIcon = ({ isActive }) => {
  if (isActive) {
    // Render filled version when active
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M21.5 5.134a1 1 0 0 1 .493 .748l.007 .118v13a1 1 0 0 1 -1.5 .866a8 8 0 0 0 -7.5 -.266v-15.174a10 10 0 0 1 8.5 .708m-10.5 -.707l.001 15.174a8 8 0 0 0 -7.234 .117l-.327 .18l-.103 .044l-.049 .016l-.11 .026l-.061 .01l-.117 .006h-.042l-.11 -.012l-.077 -.014l-.108 -.032l-.126 -.056l-.095 -.056l-.089 -.067l-.06 -.056l-.073 -.082l-.064 -.089l-.022 -.036l-.032 -.06l-.044 -.103l-.016 -.049l-.026 -.11l-.01 -.061l-.004 -.049l-.002 -13.068a1 1 0 0 1 .5 -.866a10 10 0 0 1 8.5 -.707" />
      </svg>
    );
  }
  
  // Render outline version when not active
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
      <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
      <path d="M3 6l0 13" />
      <path d="M12 6l0 13" />
      <path d="M21 6l0 13" />
    </svg>
  );
};

// Create a custom CodePad icon component with filled style for active state
const CustomCodePadIcon = ({ isActive }) => {
  if (isActive) {
    // Use the same icon but with filled styling for active state
    return (
      <TerminalOutlinedIcon sx={{ 
        '& path': {
          fill: 'currentColor', // Fill the paths with current color
          fillOpacity: 1,
          stroke: 'currentColor',
          strokeWidth: 0.5
        }
      }} />
    );
  }
  
  // Use the standard outlined version for inactive state
  return <TerminalOutlinedIcon />;
};

// Create a logo component with image
const Logo = ({ open, darkMode, onClick }) => (
  <Box 
    sx={{
      display: 'flex',
      justifyContent: open ? 'flex-start' : 'center',
      alignItems: 'center',
      width: '100%',
      height: { xs: 64, sm: 75 },
      cursor: !open ? 'pointer' : 'default',
      gap: open ? { xs: 1, sm: 0.5 } : 0,
      p: open ? { xs: 2.5, sm: 2 } : 0,
    }}
    onClick={!open ? onClick : undefined}
  >
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: !open ? { xs: 40, sm: 50 } : { xs: 28, sm: 36 },
      height: !open ? { xs: 40, sm: 50 } : { xs: 28, sm: 36 },
      position: 'relative',
    }}>
      <img 
        src="/scope-blac.png" 
        alt="SCOPE" 
        style={{
          width: '100%',
          height: '100%',
          maxWidth: !open ? '32px' : '24px',
          maxHeight: !open ? '32px' : '24px',
          objectFit: 'contain',
          transition: 'all 0.2s ease'
        }}
      />
    </Box>
    {open && (
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: { xs: '1.15rem', sm: '1.35rem' },
          color: darkMode ? '#fff' : '#101010',
          letterSpacing: '0.5px',
          lineHeight: 1,
        }}
      >
        C{'<>'}destats
      </Typography>
    )}
  </Box>
);

// Add custom sidebar toggle icon
const SidebarToggleIcon = () => (
  <svg  
    xmlns="http://www.w3.org/2000/svg"  
    width="28"  
    height="28"  
    viewBox="0 0 24 24"  
    fill="none"  
    stroke="currentColor"  
    strokeWidth="1.75"  
    strokeLinecap="round"  
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
    <path d="M9 4v16" />
    <path d="M15 10l-2 2l2 2" />
  </svg>
);

const Sidebar = ({ onToggle, mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const { theme, darkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Keep sidebar expanded on mobile
  useEffect(() => {
    if (isMobile) {
      setOpen(true); // Always keep expanded on mobile
    }
  }, [isMobile]);

  // Notify parent component when sidebar state changes
  useEffect(() => {
    if (onToggle) {
      onToggle(open);
    }
    
    // Add a class to the body for other components to react to
    if (open) {
      document.body.classList.add('sidebar-expanded');
      document.body.classList.remove('sidebar-collapsed');
    } else {
      document.body.classList.add('sidebar-collapsed');
      document.body.classList.remove('sidebar-expanded');
    }
  }, [open, onToggle]);

  // Emit sidebar state change
  useEffect(() => {
    const event = new CustomEvent('sidebarStateChange', { 
      detail: { isOpen: open } 
    });
    window.dispatchEvent(event);
  }, [open]);

  const handleDrawerToggle = () => {
    if (!isMobile) { // Only allow toggle on desktop
      setOpen(!open);
    }
  };

  // Theme-aware colors
  const themeColors = {
    background: darkMode ?'rgba(23, 23, 23, 0.45)' : '#ffffff',
    text: darkMode ? '#ffffff' : '#191919',
    border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    hover: 'transparent',
    activeItem: '#0585E0',
    activeBackground: '#0585E0', // Light blue with opacity
    iconColor: darkMode ? '#ffffff' : '#00000099',
  };

  // List of navigation items
  const menuItems = [
    { 
      text: 'Dashboard', 
      path: '/dashboard', 
      icon: <CustomDashboardIcon isActive={location.pathname === '/dashboard' || location.pathname === '/admin/dashboard'} />, 
      divider: false 
    },
    { 
      text: 'Leaderboard', 
      path: '/leaderboard', 
      icon: <LeaderboardIcon />, 
      divider: false 
    },
    { 
      text: 'CodePad', 
      path: '/codepad', 
      icon: <CustomCodePadIcon isActive={location.pathname === '/codepad'} />, 
      divider: false,
      hideFor: user?.userType === 'admin'
    },
    { 
      text: 'Cohorts', 
      path: user?.userType === 'admin' ? '/admin/cohorts' : '/cohorts', 
      icon: location.pathname.includes('/cohorts') || location.pathname.includes('/admin/cohorts') ? <ViewCarouselRoundedIcon /> : <ViewCarouselOutlinedIcon />, 
      divider: false,
      isNew: true 
    },
    { 
      text: 'Practice Arena', 
      path: user?.userType === 'admin' ? '/admin/practice-arena' : '/practice-arena', 
      icon: location.pathname.includes('/practice-arena') || location.pathname.includes('/admin/practice-arena') ? <StadiumRoundedIcon /> : <StadiumOutlinedIcon />, 
      divider: false 
    },
    { 
      text: 'Courses', 
      path: user?.userType === 'admin' ? '/admin/courses' : '/courses', 
      icon: <CustomCoursesIcon isActive={location.pathname.includes('/courses')} />, 
      divider: false 
    },
    { 
      text: 'Opportunities', 
      path: user?.userType === 'admin' ? '/admin/opportunities' : '/opportunities', 
      icon: <CustomOpportunitiesIcon isActive={location.pathname.includes('/opportunities')} />, 
      divider: false 
    },
    {
      text: 'Notifications',
      path: '/admin/notifications',
      icon: location.pathname.includes('/notifications') ? <NotificationsIcon /> : <NotificationsOutlinedIcon />,
      divider: false,
      adminOnly: true
    }
  ];

  // Filter items based on user type
  const filteredItems = menuItems.filter(item => {
    // Hide items that are marked for hiding for current user type
    if (item.hideFor) return false;
    
    // Show admin-only items only for admin users
    if (item.adminOnly) return user?.userType === 'admin';
    
    return true;
  });

  const drawerWidth = isMobile ? 240 : (open ? 280 : 75); // Reduced width on mobile

  const sidebarContent = (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: { xs: '12px 16px', sm: 2 },
              paddingLeft: { xs: '8px', sm: 1 },
              paddingRight: { xs: '12px', sm: 1.5 },
              ...theme.mixins.toolbar,
              width: '100%',
              minHeight: { xs: 64, sm: 64 }
            }}
          >
            <Logo open={open} darkMode={darkMode} onClick={handleDrawerToggle} />
            {open && !isMobile && (
              <IconButton 
                onClick={handleDrawerToggle} 
                sx={{ 
                  width: { xs: 40, sm: 44 },
                  height: { xs: 40, sm: 44 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& svg': {
                    width: 28,
                    height: 28,
                    transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
                    transition: 'transform 0.3s ease'
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(5, 133, 224, 0.08)'
                  }
                }}
              >
                <SidebarToggleIcon />
              </IconButton>
            )}
          </Box>
          <Box 
            sx={{ 
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              mb: { xs: 1, sm: 2 }
            }}
          >
            <Box 
              sx={{ 
                width: '90%',
                height: '1px',
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)'
              }} 
            />
          </Box>
          <List sx={{ pt: { xs: 0.5, sm: 1 } }}>
            {filteredItems.map((item) => (
              <ListItem 
                key={item.text} 
                disablePadding 
                sx={{ 
                  display: 'block', 
                  mb: { xs: 0.5, sm: 1.5 } // Reduced margin bottom on mobile
                }}
              >
                <ListItemButton
                  disableRipple={true}
                  sx={{
                    minHeight: { xs: 40, sm: 50 }, // Reduced height on mobile
                    height: { xs: 40, sm: 50 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: open ? 'flex-start' : 'center',
                    padding: open ? 
                      { xs: '0 10px', sm: '0 16px' } : // Reduced padding on mobile
                      { xs: '0 4px', sm: '0 8px' },
                    backgroundColor: location.pathname === item.path || 
                                   (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) ? 
                                   themeColors.activeBackground : 'transparent',
                    borderRadius: '12px',
                    mx: open ? { xs: 1, sm: 2 } : { xs: 0.5, sm: 1 }, // Reduced margins on mobile
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: location.pathname === item.path || 
                                     (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) ?
                                     themeColors.activeBackground : 'rgba(5, 133, 224, 0.1)',
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    }
                  }}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile && onMobileClose) {
                      onMobileClose();
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? { xs: 1, sm: 2 } : 'auto', // Reduced margin right on mobile
                      ml: open ? 0 : 'auto',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: !open ? '100%' : 'auto',
                      transition: 'all 0.2s ease',
                      '& svg': {
                        width: { xs: 18, sm: 24 }, // Reduced icon size on mobile
                        height: { xs: 18, sm: 24 }
                      },
                      color: location.pathname === item.path || 
                             (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) ?
                             "#ffffff" : themeColors.iconColor,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {open && (
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{
                        style: { 
                          fontWeight: 500,
                          fontSize: isMobile ? '0.85rem' : '1rem', // Reduced font size on mobile
                          color: location.pathname === item.path || 
                                 (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) ?
                                 "#ffffff": themeColors.text 
                        }
                      }}
                    />
                  )}
                  {item.isNew && open && (
                    <Chip 
                      label="New" 
                      size="small" 
                      sx={{ 
                        height: { xs: '14px', sm: '16px' },
                        fontSize: { xs: '0.45rem', sm: '0.6rem' }, // Reduced font size on mobile
                        fontWeight: 'bold',
                        backgroundColor: '#0088cc',
                        color: 'white',
                        borderRadius: '4px',
                        ml: 0,
                        px: { xs: 0.5, sm: 0.75 } // Reduced padding on mobile
                      }} 
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Logout Button */}
        <Box sx={{ p: 2, mt: 'auto' }}>
          <ListItemButton
            onClick={() => {
              const logoutSuccessful = logout();
              if (logoutSuccessful) {
                navigate('/login');
              }
              if (isMobile && onMobileClose) {
                onMobileClose();
              }
            }}
            sx={{
              minHeight: { xs: 40, sm: 50 },
              borderRadius: '12px',
              backgroundColor: darkMode ? 'rgba(255, 77, 77, 0.1)' : 'rgba(255, 77, 77, 0.08)',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 77, 77, 0.2)' : 'rgba(255, 77, 77, 0.15)',
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: open ? 'flex-start' : 'center',
              px: open ? 2 : 1
            }}
          >
            <LogoutIcon 
              sx={{ 
                color: '#ff4d4d',
                minWidth: 0,
                mr: open ? 2 : 'auto',
                fontSize: { xs: 18, sm: 24 }
              }} 
            />
            {open && (
              <ListItemText 
                primary="Logout" 
                primaryTypographyProps={{
                  style: {
                    color: '#ff4d4d',
                    fontWeight: 500,
                    fontSize: isMobile ? '0.85rem' : '1rem'
                  }
                }}
              />
            )}
          </ListItemButton>
        </Box>
      </Box>
    </>
  );
  
  return (
    <>
      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: `1px solid ${themeColors.border}`,
              backgroundColor: themeColors.background,
              transition: theme.transitions.create(['width'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
              zIndex: theme.zIndex.drawer,
              borderRadius: '0 16px 16px 0',
              height: '100%',
              '&::-webkit-scrollbar': {
                width: '6px',
                backgroundColor: darkMode ? '#000000' : '#ffffff',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#0585E0',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: darkMode ? '#000000' : '#ffffff',
              },
              scrollbarWidth: 'thin',
              scrollbarColor: '#0585E0 ' + (darkMode ? '#000000' : '#ffffff'),
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <SwipeableDrawer
          anchor="left"
          open={mobileOpen}
          onClose={onMobileClose}
          onOpen={() => {}}
          sx={{
            '& .MuiDrawer-paper': {
              width: '240px',
              boxSizing: 'border-box',
              backgroundColor: themeColors.background,
              borderRight: `1px solid ${themeColors.border}`,
              height: '100%',
              overflowY: 'auto',
            },
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          }}
          ModalProps={{
            keepMounted: true,
          }}
        >
          {sidebarContent}
        </SwipeableDrawer>
      )}
    </>
  );
};

export default Sidebar; 