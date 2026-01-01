import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { BarChart as BarChartIcon } from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Traffic() {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('24h');

  // Placeholder data - will be replaced with real API data
  const trafficData = [
    { time: '00:00', upload: 120, download: 450 },
    { time: '04:00', upload: 80, download: 200 },
    { time: '08:00', upload: 250, download: 800 },
    { time: '12:00', upload: 400, download: 1200 },
    { time: '16:00', upload: 350, download: 950 },
    { time: '20:00', upload: 500, download: 1500 },
    { time: '23:59', upload: 300, download: 700 },
  ];

  const protocolData = [
    { protocol: 'HTTP/HTTPS', bytes: 15234567, color: '#17a2b8' },
    { protocol: 'DNS', bytes: 892456, color: '#28a745' },
    { protocol: 'SSH', bytes: 234567, color: '#dc3545' },
    { protocol: 'Other', bytes: 567890, color: '#ffc107' },
  ];

  const topTalkers = [
    { device: '10.10.1.10', name: 'Desktop-PC', bytes: 8521234 },
    { device: '10.10.1.20', name: 'Laptop', bytes: 4521234 },
    { device: '10.10.1.30', name: 'Smartphone', bytes: 2521234 },
    { device: '10.10.1.40', name: 'Tablet', bytes: 1521234 },
    { device: '10.10.1.50', name: 'Smart-TV', bytes: 821234 },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BarChartIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Traffic Statistics
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="1h">Last Hour</MenuItem>
            <MenuItem value="24h">Last 24h</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Overview" />
          <Tab label="Protocols" />
          <Tab label="Top Talkers" />
          <Tab label="Real-time" />
        </Tabs>

        <CardContent>
          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Bandwidth Usage</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={trafficData}>
                    <defs>
                      <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d94f00" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#d94f00" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#17a2b8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#17a2b8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                    <XAxis dataKey="time" stroke="#495057" style={{ fontSize: 12 }} />
                    <YAxis stroke="#495057" style={{ fontSize: 12 }} label={{ value: 'Mbps', angle: -90, position: 'insideLeft', style: { fill: '#495057' } }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #dee2e6',
                        borderRadius: 3,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="download" stroke="#17a2b8" fillOpacity={1} fill="url(#colorDownload)" />
                    <Area type="monotone" dataKey="upload" stroke="#d94f00" fillOpacity={1} fill="url(#colorUpload)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ backgroundColor: 'rgba(23, 162, 184, 0.1)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Total Download</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#17a2b8' }}>
                      45.2 GB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ backgroundColor: 'rgba(217, 79, 0, 0.1)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Total Upload</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#d94f00' }}>
                      12.8 GB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ backgroundColor: 'rgba(40, 167, 69, 0.1)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Peak Rate</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#28a745' }}>
                      1.5 Gbps
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Protocols Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>Traffic by Protocol</Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={protocolData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis dataKey="protocol" stroke="#495057" style={{ fontSize: 12 }} />
                <YAxis stroke="#495057" style={{ fontSize: 12 }} label={{ value: 'Bytes', angle: -90, position: 'insideLeft', style: { fill: '#495057' } }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: 3,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => `${(value / 1024 / 1024).toFixed(2)} MB`}
                />
                <Legend />
                <Bar dataKey="bytes" fill="#d94f00" />
              </BarChart>
            </ResponsiveContainer>
          </TabPanel>

          {/* Top Talkers Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>Top Bandwidth Consumers</Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topTalkers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis type="number" stroke="#495057" style={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" stroke="#495057" style={{ fontSize: 12 }} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: 3,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => `${(value / 1024 / 1024).toFixed(2)} MB`}
                />
                <Legend />
                <Bar dataKey="bytes" fill="#28a745" />
              </BarChart>
            </ResponsiveContainer>
          </TabPanel>

          {/* Real-time Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography color="text.secondary">Real-time Traffic Monitor - Coming soon...</Typography>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
