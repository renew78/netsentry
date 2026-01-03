# OPNsense DuckDB Integration - Setup Guide

Diese Anleitung beschreibt die Einrichtung der direkten DuckDB-Anbindung für umfassende Unbound DNS Analytics.

## 🎯 Was wird erreicht?

Die Integration ermöglicht Zugriff auf detaillierte DNS-Statistiken direkt aus der OPNsense DuckDB-Datenbank:

- **Top Blocked Domains**: Liste der am häufigsten geblockten Domains mit Blocklist-Zuordnung
- **Client Statistics**: Per-Client DNS-Analyse (Queries, Blocked, Allowed, Block-Rate)
- **Blocklist Effectiveness**: Vergleich der verschiedenen Blocklisten nach Effektivität
- **Performance Metrics**: DNS-Antwortzeiten (Average, Median, P95, Min, Max)
- **Query Types**: Verteilung der DNS-Query-Typen (A, AAAA, PTR, etc.)
- **Top Domains**: Meistabgefragte erlaubte Domains
- **Time Series**: Zeitbasierte Analyse der DNS-Queries

## 📋 Voraussetzungen

1. OPNsense mit aktiviertem Unbound DNS
2. SSH-Zugriff auf OPNsense
3. NetSentry Backend mit Docker

## 🔧 Setup-Schritte

### 1. SSH-Benutzer auf OPNsense erstellen

```bash
# SSH zu OPNsense
ssh root@10.10.1.1

# Benutzer erstellen
pw useradd netsentry -m -s /bin/sh -G wheel

# Passwort setzen (wird später durch Key ersetzt)
passwd netsentry

# SSH-Verzeichnis erstellen
mkdir -p /home/netsentry/.ssh
chmod 700 /home/netsentry/.ssh
```

### 2. SSH-Key generieren und kopieren

Auf dem Server mit NetSentry:

```bash
# SSH-Key generieren (falls noch nicht vorhanden)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# Public Key anzeigen
cat ~/.ssh/id_rsa.pub
```

Auf OPNsense:

```bash
# Public Key in authorized_keys eintragen
vi /home/netsentry/.ssh/authorized_keys
# Inhalt von ~/.ssh/id_rsa.pub einfügen

# Berechtigungen setzen
chmod 600 /home/netsentry/.ssh/authorized_keys
chown -R netsentry:netsentry /home/netsentry/.ssh

# Testen
exit
ssh netsentry@10.10.1.1 "echo 'SSH funktioniert!'"
```

### 3. DuckDB-Zugriff testen

```bash
# Auf OPNsense einloggen als netsentry
ssh netsentry@10.10.1.1

# DuckDB testen
duckdb /var/unbound/data/unbound.duckdb -c "SELECT COUNT(*) as total FROM query"

# Beispiel-Query für blocked domains
duckdb /var/unbound/data/unbound.duckdb -json -c "
SELECT domain, COUNT(*) as blocked_count
FROM query
WHERE action = 'blocked'
  AND time >= (NOW() - INTERVAL '24 hours')
GROUP BY domain
ORDER BY blocked_count DESC
LIMIT 10
"
```

### 4. Docker Compose aktualisieren

Die `.env` Datei im Docker-Verzeichnis erstellen oder aktualisieren:

```env
# OPNsense SSH Configuration
OPNSENSE_SSH_HOST=10.10.1.1
OPNSENSE_SSH_USER=netsentry
SSH_KEY_PATH=/root/.ssh/id_rsa
SSH_KNOWN_HOSTS=/root/.ssh/known_hosts

# Andere bestehende Variablen...
INFLUXDB_ADMIN_TOKEN=my-super-secret-auth-token
INFLUXDB_ORG=network-monitoring
INFLUXDB_BUCKET=traffic
```

### 5. Backend neu bauen und starten

```bash
cd /path/to/network-traffic-logger-docker

# Containers stoppen
docker-compose down

# Backend neu bauen (mit neuen Dependencies: paramiko, duckdb)
docker-compose build backend

# Alle Services starten
docker-compose up -d

# Logs prüfen
docker-compose logs -f backend
```

### 6. Frontend-Build triggern

Wenn GitHub Actions konfiguriert ist:

```bash
# Änderungen committen
git add .
git commit -m "Add DuckDB integration for comprehensive DNS analytics"
git push origin main
```

Die GitHub Action baut automatisch die neuen Docker Images und pushed sie zu Docker Hub.

### 7. Auf dem Server aktualisieren

```bash
# Zu Dockge Stack navigieren
cd /mnt/.ix-apps/app_mounts/dockge/stacks/netsentry

# Neueste Images pullen
docker-compose pull

# Services neu starten
docker-compose up -d

# Logs überprüfen
docker-compose logs -f backend frontend
```

## 🧪 Testing

### Backend API testen

