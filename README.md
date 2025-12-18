# Ansible Automation Project

Dieses Ansible-Projekt enthält verschiedene Rollen für Server-Management und Netzwerk-Monitoring.

## 🎯 Verfügbare Rollen

### 1. RPM Installation (`rpm_install`)
Installiert RPM-Pakete von GitHub auf Oracle Linux Servern.

### 2. Network Traffic Logger (`network_traffic_logger`) ⭐ NEU!
Umfassende Netzwerk-Traffic-Monitoring-Lösung mit:
- 🌐 NetFlow/sFlow Collector für OPNsense
- 📊 Moderne Dark-Theme Web-GUI (React + Material-UI)
- 🔄 Echtzeit-Traffic-Graphen
- 🔌 TP-Link Switch Port-Überwachung via SNMP
- 📈 Geräte-Tracking (IP, Hostname, Datenfluss-Richtung)
- 🗄️ InfluxDB + PostgreSQL + Redis Backend
- 🐳 Vollständig containerisiert mit Docker Compose

## 📁 Struktur

```
.
├── ansible.cfg                          # Ansible Konfiguration
├── hosts.yaml                           # Inventory-Datei
├── group_vars/
│   ├── all.yml                         # Globale Variablen (NICHT in Git committen!)
│   └── all.yml.example                 # Beispiel-Konfiguration
├── playbooks/
│   ├── install_rpm.yml                 # RPM-Installation
│   └── deploy_network_traffic_logger.yml # Network Traffic Logger
└── roles/
    ├── rpm_install/                    # Rolle für RPM-Installation
    │   ├── defaults/
    │   ├── tasks/
    │   └── README.md
    └── network_traffic_logger/         # Rolle für Netzwerk-Monitoring
        ├── defaults/
        ├── tasks/
        ├── templates/
        ├── files/
        │   ├── backend/
        │   │   ├── api/                # FastAPI Backend
        │   │   └── netflow_collector/  # NetFlow/sFlow Collector
        │   └── frontend/               # React Frontend
        │       ├── src/
        │       └── public/
        ├── handlers/
        ├── meta/
        └── README.md
```

## 🚀 Quick Start

### Network Traffic Logger installieren

```bash
# 1. Konfiguration anpassen
cp group_vars/all.yml.example group_vars/all.yml
nano group_vars/all.yml  # Passwörter ändern!

# 2. Deployment durchführen
ansible-playbook playbooks/deploy_network_traffic_logger.yml

# 3. Web-UI öffnen
# http://<Server-IP>:3000
```

Siehe [roles/network_traffic_logger/README.md](roles/network_traffic_logger/README.md) für detaillierte Anleitung.

### RPM Installation

```bash
# 1. Konfiguration
cp group_vars/all.yml.example group_vars/all.yml
nano group_vars/all.yml  # GitHub Token eintragen

# 2. Installation
ansible-playbook playbooks/install_rpm.yml
```

## Voraussetzungen

### Allgemein
- Ansible 2.9 oder höher
- Sudo-Rechte auf dem Zielserver

### Für RPM Installation
- Oracle Linux Zielserver
- GitHub Personal Access Token mit Lesezugriff auf das Repository
- User `apps` muss auf dem Zielserver existieren

### Für Network Traffic Logger
- Docker und Docker Compose
- Mindestens 4GB RAM
- Mindestens 50GB freier Speicherplatz
- OPNsense Firewall (optional, für NetFlow/sFlow)
- TP-Link Switches mit SNMP (optional)

## Einrichtung

### 1. GitHub Token konfigurieren

Erstellen Sie ein Personal Access Token in GitHub:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" klicken
3. Scopes: mindestens `repo` (für private Repos)
4. Token kopieren

### 2. Variablen konfigurieren

Kopieren Sie die Beispiel-Konfiguration und passen Sie sie an:

```bash
cp group_vars/all.yml.example group_vars/all.yml
```

