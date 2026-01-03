# Network Traffic Logger - Ansible Deployment

Umfassende Netzwerk-Traffic-Monitoring-Lösung für OPNsense und TP-Link Switches.

## 🎯 Features

- 🌐 **NetFlow/sFlow Collector** für OPNsense Firewall
- 📊 **Moderne Dark-Theme Web-GUI** (React + Material-UI)
- 🔄 **Echtzeit-Traffic-Graphen** mit Live-Updates
- 🔌 **TP-Link Switch Port-Überwachung** via SNMP
- 📈 **Geräte-Tracking** (IP, Hostname, MAC, Datenfluss-Richtung)
- 🗄️ **Robustes Backend** mit InfluxDB + PostgreSQL + Redis
- 🐳 **Vollständig containerisiert** mit Docker Compose
- 📱 **Responsive Design** für Desktop und Mobile

## 📁 Projektstruktur

```
.
├── ansible.cfg                          # Ansible Konfiguration
├── hosts.yaml                           # Inventory-Datei
├── group_vars/
│   ├── all.yml                         # Globale Variablen (NICHT in Git committen!)
│   └── all.yml.example                 # Beispiel-Konfiguration
├── playbooks/
│   └── deploy_network_traffic_logger.yml # Deployment Playbook
├── roles/
│   └── network_traffic_logger/         # Hauptrolle
│       ├── defaults/                   # Standard-Variablen
│       ├── tasks/                      # Ansible Tasks
│       ├── templates/                  # Jinja2 Templates
│       ├── files/                      # Statische Dateien
│       │   ├── backend/
│       │   │   ├── api/                # FastAPI Backend
│       │   │   └── netflow_collector/  # NetFlow/sFlow Collector
│       │   └── frontend/               # React Frontend
│       │       ├── src/
│       │       └── public/
│       ├── handlers/                   # Event Handler
│       ├── meta/                       # Rollen-Metadaten
│       └── README.md                   # Detaillierte Dokumentation
└── network-traffic-logger-docker/      # Standalone Docker Compose Version
    ├── docker-compose.yml              # für Raspberry Pi
    └── README.md                       # Standalone Installation
```

## 🚀 Quick Start

### Voraussetzungen

- **Zielserver**: Linux-Server (Ubuntu, Debian, CentOS, Rocky Linux, etc.)
- **Ansible**: Version 2.9 oder höher auf dem Control Node
- **Docker**: Wird automatisch installiert wenn nicht vorhanden
- **Ressourcen**:
  - Mindestens 4GB RAM (empfohlen: 8GB+)
  - Mindestens 50GB freier Speicherplatz
  - Internetverbindung für Docker Image Downloads

### Optionale Komponenten

- **OPNsense Firewall** für NetFlow/sFlow Daten
- **TP-Link Switches** mit SNMP-Unterstützung für Port-Monitoring

## 📦 Installation

### 1. Repository klonen

```bash
git clone https://github.com/renew78/ansible.git
cd ansible
```

### 2. Konfiguration anpassen

```bash
# Beispiel-Konfiguration kopieren
cp group_vars/all.yml.example group_vars/all.yml

# Konfiguration bearbeiten
nano group_vars/all.yml
```

**WICHTIG**: Ändern Sie die Standard-Passwörter!

```yaml
# group_vars/all.yml
---
# Sichere Passwörter setzen!
influxdb_admin_password: "IhrSicheresPasswort123!"
influxdb_admin_token: "IhrGeheimesToken987654321"
postgres_password: "IhrPostgresPasswort456!"

# SNMP Community für TP-Link Switches
snmp_community: "public"

# Server-Konfiguration
server_ip: "192.168.1.100"  # IP Ihres Servers
```

### 3. Inventory anpassen (optional)

Bearbeiten Sie `hosts.yaml` wenn Sie einen Remote-Server verwenden:

```yaml
all:
  children:
    monitoring_servers:
      hosts:
        netlogger:
          ansible_host: 192.168.1.100  # IP Ihres Servers
          ansible_user: admin
          ansible_become: yes
          ansible_become_method: sudo
```

### 4. Deployment durchführen

```bash
# Installation starten
ansible-playbook playbooks/deploy_network_traffic_logger.yml

# Mit Vault-verschlüsselten Variablen
ansible-playbook playbooks/deploy_network_traffic_logger.yml --ask-vault-pass
```

### 5. Web-Interface öffnen

Nach erfolgreicher Installation:

```
http://<SERVER_IP>:3000
```

Beispiel: `http://192.168.1.100:3000`

## 🔧 OPNsense Konfiguration

### NetFlow aktivieren

1. In OPNsense: **Services → NetFlow → Settings**
2. **Enable NetFlow**: ✅
3. **Version**: NetFlow v5 oder v9
4. **Target IP**: `<IP Ihres Servers>`
5. **Target Port**: `2055`
6. **Save & Apply**

### Alternative: sFlow

1. In OPNsense: **Services → sFlow → Settings**
2. **Enable sFlow**: ✅
3. **Collector IP**: `<IP Ihres Servers>`
4. **Collector Port**: `6343`
5. **Save & Apply**

## 🔌 TP-Link Switch Konfiguration

### SNMP aktivieren

