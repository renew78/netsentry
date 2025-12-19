import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Router as RouterIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getStatusColor = (status) => {
  switch (status) {
    case 'up':
      return '#00ff88';
    case 'down':
      return '#ff4444';
    default:
      return '#666';
  }
};

const PortCard = ({ port }) => {
  const isUp = port.status === 'up';

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          backgroundColor: getStatusColor(port.status),
        },
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`P${port.port_number}`}
              size="small"
              sx={{
                fontWeight: 700,
                minWidth: 45,
                backgroundColor: isUp ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                color: isUp ? '#00ff88' : '#ff4444',
              }}
            />
            {isUp ? (
              <CheckCircleIcon sx={{ fontSize: 16, color: '#00ff88' }} />
            ) : (
              <CancelIcon sx={{ fontSize: 16, color: '#ff4444' }} />
            )}
          </Box>
          {port.vlan_id && (
            <Chip
              label={`VLAN ${port.vlan_id}`}
              size="small"
              sx={{ fontSize: '0.7rem', height: 20 }}
              color="info"
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.85rem' }}>
          {port.port_name || `Port ${port.port_number}`}
        </Typography>

        {port.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {port.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              ↓ {formatBytes(port.bytes_in)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              ↑ {formatBytes(port.bytes_out)}
            </Typography>
          </Box>
          {port.speed && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {port.speed}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default function Switches() {
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPorts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/switches/ports`);
      setPorts(response.data);
    } catch (error) {
      console.error('Error fetching switch ports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPorts();
    const interval = setInterval(fetchPorts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Group ports by switch
  const groupedPorts = ports.reduce((acc, port) => {
    if (!acc[port.switch_ip]) {
      acc[port.switch_ip] = {
        switch_name: port.switch_name,
        switch_ip: port.switch_ip,
        ports: []
      };
    }
    acc[port.switch_ip].ports.push(port);
    return acc;
  }, {});

  const getTotalStats = (ports) => {
    const activeCount = ports.filter(p => p.status === 'up').length;
    const totalIn = ports.reduce((sum, p) => sum + (p.bytes_in || 0), 0);
    const totalOut = ports.reduce((sum, p) => sum + (p.bytes_out || 0), 0);
    return { activeCount, totalIn, totalOut };
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Switch-Verwaltung
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Aktualisieren">
            <IconButton onClick={fetchPorts} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Switches konfigurieren">
            <IconButton onClick={() => navigate('/settings')} color="primary">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {Object.keys(groupedPorts).length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <RouterIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine Switches konfiguriert
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                Konfigurieren Sie Ihre Switches in den Einstellungen mit Web-Scraping Login-Daten
              </Typography>
              <IconButton
                onClick={() => navigate('/settings')}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                  width: 64,
                  height: 64,
                }}
              >
                <SettingsIcon sx={{ fontSize: 32 }} />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.values(groupedPorts).map((switchData) => {
            const stats = getTotalStats(switchData.ports);
            return (
              <Card key={switchData.switch_ip}>
                <CardContent>
                  {/* Switch Header */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <RouterIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {switchData.switch_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {switchData.switch_ip}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Aktive Ports
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {stats.activeCount}/{switchData.ports.length}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Traffic ↓
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {formatBytes(stats.totalIn)}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Traffic ↑
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {formatBytes(stats.totalOut)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Port Grid - Compact View */}
                  <Grid container spacing={1.5}>
                    {switchData.ports
                      .sort((a, b) => a.port_number - b.port_number)
                      .map((port) => (
                        <Grid item xs={6} sm={4} md={3} lg={2} key={port.id}>
                          <PortCard port={port} />
                        </Grid>
                      ))}
                  </Grid>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Hinweis:</strong> Die Switch-Zugangsdaten können in den{' '}
          <span
            onClick={() => navigate('/settings')}
            style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
          >
            Einstellungen
          </span>{' '}
          konfiguriert werden. Da Ihre Switches kein SNMP unterstützen, werden die Daten via
          Web-Scraping abgerufen.
        </Typography>
      </Alert>
    </Box>
  );
}
