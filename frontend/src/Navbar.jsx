import React, { useState, useMemo, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Container,
  Tooltip,
  Divider,
  useTheme as useMuiTheme,
  Chip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import { apiUrl } from '../config/apiConfig';

const Navbar = () => {
  // ... existing code ...

  // ... all the state and handlers ...

  // Main navbar for authenticated users
  return (
    <AppBar position="fixed" sx={{ 
      background: themeColors.appBar,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      borderBottom: `1px solid ${themeColors.border}`,
    }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo for desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
            <Logo />
          </Box>

          {/* Mobile menu icon */}
          <Box sx={{ flexGrow: 0, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              sx={{ color: themeColors.iconColor }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
              PaperProps={{
                sx: { 
                  backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                  color: themeColors.text,
                  borderRadius: '8px',
                  boxShadow: darkMode 
                    ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
                    : '0 0 0 1px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05)'
                }
              }}
              container={() => document.getElementById('dialog-container') || document.body}
              disableEnforceFocus
            >
              {menuItems?.map((item) => (
                <MenuItem 
                  key={item.text} 
                  onClick={() => handleMenuClick(item.path)}
                  sx={{
                    color: themeColors.text,
                    '&:hover': {
                      background: themeColors.menuHover,
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.text}
                    {item.isNew && (
                      <Chip 
                        label="New" 
                        size="small" 
                        color="primary" 
                        sx={{ 
                          height: '20px', 
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          ml: 0.5 
                        }} 
                      />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Logo for mobile */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <Logo />
          </Box>

          {/* Desktop menu items */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 3, ml: 4 }}>
            {menuItems?.map((item) => (
              <Box
                key={item.text}
              >
                <Box
                  onClick={() => handleMenuClick(item.path)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: location.pathname === item.path ? themeColors.activeItem : themeColors.text,
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '6px 12px',
                    borderRadius: 2,
                    transition: 'color 0.3s ease',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    '&:hover': {
                      color: themeColors.activeItem,
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {item.text}
                    {item.isNew && (
                      <Chip 
                        label="New" 
                        size="small" 
                        color="primary" 
                        sx={{ 
                          height: '16px', 
                          fontSize: '0.6rem',
                          fontWeight: 'bold',
                          ml: 0.5 
                        }} 
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
            
          {/* User menu, notifications, and theme toggle */}
          {/* ... rest of existing code ... */}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 