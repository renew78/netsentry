import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';

export default function OPNsenseSettings() {
  const [settings, setSettings] = useState({
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
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      const defaultOPNsense = {
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
      };
      setSettings({
        opnsense: {
          ...defaultOPNsense,
          ...(response.data.opnsense || {}),
          features: {
            ...defaultOPNsense.features,
            ...((response.data.opnsense && response.data.opnsense.features) || {}),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      // Fetch current settings first to preserve other settings
      const currentResponse = await axios.get(`${API_URL}/settings`);
      const currentSettings = currentResponse.data;

      // Merge with OPNsense settings
      const updatedSettings = {
        ...currentSettings,
        opnsense: settings.opnsense,
      };

      await axios.post(`${API_URL}/settings`, updatedSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Fehler beim Speichern der Einstellungen');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SettingsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          OPNsense-Einstellungen
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6">OPNsense Firewall Integration</Typography>
              <Typography variant="body2" color="text.secondary">
                Verbinden Sie NetSentry mit Ihrer OPNsense Firewall
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Um NetSentry mit OPNsense zu verbinden, benötigen Sie einen API Key und Secret.
            Erstellen Sie diese in OPNsense unter System → Zugriff → Benutzer → API Keys.
          </Alert>

          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Einstellungen erfolgreich gespeichert!
            </Alert>
          )}

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
                helperText="Die vollständige URL Ihrer OPNsense Firewall (inkl. https://)"
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

            {settings.opnsense.enabled && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Anzuzeigende Komponenten
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(0, 212, 255, 0.05)' }}>
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
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                      Zeigt alle verbundenen Geräte aus der ARP-Tabelle
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(0, 212, 255, 0.05)' }}>
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
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                      Zeigt geblockte und erlaubte Verbindungen
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(255, 170, 0, 0.05)' }}>
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
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                      Zeigt Echtzeit-Logs der Firewall-Aktivität
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(255, 170, 0, 0.05)' }}>
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
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                      Zeigt Bandbreiten-Nutzung über Zeit
                    </Typography>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={saveSettings}
            >
              Einstellungen speichern
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
