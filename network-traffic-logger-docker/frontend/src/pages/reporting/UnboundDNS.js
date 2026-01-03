import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { Dns as DnsIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UnboundDNS() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dnsData, setDnsData] = useState(null);
  const [clientStats, setClientStats] = useState([]);
  const [blocklistStats, setBlocklistStats] = useState([]);
  const [performanceStats, setPerformanceStats] = useState({});
  const [timeRange, setTimeRange] = useState(24); // hours

  // Fallback placeholder data
  const placeholderData = {
    queryStats: [
      { name: 'Resolved', value: 15234, color: '#28a745' },
      { name: 'Blocked', value: 892, color: '#dc3545' },
      { name: 'Cached', value: 8521, color: '#17a2b8' },
    ],
    queryTypes: [
      { type: 'A', count: 8521, color: '#d94f00' },
      { type: 'AAAA', count: 3214, color: '#17a2b8' },
      { type: 'PTR', count: 1523, color: '#28a745' },
      { type: 'MX', count: 892, color: '#ffc107' },
      { type: 'TXT', count: 456, color: '#dc3545' },
      { type: 'CNAME', count: 234, color: '#6c757d' },
    ],
    topDomains: [
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
    ],
    blocklist: [
      { domain: 'ads.doubleclick.net', blocked: 1523, color: '#dc3545' },
      { domain: 'tracker.facebook.com', blocked: 892, color: '#dc3545' },
      { domain: 'analytics.google.com', blocked: 756, color: '#dc3545' },
      { domain: 'ad.atdmt.com', blocked: 645, color: '#dc3545' },
      { domain: 'pixel.facebook.com', blocked: 534, color: '#dc3545' },
      { domain: 'adservice.google.com', blocked: 489, color: '#dc3545' },
      { domain: 'pagead2.googlesyndication.com', blocked: 456, color: '#dc3545' },
      { domain: 'googleadservices.com', blocked: 423, color: '#dc3545' },
      { domain: 'ad.doubleclick.net', blocked: 398, color: '#dc3545' },
      { domain: 'static.ads-twitter.com', blocked: 367, color: '#dc3545' },
      { domain: 'www.googletagmanager.com', blocked: 334, color: '#dc3545' },
      { domain: 'connect.facebook.net', blocked: 312, color: '#dc3545' },
      { domain: 'stats.g.doubleclick.net', blocked: 289, color: '#dc3545' },
      { domain: 'www.google-analytics.com', blocked: 267, color: '#dc3545' },
      { domain: 'bat.bing.com', blocked: 245, color: '#dc3545' },
      { domain: 'adnxs.com', blocked: 223, color: '#dc3545' },
      { domain: 'pubads.g.doubleclick.net', blocked: 201, color: '#dc3545' },
      { domain: 'advertising.com', blocked: 189, color: '#dc3545' },
      { domain: 'scorecardresearch.com', blocked: 167, color: '#dc3545' },
      { domain: 'tags.tiqcdn.com', blocked: 145, color: '#dc3545' },
    ]
  };

  const fetchDNSData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all DNS statistics from OPNsense DuckDB API
      const [statsResponse, clientResponse, blocklistResponse, perfResponse] = await Promise.all([
        axios.get(`${API_URL}/opnsense/unbound/stats?hours=${timeRange}`),
        axios.get(`${API_URL}/opnsense/unbound/client-stats?hours=${timeRange}&limit=20`),
        axios.get(`${API_URL}/opnsense/unbound/blocklist-stats?hours=${timeRange}`),
        axios.get(`${API_URL}/opnsense/unbound/performance?hours=${timeRange}`)
      ]);

      // Check if we got any real data
      const hasRealData = statsResponse.data && (
        (statsResponse.data.queryStats && statsResponse.data.queryStats.length > 0) ||
        (statsResponse.data.blocklist && statsResponse.data.blocklist.length > 0) ||
        (statsResponse.data.queryTypes && statsResponse.data.queryTypes.length > 0) ||
        (statsResponse.data.topDomains && statsResponse.data.topDomains.length > 0)
      );

      if (hasRealData) {
        setDnsData(statsResponse.data);
        setClientStats(clientResponse.data.success ? clientResponse.data.data : []);
        setBlocklistStats(blocklistResponse.data.success ? blocklistResponse.data.data : []);
        setPerformanceStats(perfResponse.data.success ? perfResponse.data.data : {});
        setError(null);
      } else {
        // Backend returned empty data - OPNsense might not be configured
        setError('Keine DNS-Statistiken verfügbar. Bitte stellen Sie sicher, dass:\n1. OPNsense in den Einstellungen konfiguriert ist\n2. Unbound DNS auf OPNsense aktiviert ist\n3. SSH-Zugriff vom Backend zu OPNsense konfiguriert ist');
        setDnsData(placeholderData);
        setClientStats([]);
        setBlocklistStats([]);
        setPerformanceStats({});
      }
    } catch (error) {
      console.error('Error fetching Unbound DNS data:', error);
      if (error.response?.status === 500) {
        setError('Fehler beim Abrufen der DNS-Statistiken von OPNsense DuckDB. Bitte Backend-Logs und SSH-Verbindung prüfen.');
      } else if (error.response?.status === 404) {
        setError('OPNsense DuckDB API-Endpoint nicht gefunden. Bitte Backend-Version prüfen.');
      } else {
        setError('Verbindungsfehler zu OPNsense. Bitte Netzwerk, SSH-Zugriff und Einstellungen prüfen.');
      }
      // Use placeholder data as fallback
      setDnsData(placeholderData);
      setClientStats([]);
      setBlocklistStats([]);
      setPerformanceStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDNSData();
    const interval = setInterval(fetchDNSData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Use fetched data or fallback to placeholder
  const queryStats = dnsData?.queryStats || placeholderData.queryStats;
  const queryTypes = dnsData?.queryTypes || placeholderData.queryTypes;
  const topDomains = dnsData?.topDomains || placeholderData.topDomains;
  const blocklist = dnsData?.blocklist || placeholderData.blocklist;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DnsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Unbound DNS Statistics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Zeitbereich</InputLabel>
            <Select
              value={timeRange}
              label="Zeitbereich"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value={1}>1 Stunde</MenuItem>
              <MenuItem value={6}>6 Stunden</MenuItem>
              <MenuItem value={24}>24 Stunden</MenuItem>
              <MenuItem value={48}>48 Stunden</MenuItem>
              <MenuItem value={168}>7 Tage</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Aktualisieren">
            <IconButton onClick={fetchDNSData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Query Types" />
          <Tab label="Top Domains" />
          <Tab label="Blocklist" />
          <Tab label="Clients" />
          <Tab label="Blocklist Effectiveness" />
          <Tab label="Performance" />
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
                    <ChartTooltip />
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
                <ChartTooltip
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
                    <ChartTooltip />
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
                <ChartTooltip
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

          {/* Clients Tab */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" gutterBottom>Client DNS Statistics</Typography>
            {clientStats && clientStats.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Client IP</strong></TableCell>
                      <TableCell align="right"><strong>Total Queries</strong></TableCell>
                      <TableCell align="right"><strong>Allowed</strong></TableCell>
                      <TableCell align="right"><strong>Blocked</strong></TableCell>
                      <TableCell align="right"><strong>Block Rate</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientStats.map((client, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{client.client}</TableCell>
                        <TableCell align="right">{client.total_queries?.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: '#28a745' }}>
                          {client.allowed?.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#dc3545' }}>
                          {client.blocked?.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${client.block_rate}%`}
                            size="small"
                            color={client.block_rate > 20 ? "error" : client.block_rate > 5 ? "warning" : "success"}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">Keine Client-Statistiken verfügbar</Alert>
            )}
          </TabPanel>

          {/* Blocklist Effectiveness Tab */}
          <TabPanel value={tabValue} index={5}>
            <Typography variant="h6" gutterBottom>Blocklist Effectiveness</Typography>
            {blocklistStats && blocklistStats.length > 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Blocked Queries by List</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={blocklistStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="blocked_count"
                        label={({ blocklist, percent }) => `${blocklist}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {blocklistStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Blocklist Details</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell><strong>Blocklist</strong></TableCell>
                          <TableCell align="right"><strong>Blocked</strong></TableCell>
                          <TableCell align="right"><strong>Domains</strong></TableCell>
                          <TableCell align="right"><strong>Clients</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {blocklistStats.map((list, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{list.blocklist}</TableCell>
                            <TableCell align="right">{list.blocked_count?.toLocaleString()}</TableCell>
                            <TableCell align="right">{list.unique_domains?.toLocaleString()}</TableCell>
                            <TableCell align="right">{list.unique_clients?.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">Keine Blocklist-Statistiken verfügbar</Alert>
            )}
          </TabPanel>

          {/* Performance Tab */}
          <TabPanel value={tabValue} index={6}>
            <Typography variant="h6" gutterBottom>DNS Performance Metrics</Typography>
            {performanceStats && Object.keys(performanceStats).length > 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Average Response Time</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#17a2b8' }}>
                        {performanceStats.avg_ms} ms
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Median Response Time</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#28a745' }}>
                        {performanceStats.median_ms} ms
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">95th Percentile</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffc107' }}>
                        {performanceStats.p95_ms} ms
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Minimum Response Time</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#28a745' }}>
                        {performanceStats.min_ms} ms
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Maximum Response Time</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#dc3545' }}>
                        {performanceStats.max_ms} ms
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">Keine Performance-Daten verfügbar</Alert>
            )}
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
