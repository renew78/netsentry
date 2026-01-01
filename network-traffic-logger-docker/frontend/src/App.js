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

// OPNsense-Style Theme Configuration
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#d94f00', // OPNsense Orange
      light: '#ff7f3f',
      dark: '#a63d00',
    },
    secondary: {
      main: '#6c757d', // OPNsense Gray
      light: '#9da5ad',
      dark: '#495057',
    },
    background: {
      default: '#151515', // Sehr dunkel, wie OPNsense
      paper: '#1e1e1e', // Dunkelgrau für Cards
    },
    text: {
      primary: '#e9ecef',
      secondary: '#adb5bd',
    },
    success: {
      main: '#28a745',
    },
    error: {
      main: '#dc3545',
    },
    warning: {
      main: '#ffc107',
    },
    info: {
      main: '#17a2b8',
    },
    divider: '#2d2d2d',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    h1: {
      fontWeight: 500,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 500,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 4, // OPNsense hat schärfere Ecken
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1e1e1e',
          borderRadius: 4,
          border: '1px solid #2d2d2d',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1e1e1e',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 4,
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
          fontWeight: 500,
          borderRadius: 4,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #2d2d2d',
        },
        head: {
          backgroundColor: '#252525',
          fontWeight: 600,
          color: '#e9ecef',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1a1a',
          borderRight: '1px solid #2d2d2d',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid #2d2d2d',
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#2d2d2d',
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-selected': {
            color: '#d94f00',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#d94f00',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
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
            <Route path="/truenas/system" element={<TrueNAS />} />
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
