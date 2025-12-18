# Network Traffic Logger - Docker Installation für Raspberry Pi

🎯 **Standalone Docker Compose Installation** - Keine Ansible erforderlich!

## 🚀 Schnellstart auf Raspberry Pi

### Voraussetzungen

- Raspberry Pi 3B+ oder höher (empfohlen: Raspberry Pi 4 mit 4GB+ RAM)
- Raspberry Pi OS (64-bit empfohlen) oder Ubuntu Server
- Docker und Docker Compose installiert
- Mindestens 8GB freier Speicherplatz

### Docker installieren (falls noch nicht vorhanden)

```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Benutzer zur Docker-Gruppe hinzufügen
sudo usermod -aG docker $USER

# Docker Compose installieren (falls nicht vorhanden)
sudo apt-get install -y docker-compose

# Neustart oder neu einloggen für Gruppenänderungen
newgrp docker
```

## 📦 Installation

### 1. Projekt herunterladen

```bash
# Auf Ihrem Raspberry Pi:
cd ~
git clone https://github.com/renew78/ansible.git
cd ansible/network-traffic-logger-docker
```

Oder Dateien manuell kopieren, falls Git nicht verfügbar ist.

### 2. Konfiguration anpassen

```bash
# .env Datei erstellen
cp .env.example .env
nano .env
```

**WICHTIG**: Ändern Sie folgende Werte in der `.env` Datei:

```bash
# Ihre Raspberry Pi IP-Adresse (finden mit: hostname -I)
SERVER_IP=192.168.1.100

# Sichere Passwörter setzen!
INFLUXDB_ADMIN_PASSWORD=IhrSicheresPasswort123!
INFLUXDB_ADMIN_TOKEN=IhrGeheimesToken987654321
POSTGRES_PASSWORD=IhrPostgresPasswort456!

# SNMP Community für Ihre TP-Link Switches
SNMP_COMMUNITY=public
```

### 3. Anwendung starten

```bash
# Container bauen und starten (beim ersten Mal dauert es einige Minuten)
docker-compose up -d

# Logs verfolgen
docker-compose logs -f
```

### 4. Web-Interface öffnen

Öffnen Sie in Ihrem Browser:
```
http://<RASPBERRY_PI_IP>:3000
```

Beispiel: `http://192.168.1.100:3000`

## 🔧 OPNsense Konfiguration

### NetFlow aktivieren

1. In OPNsense: **Services → NetFlow → Settings**
2. **Enable NetFlow**: ✅
3. **Version**: NetFlow v5 oder v9
4. **Target IP**: `<IP Ihres Raspberry Pi>`
5. **Target Port**: `2055`
6. **Save & Apply**

### Alternative: sFlow

1. In OPNsense: **Services → sFlow → Settings**
2. **Enable sFlow**: ✅
3. **Collector IP**: `<IP Ihres Raspberry Pi>`
4. **Collector Port**: `6343`
5. **Save & Apply**

## 🔌 TP-Link Switch Konfiguration

### SNMP aktivieren

1. Loggen Sie sich in Ihren TP-Link Switch ein
2. **System Tools → SNMP Settings**
3. **SNMP Agent**: Enable
4. **SNMP Version**: v2c
5. **Community Name**: `public` (oder wie in .env konfiguriert)
6. **Access Mode**: Read Only
7. **Apply**

### Ports in Web-UI hinzufügen

1. Öffnen Sie die Web-UI
2. Navigieren Sie zu **Switches**
3. Klicken Sie auf **Port hinzufügen**
4. Tragen Sie ein:
   - Switch IP-Adresse (z.B. `192.168.1.10`)
   - Switch Name (z.B. `Switch-OG`)
   - Port-Nummer (z.B. `1`)
   - VLAN-ID (optional, z.B. `10`)
   - Beschreibung (z.B. `Server Rack 1`)

## 🐳 Docker Container Management

### Status prüfen

```bash
docker-compose ps
```

### Logs anzeigen

```bash
# Alle Container
docker-compose logs -f

# Einzelner Container
docker-compose logs -f backend
docker-compose logs -f netflow_collector
docker-compose logs -f frontend
```

### Container neustarten

```bash
# Alle Container
docker-compose restart

# Einzelner Container
docker-compose restart backend
```

### Container stoppen

```bash
docker-compose stop
```

### Container starten

```bash
docker-compose start
```

### Container komplett entfernen

```bash
docker-compose down
```

### Container mit Daten entfernen (ACHTUNG: Löscht alle Daten!)

```bash
docker-compose down -v
```

## 📊 Verfügbare Services

Nach dem Start sind folgende Services verfügbar:

| Service | Port | URL | Beschreibung |
|---------|------|-----|--------------|
| **Web-UI** | 3000 | http://raspberrypi:3000 | React Frontend (Dark Theme) |
| **Backend API** | 8000 | http://raspberrypi:8000 | FastAPI Backend |
| **API Docs** | 8000 | http://raspberrypi:8000/docs | Interaktive API-Dokumentation |
| **InfluxDB** | 8086 | http://raspberrypi:8086 | InfluxDB Web-UI |
| **PostgreSQL** | 5432 | - | Datenbank (intern) |
| **Redis** | 6379 | - | Cache (intern) |
| **NetFlow** | 2055/udp | - | NetFlow Collector |
| **sFlow** | 6343/udp | - | sFlow Collector |

## 🔥 Firewall-Regeln (falls aktiviert)

Wenn Sie eine Firewall auf dem Raspberry Pi haben:

```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 3000/tcp   # Web-UI
sudo ufw allow 8000/tcp   # Backend API
sudo ufw allow 2055/udp   # NetFlow
sudo ufw allow 6343/udp   # sFlow

# Oder iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 2055 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 6343 -j ACCEPT
```

