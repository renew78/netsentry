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
  Router as RouterIcon,
  Dns as DnsIcon,
  Security as SecurityIcon,
  NetworkCheck as NetworkCheckIcon,
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
    switches: [],
    vlans: [],
    adguard: { enabled: false, url: '', username: '', password: '' },
    opnsense: { enabled: false, url: '', apiKey: '', apiSecret: '' },
    ai_analysis: { enabled: false },
  });
  const [vlanDialog, setVlanDialog] = useState(false);
  const [switchDialog, setSwitchDialog] = useState(false);
  const [editingVlan, setEditingVlan] = useState(null);
  const [editingSwitch, setEditingSwitch] = useState(null);
  const [vlanForm, setVlanForm] = useState({ id: '', name: '', description: '' });
  const [switchForm, setSwitchForm] = useState({
    ip: '',
    name: '',
    username: '',
    password: '',
    type: 'tplink',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      setSettings(response.data);
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

  const handleAddSwitch = () => {
    setEditingSwitch(null);
    setSwitchForm({ ip: '', name: '', username: '', password: '', type: 'tplink' });
    setSwitchDialog(true);
  };

  const handleEditSwitch = (sw) => {
    setEditingSwitch(sw);
    setSwitchForm(sw);
    setSwitchDialog(true);
  };

  const handleSaveSwitch = () => {
    if (editingSwitch) {
      setSettings({
        ...settings,
        switches: settings.switches.map((s) =>
          s.ip === editingSwitch.ip ? switchForm : s
        ),
      });
    } else {
      setSettings({
        ...settings,
        switches: [...settings.switches, switchForm],
      });
    }
    setSwitchDialog(false);
  };

  const handleDeleteSwitch = (switchIp) => {
    setSettings({
      ...settings,
      switches: settings.switches.filter((s) => s.ip !== switchIp),
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
          <Tab icon={<RouterIcon />} label="Switches" />
          <Tab icon={<DnsIcon />} label="AdGuard" />
          <Tab icon={<SecurityIcon />} label="OPNsense" />
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

          {/* Switch Configuration */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Switch-Zugangsdaten</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddSwitch}
              >
                Switch hinzufügen
              </Button>
            </Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Ihre Switches unterstützen kein SNMP. Die Daten werden via Web-Scraping abgerufen.
              Geben Sie hier die Login-Daten für die Web-GUI an.
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>IP-Adresse</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Benutzername</TableCell>
                    <TableCell>Typ</TableCell>
                    <TableCell align="right">Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settings.switches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">
                          Keine Switches konfiguriert
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    settings.switches.map((sw) => (
                      <TableRow key={sw.ip}>
                        <TableCell>
                          <Typography fontFamily="monospace">{sw.ip}</Typography>
                        </TableCell>
                        <TableCell>{sw.name}</TableCell>
                        <TableCell>{sw.username}</TableCell>
                        <TableCell>
                          <Chip label={sw.type} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleEditSwitch(sw)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSwitch(sw.ip)}
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
          <TabPanel value={tabValue} index={2}>
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Benutzername"
                  value={settings.adguard.username}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      adguard: { ...settings.adguard, username: e.target.value },
                    })
                  }
                  disabled={!settings.adguard.enabled}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="Passwort"
                  value={settings.adguard.password}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      adguard: { ...settings.adguard, password: e.target.value },
                    })
                  }
                  disabled={!settings.adguard.enabled}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* OPNsense Configuration */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              OPNsense Firewall Integration
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Verbinden Sie NetSentry mit Ihrer OPNsense Firewall, um Firewall-Statistiken anzuzeigen.
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
            </Grid>
          </TabPanel>

          {/* Advanced Settings */}
          <TabPanel value={tabValue} index={4}>
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

      {/* Switch Dialog */}
      <Dialog open={switchDialog} onClose={() => setSwitchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSwitch ? 'Switch bearbeiten' : 'Switch hinzufügen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Die Zugangsdaten werden verschlüsselt gespeichert und nur für das Web-Scraping verwendet.
            </Alert>
            <TextField
              label="IP-Adresse"
              value={switchForm.ip}
              onChange={(e) => setSwitchForm({ ...switchForm, ip: e.target.value })}
              fullWidth
              required
              placeholder="z.B. 10.10.1.100"
              disabled={!!editingSwitch}
            />
            <TextField
              label="Switch-Name"
              value={switchForm.name}
              onChange={(e) => setSwitchForm({ ...switchForm, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Benutzername"
              value={switchForm.username}
              onChange={(e) => setSwitchForm({ ...switchForm, username: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Passwort"
              type="password"
              value={switchForm.password}
              onChange={(e) => setSwitchForm({ ...switchForm, password: e.target.value })}
              fullWidth
              required
            />
            <TextField
              select
              label="Switch-Typ"
              value={switchForm.type}
              onChange={(e) => setSwitchForm({ ...switchForm, type: e.target.value })}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="tplink">TP-Link</option>
              <option value="netgear">Netgear</option>
              <option value="cisco">Cisco</option>
              <option value="ubiquiti">Ubiquiti</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwitchDialog(false)}>Abbrechen</Button>
          <Button onClick={handleSaveSwitch} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
