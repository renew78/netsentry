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
  TableSortLabel,
  Chip,
  TextField,
  InputAdornment,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
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
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatBytesPerSec = (bytesPerSec) => {
  if (!bytesPerSec || bytesPerSec === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    return { text: 'Upload', color: 'warning' };
  } else if (received > sent * 2) {
    return { text: 'Download', color: 'success' };
  }
  return { text: 'Bidirektional', color: 'info' };
};

function descendingComparator(a, b, orderBy) {
  const aVal = a[orderBy] || 0;
  const bVal = b[orderBy] || 0;

  if (bVal < aVal) return -1;
  if (bVal > aVal) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vlans, setVlans] = useState({});
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('total_traffic');
  const [error, setError] = useState(null);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch devices from OPNsense
      const response = await axios.get(`${API_URL}/opnsense/devices`);
      setDevices(response.data || []);
      setFilteredDevices(response.data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError('Fehler beim Laden der Geräteliste. Bitte überprüfen Sie die OPNsense-Verbindung in den Einstellungen.');
      setDevices([]);
      setFilteredDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
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
        (device.ip_address && device.ip_address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (device.hostname && device.hostname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (device.mac_address && device.mac_address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredDevices(filtered);
    }
  }, [searchTerm, devices]);

  const getVlanName = (vlanId) => {
    if (!vlanId) return null;
    return vlans[vlanId] || `VLAN ${vlanId}`;
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler = (property) => () => {
    handleRequestSort(property);
  };

  const sortedDevices = stableSort(filteredDevices, getComparator(order, orderBy));

  const headCells = [
    { id: 'ip_address', label: 'IP-Adresse', sortable: true },
    { id: 'hostname', label: 'Hostname', sortable: true },
    { id: 'vlan_id', label: 'VLAN', sortable: true },
    { id: 'current_traffic', label: 'Aktueller Traffic', sortable: true, align: 'right' },
    { id: 'total_traffic', label: 'Gesamt-Traffic', sortable: true, align: 'right' },
    { id: 'direction', label: 'Richtung', sortable: false },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ComputerIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Netzwerk-Geräte
          </Typography>
        </Box>
        <Tooltip title="Aktualisieren">
          <IconButton onClick={fetchDevices} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
                <TableCell padding="checkbox" />
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.align || 'left'}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    {headCell.sortable ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={createSortHandler(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 4 }}>
                      <ComputerIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Keine Geräte gefunden
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {searchTerm ? 'Versuchen Sie eine andere Suchanfrage' : 'OPNsense Integration aktivieren und konfigurieren'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                sortedDevices.map((device, index) => {
                  const direction = getDirectionText(device.bytes_sent || 0, device.bytes_received || 0);
                  const vlanName = getVlanName(device.vlan_id);
                  const totalTraffic = (device.bytes_sent || 0) + (device.bytes_received || 0);
                  const currentTraffic = (device.bytes_sent_rate || 0) + (device.bytes_received_rate || 0);

                  return (
                    <TableRow
                      key={device.id || index}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell padding="checkbox">
                        <ComputerIcon sx={{ color: 'primary.main' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {device.ip_address || '-'}
                        </Typography>
                        {device.mac_address && (
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', display: 'block' }}>
                            {device.mac_address}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {device.hostname || '-'}
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
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatBytesPerSec(currentTraffic)}
                        </Typography>
                        {currentTraffic > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                            <Chip label={`↑ ${formatBytesPerSec(device.bytes_sent_rate || 0)}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 18 }} />
                            <Chip label={`↓ ${formatBytesPerSec(device.bytes_received_rate || 0)}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 18 }} />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatBytes(totalTraffic)}
                        </Typography>
                        {totalTraffic > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                            <Chip label={`↑ ${formatBytes(device.bytes_sent || 0)}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 18 }} />
                            <Chip label={`↓ ${formatBytes(device.bytes_received || 0)}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 18 }} />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getDirectionIcon(device.bytes_sent || 0, device.bytes_received || 0)}
                          <Chip
                            label={direction.text}
                            size="small"
                            color={direction.color}
                            variant="outlined"
                          />
                        </Box>
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
          Gesamt: {sortedDevices.length} Gerät(e) {searchTerm && `(gefiltert von ${devices.length})`}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Aktualisiert alle 10 Sekunden • Daten von OPNsense
        </Typography>
      </Box>
    </Box>
  );
}
