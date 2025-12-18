# Network Traffic Logger - Ansible Role

Eine umfassende Lösung zur Überwachung des Netzwerk-Traffics mit moderner Web-GUI, Echtzeit-Graphen und Switch-Port-Management.

## 🎯 Features

### 🌐 Netzwerk-Monitoring
- **NetFlow/sFlow Collector** - Empfängt Daten von OPNsense und anderen Netzwerkgeräten
- **Mehrere VLANs & WLANs** - Vollständige Unterstützung
- **Geräte-Tracking** - IP-Adresse, Hostname, MAC-Adresse und Datenfluss-Richtung
- **Echtzeit-Updates** - WebSocket-basierte Live-Daten

### 📊 Visualisierung
- **Moderne Dark-Theme Web-GUI** - React mit Material-UI
- **Echtzeit-Traffic-Graphen** - Live-Darstellung des Netzwerk-Traffics
- **Historische Daten** - Abfrage und Analyse vergangener Traffic-Daten
- **Traffic-Verteilung** - Eingehend, Ausgehend und Intern

### 🔌 Switch-Management
- **TP-Link Switch Überwachung** - SNMP-basiert
- **Port-Status** - Online/Offline-Status je Port
- **VLAN-Anzeige** - VLAN-ID pro Port
- **Beschreibungsfeld** - Notizen für jeden Port (z.B. "Server-Rack-1")
- **Traffic-Statistiken** - Bytes In/Out pro Port

### 🗄️ Technologie-Stack
- **Backend**: FastAPI (Python)
- **Frontend**: React + Material-UI Dark Theme
- **Datenbanken**:
  - InfluxDB (Zeitreihen-Daten)
  - PostgreSQL (Metadaten)
  - Redis (Caching & Real-time State)
- **Collector**: nfcapd + Custom Python Collector
- **Deployment**: Docker Compose

## 📋 Voraussetzungen

- Ansible 2.9 oder höher
- Docker und Docker Compose auf dem Zielserver
- OPNsense Firewall oder anderes Gerät mit NetFlow/sFlow Support
- TP-Link Switches mit SNMP-Unterstützung (optional)
- Mindestens 4GB RAM auf dem Zielserver
- Mindestens 50GB freier Speicherplatz

## 🚀 Installation

### 1. Ansible-Projekt einrichten

```bash
cd ansible
```

### 2. Playbook erstellen oder verwenden

Verwenden Sie das mitgelieferte Playbook:

```bash
ansible-playbook playbooks/deploy_network_traffic_logger.yml
```

### 3. Konfiguration anpassen

Bearbeiten Sie die Variablen in `group_vars/all.yml`:

```yaml
# Passwörter (WICHTIG: Ändern Sie diese!)
influxdb_admin_password: "IhrSicheresPasswort123!"
influxdb_admin_token: "IhrInfluxDBToken_Random_String_12345"
postgres_password: "IhrPostgreSQLPasswort123!"

# SNMP Community für TP-Link Switches
snmp_community: "public"

# Ihre TP-Link Switches
tplink_switches:
  - ip: "192.168.1.10"
    name: "Switch-OG"
    ports:
      - number: 1
        name: "Server"
        vlan: 10
        description: "Hauptserver"
      - number: 2
        name: "NAS"
        vlan: 20
        description: "Storage"
```

### 4. Installation durchführen

```bash
ansible-playbook -i hosts.yaml playbooks/deploy_network_traffic_logger.yml
```

## 🔧 OPNsense Konfiguration

### NetFlow v5/v9 einrichten

1. In OPNsense: **Services → NetFlow → Settings**
2. **Enable NetFlow**: ✅
3. **Version**: NetFlow v5 oder v9
4. **Target IP**: `<IP-Adresse Ihres Servers>`
5. **Target Port**: `2055` (Standard)
6. **Save & Apply**

### sFlow einrichten (Alternative)

1. In OPNsense: **Services → sFlow → Settings**
2. **Enable sFlow**: ✅
3. **Collector IP**: `<IP-Adresse Ihres Servers>`
4. **Collector Port**: `6343` (Standard)
5. **Save & Apply**

## 🔌 TP-Link Switch Konfiguration

### SNMP aktivieren

1. Loggen Sie sich in Ihren TP-Link Switch ein
2. Navigieren Sie zu: **System Tools → SNMP Settings**
3. **SNMP Agent**: Enable
4. **SNMP Version**: v2c
5. **Community Name**: `public` (oder Ihr gewählter Name)
6. **Access Mode**: Read Only
7. **Apply**