## 🛠️ Troubleshooting

### Container starten nicht

```bash
# Prüfen Sie die Logs
docker-compose logs

# Speicherplatz prüfen
df -h

# Docker-Status prüfen
sudo systemctl status docker
```

### Port bereits in Verwendung

```bash
# Prüfen Sie, welcher Prozess den Port verwendet
sudo netstat -tulpn | grep :3000

# Ändern Sie den Port in docker-compose.yml
# Beispiel: "3001:80" statt "3000:80"
```

### Keine Daten von OPNsense

1. Prüfen Sie, ob der Port erreichbar ist:
   ```bash
   sudo netstat -ulnp | grep 2055
   ```

2. Testen Sie die Erreichbarkeit von OPNsense:
   ```bash
   ping <RASPBERRY_PI_IP>
   ```

3. Prüfen Sie Collector-Logs:
   ```bash
   docker-compose logs netflow_collector
   ```

### Raspberry Pi zu langsam

Wenn der Raspberry Pi überlastet ist:

1. **Ressourcen-Limits setzen** - Bearbeiten Sie `docker-compose.yml`:
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1.0'
             memory: 512M
   ```

2. **Frontend-Build optimieren** - Verwenden Sie einen stärkeren PC für den Build:
   ```bash
   # Auf Ihrem PC:
   cd frontend
   docker build -t ntl-frontend:latest .
   docker save ntl-frontend:latest | gzip > ntl-frontend.tar.gz

   # Auf Raspberry Pi:
   gunzip -c ntl-frontend.tar.gz | docker load
   ```

3. **Datenbank-Retention reduzieren** - InfluxDB-Retention auf 7 Tage setzen

### SNMP funktioniert nicht

```bash
# Testen Sie SNMP manuell vom Raspberry Pi
sudo apt-get install snmp
snmpwalk -v2c -c public <SWITCH_IP> system

# Wenn das funktioniert, ist SNMP korrekt konfiguriert
```

## 🔄 Updates

So aktualisieren Sie die Anwendung:

```bash
# Git-Repository aktualisieren
cd ~/ansible/network-traffic-logger-docker
git pull

# Container neu bauen
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Datenbank-Backup

### InfluxDB Backup

```bash
docker exec -it ntl_influxdb influx backup /var/lib/influxdb2/backup
docker cp ntl_influxdb:/var/lib/influxdb2/backup ./backup-influxdb
```

### PostgreSQL Backup

```bash
docker exec -it ntl_postgres pg_dump -U ntl_user network_traffic > backup-postgres.sql
```

### Restore

```bash
# InfluxDB Restore
docker cp ./backup-influxdb ntl_influxdb:/var/lib/influxdb2/backup
docker exec -it ntl_influxdb influx restore /var/lib/influxdb2/backup

# PostgreSQL Restore
docker exec -i ntl_postgres psql -U ntl_user network_traffic < backup-postgres.sql
```

## 🚀 Performance-Tipps für Raspberry Pi

1. **SD-Karte Optimierung**
   ```bash
   # Verwenden Sie eine schnelle SD-Karte (Class 10, A1/A2)
   # Oder besser: USB 3.0 SSD verwenden
   ```

2. **Swap erhöhen** (für Pi mit wenig RAM)
   ```bash
   sudo dphys-swapfile swapoff
   sudo nano /etc/dphys-swapfile
   # CONF_SWAPSIZE=2048
   sudo dphys-swapfile setup
   sudo dphys-swapfile swapon
   ```

3. **Docker-Logs limitieren**
   ```bash
   # In docker-compose.yml für jeden Service:
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

## 📱 Features der Web-UI

### Dashboard
- ✅ Echtzeit-Traffic-Graphen
- ✅ Gesamt-Traffic-Statistiken
- ✅ Traffic nach Richtung (Eingehend/Ausgehend/Intern)
- ✅ Anzahl aktiver Geräte

### Geräte
- ✅ Liste aller Netzwerk-Geräte
- ✅ IP-Adresse, Hostname, MAC-Adresse
- ✅ Datenfluss-Richtung
- ✅ Bytes gesendet/empfangen
- ✅ Letzte Aktivität

### Switches
- ✅ TP-Link Switch Port-Überwachung
- ✅ Port-Status (Online/Offline)
- ✅ VLAN-Anzeige pro Port
- ✅ Beschreibungsfeld für Notizen
- ✅ Traffic-Statistiken pro Port
- ✅ Port hinzufügen/bearbeiten/löschen

### Verlauf
- ✅ Historische Traffic-Daten
- ✅ Zeitraum-Auswahl
- ✅ Intervall-Konfiguration
- ✅ Grafische Darstellung

## 🔐 Sicherheit

**WICHTIG**: Ändern Sie alle Standardpasswörter in der `.env` Datei!

### Empfohlene Sicherheitsmaßnahmen:

1. **Starke Passwörter verwenden**
2. **Firewall konfigurieren** (nur notwendige Ports öffnen)
3. **Reverse Proxy mit SSL** (z.B. Nginx mit Let's Encrypt)
4. **Regelmäßige Updates**
5. **Backups erstellen**

## 📞 Support

Bei Fragen oder Problemen:
- Prüfen Sie die Logs: `docker-compose logs`
- Erstellen Sie ein Issue im Repository
- Konsultieren Sie die Hauptdokumentation: `../roles/network_traffic_logger/README.md`

## 📄 Lizenz

MIT License

---

**Viel Spaß mit Ihrem Netzwerk-Traffic-Logger auf Raspberry Pi! 🎉**
