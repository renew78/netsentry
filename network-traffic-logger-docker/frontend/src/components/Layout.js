import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Devices as DevicesIcon,
  History as HistoryIcon,
  WifiTethering as WifiTetheringIcon,
  Dns as DnsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';
const drawerWidth = 260;

// Define all possible menu items
const allMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', alwaysShow: true },
  { text: 'Geräte', icon: <DevicesIcon />, path: '/devices', alwaysShow: true },
  { text: 'AdGuard', icon: <DnsIcon />, path: '/adguard', enabledKey: 'adguard' },
  { text: 'OPNsense', icon: <SecurityIcon />, path: '/opnsense', enabledKey: 'opnsense' },
  { text: 'TrueNAS', icon: <StorageIcon />, path: '/truenas', enabledKey: 'truenas' },
  { text: 'Verlauf', icon: <HistoryIcon />, path: '/history', alwaysShow: true },
  { text: 'Einstellungen', icon: <SettingsIcon />, path: '/settings', alwaysShow: true },
];

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      const settings = response.data;

      // Filter menu items based on enabled integrations
      const filteredItems = allMenuItems.filter(item => {
        // Always show items without enabledKey
        if (item.alwaysShow) return true;

        // Check if integration is enabled
        if (item.enabledKey && settings[item.enabledKey]) {
          return settings[item.enabledKey].enabled === true;
        }

        return false;
      });

      setMenuItems(filteredItems);
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Fallback to showing all items if settings fetch fails
      setMenuItems(allMenuItems.filter(item => item.alwaysShow));
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ background: 'linear-gradient(135deg, #00d4ff 0%, #00a3cc 100%)' }}>
        <WifiTetheringIcon sx={{ mr: 1.5, fontSize: 32, color: 'white' }} />
        <Typography variant="h6" noWrap component="div" sx={{ color: 'white', fontWeight: 700 }}>
          NetSentry
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 212, 255, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 212, 255, 0.25)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: location.pathname === item.path ? 600 : 400
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'linear-gradient(90deg, rgba(26, 26, 46, 0.95) 0%, rgba(15, 15, 35, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#0f0f23',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
