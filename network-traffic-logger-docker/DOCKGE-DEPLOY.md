# NetSentry - Dockge Deployment Guide

This guide explains how to deploy NetSentry using Dockge on a Raspberry Pi or any Docker-enabled system.

## Prerequisites

- Dockge installed and running
- Docker and Docker Compose available
- Network access to Docker Hub
- Ports available: 4000 (web UI), 2055/udp (NetFlow), 6343/udp (sFlow)

## Deployment Steps

### 1. Create a New Stack in Dockge

1. Open Dockge web interface
2. Click "Compose" → "New Stack"
3. Enter stack name: `netsentry`
4. Copy the contents of `docker-compose.dockge.yml` into the compose editor

### 2. Create nginx-simple.conf File

In the stack directory (typically `/opt/stacks/netsentry/`):

1. Create a file named `nginx-simple.conf`
2. Copy the contents from `nginx-simple.conf` in this repository
3. Ensure the file is readable by Docker containers

Example:
```bash
cd /opt/stacks/netsentry/
nano nginx-simple.conf
# Paste the nginx-simple.conf contents
# Save and exit (Ctrl+X, Y, Enter)
```

### 3. Configure Environment Variables

In Dockge, click on the "Env" tab and add these variables:

```env
MONGO_PASSWORD=YourSecureMongoPassword123!
INFLUX_PASSWORD=YourInfluxDBPassword456!
INFLUX_TOKEN=YourInfluxDBSecretToken789xyz
REDIS_PASSWORD=YourRedisPassword012!
```

**Important:** Use strong, unique passwords for each service!

Alternatively, create a `.env` file in `/opt/stacks/netsentry/`:

```bash
cd /opt/stacks/netsentry/
nano .env
```

Paste the environment variables above, save and exit.

### 4. Deploy the Stack

1. Click "Start" in Dockge
2. Wait for all containers to download and start
3. Check the logs to ensure all services are healthy

### 5. Access NetSentry

Open your browser and navigate to:
```
http://<your-raspberry-pi-ip>:4000
```

For example:
```
http://10.10.1.2:4000
```

## Architecture

NetSentry consists of these components:

- **Frontend**: React-based web interface (port 4000 via nginx)
- **Backend**: FastAPI server for SNMP switch management
- **Collector**: NetFlow/sFlow data collector (UDP ports 2055, 6343)
- **MongoDB**: Stores switch and device configurations
- **InfluxDB**: Time-series database for network traffic data
- **Redis**: Caching and real-time state management
- **Nginx**: Reverse proxy routing requests between frontend and backend

## Network Configuration

The stack creates a Docker network called `netsentry` where all containers communicate internally. Only nginx exposes port 4000 to the host.

Internal communication:
- Frontend → Nginx → Backend (via `/api` path)
- Backend → MongoDB (port 27017)
- Backend → InfluxDB (port 8086)
- Backend → Redis (port 6379)
- Collector → InfluxDB (port 8086)
- Collector → Redis (port 6379)

## Configuring Network Devices

### NetFlow/sFlow Export Configuration

Configure your network switches and routers to send NetFlow or sFlow data to:
- **NetFlow v5/v9/IPFIX**: `<raspberry-pi-ip>:2055` (UDP)
- **sFlow**: `<raspberry-pi-ip>:6343` (UDP)

Example Cisco NetFlow configuration:
```
flow exporter EXPORTER-1
 destination <raspberry-pi-ip>
 transport udp 2055

flow monitor MONITOR-1
 exporter EXPORTER-1
 record netflow ipv4 original-input

interface GigabitEthernet0/1
 ip flow monitor MONITOR-1 input
```

### SNMP Configuration

For switch management via SNMP:
1. Ensure your switches have SNMP enabled
2. Default community string is `public` (configurable via environment)
3. Add switches via the web interface

## Troubleshooting

### Container Won't Start

Check logs in Dockge or via command line:
```bash
docker logs netsentry_backend
docker logs netsentry_frontend
docker logs netsentry_nginx
```

### MongoDB Authentication Errors

If you see authentication failures, the MongoDB password may have changed. Reset the volume:
```bash
docker-compose down
docker volume rm netsentry_mongodb_data
# Update .env with correct password
docker-compose up -d
```

### "Fehler beim Speichern" or 502 Bad Gateway

This indicates the backend isn't reachable. Check:
1. Backend container is running: `docker ps | grep backend`
2. Network exists: `docker network ls | grep netsentry`
3. Nginx can reach backend: `docker exec netsentry_nginx wget -O- http://backend:8000/api/`

### Frontend Shows "Cannot Connect"

1. Verify nginx is running on port 4000: `docker ps | grep nginx`
2. Check if another service is using port 4000: `netstat -tulpn | grep 4000`
3. Review nginx logs: `docker logs netsentry_nginx`

### Alpine Container "bash not found"

Alpine Linux containers use `sh` instead of `bash`:
```bash
# Wrong:
docker exec -it netsentry_nginx bash

# Correct:
docker exec -it netsentry_nginx sh
```

## Updating

To update to the latest version:

1. Pull new images:
```bash
docker pull renew78/netsentry-frontend:latest
docker pull renew78/netsentry-backend:latest
docker pull renew78/netsentry-collector:latest
```

2. Restart the stack in Dockge (click "Restart")

Images are automatically built via GitHub Actions when changes are pushed to the repository.

## Data Persistence

The following volumes persist data across container restarts:
- `mongodb_data`: Switch and device configurations
- `influxdb_data`: Network traffic time-series data
- `influxdb_config`: InfluxDB configuration
- `redis_data`: Redis persistence
- `netflow_data`: Collected NetFlow/sFlow data

## Security Recommendations

1. **Change default passwords**: Use strong, unique passwords for all services
2. **Firewall rules**: Restrict access to port 4000 to trusted networks only
3. **SNMP community**: Change from `public` to a secure community string
4. **Regular updates**: Keep Docker images updated via GitHub Actions builds
5. **Backup volumes**: Regularly backup MongoDB and InfluxDB volumes

## Support

For issues, feature requests, or questions:
- GitHub: https://github.com/renew78/netsentry/issues
- Docker Hub: https://hub.docker.com/u/renew78
