import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';

const intervals = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minuten' },
  { value: '15m', label: '15 Minuten' },
  { value: '1h', label: '1 Stunde' },
  { value: '6h', label: '6 Stunden' },
  { value: '1d', label: '1 Tag' },
];

export default function History() {
  const [interval, setInterval] = useState('5m');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('1h');

  const fetchHistory = async (range) => {
    setLoading(true);
    setTimeRange(range);
    try {
      const now = new Date();
      let startDate;

      switch (range) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
      }

      const response = await axios.get(`${API_URL}/traffic/history`, {
        params: {
          start: startDate.toISOString(),
          end: now.toISOString(),
          interval: interval
        }
      });

      // Process data for chart
      const processedData = {};
      response.data.data.forEach(item => {
        const time = new Date(item.time).toLocaleString('de-DE');
        if (!processedData[time]) {
          processedData[time] = { time, bytes: 0, packets: 0 };
        }
        if (item.field === 'bytes') {
          processedData[time].bytes += item.value;
        } else if (item.field === 'packets') {
          processedData[time].packets += item.value;
        }
      });

      setData(Object.values(processedData));
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return 0;
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Traffic-Verlauf
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Zeitraum auswählen
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Intervall"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
              >
                {intervals.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={9}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant={timeRange === '1h' ? 'contained' : 'outlined'}
                  onClick={() => fetchHistory('1h')}
                >
                  Letzte Stunde
                </Button>
                <Button
                  variant={timeRange === '24h' ? 'contained' : 'outlined'}
                  onClick={() => fetchHistory('24h')}
                >
                  Letzte 24h
                </Button>
                <Button
                  variant={timeRange === '7d' ? 'contained' : 'outlined'}
                  onClick={() => fetchHistory('7d')}
                >
                  Letzte 7 Tage
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {data.length > 0 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Traffic (Bytes)
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis
                    dataKey="time"
                    stroke="#a0a0a0"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#a0a0a0" tickFormatter={formatBytes} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2a2a3e',
                      borderRadius: 8,
                    }}
                    formatter={(value) => `${formatBytes(value)} MB`}
                  />
                  <Legend />
                  <Bar dataKey="bytes" fill="#00d4ff" name="Bytes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Pakete
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis
                    dataKey="time"
                    stroke="#a0a0a0"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
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
                    dataKey="packets"
                    stroke="#ff6b9d"
                    strokeWidth={2}
                    dot={false}
                    name="Pakete"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {!loading && data.length === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine Daten verfügbar
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Wählen Sie einen Zeitraum aus
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
