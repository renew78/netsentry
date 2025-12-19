#!/usr/bin/env python3
"""
NetSentry - Backend API
FastAPI application for network traffic monitoring with OPNsense, AdGuard, and TrueNAS integration
"""

import os
import json
import asyncio
import aiohttp
import base64
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import redis.asyncio as redis
from influxdb_client.client.influxdb_client_async import InfluxDBClientAsync
from motor.motor_asyncio import AsyncIOMotorClient

# Configuration
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://admin:password@mongodb:27017')
INFLUXDB_URL = os.getenv('INFLUXDB_URL', 'http://influxdb:8086')
INFLUXDB_TOKEN = os.getenv('INFLUXDB_TOKEN')
INFLUXDB_ORG = os.getenv('INFLUXDB_ORG', 'network-monitoring')
INFLUXDB_BUCKET = os.getenv('INFLUXDB_BUCKET', 'traffic')
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379')

# MongoDB client
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client['netsentry']

# Pydantic Models
class VLANConfig(BaseModel):
    id: int
    name: str
    description: Optional[str] = ''

class AdGuardConfig(BaseModel):
    enabled: bool = False
    url: Optional[str] = ''
    apiKey: Optional[str] = ''

class OPNsenseConfig(BaseModel):
    enabled: bool = False
    url: Optional[str] = ''
    apiKey: Optional[str] = ''
    apiSecret: Optional[str] = ''

class TrueNASConfig(BaseModel):
    enabled: bool = False
    url: Optional[str] = ''
    apiKey: Optional[str] = ''

class AIAnalysisConfig(BaseModel):
    enabled: bool = False

class Settings(BaseModel):
    vlans: List[VLANConfig] = []
    adguard: AdGuardConfig = AdGuardConfig()
    opnsense: OPNsenseConfig = OPNsenseConfig()
    truenas: TrueNASConfig = TrueNASConfig()
    ai_analysis: AIAnalysisConfig = AIAnalysisConfig()

class DeviceResponse(BaseModel):
    id: str
    ip_address: str
    hostname: Optional[str]
    mac_address: Optional[str]
    vlan_id: Optional[int] = None
    bytes_sent: Optional[int] = 0
    bytes_received: Optional[int] = 0
    bytes_sent_rate: Optional[int] = 0
    bytes_received_rate: Optional[int] = 0

class TrafficStats(BaseModel):
    timestamp: datetime
    total_bytes: int
    total_packets: int
    inbound_bytes: int
    outbound_bytes: int
    internal_bytes: int
    devices_active: int

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections[:]:
            try:
                await connection.send_json(message)
            except:
                await self.disconnect(connection)

manager = ConnectionManager()

# Helper Functions
async def get_settings() -> Settings:
    """Get settings from database"""
    settings_doc = await db.settings.find_one()
    if not settings_doc:
        return Settings()
    settings_doc.pop('_id', None)
    return Settings(**settings_doc)

