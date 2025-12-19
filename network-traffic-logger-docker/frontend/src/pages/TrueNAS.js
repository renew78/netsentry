import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Storage as StorageIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';

export default function TrueNAS() {
  const [pools, setPools] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [services, setServices] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrueNASData();
    const interval = setInterval(fetchTrueNASData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchTrueNASData = async () => {
    try {
      setError(null);
      const [poolsRes, datasetsRes, servicesRes, systemRes] = await Promise.all([
        axios.get(`${API_URL}/truenas/pools`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/truenas/datasets`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/truenas/services`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/truenas/system`).catch(() => ({ data: null })),
      ]);

      setPools(poolsRes.data || []);
      setDatasets(datasetsRes.data || []);
      setServices(servicesRes.data || []);
      setSystemInfo(systemRes.data);
    } catch (error) {
      console.error('Error fetching TrueNAS data:', error);
      setError('Fehler beim Laden der TrueNAS Daten. Bitte überprüfen Sie die Verbindungseinstellungen.');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getServiceStatusColor = (status) => {
    return status === 'RUNNING' ? 'success' : 'error';
  };

  const getServiceStatusIcon = (status) => {
    return status === 'RUNNING' ? <CheckCircleIcon /> : <ErrorIcon />;
  };

  const getHealthColor = (health) => {
    if (health === 'ONLINE') return 'success';
    if (health === 'DEGRADED') return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <StorageIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          TrueNAS Scale
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* System Info */}
      {systemInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System-Informationen
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Hostname
                </Typography>
                <Typography variant="h6">{systemInfo.hostname || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Version
                </Typography>
                <Typography variant="h6">{systemInfo.version || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Uptime
                </Typography>
                <Typography variant="h6">{systemInfo.uptime || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Load Average
                </Typography>
                <Typography variant="h6">{systemInfo.loadavg || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Storage Pools */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Storage Pools
          </Typography>
          {pools.length === 0 ? (
            <Alert severity="info">Keine Storage Pools gefunden</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Gesamt</TableCell>
                    <TableCell align="right">Verwendet</TableCell>
                    <TableCell align="right">Verfügbar</TableCell>
                    <TableCell>Auslastung</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pools.map((pool) => {
                    const usagePercent = pool.allocated && pool.size
                      ? (pool.allocated / pool.size) * 100
                      : 0;
                    return (
                      <TableRow key={pool.name}>
                        <TableCell>
                          <Typography fontWeight={600}>{pool.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pool.status || 'UNKNOWN'}
                            color={getHealthColor(pool.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatBytes(pool.size)}
                        </TableCell>
                        <TableCell align="right">
                          {formatBytes(pool.allocated)}
                        </TableCell>
                        <TableCell align="right">
                          {formatBytes(pool.free)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={usagePercent}
                                color={usagePercent > 90 ? 'error' : usagePercent > 75 ? 'warning' : 'primary'}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ minWidth: 45 }}>
                              {usagePercent.toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Datasets */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Datasets
          </Typography>
          {datasets.length === 0 ? (
            <Alert severity="info">Keine Datasets gefunden</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Typ</TableCell>
                    <TableCell align="right">Verwendet</TableCell>
                    <TableCell align="right">Verfügbar</TableCell>
                    <TableCell>Kompression</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datasets.slice(0, 10).map((dataset) => (
                    <TableRow key={dataset.name}>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {dataset.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={dataset.type || 'filesystem'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        {formatBytes(dataset.used)}
                      </TableCell>
                      <TableCell align="right">
                        {formatBytes(dataset.available)}
                      </TableCell>
                      <TableCell>
                        <Chip label={dataset.compression || 'off'} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {datasets.length > 10 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Zeige 10 von {datasets.length} Datasets
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Services
          </Typography>
          {services.length === 0 ? (
            <Alert severity="info">Keine Services gefunden</Alert>
          ) : (
            <Grid container spacing={2}>
              {services.map((service) => (
                <Grid item xs={12} sm={6} md={4} key={service.name}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {service.name}
                        </Typography>
                        <Chip
                          icon={getServiceStatusIcon(service.state)}
                          label={service.state}
                          color={getServiceStatusColor(service.state)}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
