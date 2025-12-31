import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
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
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Shield as ShieldIcon,
  Dns as DnsIcon,
  Security as SecurityIcon,
  NetworkCheck as NetworkCheckIcon,
  Storage as StorageIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    vlans: [],
    adguard: { enabled: false, url: '', apiKey: '' },
    opnsense: {
      enabled: false,
      url: '',
      apiKey: '',
      apiSecret: '',
      features: {
        showDevices: true,
        showFirewallStats: true,
        showFirewallLogs: false,
        showTrafficChart: false,
      },
    },
    truenas: { enabled: false, url: '', apiKey: '' },
    ai_analysis: { enabled: false },
  });
  const [vlanDialog, setVlanDialog] = useState(false);
  const [editingVlan, setEditingVlan] = useState(null);
  const [vlanForm, setVlanForm] = useState({ id: '', name: '', description: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      // Merge with defaults to ensure all fields exist
      const defaultSettings = {
        vlans: [],
        adguard: { enabled: false, url: '', apiKey: '' },
        opnsense: {
          enabled: false,
          url: '',
          apiKey: '',
          apiSecret: '',
          features: {
            showDevices: true,
            showFirewallStats: true,
            showFirewallLogs: false,
            showTrafficChart: false,
          },
        },
        truenas: { enabled: false, url: '', apiKey: '' },
        ai_analysis: { enabled: false },
      };
      const mergedSettings = {
        ...defaultSettings,
        ...response.data,
        adguard: { ...defaultSettings.adguard, ...(response.data.adguard || {}) },
        opnsense: {
          ...defaultSettings.opnsense,
          ...(response.data.opnsense || {}),
          features: {
            ...defaultSettings.opnsense.features,
            ...((response.data.opnsense && response.data.opnsense.features) || {}),
          },
        },
        truenas: { ...defaultSettings.truenas, ...(response.data.truenas || {}) },
        ai_analysis: { ...defaultSettings.ai_analysis, ...(response.data.ai_analysis || {}) },
      };
      setSettings(mergedSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await axios.post(`${API_URL}/settings`, settings);
      alert('Einstellungen gespeichert');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Fehler beim Speichern der Einstellungen');
    }
  };

  const handleAddVlan = () => {
    setEditingVlan(null);
    setVlanForm({ id: '', name: '', description: '' });
    setVlanDialog(true);
  };

  const handleEditVlan = (vlan) => {
    setEditingVlan(vlan);
    setVlanForm(vlan);
    setVlanDialog(true);
  };

  const handleSaveVlan = () => {
    if (editingVlan) {
      setSettings({
        ...settings,
        vlans: settings.vlans.map((v) =>
          v.id === editingVlan.id ? vlanForm : v
        ),
      });
    } else {
      setSettings({
        ...settings,
        vlans: [...settings.vlans, { ...vlanForm, id: parseInt(vlanForm.id) }],
      });
    }
    setVlanDialog(false);
  };

  const handleDeleteVlan = (vlanId) => {
    setSettings({
      ...settings,
      vlans: settings.vlans.filter((v) => v.id !== vlanId),
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SettingsIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Einstellungen
        </Typography>
      </Box>

      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<NetworkCheckIcon />} label="VLANs" />
          <Tab icon={<DnsIcon />} label="AdGuard" />
          <Tab icon={<SecurityIcon />} label="OPNsense" />
          <Tab icon={<StorageIcon />} label="TrueNAS" />
          <Tab icon={<VideocamIcon />} label="Kameras" />
          <Tab icon={<ShieldIcon />} label="Erweitert" />
        </Tabs>

        <CardContent>
          {/* VLAN Configuration */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">VLAN-Konfiguration</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddVlan}
              >
                VLAN hinzufügen
              </Button>
            </Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Konfigurieren Sie hier die VLAN IDs und Namen. Diese werden in der Geräte-Übersicht angezeigt.
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>VLAN ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Beschreibung</TableCell>
                    <TableCell align="right">Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settings.vlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">
                          Keine VLANs konfiguriert
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    settings.vlans.map((vlan) => (
                      <TableRow key={vlan.id}>
                        <TableCell>
                          <Chip label={vlan.id} color="primary" size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={600}>{vlan.name}</Typography>
                        </TableCell>
                        <TableCell>{vlan.description}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleEditVlan(vlan)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteVlan(vlan.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* AdGuard Configuration */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              AdGuard Home Integration
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Verbinden Sie NetSentry mit Ihrem AdGuard Home Server, um DNS-Statistiken anzuzeigen.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.adguard.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          adguard: { ...settings.adguard, enabled: e.target.checked },
                        })
                      }
                    />
                  }
                  label="AdGuard Integration aktivieren"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="AdGuard URL"
                  placeholder="http://10.10.1.10:3000"
                  value={settings.adguard.url}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      adguard: { ...settings.adguard, url: e.target.value },
                    })
                  }
                  disabled={!settings.adguard.enabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  type="password"
                  value={settings.adguard.apiKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      adguard: { ...settings.adguard, apiKey: e.target.value },
                    })
                  }
                  disabled={!settings.adguard.enabled}
                  helperText="Sie finden den API Key in den AdGuard Einstellungen unter 'Allgemeine Einstellungen'"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* OPNsense Configuration */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              OPNsense Firewall Integration
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Verbinden Sie NetSentry mit Ihrer OPNsense Firewall, um Firewall-Statistiken und Geräteliste anzuzeigen.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.opnsense.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          opnsense: { ...settings.opnsense, enabled: e.target.checked },
                        })
                      }
                    />
                  }
                  label="OPNsense Integration aktivieren"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="OPNsense URL"
                  placeholder="https://10.10.1.1"
                  value={settings.opnsense.url}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      opnsense: { ...settings.opnsense, url: e.target.value },
                    })
                  }
                  disabled={!settings.opnsense.enabled}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Key"
                  value={settings.opnsense.apiKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      opnsense: { ...settings.opnsense, apiKey: e.target.value },
                    })
                  }
                  disabled={!settings.opnsense.enabled}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="API Secret"
                  value={settings.opnsense.apiSecret}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      opnsense: { ...settings.opnsense, apiSecret: e.target.value },
                    })
                  }
                  disabled={!settings.opnsense.enabled}
                />
              </Grid>

              {/* OPNsense Features */}
              {settings.opnsense.enabled && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                      Anzuzeigende Komponenten
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.opnsense.features?.showDevices ?? true}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              opnsense: {
                                ...settings.opnsense,
                                features: {
                                  ...settings.opnsense.features,
                                  showDevices: e.target.checked,
                                },
                              },
                            })
                          }
                        />
                      }
                      label="Geräteliste anzeigen"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.opnsense.features?.showFirewallStats ?? true}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              opnsense: {
                                ...settings.opnsense,
                                features: {
                                  ...settings.opnsense.features,
                                  showFirewallStats: e.target.checked,
                                },
                              },
                            })
                          }
                        />
                      }
                      label="Firewall-Statistiken anzeigen"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.opnsense.features?.showFirewallLogs ?? false}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              opnsense: {
                                ...settings.opnsense,
                                features: {
                                  ...settings.opnsense.features,
                                  showFirewallLogs: e.target.checked,
                                },
                              },
                            })
                          }
                        />
                      }
                      label="Firewall-Logs anzeigen (experimentell)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.opnsense.features?.showTrafficChart ?? false}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              opnsense: {
                                ...settings.opnsense,
                                features: {
                                  ...settings.opnsense.features,
                                  showTrafficChart: e.target.checked,
                                },
                              },
                            })
                          }
                        />
                      }
                      label="Traffic-Diagramm anzeigen (experimentell)"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </TabPanel>

          {/* TrueNAS Configuration */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              TrueNAS Scale Integration
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Verbinden Sie NetSentry mit Ihrem TrueNAS Scale Server, um Storage-Statistiken anzuzeigen.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.truenas.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          truenas: { ...settings.truenas, enabled: e.target.checked },
                        })
                      }
                    />
                  }
                  label="TrueNAS Integration aktivieren"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="TrueNAS URL"
                  placeholder="https://10.10.1.20"
                  value={settings.truenas.url}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      truenas: { ...settings.truenas, url: e.target.value },
                    })
                  }
                  disabled={!settings.truenas.enabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="API Key"
                  value={settings.truenas.apiKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      truenas: { ...settings.truenas, apiKey: e.target.value },
                    })
                  }
                  disabled={!settings.truenas.enabled}
                  helperText="Erstellen Sie einen API Key in TrueNAS unter System → API Keys"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Camera Configuration */}
          <CameraSettings />

          {/* Advanced Settings */}
          <TabPanel value={tabValue} index={5}>
            <Typography variant="h6" gutterBottom>
              Erweiterte Einstellungen
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                      KI-Traffic-Analyse
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Aktivieren Sie die KI-basierte Analyse des Netzwerk-Traffics, um
                      Anomalien und Muster automatisch zu erkennen.
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.ai_analysis.enabled}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              ai_analysis: { enabled: e.target.checked },
                            })
                          }
                        />
                      }
                      label={
                        settings.ai_analysis.enabled
                          ? 'KI-Analyse aktiviert'
                          : 'KI-Analyse deaktiviert'
                      }
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={saveSettings}
            >
              Alle Einstellungen speichern
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* VLAN Dialog */}
      <Dialog open={vlanDialog} onClose={() => setVlanDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingVlan ? 'VLAN bearbeiten' : 'VLAN hinzufügen'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="VLAN ID"
              type="number"
              value={vlanForm.id}
              onChange={(e) => setVlanForm({ ...vlanForm, id: e.target.value })}
              fullWidth
              required
              disabled={!!editingVlan}
            />
            <TextField
              label="Name"
              value={vlanForm.name}
              onChange={(e) => setVlanForm({ ...vlanForm, name: e.target.value })}
              fullWidth
              required
              placeholder="z.B. Gäste-WLAN, IoT, etc."
            />
            <TextField
              label="Beschreibung"
              value={vlanForm.description}
              onChange={(e) => setVlanForm({ ...vlanForm, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVlanDialog(false)}>Abbrechen</Button>
          <Button onClick={handleSaveVlan} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Camera Settings Component
function CameraSettings() {
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
    <TabPanel value={4} index={4}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Kamera-Konfiguration</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCamera}
        >
          Kamera hinzufügen
        </Button>
      </Box>

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
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Keine Kameras konfiguriert
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              cameras.map((camera) => (
                <TableRow key={camera.id}>
                  <TableCell>{camera.name}</TableCell>
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
                    <IconButton size="small" onClick={() => handleEditCamera(camera)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteCamera(camera.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={cameraDialog}
        onClose={() => setCameraDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCamera ? 'Kamera bearbeiten' : 'Neue Kamera hinzufügen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Kamera-Name"
              value={cameraForm.name}
              onChange={(e) => setCameraForm({ ...cameraForm, name: e.target.value })}
              fullWidth
              required
              placeholder="z.B. Eingang, Garage, etc."
            />
            <TextField
              label="IP-Adresse oder Hostname"
              value={cameraForm.host}
              onChange={(e) => setCameraForm({ ...cameraForm, host: e.target.value })}
              fullWidth
              required
              placeholder="z.B. 192.168.1.100"
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
    </TabPanel>
  );
}
