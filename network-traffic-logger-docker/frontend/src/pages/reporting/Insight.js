import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { Insights as InsightsIcon, TrendingUp, TrendingDown, Warning, CheckCircle } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Insight() {
  const [tabValue, setTabValue] = useState(0);

  // Placeholder data - will be replaced with real API data
  const networkHealth = [
    { time: '00:00', latency: 12, packetLoss: 0.1 },
    { time: '04:00', latency: 15, packetLoss: 0.2 },
    { time: '08:00', latency: 25, packetLoss: 0.5 },
    { time: '12:00', latency: 18, packetLoss: 0.3 },
    { time: '16:00', latency: 22, packetLoss: 0.4 },
    { time: '20:00', latency: 14, packetLoss: 0.2 },
    { time: '23:59', latency: 11, packetLoss: 0.1 },
  ];

  const insights = [
    {
      type: 'warning',
      severity: 'medium',
      title: 'Unusual Traffic Pattern Detected',
      description: 'Device 10.10.1.30 showed 300% increase in bandwidth usage',
      time: '2 hours ago'
    },
    {
      type: 'info',
      severity: 'low',
      title: 'New Device Connected',
      description: 'Unknown device (MAC: AA:BB:CC:DD:EE:FF) connected to network',
      time: '4 hours ago'
    },
    {
      type: 'success',
      severity: 'low',
      title: 'Network Performance Optimal',
      description: 'All monitored services responding within normal parameters',
      time: '1 day ago'
    },
  ];

  const anomalies = [
    { device: '10.10.1.30', issue: 'High bandwidth usage', severity: 'medium', status: 'active' },
    { device: '10.10.1.45', issue: 'Port scan detected', severity: 'high', status: 'investigating' },
    { device: '10.10.1.12', issue: 'DNS query spike', severity: 'low', status: 'resolved' },
  ];

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'warning': return <Warning />;
      case 'success': return <CheckCircle />;
      default: return <InsightsIcon />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <InsightsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Network Insights
        </Typography>
      </Box>

      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Overview" />
          <Tab label="Anomalies" />
          <Tab label="Network Health" />
          <Tab label="Predictions" />
        </Tabs>

        <CardContent>
          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Recent Insights</Typography>
                {insights.map((insight, index) => (
                  <Card
                    key={index}
                    variant="outlined"
                    sx={{
                      mb: 2,
                      borderLeft: `4px solid ${
                        insight.type === 'warning' ? '#ffc107' :
                        insight.type === 'success' ? '#28a745' : '#17a2b8'
                      }`
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {getTypeIcon(insight.type)}
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {insight.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {insight.description}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                              {insight.time}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={insight.severity}
                          color={getSeverityColor(insight.severity)}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ backgroundColor: 'rgba(40, 167, 69, 0.1)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Network Score</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#28a745' }}>
                      94/100
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp sx={{ color: '#28a745', mr: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#28a745' }}>+5 from yesterday</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ backgroundColor: 'rgba(23, 162, 184, 0.1)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Active Devices</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#17a2b8' }}>
                      42
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp sx={{ color: '#17a2b8', mr: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#17a2b8' }}>+3 new today</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ backgroundColor: 'rgba(255, 193, 7, 0.1)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Open Alerts</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffc107' }}>
                      2
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingDown sx={{ color: '#28a745', mr: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#28a745' }}>-3 from yesterday</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Anomalies Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>Detected Anomalies</Typography>
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Device</TableCell>
                    <TableCell>Issue</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {anomalies.map((anomaly, index) => (
                    <TableRow key={index}>
                      <TableCell>{anomaly.device}</TableCell>
                      <TableCell>{anomaly.issue}</TableCell>
                      <TableCell>
                        <Chip
                          label={anomaly.severity}
                          color={getSeverityColor(anomaly.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={anomaly.status}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Network Health Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>Network Health Metrics</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={networkHealth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                    <XAxis dataKey="time" stroke="#495057" style={{ fontSize: 12 }} />
                    <YAxis stroke="#495057" style={{ fontSize: 12 }} yAxisId="left" label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', style: { fill: '#495057' } }} />
                    <YAxis stroke="#495057" style={{ fontSize: 12 }} yAxisId="right" orientation="right" label={{ value: 'Packet Loss (%)', angle: 90, position: 'insideRight', style: { fill: '#495057' } }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #dee2e6',
                        borderRadius: 3,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#17a2b8" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="packetLoss" stroke="#dc3545" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Predictions Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography color="text.secondary">AI-powered Network Predictions - Coming soon...</Typography>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
