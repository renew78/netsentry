import React, { useState } from 'react';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';

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
    { ip: '10.10.1.10', hostname: 'desktop-main.local', bytes: 8521234, label: '10.10.1.10 - desktop-main.local' },
    { ip: '10.10.1.20', hostname: 'laptop-work.local', bytes: 4521234, label: '10.10.1.20 - laptop-work.local' },
    { ip: '10.10.1.30', hostname: 'iphone-12.local', bytes: 3521234, label: '10.10.1.30 - iphone-12.local' },
    { ip: '10.10.1.40', hostname: 'ipad-pro.local', bytes: 2521234, label: '10.10.1.40 - ipad-pro.local' },
    { ip: '10.10.1.50', hostname: 'smart-tv.local', bytes: 1821234, label: '10.10.1.50 - smart-tv.local' },
    { ip: '10.10.1.60', hostname: 'nas-server.local', bytes: 1521234, label: '10.10.1.60 - nas-server.local' },
    { ip: '10.10.1.70', hostname: 'pi-hole.local', bytes: 1321234, label: '10.10.1.70 - pi-hole.local' },
    { ip: '10.10.1.80', hostname: 'gaming-pc.local', bytes: 1121234, label: '10.10.1.80 - gaming-pc.local' },
    { ip: '10.10.1.90', hostname: 'macbook-air.local', bytes: 921234, label: '10.10.1.90 - macbook-air.local' },
    { ip: '10.10.1.100', hostname: 'android-phone.local', bytes: 821234, label: '10.10.1.100 - android-phone.local' },
    { ip: '10.10.2.10', hostname: 'printer-office.local', bytes: 721234, label: '10.10.2.10 - printer-office.local' },
    { ip: '10.10.2.20', hostname: 'security-cam-1.local', bytes: 621234, label: '10.10.2.20 - security-cam-1.local' },
    { ip: '10.10.2.30', hostname: 'security-cam-2.local', bytes: 521234, label: '10.10.2.30 - security-cam-2.local' },
    { ip: '10.10.2.40', hostname: 'chromebook.local', bytes: 421234, label: '10.10.2.40 - chromebook.local' },
    { ip: '10.10.2.50', hostname: 'switch-office.local', bytes: 321234, label: '10.10.2.50 - switch-office.local' },
    { ip: '10.10.3.10', hostname: 'sonos-speaker.local', bytes: 281234, label: '10.10.3.10 - sonos-speaker.local' },
    { ip: '10.10.3.20', hostname: 'alexa-echo.local', bytes: 221234, label: '10.10.3.20 - alexa-echo.local' },
    { ip: '10.10.3.30', hostname: 'smart-thermostat.local', bytes: 181234, label: '10.10.3.30 - smart-thermostat.local' },
    { ip: '10.10.3.40', hostname: 'ring-doorbell.local', bytes: 151234, label: '10.10.3.40 - ring-doorbell.local' },
    { ip: '10.10.3.50', hostname: 'hue-bridge.local', bytes: 121234, label: '10.10.3.50 - hue-bridge.local' },
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
            <ResponsiveContainer width="100%" height={600}>
              <BarChart data={topTalkers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis type="number" stroke="#495057" style={{ fontSize: 12 }} />
                <YAxis dataKey="label" type="category" stroke="#495057" style={{ fontSize: 11 }} width={250} />
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
