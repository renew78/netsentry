import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Router as RouterIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusColor = (status) => {
  switch (status) {
    case 'up':
      return 'success';
    case 'down':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'up':
      return 'Online';
    case 'down':
      return 'Offline';
    default:
      return 'Unbekannt';
  }
};

export default function Switches() {
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPort, setSelectedPort] = useState(null);
  const [formData, setFormData] = useState({
    switch_ip: '',
    switch_name: '',
    port_number: '',
    port_name: '',
    vlan_id: '',
    description: '',
    is_enabled: true
  });

  const fetchPorts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/switches/ports`);
      setPorts(response.data);
    } catch (error) {
      console.error('Error fetching switch ports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPorts();
    const interval = setInterval(fetchPorts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleEditClick = (port) => {
    setSelectedPort(port);
    setFormData({
      switch_ip: port.switch_ip,
      switch_name: port.switch_name,
      port_number: port.port_number,
      port_name: port.port_name || '',
      vlan_id: port.vlan_id || '',
      description: port.description || '',
      is_enabled: port.is_enabled
    });
    setEditDialogOpen(true);
  };

  const handleAddClick = () => {
    setFormData({
      switch_ip: '',
      switch_name: '',
      port_number: '',
      port_name: '',
      vlan_id: '',
      description: '',
      is_enabled: true
    });
    setAddDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API_URL}/api/switches/ports/${selectedPort.id}`, {
        port_name: formData.port_name,
        vlan_id: parseInt(formData.vlan_id) || null,
        description: formData.description,
        is_enabled: formData.is_enabled
      });
      setEditDialogOpen(false);
      fetchPorts();
    } catch (error) {
      console.error('Error updating port:', error);
      alert('Fehler beim Aktualisieren des Ports');
    }
  };

  const handleAddPort = async () => {
    try {
      await axios.post(`${API_URL}/api/switches/ports`, {
        switch_ip: formData.switch_ip,
        switch_name: formData.switch_name,
        port_number: parseInt(formData.port_number),
        port_name: formData.port_name,
        vlan_id: parseInt(formData.vlan_id) || null,
        description: formData.description,
        is_enabled: formData.is_enabled
      });
      setAddDialogOpen(false);
      fetchPorts();
    } catch (error) {
      console.error('Error adding port:', error);
      alert('Fehler beim Hinzufügen des Ports');
    }
  };

  const handleDeletePort = async (portId) => {
    if (window.confirm('Möchten Sie diesen Port wirklich löschen?')) {
      try {
        await axios.delete(`${API_URL}/api/switches/ports/${portId}`);
        fetchPorts();
      } catch (error) {
        console.error('Error deleting port:', error);
        alert('Fehler beim Löschen des Ports');
      }
    }
  };

  // Group ports by switch
  const groupedPorts = ports.reduce((acc, port) => {
    if (!acc[port.switch_ip]) {
      acc[port.switch_ip] = {
        switch_name: port.switch_name,
        switch_ip: port.switch_ip,
        ports: []
      };
    }
    acc[port.switch_ip].ports.push(port);
    return acc;
  }, {});

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Switch-Verwaltung
        </Typography>
        <Box>
          <Tooltip title="Aktualisieren">
            <IconButton onClick={fetchPorts} color="primary" sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
          >
            Port hinzufügen
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {Object.keys(groupedPorts).length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <RouterIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine Switches konfiguriert
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                Fügen Sie Ihre TP-Link Switches hinzu, um die Port-Überwachung zu aktivieren
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddClick}
              >
                Ersten Port hinzufügen
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {Object.values(groupedPorts).map((switchData) => (
            <Grid item xs={12} key={switchData.switch_ip}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <RouterIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {switchData.switch_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {switchData.switch_ip}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${switchData.ports.length} Ports`}
                      sx={{ ml: 'auto' }}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Port</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>VLAN</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Geschwindigkeit</TableCell>
                          <TableCell align="right">Eingehend</TableCell>
                          <TableCell align="right">Ausgehend</TableCell>
                          <TableCell>Beschreibung</TableCell>
                          <TableCell align="center">Aktionen</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {switchData.ports.sort((a, b) => a.port_number - b.port_number).map((port) => (
                          <TableRow key={port.id} hover>
                            <TableCell>
                              <Chip
                                label={port.port_number}
                                size="small"
                                sx={{ fontWeight: 600, minWidth: 50 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {port.port_name || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {port.vlan_id ? (
                                <Chip
                                  label={`VLAN ${port.vlan_id}`}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                />
                              ) : (
                                <Typography variant="body2" color="text.disabled">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={port.status === 'up' ? <CheckCircleIcon /> : <CancelIcon />}
                                label={getStatusText(port.status)}
                                size="small"
                                color={getStatusColor(port.status)}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {port.speed || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {formatBytes(port.bytes_in)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {formatBytes(port.bytes_out)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  maxWidth: 200,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {port.description || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Bearbeiten">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditClick(port)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Löschen">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeletePort(port.id)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Port bearbeiten</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Port-Name"
              value={formData.port_name}
              onChange={(e) => setFormData({ ...formData, port_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="VLAN ID"
              type="number"
              value={formData.vlan_id}
              onChange={(e) => setFormData({ ...formData, vlan_id: e.target.value })}
              fullWidth
              helperText="Optional: VLAN-ID für diesen Port"
            />
            <TextField
              label="Beschreibung"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              helperText="Was ist an diesem Port angeschlossen?"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSaveEdit} variant="contained">Speichern</Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Port hinzufügen</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Stellen Sie sicher, dass der Switch via SNMP erreichbar ist und die Community richtig konfiguriert ist.
            </Alert>
            <TextField
              label="Switch IP-Adresse"
              value={formData.switch_ip}
              onChange={(e) => setFormData({ ...formData, switch_ip: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Switch Name"
              value={formData.switch_name}
              onChange={(e) => setFormData({ ...formData, switch_name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Port-Nummer"
              type="number"
              value={formData.port_number}
              onChange={(e) => setFormData({ ...formData, port_number: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Port-Name"
              value={formData.port_name}
              onChange={(e) => setFormData({ ...formData, port_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="VLAN ID"
              type="number"
              value={formData.vlan_id}
              onChange={(e) => setFormData({ ...formData, vlan_id: e.target.value })}
              fullWidth
            />
            <TextField
              label="Beschreibung"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleAddPort} variant="contained">Hinzufügen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
