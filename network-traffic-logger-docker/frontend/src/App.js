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

// Dark Theme Configuration
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
      light: '#5dfdff',
      dark: '#00a3cc',
    },
    secondary: {
      main: '#ff6b9d',
      light: '#ff9dc8',
      dark: '#cc3a6f',
    },
    background: {
      default: '#0f0f23',
      paper: '#1a1a2e',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#a0a0a0',
    },
    success: {
      main: '#00ff88',
    },
    error: {
      main: '#ff4444',
    },
    warning: {
      main: '#ffaa00',
    },
    info: {
      main: '#00d4ff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1a1a2e',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
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