### Ports in der Web-UI hinzufügen

Nach der Installation können Sie Switch-Ports über die Web-UI hinzufügen:

1. Öffnen Sie die Web-UI: `http://<Server-IP>:3000`
2. Navigieren Sie zu **Switches**
3. Klicken Sie auf **Port hinzufügen**
4. Tragen Sie die Informationen ein:
   - Switch IP-Adresse
   - Switch Name
   - Port-Nummer
   - VLAN-ID (optional)
   - Beschreibung (z.B. "Server Rack 1")
5. Speichern

## 📱 Web-Interface

Nach erfolgreicher Installation ist die Web-UI erreichbar unter:

```
http://<Server-IP>:3000
```

### Dashboard
- **Gesamt-Traffic** - Bytes und Pakete
- **Echtzeit-Graph** - Live-Traffic-Visualisierung
- **Traffic-Verteilung** - Eingehend/Ausgehend/Intern
- **Aktive Geräte** - Anzahl der erkannten Geräte

### Geräte
- Liste aller erkannten Netzwerk-Geräte
- IP-Adresse, Hostname, MAC-Adresse
- **Datenfluss-Richtung** - Hauptsächlich Eingehend/Ausgehend/Bidirektional
- Bytes gesendet/empfangen
- Letzte Aktivität

### Switches
- Übersicht aller konfigurierten Switches
- Port-Status (Online/Offline)
- VLAN-Zuordnung je Port
- **Beschreibungsfeld** - Was ist an diesem Port angeschlossen
- Traffic-Statistiken pro Port
- Port-Geschwindigkeit

### Verlauf
- Historische Traffic-Daten abfragen
- Zeitraum wählen (letzte Stunde, 24h, 7 Tage, custom)
- Intervall konfigurieren (1m, 5m, 15m, 1h, etc.)
- Grafische Darstellung

## 🔧 Konfiguration

### Variablen (defaults/main.yml)

```yaml
# Installation
ntl_install_dir: "/opt/network-traffic-logger"

# Netzwerk-Ports
netflow_port: 2055
sflow_port: 6343
backend_port: 8000
frontend_port: 3000
nginx_port: 80

# InfluxDB
influxdb_admin_user: "admin"
influxdb_admin_password: "changeme"
influxdb_admin_token: "changeme"
influxdb_org: "network-monitoring"
influxdb_bucket: "traffic"

# PostgreSQL
postgres_db: "network_traffic"
postgres_user: "ntl_user"
postgres_password: "changeme"

# SNMP
snmp_community: "public"
```

### Ansible Vault nutzen (empfohlen)

Für Produktionsumgebungen sollten Sie Ansible Vault verwenden:

```bash
# Vault-Datei erstellen
ansible-vault create group_vars/vault.yml
```

Inhalt:
```yaml
vault_influxdb_password: "IhrSicheresPasswort"
vault_influxdb_token: "IhrToken"
vault_postgres_password: "IhrPostgresPasswort"
```

In `group_vars/all.yml`:
```yaml
influxdb_admin_password: "{{ vault_influxdb_password }}"
influxdb_admin_token: "{{ vault_influxdb_token }}"
postgres_password: "{{ vault_postgres_password }}"
```

Playbook ausführen:
```bash
ansible-playbook playbooks/deploy_network_traffic_logger.yml --ask-vault-pass
```

## 🐳 Docker Container

Die Installation erstellt folgende Container:

| Container | Port | Beschreibung |
|-----------|------|--------------|
| `ntl_frontend` | 3000 | React Web-UI |
| `ntl_backend` | 8000 | FastAPI Backend |
| `ntl_netflow_collector` | 2055/udp, 6343/udp | NetFlow/sFlow Collector |
| `ntl_influxdb` | 8086 | InfluxDB Zeitreihen-DB |
| `ntl_postgres` | 5432 | PostgreSQL Metadaten-DB |
| `ntl_redis` | 6379 | Redis Cache |
| `ntl_nginx` | 80 | Nginx Reverse Proxy |

### Container-Management

```bash
# Status prüfen
cd /opt/network-traffic-logger
docker-compose ps

# Logs anzeigen
docker-compose logs -f

# Container neustarten
docker-compose restart

# Container stoppen
docker-compose stop

# Container entfernen
docker-compose down
```

