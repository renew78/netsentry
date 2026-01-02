import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';

export default function CameraSettings() {
  const [cameras, setCameras] = useState([]);
  const [cameraDialog, setCameraDialog] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [cameraForm, setCameraForm] = useState({
    name: '',
    host: '',
    port: 554,
    username: '',
    password: '',
    rtsp_path: '/h264Preview_01_main',
    sub_stream_path: '/h264Preview_01_sub',
    enabled: true,
  });

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const response = await axios.get(`${API_URL}/cameras`);
      setCameras(response.data || []);
    } catch (error) {
      console.error('Error fetching cameras:', error);
    }
  };

  const handleAddCamera = () => {
    setCameraForm({
      name: '',
      host: '',
      port: 554,
      username: '',
      password: '',
      rtsp_path: '/h264Preview_01_main',
      sub_stream_path: '/h264Preview_01_sub',
      enabled: true,
    });
    setEditingCamera(null);
    setCameraDialog(true);
  };

  const handleEditCamera = (camera) => {
    setCameraForm({
      name: camera.name,
      host: camera.host,
      port: camera.port,
      username: camera.username,
      password: camera.password,
      rtsp_path: camera.rtsp_path || '/h264Preview_01_main',
      sub_stream_path: camera.sub_stream_path || '/h264Preview_01_sub',
      enabled: camera.enabled,
    });
    setEditingCamera(camera);
    setCameraDialog(true);
  };

  const handleDeleteCamera = async (cameraId) => {
    if (!window.confirm('Möchten Sie diese Kamera wirklich löschen?')) return;

    try {
      await axios.delete(`${API_URL}/cameras/${cameraId}`);
      fetchCameras();
    } catch (error) {
      console.error('Error deleting camera:', error);
      alert('Fehler beim Löschen der Kamera');
    }
  };

  const handleSaveCamera = async () => {
    try {
      if (editingCamera) {
        await axios.put(`${API_URL}/cameras/${editingCamera.id}`, cameraForm);
      } else {
        await axios.post(`${API_URL}/cameras`, cameraForm);
      }
      setCameraDialog(false);
      fetchCameras();
    } catch (error) {
      console.error('Error saving camera:', error);
      alert('Fehler beim Speichern der Kamera');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SettingsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Kamera-Einstellungen
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Konfigurierte Kameras</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddCamera}
            >
              Kamera hinzufügen
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Konfigurieren Sie hier Ihre Reolink IP-Kameras. Die Kameras werden über HTTPS-Snapshots eingebunden.
          </Alert>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Host</TableCell>
                  <TableCell>Port</TableCell>
                  <TableCell>Benutzername</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cameras.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <VideocamIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography color="text.secondary" variant="h6" gutterBottom>
                        Keine Kameras konfiguriert
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Klicken Sie auf "Kamera hinzufügen", um loszulegen
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  cameras.map((camera) => (
                    <TableRow key={camera.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VideocamIcon sx={{ color: 'primary.main' }} />
                          <Typography fontWeight={600}>{camera.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{camera.host}</TableCell>
                      <TableCell>{camera.port}</TableCell>
                      <TableCell>{camera.username}</TableCell>
                      <TableCell>
                        <Chip
                          label={camera.enabled ? 'Aktiv' : 'Deaktiviert'}
                          color={camera.enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEditCamera(camera)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteCamera(camera.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Camera Dialog */}
      <Dialog
        open={cameraDialog}
        onClose={() => setCameraDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#1a1a2e' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideocamIcon color="primary" />
            {editingCamera ? 'Kamera bearbeiten' : 'Neue Kamera hinzufügen'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Kamera-Name"
              value={cameraForm.name}
              onChange={(e) => setCameraForm({ ...cameraForm, name: e.target.value })}
              fullWidth
              required
              placeholder="z.B. Eingang, Garage, Garten"
            />
            <TextField
              label="IP-Adresse oder Hostname"
              value={cameraForm.host}
              onChange={(e) => setCameraForm({ ...cameraForm, host: e.target.value })}
              fullWidth
              required
              placeholder="z.B. 10.10.10.50"
            />
            <TextField
              label="Port"
              type="number"
              value={cameraForm.port}
              onChange={(e) => setCameraForm({ ...cameraForm, port: parseInt(e.target.value) || 554 })}
              fullWidth
              placeholder="Standard: 554"
            />
            <TextField
              label="Benutzername"
              value={cameraForm.username}
              onChange={(e) => setCameraForm({ ...cameraForm, username: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Passwort"
              type="password"
              value={cameraForm.password}
              onChange={(e) => setCameraForm({ ...cameraForm, password: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="RTSP-Pfad (Hauptstream)"
              value={cameraForm.rtsp_path}
              onChange={(e) => setCameraForm({ ...cameraForm, rtsp_path: e.target.value })}
              fullWidth
              placeholder="/h264Preview_01_main"
              helperText="Standard für Reolink Kameras"
            />
            <TextField
              label="RTSP-Pfad (Substream)"
              value={cameraForm.sub_stream_path}
              onChange={(e) => setCameraForm({ ...cameraForm, sub_stream_path: e.target.value })}
              fullWidth
              placeholder="/h264Preview_01_sub"
              helperText="Niedrigere Auflösung für schnellere Vorschau"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={cameraForm.enabled}
                  onChange={(e) => setCameraForm({ ...cameraForm, enabled: e.target.checked })}
                />
              }
              label="Kamera aktiviert"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCameraDialog(false)}>Abbrechen</Button>
          <Button onClick={handleSaveCamera} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
