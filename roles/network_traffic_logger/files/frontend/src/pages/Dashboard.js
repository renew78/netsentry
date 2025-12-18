import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Devices,
  Speed,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';

const StatCard = ({ title, value, unit, icon, color, trend }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color }}>
            {value}
            <Typography component="span" variant="h6" sx={{ ml: 1, color: 'text.secondary' }}>
              {unit}
            </Typography>
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {trend > 0 ? (
                <TrendingUp sx={{ fontSize: 20, color: 'success.main', mr: 0.5 }} />
              ) : (
                <TrendingDown sx={{ fontSize: 20, color: 'error.main', mr: 0.5 }} />
              )}
              <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                {Math.abs(trend)}% zur letzten Stunde
              </Typography>
            </Box>
          )}
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

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_bytes: 0,
    total_packets: 0,
    inbound_bytes: 0,
    outbound_bytes: 0,
    internal_bytes: 0,
    devices_active: 0,
  });
  const [trafficData, setTrafficData] = useState([]);
  const [realtimeData, setRealtimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  };

  const getBytesUnit = (bytes) => {
    if (bytes === 0) return 'B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return sizes[i];
  };

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats/current`);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  }, []);

  const fetchTrafficHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/traffic/history`, {
        params: {
          interval: '1m'
        }
      });

      // Process data for chart
      const processedData = {};
      response.data.data.forEach(item => {
        const time = new Date(item.time).toLocaleTimeString();
        if (!processedData[time]) {
          processedData[time] = { time, inbound: 0, outbound: 0, internal: 0 };
        }
        if (item.field === 'bytes') {
          processedData[time][item.direction] = (processedData[time][item.direction] || 0) + item.value;
        }
      });

      setTrafficData(Object.values(processedData));
    } catch (error) {
      console.error('Error fetching traffic history:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTrafficHistory();

    // Refresh stats every 5 seconds
    const statsInterval = setInterval(fetchStats, 5000);
    const historyInterval = setInterval(fetchTrafficHistory, 30000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(historyInterval);
    };
  }, [fetchStats, fetchTrafficHistory]);

  useEffect(() => {
    // WebSocket connection for real-time updates
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'traffic_update') {
          // Update real-time chart
          setRealtimeData(prev => {
            const newData = [...prev, {
              time: new Date(data.data.timestamp).toLocaleTimeString(),
              bytes: data.data.bytes,
              packets: data.data.packets
            }];
            // Keep last 60 data points
            return newData.slice(-60);
          });

          // Refresh stats
          fetchStats();
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [fetchStats]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Lade Daten...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Netzwerk-Übersicht
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Gesamter Traffic"
            value={formatBytes(stats.total_bytes)}
            unit={getBytesUnit(stats.total_bytes)}
            icon={<Speed sx={{ fontSize: 32, color: 'primary.main' }} />}
            color="#00d4ff"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Eingehend"
            value={formatBytes(stats.inbound_bytes)}
            unit={getBytesUnit(stats.inbound_bytes)}
            icon={<TrendingDown sx={{ fontSize: 32, color: 'success.main' }} />}
            color="#00ff88"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ausgehend"
            value={formatBytes(stats.outbound_bytes)}
            unit={getBytesUnit(stats.outbound_bytes)}
            icon={<TrendingUp sx={{ fontSize: 32, color: 'warning.main' }} />}
            color="#ffaa00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aktive Geräte"
            value={stats.devices_active}
            unit="Geräte"
            icon={<Devices sx={{ fontSize: 32, color: 'secondary.main' }} />}
            color="#ff6b9d"
          />
        </Grid>
      </Grid>

      {/* Real-time Traffic Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Echtzeit Traffic
            </Typography>
            <Chip
              label="Live"
              size="small"
              sx={{
                backgroundColor: 'success.main',
                color: 'white',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            />
          </Box>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
              <XAxis dataKey="time" stroke="#a0a0a0" />
              <YAxis stroke="#a0a0a0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="bytes"
                stroke="#00d4ff"
                strokeWidth={2}
                dot={false}
                name="Bytes/s"
              />
              <Line
                type="monotone"
                dataKey="packets"
                stroke="#ff6b9d"
                strokeWidth={2}
                dot={false}
                name="Pakete/s"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Traffic Distribution Chart */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Traffic-Verteilung (Letzte Stunde)
          </Typography>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffaa00" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ffaa00" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInternal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
              <XAxis dataKey="time" stroke="#a0a0a0" />
              <YAxis stroke="#a0a0a0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="inbound"
                stroke="#00ff88"
                fillOpacity={1}
                fill="url(#colorInbound)"
                name="Eingehend"
              />
              <Area
                type="monotone"
                dataKey="outbound"
                stroke="#ffaa00"
                fillOpacity={1}
                fill="url(#colorOutbound)"
                name="Ausgehend"
              />
              <Area
                type="monotone"
                dataKey="internal"
                stroke="#00d4ff"
                fillOpacity={1}
                fill="url(#colorInternal)"
                name="Intern"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
