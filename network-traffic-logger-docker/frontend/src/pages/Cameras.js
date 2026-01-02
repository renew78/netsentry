import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '/api';

export default function Cameras() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/cameras`);
      setCameras(response.data || []);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      setCameras([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCameraClick = (camera) => {
    setSelectedCamera(camera);
  };

  const handleCloseModal = () => {
    setSelectedCamera(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (cameras.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Kameras
          </Typography>
          <Tooltip title="Aktualisieren">
            <IconButton onClick={fetchCameras}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Card>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <VideocamIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Keine Kameras konfiguriert
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Gehen Sie zu Einstellungen, um Kameras hinzuzufügen
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Kameras ({cameras.length})
        </Typography>
        <Tooltip title="Alle aktualisieren">
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {cameras.filter(cam => cam.enabled).map((camera) => (
          <Grid item xs={12} sm={6} md={4} key={camera.id}>
            <CameraCard
              camera={camera}
              onClick={() => handleCameraClick(camera)}
              refreshKey={refreshKey}
            />
          </Grid>
        ))}
      </Grid>

      {/* Enlarged Camera Modal */}
      <Dialog
        open={Boolean(selectedCamera)}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a2e',
            minHeight: '70vh',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideocamIcon color="primary" />
            <Typography variant="h6">{selectedCamera?.name}</Typography>
          </Box>
          <IconButton onClick={handleCloseModal} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedCamera && (
            <CameraStream camera={selectedCamera} large refreshKey={refreshKey} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

// Camera Card Component
function CameraCard({ camera, onClick, refreshKey }) {
  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0, 212, 255, 0.3)',
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative', paddingTop: '75%', backgroundColor: '#000' }}>
          <CameraStream camera={camera} refreshKey={refreshKey} />
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2,
            }}
          >
            <Chip
              icon={<VideocamIcon />}
              label="Live"
              size="small"
              color="error"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
              p: 2,
              zIndex: 1,
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              {camera.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {camera.host}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Camera Stream Component
// TODO: Implement true RTSP stream using HLS/WebRTC conversion or JSMpeg
// For now, using snapshot refresh as interim solution
function CameraStream({ camera, large = false, refreshKey }) {
  const [imageKey, setImageKey] = useState(0);
  const [error, setError] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Refresh snapshot every 1 second for live effect
    // TODO: Replace with actual RTSP stream when backend supports HLS/WebRTC
    intervalRef.current = setInterval(() => {
      setImageKey(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Force refresh when parent triggers
    setImageKey(prev => prev + 1);
  }, [refreshKey]);

  const snapshotUrl = `${API_URL}/cameras/${camera.id}/snapshot?t=${imageKey}`;

  return (
    <Box
      sx={{
        position: large ? 'relative' : 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: large ? 'auto' : '100%',
        minHeight: large ? '60vh' : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
      }}
    >
      {error ? (
        <Box sx={{ textAlign: 'center', color: 'text.disabled' }}>
          <VideocamIcon sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="body2">Kamera nicht erreichbar</Typography>
        </Box>
      ) : (
        <img
          src={snapshotUrl}
          alt={camera.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          onError={() => setError(true)}
          onLoad={() => setError(false)}
        />
      )}
    </Box>
  );
}
