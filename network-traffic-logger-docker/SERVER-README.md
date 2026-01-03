# NetSentry - Docker Stack

Dieses Verzeichnis enthält den NetSentry Docker Stack für Dockge.

## 🔗 Repository

- **GitHub**: https://github.com/renew78/netsentry
- **Branch**: main
- **Dokumentation**: https://github.com/renew78/netsentry/tree/main/network-traffic-logger-docker

## 📦 Komponenten

Dieser Stack verwendet fertige Docker Images von Docker Hub:

- **Backend**: `renew78/netsentry-backend:latest`
- **Frontend**: `renew78/netsentry-frontend:latest`
- **Collector**: `renew78/netsentry-collector:latest`

Die Images werden automatisch über GitHub Actions gebaut und auf Docker Hub veröffentlicht.

## 🔄 Updates

Um die neuesten Images zu verwenden:

```bash
cd /mnt/.ix-apps/app_mounts/dockge/stacks/netsentry
docker-compose pull
docker-compose up -d
```

Oder in Dockge:
1. Gehe zum NetSentry Stack
2. Klicke auf "Pull" um die neuesten Images zu laden
3. Klicke auf "Restart" um die Container neu zu starten

## ⚙️ Konfiguration

Die Konfiguration erfolgt über die `.env` Datei in diesem Verzeichnis:

- `MONGO_PASSWORD`: MongoDB Admin-Passwort
- `INFLUX_PASSWORD`: InfluxDB Admin-Passwort
- `INFLUX_TOKEN`: InfluxDB API-Token
- `INFLUX_ORG`: InfluxDB Organisation
- `INFLUX_BUCKET`: InfluxDB Bucket-Name
- `REDIS_PASSWORD`: Redis-Passwort

## 📊 Zugriff

Nach dem Start ist die Web-UI verfügbar unter:
- **Port 4000**: http://server-ip:4000

## 🔧 Troubleshooting

Logs anzeigen:
```bash
docker-compose logs -f
```

Einzelnen Service neu starten:
```bash
docker-compose restart backend
docker-compose restart frontend
```

Container Status prüfen:
```bash
docker-compose ps
```

## 📝 Dateien

- `compose.yaml`: Docker Compose Konfiguration
- `.env`: Umgebungsvariablen und Passwörter
- `compose.yaml.backup-*`: Automatische Backups
- `compose.yaml.broken`: Alte/fehlerhafte Version (zur Referenz)

## 🆘 Support

Bei Problemen:
- **Issues**: https://github.com/renew78/netsentry/issues
- **Dokumentation**: https://github.com/renew78/netsentry/blob/main/README.md

---
Letzte Aktualisierung: 2026-01-03
Repository-Migration von renew78/ansible zu renew78/netsentry abgeschlossen
