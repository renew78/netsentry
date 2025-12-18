import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
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
  Dns as DnsIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  TrendingUp,
  TrendingDown,
  Speed,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
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

export default function AdGuard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_queries: 0,
    blocked_queries: 0,
    allowed_queries: 0,
    blocking_percentage: 0,
  });
  const [queries, setQueries] = useState([]);
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    fetchAdGuardData();
    const interval = setInterval(fetchAdGuardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterQueries();
  }, [searchTerm, filterType, queries]);

  const fetchAdGuardData = async () => {
    setLoading(true);
    try {
      const [statsRes, queriesRes] = await Promise.all([
        axios.get(`${API_URL}/adguard/stats`),
        axios.get(`${API_URL}/adguard/queries`),
      ]);

      setStats(statsRes.data);
      setQueries(queriesRes.data);

      // Prepare pie chart data
      setPieData([
        { name: 'Erlaubt', value: statsRes.data.allowed_queries, color: '#00ff88' },
        { name: 'Blockiert', value: statsRes.data.blocked_queries, color: '#ff4444' },
      ]);
    } catch (error) {
      console.error('Error fetching AdGuard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterQueries = () => {
    let filtered = queries;

    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.client_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (q.client_name && q.client_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((q) => q.status === filterType);
    }

    setFilteredQueries(filtered);
  };

  const getStatusChip = (status) => {
    if (status === 'blocked') {
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

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DnsIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            AdGuard Home
          </Typography>
        </Box>
        <Tooltip title="Aktualisieren">
          <IconButton onClick={fetchAdGuardData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Gesamt Anfragen"
            value={stats.total_queries.toLocaleString()}
            icon={<Speed sx={{ fontSize: 32, color: 'primary.main' }} />}
            color="#00d4ff"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Erlaubt"
            value={stats.allowed_queries.toLocaleString()}
            icon={<TrendingUp sx={{ fontSize: 32, color: 'success.main' }} />}
            color="#00ff88"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Blockiert"
            value={stats.blocked_queries.toLocaleString()}
            icon={<TrendingDown sx={{ fontSize: 32, color: 'error.main' }} />}
            color="#ff4444"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Blockierungsrate"
            value={stats.blocking_percentage.toFixed(1)}
            unit="%"
            icon={<BlockIcon sx={{ fontSize: 32, color: 'warning.main' }} />}
            color="#ffaa00"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                DNS-Anfragen Verteilung
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2a2a3e',
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Query Log */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                DNS-Anfragen Protokoll
              </Typography>

              {/* Filters */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Suche nach Domain, IP oder Gerät..."
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
                  <InputLabel>Filter</InputLabel>
                  <Select
                    value={filterType}
                    label="Filter"
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <MenuItem value="all">Alle</MenuItem>
                    <MenuItem value="allowed">Nur Erlaubt</MenuItem>
                    <MenuItem value="blocked">Nur Blockiert</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Zeit</TableCell>
                      <TableCell>Domain</TableCell>
                      <TableCell>Client IP</TableCell>
                      <TableCell>Client Name</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredQueries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Box sx={{ py: 4 }}>
                            <DnsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                              Keine DNS-Anfragen gefunden
                            </Typography>
                            <Typography variant="body2" color="text.disabled">
                              {searchTerm || filterType !== 'all'
                                ? 'Versuchen Sie andere Filter'
                                : 'Warte auf DNS-Anfragen...'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQueries.map((query, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {formatTime(query.timestamp)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                maxWidth: 300,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {query.domain}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {query.client_ip}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {query.client_name || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>{getStatusChip(query.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Anzeige: {filteredQueries.length} von {queries.length} Anfragen
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Aktualisiert alle 30 Sekunden
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