1. Loggen Sie sich in Ihren TP-Link Switch ein
2. **System Tools → SNMP Settings**
3. **SNMP Agent**: Enable
4. **SNMP Version**: v2c
5. **Community Name**: `public` (oder wie in all.yml konfiguriert)
6. **Access Mode**: Read Only
7. **Apply**

### Ports in Web-UI hinzufügen

1. Öffnen Sie die Web-UI: `http://<SERVER_IP>:3000`
2. Navigieren Sie zu **Switches**
3. Klicken Sie auf **Port hinzufügen**
4. Tragen Sie ein:
   - Switch IP-Adresse (z.B. `192.168.1.10`)
   - Switch Name (z.B. `Switch-OG`)
   - Port-Nummer (z.B. `1`)
   - VLAN-ID (optional)
   - Beschreibung (z.B. `Server Rack 1`)

## 📊 Verfügbare Services

Nach dem Deployment sind folgende Services verfügbar:

| Service | Port | URL | Beschreibung |
|---------|------|-----|--------------|
| **Web-UI** | 3000 | http://server:3000 | React Frontend (Dark Theme) |
| **Backend API** | 8000 | http://server:8000 | FastAPI Backend |
| **API Docs** | 8000 | http://server:8000/docs | Interaktive API-Dokumentation |
| **InfluxDB** | 8086 | http://server:8086 | InfluxDB Web-UI |
| **PostgreSQL** | 5432 | - | Datenbank (intern) |
| **Redis** | 6379 | - | Cache (intern) |
| **NetFlow** | 2055/udp | - | NetFlow Collector |
| **sFlow** | 6343/udp | - | sFlow Collector |

## 🐳 Docker Management

Nach der Installation können Sie die Container direkt verwalten:

```bash
# Auf dem Server
cd /opt/network-traffic-logger

# Container-Status prüfen
docker-compose ps

# Logs anzeigen
docker-compose logs -f

# Container neustarten
docker-compose restart

# Container stoppen
docker-compose stop

# Container starten
docker-compose start
```

## 🛠️ Troubleshooting

### Container starten nicht

```bash
# Prüfen Sie die Logs
docker-compose logs

# Docker-Status prüfen
sudo systemctl status docker

# Container neu bauen
docker-compose down
docker-compose up -d --build
```

### Keine Daten von OPNsense

1. Prüfen Sie NetFlow Collector Logs:
   ```bash
   docker-compose logs netflow_collector
   ```

2. Testen Sie die Erreichbarkeit:
   ```bash
   # Auf dem Server
   sudo netstat -ulnp | grep 2055
   ```

3. Firewall-Regeln prüfen:
   ```bash
   sudo firewall-cmd --list-all
   ```

### SNMP funktioniert nicht

```bash
# Testen Sie SNMP manuell
sudo apt-get install snmp
snmpwalk -v2c -c public <SWITCH_IP> system

# Wenn das funktioniert, ist SNMP korrekt konfiguriert
```

## 🔄 Updates

```bash
# Git Repository aktualisieren
cd ~/ansible
git pull

# Deployment erneut ausführen
ansible-playbook playbooks/deploy_network_traffic_logger.yml
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

## 🔐 Sicherheit

**WICHTIG**: Ändern Sie alle Standardpasswörter!

### Empfohlene Sicherheitsmaßnahmen:

1. **Starke Passwörter verwenden**
   - Ändern Sie alle Passwörter in `group_vars/all.yml`
   - Verwenden Sie mindestens 20 Zeichen
   - Nutzen Sie einen Passwort-Manager

2. **Ansible Vault nutzen**
   ```bash
   # Variablen verschlüsseln
   ansible-vault encrypt group_vars/all.yml

   # Mit verschlüsselten Variablen deployen
   ansible-playbook playbooks/deploy_network_traffic_logger.yml --ask-vault-pass
   ```

3. **Firewall konfigurieren**
   - Öffnen Sie nur notwendige Ports
   - Beschränken Sie Zugriff auf vertrauenswürdige IPs

4. **Reverse Proxy mit SSL**
   - Verwenden Sie Nginx oder Traefik
   - Aktivieren Sie Let's Encrypt für HTTPS

5. **Regelmäßige Updates**
   ```bash
   # Docker Images aktualisieren
   docker-compose pull
   docker-compose up -d
   ```

6. **Backups erstellen**
   - Regelmäßige Datenbank-Backups
   - Konfigurationsdateien sichern

## 🚀 Alternative: Standalone Docker Installation

Wenn Sie kein Ansible verwenden möchten, gibt es auch eine **Standalone Docker Compose Version**:

```bash
cd network-traffic-logger-docker
cp .env.example .env
nano .env  # Passwörter anpassen
docker-compose up -d
```

Siehe [network-traffic-logger-docker/README.md](network-traffic-logger-docker/README.md) für Details.

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

## 📞 Support

Bei Fragen oder Problemen:
- Prüfen Sie die Logs: `docker-compose logs`
- Konsultieren Sie die detaillierte Dokumentation: `roles/network_traffic_logger/README.md`
- Erstellen Sie ein Issue im Repository: https://github.com/renew78/ansible/issues

## 📄 Lizenz

MIT License

---

**Viel Spaß mit Ihrem Network Traffic Logger! 🎉**
