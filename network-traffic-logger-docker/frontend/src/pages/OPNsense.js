import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  TrendingUp,
  TrendingDown,
  Speed,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
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
  const [trafficData, setTrafficData] = useState([]);
  const [firewallStatsAction, setFirewallStatsAction] = useState([]);
  const [firewallStatsInterface, setFirewallStatsInterface] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

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
        requests.push(axios.get(`${API_URL}/opnsense/logs?group_by=action`));
        requests.push(axios.get(`${API_URL}/opnsense/logs?group_by=interface`));
      } else {
        requests.push(Promise.resolve({ data: [] }));
        requests.push(Promise.resolve({ data: [] }));
      }

      if (settings.showTrafficChart) {
        requests.push(axios.get(`${API_URL}/opnsense/traffic`));
      } else {
        requests.push(Promise.resolve({ data: [] }));
      }

      const [statsRes, logsActionRes, logsInterfaceRes, trafficRes] = await Promise.all(requests);

      setStats(statsRes.data || {
        total_rules: 0,
        blocked_connections: 0,
        allowed_connections: 0,
        active_connections: 0,
      });
      setFirewallStatsAction(logsActionRes.data || []);
      setFirewallStatsInterface(logsInterfaceRes.data || []);
      setTrafficData(trafficRes.data || []);
    } catch (error) {
      console.error('Error fetching OPNsense data:', error);
      setStats({
        total_rules: 0,
        blocked_connections: 0,
        allowed_connections: 0,
        active_connections: 0,
      });
      setFirewallStatsAction([]);
      setFirewallStatsInterface([]);
      setTrafficData([]);
    } finally {
      setLoading(false);
    }
  };

  // Color palette for donut charts
  const COLORS = {
    pass: '#00ff88',
    block: '#ff4444',
    reject: '#ff4444',
    wan: '#00d4ff',
    MGMT: '#ffaa00',
    IoT: '#ff00ff',
    default: '#a0a0a0',
  };

  const getColor = (label, index) => {
    if (COLORS[label]) return COLORS[label];
    // Generate colors for interfaces
    const colorPalette = ['#00d4ff', '#00ff88', '#ffaa00', '#ff00ff', '#ff4444', '#a0a0a0', '#00ffff', '#ff6666'];
    return colorPalette[index % colorPalette.length];
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

      {/* Firewall Statistics */}
      {settings.showFirewallLogs && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Firewall Statistiken
            </Typography>

            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Aktionen" />
              <Tab label="Interfaces" />
            </Tabs>

            {/* Actions Tab */}
            {activeTab === 0 && (
              <Box>
                {firewallStatsAction.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <SecurityIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Keine Firewall-Daten gefunden
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      Warte auf Firewall-Aktivität...
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={firewallStatsAction.map((item) => ({ name: item.label, value: item.value }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {firewallStatsAction.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getColor(entry.label, index)} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#1a1a2e',
                              border: '1px solid #2a2a3e',
                              borderRadius: 8,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', height: '100%' }}>
                        {firewallStatsAction.map((item, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: 1,
                                backgroundColor: getColor(item.label, index)
                              }}
                            />
                            <Typography variant="body1" sx={{ flex: 1 }}>
                              {item.label === 'pass' ? 'Erlaubt' : item.label === 'block' ? 'Blockiert' : item.label}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {item.value.toLocaleString()}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}

            {/* Interfaces Tab */}
            {activeTab === 1 && (
              <Box>
                {firewallStatsInterface.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <SecurityIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Keine Interface-Daten gefunden
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      Warte auf Firewall-Aktivität...
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={firewallStatsInterface.map((item) => ({ name: item.label, value: item.value }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {firewallStatsInterface.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getColor(entry.label, index)} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#1a1a2e',
                              border: '1px solid #2a2a3e',
                              borderRadius: 8,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', height: '100%' }}>
                        {firewallStatsInterface.map((item, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: 1,
                                backgroundColor: getColor(item.label, index)
                              }}
                            />
                            <Typography variant="body1" sx={{ flex: 1 }}>
                              {item.label}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {item.value.toLocaleString()}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}

            <Box sx={{ mt: 3, textAlign: 'right' }}>
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
