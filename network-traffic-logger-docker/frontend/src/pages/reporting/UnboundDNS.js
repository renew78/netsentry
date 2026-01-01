import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import { Dns as DnsIcon } from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UnboundDNS() {
  const [tabValue, setTabValue] = useState(0);

  // Placeholder data - will be replaced with real API data
  const queryStats = [
    { name: 'Resolved', value: 15234, color: '#00ff88' },
    { name: 'Blocked', value: 892, color: '#ff4444' },
    { name: 'Cached', value: 8521, color: '#00d4ff' },
  ];

  const topDomains = [
    { domain: 'google.com', queries: 1234 },
    { domain: 'cloudflare.com', queries: 892 },
    { domain: 'github.com', queries: 567 },
    { domain: 'amazon.com', queries: 445 },
    { domain: 'facebook.com', queries: 321 },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <DnsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Unbound DNS Statistics
        </Typography>
      </Box>

      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Overview" />
          <Tab label="Query Types" />
          <Tab label="Top Domains" />
          <Tab label="Blocklist" />
        </Tabs>

        <CardContent>
          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Query Distribution</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={queryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {queryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Statistics</Typography>
                <Grid container spacing={2}>
                  {queryStats.map((stat, index) => (
                    <Grid item xs={12} key={index}>
                      <Card variant="outlined" sx={{ backgroundColor: 'rgba(0, 212, 255, 0.05)' }}>
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">{stat.name}</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 600, color: stat.color }}>
                            {stat.value.toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Top Domains Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>Most Queried Domains</Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topDomains}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="domain" stroke="#a0a0a0" />
                <YAxis stroke="#a0a0a0" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 8 }}
                />
                <Legend />
                <Bar dataKey="queries" fill="#00d4ff" />
              </BarChart>
            </ResponsiveContainer>
          </TabPanel>

          {/* Placeholder tabs */}
          <TabPanel value={tabValue} index={1}>
            <Typography color="text.secondary">Query Types - Coming soon...</Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography color="text.secondary">Blocklist Statistics - Coming soon...</Typography>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
