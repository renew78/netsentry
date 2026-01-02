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
  Storage as StorageIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';

export default function TrueNASSettings() {
  const [settings, setSettings] = useState({
    truenas: {
      enabled: false,
      url: '',
      apiKey: '',
    },
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      const defaultTrueNAS = {
        enabled: false,
        url: '',
        apiKey: '',
      };
      setSettings({
        truenas: {
          ...defaultTrueNAS,
          ...(response.data.truenas || {}),
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

      // Merge with TrueNAS settings
      const updatedSettings = {
        ...currentSettings,
        truenas: settings.truenas,
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
          TrueNAS-Einstellungen
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <StorageIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6">TrueNAS Scale Integration</Typography>
              <Typography variant="body2" color="text.secondary">
                Verbinden Sie NetSentry mit Ihrem TrueNAS Scale Server
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Um NetSentry mit TrueNAS Scale zu verbinden, benötigen Sie einen API Key.
            Erstellen Sie diesen in TrueNAS unter System → API Keys.
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
                helperText="Die vollständige URL Ihres TrueNAS Scale Servers (inkl. https://)"
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

          <Divider sx={{ my: 4 }} />

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Unterstützte Funktionen
            </Typography>
            <Typography variant="body2">
              • Pool- und Dataset-Informationen<br />
              • Speichernutzung und -kapazität<br />
              • System-Health-Status<br />
              • Snapshot-Übersicht
            </Typography>
          </Alert>

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