```bash
# Query Stats
curl http://localhost:8000/api/opnsense/unbound/stats?hours=24

# Blocked Domains
curl http://localhost:8000/api/opnsense/unbound/blocked-domains?hours=24&limit=20

# Client Stats
curl http://localhost:8000/api/opnsense/unbound/client-stats?hours=24&limit=20

# Blocklist Stats
curl http://localhost:8000/api/opnsense/unbound/blocklist-stats?hours=24

# Performance
curl http://localhost:8000/api/opnsense/unbound/performance?hours=24

# Time Series
curl http://localhost:8000/api/opnsense/unbound/time-series?hours=24

# DNSSEC Stats
curl http://localhost:8000/api/opnsense/unbound/dnssec?hours=24
```

### Frontend testen

1. Browser öffnen: `http://server-ip:4000`
2. Zu "Reports" → "Unbound DNS" navigieren
3. Alle 7 Tabs durchgehen:
   - Overview
   - Query Types
   - Top Domains
   - Blocklist
   - Clients
   - Blocklist Effectiveness
   - Performance

4. Zeitbereich-Dropdown testen (1h, 6h, 24h, 48h, 7d)

## 🔍 Troubleshooting

### SSH-Verbindungsfehler

```bash
# Im Backend-Container
docker exec -it ntl_backend bash

# SSH-Key prüfen
ls -la /root/.ssh/
cat /root/.ssh/id_rsa

# Manuelle SSH-Verbindung testen
ssh -i /root/.ssh/id_rsa netsentry@10.10.1.1 "hostname"
```

### DuckDB Query-Fehler

```bash
# Backend-Logs prüfen
docker-compose logs backend | grep DuckDB

# Direkt auf OPNsense testen
ssh netsentry@10.10.1.1
duckdb /var/unbound/data/unbound.duckdb -c "SELECT COUNT(*) FROM query"
```

### Keine Daten im Frontend

1. Backend-Logs prüfen: `docker-compose logs backend`
2. Browser Console öffnen (F12) und Network-Tab prüfen
3. API-Endpoints manuell testen (siehe Testing-Sektion)
4. Sicherstellen, dass OPNsense Unbound aktiv ist und Queries loggt

### Berechtigungsprobleme

```bash
# Auf OPNsense
ls -la /var/unbound/data/unbound.duckdb

# Falls nötig, Leserechte geben
chmod 644 /var/unbound/data/unbound.duckdb
```

## 📊 Neue API-Endpoints

| Endpoint | Parameter | Beschreibung |
|----------|-----------|--------------|
| `/api/opnsense/unbound/stats` | `hours` (1-168) | Umfassende DNS-Statistiken |
| `/api/opnsense/unbound/blocked-domains` | `hours`, `limit` | Top geblackte Domains |
| `/api/opnsense/unbound/client-stats` | `hours`, `limit` | Client-Statistiken |
| `/api/opnsense/unbound/blocklist-stats` | `hours` | Blocklist-Effektivität |
| `/api/opnsense/unbound/performance` | `hours` | Performance-Metriken |
| `/api/opnsense/unbound/time-series` | `hours`, `interval` | Zeitreihen-Daten |
| `/api/opnsense/unbound/dnssec` | `hours` | DNSSEC-Statistiken |

## 🎨 Frontend-Features

### Overview Tab
- Pie Chart: Query-Verteilung (Resolved, Blocked, Cached)
- Cards: Detaillierte Statistiken

### Query Types Tab
- Pie Chart: Query-Typ-Verteilung
- Bar Chart: Query-Typ-Counts

### Top Domains Tab
- Bar Chart: Meistabgefragte erlaubte Domains

### Blocklist Tab
- Horizontal Bar Chart: Top geblackte Domains mit Counts

### Clients Tab (NEU)
- Tabelle: Client IP, Total Queries, Allowed, Blocked, Block Rate
- Farbcodierte Block-Rate Chips (green/yellow/red)

### Blocklist Effectiveness Tab (NEU)
- Pie Chart: Verteilung nach Blocklist
- Tabelle: Blocklist-Details (Blocked Count, Unique Domains, Unique Clients)

### Performance Tab (NEU)
- 5 Cards: Average, Median, P95, Min, Max Response Times
- Farbcodierte Metriken

## 🔄 Auto-Refresh

- Alle Daten werden automatisch alle 30 Sekunden aktualisiert
- Manueller Refresh über Refresh-Button möglich
- Zeitbereich-Änderung triggert sofortigen Reload

## 🎯 Nächste Schritte (optional)

1. **Alerting**: Benachrichtigungen bei hoher Block-Rate
2. **Export**: CSV/PDF-Export der Statistiken
3. **Drill-Down**: Click auf Client → Detail-Ansicht
4. **Real-time**: WebSocket-basiertes Live-Update
5. **Grafana**: Integration für erweiterte Dashboards

---

**Version**: 2.0
**Datum**: 2026-01-03
**Autor**: Claude Sonnet 4.5 via Claude Code
