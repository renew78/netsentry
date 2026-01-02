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
    { name: 'Resolved', value: 15234, color: '#28a745' },
    { name: 'Blocked', value: 892, color: '#dc3545' },
    { name: 'Cached', value: 8521, color: '#17a2b8' },
  ];

  const queryTypes = [
    { type: 'A', count: 8521, color: '#d94f00' },
    { type: 'AAAA', count: 3214, color: '#17a2b8' },
    { type: 'PTR', count: 1523, color: '#28a745' },
    { type: 'MX', count: 892, color: '#ffc107' },
    { type: 'TXT', count: 456, color: '#dc3545' },
    { type: 'CNAME', count: 234, color: '#6c757d' },
  ];

  const topDomains = [
    { domain: 'google.com', queries: 4521 },
    { domain: 'youtube.com', queries: 3210 },
    { domain: 'facebook.com', queries: 2105 },
    { domain: 'amazon.com', queries: 1850 },
    { domain: 'twitter.com', queries: 1420 },
    { domain: 'instagram.com', queries: 1234 },
    { domain: 'reddit.com', queries: 1123 },
    { domain: 'netflix.com', queries: 1001 },
    { domain: 'github.com', queries: 892 },
    { domain: 'cloudflare.com', queries: 845 },
    { domain: 'apple.com', queries: 789 },
    { domain: 'microsoft.com', queries: 734 },
    { domain: 'linkedin.com', queries: 678 },
    { domain: 'stackoverflow.com', queries: 623 },
    { domain: 'wikipedia.org', queries: 567 },
    { domain: 'twitch.tv', queries: 512 },
    { domain: 'spotify.com', queries: 489 },
    { domain: 'discord.com', queries: 445 },
    { domain: 'zoom.us', queries: 398 },
    { domain: 'dropbox.com', queries: 321 },
  ];

  const blocklist = [
    { domain: 'ads.doubleclick.net', blocked: 1523, color: '#dc3545' },
    { domain: 'tracker.facebook.com', blocked: 892, color: '#dc3545' },
    { domain: 'analytics.google.com', blocked: 756, color: '#dc3545' },
    { domain: 'ad.atdmt.com', blocked: 645, color: '#dc3545' },
    { domain: 'pixel.facebook.com', blocked: 534, color: '#dc3545' },
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
                      <Card variant="outlined">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis dataKey="domain" stroke="#495057" style={{ fontSize: 12 }} />
                <YAxis stroke="#495057" style={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: 3,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="queries" fill="#d94f00" />
              </BarChart>
            </ResponsiveContainer>
          </TabPanel>

          {/* Query Types Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Query Type Distribution</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={queryTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {queryTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Query Types</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={queryTypes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                    <XAxis dataKey="type" stroke="#495057" style={{ fontSize: 12 }} />
                    <YAxis stroke="#495057" style={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #dee2e6',
                        borderRadius: 3,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#d94f00" />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Blocklist Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>Top Blocked Domains</Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={blocklist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis type="number" stroke="#495057" style={{ fontSize: 12 }} />
                <YAxis dataKey="domain" type="category" stroke="#495057" style={{ fontSize: 12 }} width={200} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: 3,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="blocked" fill="#dc3545" />
              </BarChart>
            </ResponsiveContainer>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
