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
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  TrendingUp,
  TrendingDown,
  Speed,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';

const StatCard = ({ title, value, unit, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color }}>
            {value}
            {unit && (
              <Typography component="span" variant="h6" sx={{ ml: 1, color: 'text.secondary' }}>
                {unit}
              </Typography>
            )}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: 3,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function OPNsense() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    showFirewallStats: true,
    showFirewallLogs: false,
    showTrafficChart: false,
  });
  const [stats, setStats] = useState({
    total_rules: 0,
    blocked_connections: 0,
    allowed_connections: 0,
    active_connections: 0,
  });
  const [firewallLogs, setFirewallLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [trafficData, setTrafficData] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      fetchOPNsenseData();
      const interval = setInterval(fetchOPNsenseData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [settings]);

  useEffect(() => {
    filterLogs();
  }, [searchTerm, filterAction, firewallLogs]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      const features = response.data?.opnsense?.features || {
        showFirewallStats: true,
        showFirewallLogs: false,
        showTrafficChart: false,
      };
      setSettings(features);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchOPNsenseData = async () => {
    setLoading(true);
    try {
      const requests = [];

      // Only fetch data for enabled features
      if (settings.showFirewallStats) {
        requests.push(axios.get(`${API_URL}/opnsense/stats`));
      } else {
        requests.push(Promise.resolve({ data: { total_rules: 0, blocked_connections: 0, allowed_connections: 0, active_connections: 0 } }));
      }

      if (settings.showFirewallLogs) {
        requests.push(axios.get(`${API_URL}/opnsense/logs`));
      } else {
        requests.push(Promise.resolve({ data: [] }));
      }

      if (settings.showTrafficChart) {
        requests.push(axios.get(`${API_URL}/opnsense/traffic`));
      } else {
        requests.push(Promise.resolve({ data: [] }));
      }

      const [statsRes, logsRes, trafficRes] = await Promise.all(requests);

      setStats(statsRes.data || {
        total_rules: 0,
        blocked_connections: 0,
        allowed_connections: 0,
        active_connections: 0,
      });
      setFirewallLogs(logsRes.data || []);
      setTrafficData(trafficRes.data || []);
    } catch (error) {
      console.error('Error fetching OPNsense data:', error);
      setStats({
        total_rules: 0,
        blocked_connections: 0,
        allowed_connections: 0,
        active_connections: 0,
      });
      setFirewallLogs([]);
      setTrafficData([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = firewallLogs;

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.source_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.dest_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.port.toString().includes(searchTerm) ||
          log.protocol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterAction !== 'all') {
      filtered = filtered.filter((log) => log.action === filterAction);
    }

    setFilteredLogs(filtered);
  };

  const getActionChip = (action) => {
    if (action === 'block' || action === 'reject') {
      return (
        <Chip
          icon={<BlockIcon />}
          label="Blockiert"
          size="small"
          color="error"
          variant="outlined"
        />
      );
    }
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="Erlaubt"
        size="small"
        color="success"
        variant="outlined"
      />
    );
  };

  const getRuleChip = (ruleName) => {
    if (!ruleName) return <Chip label="Default" size="small" />;
    return <Chip label={ruleName} size="small" color="info" variant="outlined" />;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            OPNsense Firewall
          </Typography>
        </Box>
        <Tooltip title="Aktualisieren">
          <IconButton onClick={fetchOPNsenseData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Statistics Cards */}
      {settings.showFirewallStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Firewall Regeln"
              value={stats.total_rules}
              icon={<Speed sx={{ fontSize: 32, color: 'primary.main' }} />}
              color="#00d4ff"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Erlaubte Verbindungen"
              value={stats.allowed_connections.toLocaleString()}
              icon={<TrendingUp sx={{ fontSize: 32, color: 'success.main' }} />}
              color="#00ff88"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Blockierte Verbindungen"
              value={stats.blocked_connections.toLocaleString()}
              icon={<TrendingDown sx={{ fontSize: 32, color: 'error.main' }} />}
              color="#ff4444"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Aktive Verbindungen"
              value={stats.active_connections}
              icon={<WarningIcon sx={{ fontSize: 32, color: 'warning.main' }} />}
              color="#ffaa00"
            />
          </Grid>
        </Grid>
      )}

      {/* Traffic Chart */}
      {settings.showTrafficChart && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Netzwerk-Traffic (Letzte Stunde)
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
              <XAxis dataKey="time" stroke="#a0a0a0" />
              <YAxis stroke="#a0a0a0" label={{ value: 'MB', angle: -90, position: 'insideLeft', style: { fill: '#a0a0a0' } }} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: 8,
                }}
                formatter={(value) => [`${value} MB`, 'Traffic']}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="traffic_mb"
                stroke="#00d4ff"
                fillOpacity={1}
                fill="url(#colorTraffic)"
                name="Traffic (MB)"
              />
            </AreaChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Firewall Logs */}
      {settings.showFirewallLogs && (
        <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Firewall Protokoll
          </Typography>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Suche nach IP, Port oder Protokoll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Aktion</InputLabel>
              <Select
                value={filterAction}
                label="Aktion"
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="allow">Nur Erlaubt</MenuItem>
                <MenuItem value="block">Nur Blockiert</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Zeit</TableCell>
                  <TableCell>Aktion</TableCell>
                  <TableCell>Quelle IP</TableCell>
                  <TableCell>Ziel IP</TableCell>
                  <TableCell>Port</TableCell>
                  <TableCell>Protokoll</TableCell>
                  <TableCell>Regel</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box sx={{ py: 4 }}>
                        <SecurityIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          Keine Firewall-Logs gefunden
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          {searchTerm || filterAction !== 'all'
                            ? 'Versuchen Sie andere Filter'
                            : 'Warte auf Firewall-Aktivität...'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {formatTime(log.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>{getActionChip(log.action)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {log.source_ip}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {log.dest_ip}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.port} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.protocol}</Typography>
                      </TableCell>
                      <TableCell>{getRuleChip(log.rule_name)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Anzeige: {filteredLogs.length} von {firewallLogs.length} Einträgen
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Aktualisiert alle 30 Sekunden
            </Typography>
          </Box>
        </CardContent>
      </Card>
      )}
    </Box>
  );
}
