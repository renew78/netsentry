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
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Devices as DevicesIcon,
  Assessment as AssessmentIcon,
  Dns as DnsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Videocam as VideocamIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  BarChart as BarChartIcon,
  Insights as InsightsIcon,
  WifiTethering as WifiTetheringIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';
const drawerWidth = 260;

// Define nested menu structure
const menuStructure = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
    alwaysShow: true
  },
  {
    text: 'Geräte',
    icon: <DevicesIcon />,
    path: '/devices',
    alwaysShow: true
  },
  {
    text: 'Reporting',
    icon: <AssessmentIcon />,
    alwaysShow: true,
    submenu: [
      { text: 'Unbound DNS', icon: <DnsIcon />, path: '/reporting/unbound' },
      { text: 'Traffic', icon: <BarChartIcon />, path: '/reporting/traffic' },
      { text: 'Insight', icon: <InsightsIcon />, path: '/reporting/insight' },
    ]
  },
  {
    text: 'OPNsense',
    icon: <SecurityIcon />,
    enabledKey: 'opnsense',
    submenu: [
      { text: 'Overview', path: '/opnsense/overview' },
      { text: 'Firewall', path: '/opnsense/firewall' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/opnsense/settings' },
    ]
  },
  {
    text: 'TrueNAS',
    icon: <StorageIcon />,
    enabledKey: 'truenas',
    submenu: [
      { text: 'Storage', path: '/truenas/storage' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/truenas/settings' },
    ]
  },
  {
    text: 'Kameras',
    icon: <VideocamIcon />,
    alwaysShow: true,
    submenu: [
      { text: 'Live View', path: '/cameras/live' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/cameras/settings' },
    ]
  },
  {
    text: 'System Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    alwaysShow: true
  },
];

export default function LayoutNew({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Auto-expand menu if current path is in submenu
    menuStructure.forEach((item, index) => {
      if (item.submenu) {
        const isActive = item.submenu.some(sub => location.pathname.startsWith(sub.path));
        if (isActive && !expandedMenus[index]) {
          setExpandedMenus(prev => ({ ...prev, [index]: true }));
        }
      }
    });
  }, [location.pathname]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      const settings = response.data;

      // Filter menu items based on enabled integrations
      const filteredItems = menuStructure.filter(item => {
        if (item.alwaysShow) return true;
        if (item.enabledKey && settings[item.enabledKey]) {
          return settings[item.enabledKey].enabled === true;
        }
        return false;
      });

      setMenuItems(filteredItems);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMenuItems(menuStructure.filter(item => item.alwaysShow));
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (index, item) => {
    if (item.submenu) {
      // Toggle submenu
      setExpandedMenus(prev => ({ ...prev, [index]: !prev[index] }));
    } else if (item.path) {
      // Navigate to path
      navigate(item.path);
      setMobileOpen(false);
    }
  };

  const handleSubmenuClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const isPathActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ background: 'linear-gradient(135deg, #d94f00 0%, #a63d00 100%)' }}>
        <WifiTetheringIcon sx={{ mr: 1.5, fontSize: 32, color: 'white' }} />
        <Typography variant="h6" noWrap component="div" sx={{ color: 'white', fontWeight: 600 }}>
          NetSentry
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, pt: 2 }}>
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={!item.submenu && isPathActive(item.path)}
                onClick={() => handleMenuClick(index, item)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(217, 79, 0, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(217, 79, 0, 0.15)',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{
                  color: !item.submenu && isPathActive(item.path) ? 'primary.main' : 'text.secondary',
                  minWidth: 40,
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: !item.submenu && isPathActive(item.path) ? 600 : 400,
                      fontSize: '0.95rem',
                    }
                  }}
                />
                {item.submenu && (
                  expandedMenus[index] ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>

            {/* Submenu */}
            {item.submenu && (
              <Collapse in={expandedMenus[index]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem, subIndex) => (
                    <ListItem key={subIndex} disablePadding sx={{ pl: 2 }}>
                      <ListItemButton
                        selected={isPathActive(subItem.path)}
                        onClick={() => handleSubmenuClick(subItem.path)}
                        sx={{
                          borderRadius: 2,
                          py: 0.75,
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(217, 79, 0, 0.08)',
                            '&:hover': {
                              backgroundColor: 'rgba(217, 79, 0, 0.12)',
                            },
                          },
                        }}
                      >
                        {subItem.icon && (
                          <ListItemIcon sx={{
                            color: isPathActive(subItem.path) ? 'primary.main' : 'text.secondary',
                            minWidth: 32,
                          }}>
                            {subItem.icon}
                          </ListItemIcon>
                        )}
                        <ListItemText
                          primary={subItem.text}
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontWeight: isPathActive(subItem.path) ? 600 : 400,
                              fontSize: '0.875rem',
                            }
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  const getCurrentPageTitle = () => {
    for (const item of menuItems) {
      if (item.path && isPathActive(item.path)) {
        return item.text;
      }
      if (item.submenu) {
        for (const subItem of item.submenu) {
          if (isPathActive(subItem.path)) {
            return `${item.text} / ${subItem.text}`;
          }
        }
      }
    }
    return 'Dashboard';
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
            {getCurrentPageTitle()}
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
          backgroundColor: 'background.default', // Verwendet Theme-Farbe
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