## 📊 API-Endpunkte

Die Backend-API ist unter `http://<Server-IP>:8000` erreichbar:

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/stats/current` | GET | Aktuelle Traffic-Statistiken |
| `/api/traffic/history` | GET | Historische Traffic-Daten |
| `/api/devices` | GET | Liste aller Geräte |
| `/api/switches/ports` | GET | Liste aller Switch-Ports |
| `/api/switches/ports` | POST | Switch-Port hinzufügen |
| `/api/switches/ports/{id}` | PUT | Switch-Port aktualisieren |
| `/api/switches/ports/{id}` | DELETE | Switch-Port löschen |
| `/ws` | WebSocket | Echtzeit-Updates |

API-Dokumentation: `http://<Server-IP>:8000/docs`

## 🔥 Firewall-Regeln

Öffnen Sie folgende Ports auf Ihrem Server:

```bash
# NetFlow/sFlow (UDP)
firewall-cmd --permanent --add-port=2055/udp
firewall-cmd --permanent --add-port=6343/udp

# Web-UI und API (TCP)
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=8000/tcp
firewall-cmd --permanent --add-port=80/tcp

# Reload
firewall-cmd --reload
```

## 🛠️ Troubleshooting

### Container starten nicht

```bash
# Logs prüfen
docker-compose logs

# Speicherplatz prüfen
df -h

# Docker-Status prüfen
systemctl status docker
```

### Keine Daten von OPNsense

1. Überprüfen Sie die NetFlow/sFlow-Konfiguration in OPNsense
2. Prüfen Sie, ob der Port erreichbar ist:
   ```bash
   netstat -ulnp | grep 2055
   ```
3. Firewall-Regeln überprüfen
4. Collector-Logs prüfen:
   ```bash
   docker-compose logs netflow_collector
   ```

### SNMP-Abfrage schlägt fehl

1. Überprüfen Sie die SNMP-Konfiguration auf dem Switch
2. Community-String überprüfen
3. Testen Sie SNMP manuell:
   ```bash
   docker exec -it ntl_backend snmpwalk -v2c -c public <Switch-IP> system
   ```

### Web-UI lädt nicht

1. Frontend-Container-Status prüfen:
   ```bash
   docker-compose logs frontend
   ```
2. Port-Konflikte prüfen:
   ```bash
   netstat -tuln | grep 3000
   ```

## 🔄 Updates

Um die Installation zu aktualisieren:

```bash
# Git-Repository aktualisieren
git pull

# Playbook erneut ausführen
ansible-playbook playbooks/deploy_network_traffic_logger.yml

# Container neu bauen
cd /opt/network-traffic-logger
docker-compose up -d --build
```

## 📸 Screenshots

### Dashboard
- Echtzeit-Traffic-Graphen mit Live-Updates
- Statistik-Karten mit Trend-Indikatoren
- Traffic-Verteilung (Eingehend/Ausgehend/Intern)

### Geräte
- Tabellarische Übersicht aller Netzwerk-Geräte
- Datenfluss-Richtung mit visuellen Indikatoren
- Letzte Aktivität mit Farb-Kodierung

### Switches
- Switch-Übersicht mit Port-Details
- VLAN-Anzeige pro Port
- Beschreibungsfelder für Port-Notizen
- Traffic-Statistiken in Echtzeit

## 🤝 Support

Bei Fragen oder Problemen:

1. Überprüfen Sie die Logs: `docker-compose logs`
2. Konsultieren Sie die Dokumentation
3. Erstellen Sie ein Issue im Repository

## 📄 Lizenz

MIT License

## 👥 Autoren

Network Traffic Logger - Entwickelt für moderne Netzwerk-Überwachung mit Ansible

## 🔮 Roadmap

- [ ] IPv6-Unterstützung
- [ ] Multi-Tenant-Fähigkeit
- [ ] Alerting und Benachrichtigungen
- [ ] Export zu Grafana
- [ ] Mobile App
- [ ] IPFIX-Unterstützung
- [ ] Geo-IP-Lokalisierung
- [ ] DPI (Deep Packet Inspection) Integration

## 🙏 Danksagungen

- FastAPI für das excellente Python-Framework
- React und Material-UI für die moderne UI-Bibliothek
- InfluxDB für die Zeitreihen-Datenbank
- nfcapd für NetFlow-Collection
