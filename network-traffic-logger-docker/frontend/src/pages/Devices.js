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
  TextField,
  InputAdornment,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Computer as ComputerIcon,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getDirectionIcon = (sent, received) => {
  if (sent > received * 2) {
    return <TrendingUp sx={{ color: 'warning.main' }} />;
  } else if (received > sent * 2) {
    return <TrendingDown sx={{ color: 'success.main' }} />;
  }
  return <SwapHoriz sx={{ color: 'info.main' }} />;
};

const getDirectionText = (sent, received) => {
  if (sent > received * 2) {
    return { text: 'Hauptsächlich Ausgehend', color: 'warning' };
  } else if (received > sent * 2) {
    return { text: 'Hauptsächlich Eingehend', color: 'success' };
  }
  return { text: 'Bidirektional', color: 'info' };
};

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vlans, setVlans] = useState({});

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/devices`);
      setDevices(response.data);
      setFilteredDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      // Convert VLAN array to ID->Name mapping
      const vlanMap = {};
      if (response.data.vlans) {
        response.data.vlans.forEach((vlan) => {
          vlanMap[vlan.id] = vlan.name;
        });
      }
      setVlans(vlanMap);
    } catch (error) {
      console.error('Error fetching VLANs:', error);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchVlans();
    const interval = setInterval(fetchDevices, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredDevices(devices);
    } else {
      const filtered = devices.filter(device =>
        device.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.hostname && device.hostname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (device.mac_address && device.mac_address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredDevices(filtered);
    }
  }, [searchTerm, devices]);

  const getLastSeenColor = (lastSeen) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = (now - lastSeenDate) / 1000 / 60;

    if (diffMinutes < 5) return 'success';
    if (diffMinutes < 30) return 'warning';
    return 'error';
  };

  const getLastSeenText = (lastSeen) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = Math.floor((now - lastSeenDate) / 1000 / 60);

    if (diffMinutes < 1) return 'Gerade eben';
    if (diffMinutes < 60) return `Vor ${diffMinutes} Min.`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Vor ${diffHours} Std.`;
    const diffDays = Math.floor(diffHours / 24);
    return `Vor ${diffDays} Tag(en)`;
  };

  const getVlanName = (vlanId) => {
    if (!vlanId) return null;
    return vlans[vlanId] || `VLAN ${vlanId}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Netzwerk-Geräte
        </Typography>
        <Tooltip title="Aktualisieren">
          <IconButton onClick={fetchDevices} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Suche nach IP, Hostname oder MAC-Adresse..."
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
        </CardContent>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Gerät</TableCell>
                <TableCell>IP-Adresse</TableCell>
                <TableCell>Hostname</TableCell>
                <TableCell>MAC-Adresse</TableCell>
                <TableCell>VLAN</TableCell>
                <TableCell>Datenfluss</TableCell>
                <TableCell align="right">Gesendet</TableCell>
                <TableCell align="right">Empfangen</TableCell>
                <TableCell>Letzte Aktivität</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Box sx={{ py: 4 }}>
                      <ComputerIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Keine Geräte gefunden
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {searchTerm ? 'Versuchen Sie eine andere Suchanfrage' : 'Warte auf Netzwerk-Traffic...'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => {
                  const direction = getDirectionText(device.bytes_sent, device.bytes_received);
                  const vlanName = getVlanName(device.vlan_id);
                  return (
                    <TableRow
                      key={device.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ComputerIcon sx={{ mr: 1, color: 'primary.main' }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {device.ip_address}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {device.hostname || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {device.mac_address || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {vlanName ? (
                          <Chip
                            label={vlanName}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getDirectionIcon(device.bytes_sent, device.bytes_received)}
                          <Chip
                            label={direction.text}
                            size="small"
                            color={direction.color}
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatBytes(device.bytes_sent || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatBytes(device.bytes_received || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getLastSeenText(device.last_seen)}
                          size="small"
                          color={getLastSeenColor(device.last_seen)}
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Gesamt: {filteredDevices.length} Gerät(e) {searchTerm && `(gefiltert von ${devices.length})`}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Aktualisiert alle 10 Sekunden
        </Typography>
      </Box>
    </Box>
  );
}