Bearbeiten Sie `group_vars/all.yml` und setzen Sie:
- `github_user`: Ihr GitHub Username (vorname.nachname)
- `github_token`: Ihr GitHub Personal Access Token
- `github_repo`: Organisation/Repository-Name
- `github_rpm_path`: Pfad zur RPM-Datei im Repository
- `rpm_filename`: Gewünschter Name der RPM-Datei

**WICHTIG:** Die Datei `group_vars/all.yml` ist in `.gitignore` und wird nicht committed!

Alternativ können Sie das Token als Umgebungsvariable setzen:

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
```

### 3. User `apps` erstellen (falls nicht vorhanden)

```bash
sudo useradd -m -s /bin/bash apps
```

## Verwendung

### RPM-Paket installieren

```bash
ansible-playbook playbooks/install_rpm.yml
```

### Mit zusätzlichen Variablen

```bash
ansible-playbook playbooks/install_rpm.yml \
  -e "rpm_filename=myapp-2.0.0.rpm" \
  -e "github_rpm_path=releases/myapp-2.0.0.rpm"
```

### Nur auf bestimmten Hosts

```bash
ansible-playbook -i hosts.yaml playbooks/install_rpm.yml --limit tawaa
```

### Dry-Run (Check-Modus)

```bash
ansible-playbook playbooks/install_rpm.yml --check
```

## Funktionsweise

1. **Download**: Die RPM-Datei wird von GitHub auf den lokalen tawaa-Server heruntergeladen (User: vorname.nachname mit Token)
2. **Verzeichnis**: Die Datei wird nach `/opt/tmp` kopiert
3. **Installation**: Das RPM-Paket wird mit Admin-Rechten (sudo) installiert
4. **Berechtigungen**: Nach der Installation werden die Berechtigungen für den User `apps` gesetzt

## Variablen

### Pflicht-Variablen (in group_vars/all.yml):
- `github_user`: GitHub Username
- `github_token`: GitHub Personal Access Token
- `github_repo`: Repository (format: "organisation/repo-name")
- `github_rpm_path`: Pfad zur RPM-Datei im Repository
- `rpm_filename`: Name der RPM-Datei

### Optionale Variablen:
- `github_branch`: Branch (Standard: main)
- `rpm_download_dir`: Download-Verzeichnis (Standard: /opt/tmp)
- `rpm_owner`: Benutzer für Berechtigungen (Standard: apps)
- `rpm_group`: Gruppe für Berechtigungen (Standard: apps)
- `rpm_state`: present oder latest (Standard: present)
- `rpm_installed_paths`: Liste von Pfaden für Berechtigungsanpassung

## Troubleshooting

### Token-Authentifizierung schlägt fehl
- Überprüfen Sie, ob das Token gültig ist
- Stellen Sie sicher, dass das Token die richtigen Berechtigungen hat (repo-Zugriff)

### User `apps` existiert nicht
```bash
sudo useradd -m -s /bin/bash apps
```

### Verzeichnis /opt/tmp existiert nicht
Das Playbook erstellt das Verzeichnis automatisch.

### GPG-Check Fehler
Das Playbook deaktiviert GPG-Check. Für Produktionsumgebungen sollten Sie GPG-Signaturen aktivieren.

## Sicherheit

- ⚠️ Committen Sie **niemals** `group_vars/all.yml` mit dem GitHub Token!
- Verwenden Sie Ansible Vault für sensible Daten in Produktionsumgebungen:
  ```bash
  ansible-vault encrypt group_vars/all.yml
  ```
- Beschränken Sie Token-Berechtigungen auf das Minimum

## Erweiterungen

### Ansible Vault nutzen

Verschlüsseln Sie sensible Variablen:

```bash
ansible-vault create group_vars/vault.yml
```

Fügen Sie das Token dort hinzu und referenzieren Sie es in `all.yml`:

```yaml
github_token: "{{ vault_github_token }}"
```

Ausführung mit Vault:

```bash
ansible-playbook playbooks/install_rpm.yml --ask-vault-pass
```

## Support

Bei Fragen oder Problemen öffnen Sie ein Issue im Repository.
