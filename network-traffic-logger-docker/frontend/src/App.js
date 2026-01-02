import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import LayoutNew from './components/LayoutNew';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import AdGuard from './pages/AdGuard';
import OPNsense from './pages/OPNsense';
import TrueNAS from './pages/TrueNAS';
import Cameras from './pages/Cameras';
import History from './pages/History';
import Settings from './pages/Settings';

// Reporting Pages
import UnboundDNS from './pages/reporting/UnboundDNS';
import Traffic from './pages/reporting/Traffic';
import Insight from './pages/reporting/Insight';

// Settings Pages
import CameraSettings from './pages/cameras/CameraSettings';
import OPNsenseSettings from './pages/opnsense/OPNsenseSettings';
import TrueNASSettings from './pages/truenas/TrueNASSettings';

// OPNsense-Style Theme Configuration (Light Mode wie Original OPNsense)
const opnsenseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#d94f00', // OPNsense Orange
      light: '#ff7f3f',
      dark: '#a63d00',
    },
    secondary: {
      main: '#6c757d',
      light: '#9da5ad',
      dark: '#495057',
    },
    background: {
      default: '#f5f5f5', // Heller Hintergrund wie OPNsense
      paper: '#ffffff', // Weiß für Cards
    },
    text: {
      primary: '#333333',
      secondary: '#6c757d',
    },
    success: {
      main: '#5cb85c',
    },
    error: {
      main: '#d9534f',
    },
    warning: {
      main: '#f0ad4e',
    },
    info: {
      main: '#5bc0de',
    },
    divider: '#dee2e6',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", "Arial", sans-serif',
    fontSize: 13,
    h1: {
      fontWeight: 400,
      fontSize: '2.5rem',
      color: '#333333',
    },
    h2: {
      fontWeight: 400,
      fontSize: '2rem',
      color: '#333333',
    },
    h3: {
      fontWeight: 400,
      fontSize: '1.75rem',
      color: '#333333',
    },
    h4: {
      fontWeight: 400,
      fontSize: '1.5rem',
      color: '#333333',
    },
    h5: {
      fontWeight: 400,
      fontSize: '1.25rem',
      color: '#333333',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      color: '#333333',
    },
    button: {
      textTransform: 'none',
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 3,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          borderRadius: 3,
          border: '1px solid #ddd',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 400,
          borderRadius: 3,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 400,
          borderRadius: 3,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #dee2e6',
          padding: '12px',
        },
        head: {
          backgroundColor: '#f8f9fa',
          fontWeight: 600,
          color: '#495057',
          borderBottom: '2px solid #dee2e6',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #dee2e6',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #dee2e6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          color: '#333333',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            '& fieldset': {
              borderColor: '#ced4da',
            },
            '&:hover fieldset': {
              borderColor: '#adb5bd',
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 400,
          color: '#6c757d',
          '&.Mui-selected': {
            color: '#d94f00',
            fontWeight: 500,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #dee2e6',
        },
        indicator: {
          backgroundColor: '#d94f00',
          height: 3,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#6c757d',
          '&:hover': {
            backgroundColor: 'rgba(217, 79, 0, 0.04)',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={opnsenseTheme}>
      <CssBaseline />
      <Router>
        <LayoutNew>
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/settings" element={<Settings />} />

            {/* Reporting Routes */}
            <Route path="/reporting/unbound" element={<UnboundDNS />} />
            <Route path="/reporting/traffic" element={<Traffic />} />
            <Route path="/reporting/insight" element={<Insight />} />

            {/* OPNsense Routes */}
            <Route path="/opnsense/overview" element={<OPNsense />} />
            <Route path="/opnsense/firewall" element={<OPNsense />} />
            <Route path="/opnsense/settings" element={<OPNsenseSettings />} />

            {/* TrueNAS Routes */}
            <Route path="/truenas/storage" element={<TrueNAS />} />
            <Route path="/truenas/settings" element={<TrueNASSettings />} />

            {/* Camera Routes */}
            <Route path="/cameras/live" element={<Cameras />} />
            <Route path="/cameras/settings" element={<CameraSettings />} />

            {/* Legacy Routes (for backward compatibility) */}
            <Route path="/adguard" element={<AdGuard />} />
            <Route path="/opnsense" element={<OPNsense />} />
            <Route path="/truenas" element={<TrueNAS />} />
            <Route path="/cameras" element={<Cameras />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </LayoutNew>
      </Router>
    </ThemeProvider>
  );
}

export default App;