async def opnsense_api_call(endpoint: str, method: str = 'GET', data: dict = None):
    """Make API call to OPNsense"""
    settings = await get_settings()

    print(f"[OPNsense] Checking settings - enabled: {settings.opnsense.enabled}, url: {settings.opnsense.url}")

    if not settings.opnsense.enabled:
        print(f"[OPNsense] Integration is disabled")
        return None

    if not settings.opnsense.url:
        print(f"[OPNsense] URL is not configured")
        return None

    url = f"{settings.opnsense.url.rstrip('/')}/api{endpoint}"
    auth = base64.b64encode(f"{settings.opnsense.apiKey}:{settings.opnsense.apiSecret}".encode()).decode()

    headers = {
        'Authorization': f'Basic {auth}',
        'Content-Type': 'application/json'
    }

    print(f"[OPNsense] Making {method} request to: {url}")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.request(method, url, headers=headers, json=data, ssl=False, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                print(f"[OPNsense] Response status: {resp.status}, content-type: {resp.content_type}")

                if resp.status == 200:
                    if 'application/json' in resp.content_type:
                        return await resp.json()
                    else:
                        text = await resp.text()
                        print(f"[OPNsense] ERROR: Got HTML instead of JSON. First 500 chars: {text[:500]}")
                        return None
                else:
                    text = await resp.text()
                    print(f"[OPNsense] ERROR: Status {resp.status}. Response: {text[:500]}")
                    return None
    except Exception as e:
        print(f"[OPNsense] API error: {type(e).__name__}: {e}")
        return None

async def adguard_api_call(endpoint: str):
    """Make API call to AdGuard Home"""
    settings = await get_settings()
    if not settings.adguard.enabled or not settings.adguard.url:
        return None

    url = f"{settings.adguard.url.rstrip('/')}/{endpoint.lstrip('/')}"
    headers = {}

    if settings.adguard.apiKey:
        headers['Authorization'] = f'Bearer {settings.adguard.apiKey}'

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    return await resp.json()
                return None
    except Exception as e:
        print(f"AdGuard API error: {e}")
        return None

async def truenas_api_call(endpoint: str):
    """Make API call to TrueNAS Scale"""
    settings = await get_settings()
    if not settings.truenas.enabled or not settings.truenas.url:
        return None

    url = f"{settings.truenas.url.rstrip('/')}/api/v2.0/{endpoint.lstrip('/')}"
    headers = {
        'Authorization': f'Bearer {settings.truenas.apiKey}',
        'Content-Type': 'application/json'
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, ssl=False, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    return await resp.json()
                return None
    except Exception as e:
        print(f"TrueNAS API error: {e}")
        return None

# Application lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.redis = await redis.from_url(REDIS_URL, decode_responses=True)
    app.state.influx = InfluxDBClientAsync(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)

    # Initialize default settings if not exists
    if not await db.settings.find_one():
        await db.settings.insert_one(Settings().model_dump())

    yield

    # Shutdown
    await app.state.redis.close()
    await app.state.influx.close()
    mongo_client.close()

# FastAPI app
app = FastAPI(
    title="NetSentry API",
    description="API for network traffic monitoring with OPNsense, AdGuard, and TrueNAS integration",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpoints
@app.get("/")
async def root():
    return {"message": "NetSentry API", "version": "2.0.0"}

@app.get("/api/settings")
async def get_settings_endpoint():
    """Get application settings"""
    settings = await db.settings.find_one()
    if not settings:
        settings = Settings().model_dump()
    settings.pop('_id', None)
    return settings

@app.post("/api/settings")
async def save_settings_endpoint(settings: Settings):
    """Save application settings"""
    await db.settings.delete_many({})
    await db.settings.insert_one(settings.model_dump())
    return {"message": "Settings saved successfully"}

@app.get("/api/stats/current", response_model=TrafficStats)
async def get_current_stats():
    """Get current traffic statistics"""
    redis_client = app.state.redis

    try:
        total_bytes = int(await redis_client.get("stats:total_bytes") or 0)
        total_packets = int(await redis_client.get("stats:total_packets") or 0)
        inbound_bytes = int(await redis_client.get("stats:inbound_bytes") or 0)
        outbound_bytes = int(await redis_client.get("stats:outbound_bytes") or 0)
        internal_bytes = int(await redis_client.get("stats:internal_bytes") or 0)
        devices_active = await redis_client.scard("devices") or 0

        return TrafficStats(
            timestamp=datetime.utcnow(),
            total_bytes=total_bytes,
            total_packets=total_packets,
            inbound_bytes=inbound_bytes,
            outbound_bytes=outbound_bytes,
            internal_bytes=internal_bytes,
            devices_active=devices_active
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/traffic/history")
async def get_traffic_history(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    interval: str = Query("1m")
):
    """Get historical traffic data from InfluxDB"""
    try:
        query_api = app.state.influx.query_api()

        if not start:
            start = (datetime.utcnow() - timedelta(hours=1)).isoformat() + "Z"
        if not end:
            end = datetime.utcnow().isoformat() + "Z"

        query = f'''
        from(bucket: "{INFLUXDB_BUCKET}")
          |> range(start: {start}, stop: {end})
          |> filter(fn: (r) => r["_measurement"] == "network_traffic")
          |> filter(fn: (r) => r["_field"] == "bytes" or r["_field"] == "packets")
          |> aggregateWindow(every: {interval}, fn: sum, createEmpty: false)
        '''

        result = await query_api.query(query)

        data = []
        for table in result:
            for record in table.records:
                data.append({
                    'time': record.get_time().isoformat(),
                    'field': record.get_field(),
                    'value': record.get_value(),
                    'direction': record.values.get('direction', 'unknown')
                })

        return {'data': data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# OPNsense Endpoints
@app.get("/api/opnsense/devices")
async def get_opnsense_devices():
    """Get device list from OPNsense ARP table and DHCP leases"""
    result = await opnsense_api_call('/diagnostics/interface/getArp')
    if not result:
        return []

    devices = []
    arp_table = result.get('rows', []) if isinstance(result, dict) else result

    for idx, entry in enumerate(arp_table):
        if isinstance(entry, dict):
            device = {
                'id': f"opn-{idx}",
                'ip_address': entry.get('ip', entry.get('address', '')),
                'mac_address': entry.get('mac', entry.get('ether', '')),
                'hostname': entry.get('hostname', entry.get('intf_description', '')),
                'vlan_id': None,
                'bytes_sent': 0,
                'bytes_received': 0,
                'bytes_sent_rate': 0,
                'bytes_received_rate': 0,
            }
            devices.append(device)

    return devices

@app.get("/api/opnsense/stats")
async def get_opnsense_stats():
    """Get OPNsense firewall statistics"""
    result = await opnsense_api_call('/firewall/filter/searchRule')

    if result and isinstance(result, dict):
        return {
            "total_rules": result.get('total', 0),
            "blocked_connections": 0,
            "allowed_connections": 0,
            "active_connections": 0
        }

    return {
        "total_rules": 0,
        "blocked_connections": 0,
        "allowed_connections": 0,
        "active_connections": 0
    }

@app.get("/api/opnsense/logs")
async def get_opnsense_logs():
    """Get OPNsense firewall logs"""
    result = await opnsense_api_call('/firewall/log/list')

    if not result:
        return []

    logs = []
    log_entries = result.get('rows', []) if isinstance(result, dict) else result

    for entry in log_entries[:50]:  # Limit to 50 entries
        if isinstance(entry, dict):
            logs.append({
                "timestamp": entry.get('timestamp', datetime.utcnow().isoformat()),
                "action": entry.get('action', 'unknown'),
                "source_ip": entry.get('src', ''),
                "dest_ip": entry.get('dst', ''),
                "port": entry.get('dst_port', 0),
                "protocol": entry.get('proto', ''),
                "rule_name": entry.get('label', 'N/A')
            })

    return logs

@app.get("/api/opnsense/traffic")
async def get_opnsense_traffic():
    """Get OPNsense traffic data"""
    result = await opnsense_api_call('/diagnostics/traffic/interface')

    if not result:
        return []

    traffic_data = []
    now = datetime.utcnow()

    for i in range(12):  # 12 data points (1 hour at 5-minute intervals)
        timestamp = (now - timedelta(minutes=i*5)).strftime("%H:%M")
        traffic_data.insert(0, {
            "time": timestamp,
            "allowed": 0,
            "blocked": 0
        })

    return traffic_data

@app.get("/api/opnsense/test")
async def test_opnsense_connection():
    """Test OPNsense API connection and credentials"""
    settings = await get_settings()

    if not settings.opnsense.enabled:
        return {
            "success": False,
            "error": "OPNsense integration is disabled. Please enable it in Settings."
        }

    if not settings.opnsense.url or not settings.opnsense.apiKey or not settings.opnsense.apiSecret:
        return {
            "success": False,
            "error": "OPNsense URL, API Key, or API Secret is missing."
        }

    # Try a simple API call to test connectivity
    result = await opnsense_api_call('/diagnostics/interface/getArp')

    if result is not None:
        return {
            "success": True,
            "message": "Successfully connected to OPNsense API",
            "url": settings.opnsense.url,
            "device_count": len(result.get('rows', [])) if isinstance(result, dict) else len(result) if isinstance(result, list) else 0
        }
    else:
        return {
            "success": False,
            "error": "Failed to connect to OPNsense API. Check the backend logs for details.",
            "url": settings.opnsense.url
        }

# AdGuard Endpoints
@app.get("/api/adguard/stats")
async def get_adguard_stats():
    """Get AdGuard Home statistics"""
    result = await adguard_api_call('/control/stats')

    if result:
        return {
            "total_queries": result.get('num_dns_queries', 0),
            "blocked_queries": result.get('num_blocked_filtering', 0),
            "allowed_queries": result.get('num_dns_queries', 0) - result.get('num_blocked_filtering', 0),
            "blocking_percentage": (result.get('num_blocked_filtering', 0) / max(result.get('num_dns_queries', 1), 1)) * 100
        }

    return {
        "total_queries": 0,
        "blocked_queries": 0,
        "allowed_queries": 0,
        "blocking_percentage": 0
    }

@app.get("/api/adguard/queries")
async def get_adguard_queries():
    """Get AdGuard DNS query log"""
    result = await adguard_api_call('/control/querylog')

    if not result or not isinstance(result, dict):
        return []

    queries = []
    data = result.get('data', [])

    for entry in data[:100]:  # Limit to 100 queries
        queries.append({
            "timestamp": entry.get('time', datetime.utcnow().isoformat()),
            "domain": entry.get('question', {}).get('name', ''),
            "client_ip": entry.get('client', ''),
            "client_name": entry.get('client_info', {}).get('name', ''),
            "status": "blocked" if entry.get('reason') in ['FilteredBlackList', 'FilteredBlockedService'] else "allowed"
        })

    return queries

# TrueNAS Endpoints
@app.get("/api/truenas/pools")
async def get_truenas_pools():
    """Get TrueNAS storage pools"""
    result = await truenas_api_call('/pool')

    if not result:
        return []

    pools = []
    for pool in result:
        if isinstance(pool, dict):
            topology = pool.get('topology', {})
            pools.append({
                "name": pool.get('name', ''),
                "status": pool.get('status', 'UNKNOWN'),
                "size": pool.get('size', 0),
                "allocated": pool.get('allocated', 0),
                "free": pool.get('free', 0)
            })

    return pools

@app.get("/api/truenas/datasets")
async def get_truenas_datasets():
    """Get TrueNAS datasets"""
    result = await truenas_api_call('/pool/dataset')

    if not result:
        return []

    datasets = []
    for dataset in result:
        if isinstance(dataset, dict):
            datasets.append({
                "name": dataset.get('name', ''),
                "type": dataset.get('type', 'FILESYSTEM'),
                "used": dataset.get('used', {}).get('parsed', 0),
                "available": dataset.get('available', {}).get('parsed', 0),
                "compression": dataset.get('compression', {}).get('value', 'off')
            })

    return datasets

@app.get("/api/truenas/services")
async def get_truenas_services():
    """Get TrueNAS services status"""
    result = await truenas_api_call('/service')

    if not result:
        return []

    services = []
    for service in result:
        if isinstance(service, dict):
            services.append({
                "name": service.get('service', ''),
                "state": service.get('state', 'STOPPED'),
                "enable": service.get('enable', False)
            })

    return services

@app.get("/api/truenas/system")
async def get_truenas_system():
    """Get TrueNAS system information"""
    result = await truenas_api_call('/system/info')

    if result and isinstance(result, dict):
        return {
            "hostname": result.get('hostname', 'N/A'),
            "version": result.get('version', 'N/A'),
            "uptime": result.get('uptime_seconds', 0),
            "loadavg": ', '.join(map(str, result.get('loadavg', [0, 0, 0])))
        }

    return {
        "hostname": "N/A",
        "version": "N/A",
        "uptime": "N/A",
        "loadavg": "N/A"
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
