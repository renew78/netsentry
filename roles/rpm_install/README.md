# Ansible Rolle: rpm_install

Diese Rolle lädt RPM-Pakete von GitHub herunter und installiert sie auf Oracle Linux Systemen.

## Anforderungen

- Ansible 2.9 oder höher
- Oracle Linux 7, 8 oder 9
- GitHub Personal Access Token mit Repository-Zugriff
- Sudo-Rechte auf dem Zielsystem
- User `apps` muss existieren (oder wird erstellt)

## Rollenvariablen

### Pflicht-Variablen

Diese Variablen müssen in `group_vars/all.yml` oder als Extra-Vars definiert werden:

```yaml
github_user: vorname.nachname          # GitHub Username
github_token: "ghp_xxxxx"              # GitHub Personal Access Token
github_repo: "organisation/repository" # GitHub Repository
github_rpm_path: "path/to/file.rpm"    # Pfad zur RPM-Datei im Repository
rpm_filename: "application.rpm"        # Name der RPM-Datei
```

### Optionale Variablen

```yaml
# Download-Verzeichnis (Standard: /opt/tmp)
rpm_download_dir: /opt/tmp

# Benutzer und Gruppe für Berechtigungen (Standard: apps)
rpm_owner: apps
rpm_group: apps

# GitHub Branch (Standard: main)
github_branch: main

# RPM State (Standard: present)
# Optionen: present, latest
rpm_state: present

# Pfade, die nach Installation berechtigt werden sollen
rpm_installed_paths:
  - /opt/application
  - /var/lib/application
  - /etc/application

# Optional: Service-Name für automatischen Neustart
application_service_name: myapp
```

## Dependencies

Keine

## Beispiel Playbook

```yaml
---
- name: RPM Installation auf Oracle Linux
  hosts: oracle_linux
  become: yes

  roles:
    - rpm_install
```

Mit zusätzlichen Variablen:

```yaml
---
- name: RPM Installation mit Custom-Variablen
  hosts: oracle_linux
  become: yes

  vars:
    rpm_filename: "myapp-2.0.0.rpm"
    github_rpm_path: "releases/myapp-2.0.0.rpm"
    rpm_installed_paths:
      - /opt/myapp
      - /etc/myapp
    application_service_name: myapp

  roles:
    - rpm_install
```

## Funktionsweise

1. **Verzeichnis erstellen**: Erstellt das Download-Verzeichnis `/opt/tmp` (oder custom)
2. **GitHub Download**: Lädt die RPM-Datei von GitHub herunter (mit Token-Authentifizierung)
3. **Berechtigungen**: Setzt die Berechtigungen für die RPM-Datei
4. **Installation**: Installiert das RPM-Paket mit `yum`
5. **Post-Installation**: Setzt Berechtigungen für den `apps`-User auf definierte Pfade
6. **Handler**: Optional - Startet Services neu oder lädt systemd neu

## Handlers

Die Rolle bietet folgende Handler:

- `restart application service`: Startet einen Service neu (benötigt `application_service_name`)
- `reload systemd`: Lädt systemd-Daemon neu
- `set selinux context`: Setzt SELinux-Context auf installierte Pfade

Um Handler zu nutzen, fügen Sie `notify` zu Ihren Tasks hinzu oder definieren Sie `application_service_name`.

## Sicherheit

⚠️ **Wichtige Sicherheitshinweise:**

1. **GitHub Token**: Niemals in Git committen!
   - Nutzen Sie Umgebungsvariablen: `export GITHUB_TOKEN="ghp_xxx"`
   - Oder Ansible Vault für Produktionsumgebungen

2. **GPG-Check**: Standardmäßig deaktiviert für einfachere Installation
   - Für Produktion: GPG-Signatur aktivieren

3. **Berechtigungen**: Die Rolle setzt Berechtigungen für den `apps`-User
   - Überprüfen Sie, welche Pfade berechtigt werden sollen
   - Nutzen Sie `rpm_installed_paths` nur für notwendige Verzeichnisse

## Troubleshooting

### User `apps` existiert nicht

```bash
sudo useradd -m -s /bin/bash apps
sudo groupadd apps 2>/dev/null || true
```

### GitHub Download schlägt fehl

- Token überprüfen: `echo $GITHUB_TOKEN`
- Token-Berechtigungen überprüfen (mindestens `repo` Scope)
- Repository-Zugriff überprüfen
- Pfad zur RPM-Datei überprüfen

### RPM-Installation schlägt fehl

- Dependencies überprüfen: `rpm -qpR /opt/tmp/application.rpm`
- Logs prüfen: `/var/log/yum.log`

### SELinux Probleme

Die Rolle berücksichtigt SELinux und setzt Contexts automatisch, wenn `rpm_installed_paths` definiert ist.

```bash
# SELinux Status prüfen
sestatus

# Manuell Context setzen
restorecon -R /opt/application
```

## Beispiele

### Einfache Installation

```bash
ansible-playbook -i hosts.yaml playbooks/install_rpm.yml
```

### Mit Extra-Variablen

```bash
ansible-playbook playbooks/install_rpm.yml \
  -e "rpm_filename=myapp-2.0.0.rpm" \
  -e "github_rpm_path=releases/myapp-2.0.0.rpm"
```

### Mit Vault

```bash
ansible-playbook playbooks/install_rpm.yml --ask-vault-pass
```

## Lizenz

MIT

## Autor

DevOps Team
