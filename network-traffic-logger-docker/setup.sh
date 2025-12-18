#!/bin/bash

# Network Traffic Logger - Setup Script für Raspberry Pi
# Automatisiert die Ersteinrichtung

set -e

echo "=================================================="
echo "  Network Traffic Logger - Setup für Raspberry Pi"
echo "=================================================="
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Prüfe ob Docker installiert ist
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker ist nicht installiert!${NC}"
    echo "Installiere Docker mit: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    exit 1
fi

# Prüfe ob Docker Compose installiert ist
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose ist nicht installiert!${NC}"
    echo "Installiere Docker Compose mit: sudo apt-get install -y docker-compose"
    exit 1
fi

echo -e "${GREEN}✓ Docker ist installiert${NC}"
echo -e "${GREEN}✓ Docker Compose ist installiert${NC}"
echo ""

# Prüfe Berechtigungen
if ! docker ps &> /dev/null; then
    echo -e "${YELLOW}⚠ Sie haben keine Berechtigung Docker ohne sudo zu verwenden${NC}"
    echo "Führen Sie aus: sudo usermod -aG docker $USER && newgrp docker"
    echo ""
fi

# .env Datei erstellen falls nicht vorhanden
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Erstelle .env Datei...${NC}"
    cp .env.example .env

    # Versuche Raspberry Pi IP zu ermitteln
    PI_IP=$(hostname -I | awk '{print $1}')
    if [ -n "$PI_IP" ]; then
        echo "Erkannte Raspberry Pi IP: $PI_IP"
        sed -i "s/SERVER_IP=.*/SERVER_IP=$PI_IP/" .env
    fi

    echo -e "${GREEN}✓ .env Datei erstellt${NC}"
    echo -e "${YELLOW}⚠ WICHTIG: Bearbeiten Sie .env und ändern Sie die Passwörter!${NC}"
    echo "   nano .env"
    echo ""
else
    echo -e "${GREEN}✓ .env Datei existiert bereits${NC}"
fi

# Bestätige Fortsetzung
read -p "Möchten Sie mit der Installation fortfahren? (j/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[JjYy]$ ]]; then
    echo "Installation abgebrochen."
    exit 0
fi

echo ""
echo "=================================================="
echo "  Starte Installation..."
echo "=================================================="
echo ""

# Docker Images bauen und Container starten
echo -e "${YELLOW}🔨 Baue Docker Images (dies kann einige Minuten dauern)...${NC}"
docker-compose build

echo ""
echo -e "${YELLOW}🚀 Starte Container...${NC}"
docker-compose up -d

echo ""
echo "=================================================="
echo "  Warte auf Service-Start..."
echo "=================================================="
echo ""

# Warte auf Services
for i in {1..30}; do
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✓ Container sind gestartet${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo ""
echo "=================================================="
echo "  🎉 Installation abgeschlossen!"
echo "=================================================="
echo ""

# Zeige laufende Container
echo "Laufende Container:"
docker-compose ps
echo ""

# Zeige Zugriffs-URLs
PI_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}📱 Web-Interface:${NC}"
echo "   → http://$PI_IP:3000"
echo ""
echo -e "${GREEN}🔌 Backend API:${NC}"
echo "   → http://$PI_IP:8000"
echo "   → http://$PI_IP:8000/docs (API Dokumentation)"
echo ""
echo -e "${GREEN}📊 InfluxDB:${NC}"
echo "   → http://$PI_IP:8086"
echo ""

echo -e "${YELLOW}📋 Nächste Schritte:${NC}"
echo "1. Öffnen Sie die Web-UI: http://$PI_IP:3000"
echo "2. Konfigurieren Sie OPNsense NetFlow:"
echo "   - Target IP: $PI_IP"
echo "   - Target Port: 2055"
echo "3. Konfigurieren Sie TP-Link Switches:"
echo "   - Aktivieren Sie SNMP v2c"
echo "   - Community: public (oder wie in .env)"
echo "4. Fügen Sie Switch-Ports in der Web-UI hinzu"
echo ""

echo -e "${GREEN}✓ Fertig! Viel Spaß mit dem Network Traffic Logger! 🎉${NC}"
echo ""
echo "Logs anzeigen: docker-compose logs -f"
echo "Container stoppen: docker-compose stop"
echo "Container starten: docker-compose start"
echo ""
