#!/usr/bin/env python3
"""
NetSentry - Backend API
FastAPI application for network traffic monitoring and switch management with MongoDB
"""

import os
import json
import asyncio
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
class SwitchConfig(BaseModel):
    ip: str
    name: str
    username: str
    password: str
    type: str = 'tplink'

class VLANConfig(BaseModel):
    id: int
    name: str
    description: Optional[str] = ''

class AdGuardConfig(BaseModel):
    enabled: bool = False
    url: Optional[str] = ''
    username: Optional[str] = ''
    password: Optional[str] = ''

class OPNsenseConfig(BaseModel):
    enabled: bool = False
    url: Optional[str] = ''
    apiKey: Optional[str] = ''
    apiSecret: Optional[str] = ''

class AIAnalysisConfig(BaseModel):
    enabled: bool = False

class Settings(BaseModel):
    switches: List[SwitchConfig] = []
    vlans: List[VLANConfig] = []
    adguard: AdGuardConfig = AdGuardConfig()
    opnsense: OPNsenseConfig = OPNsenseConfig()
    ai_analysis: AIAnalysisConfig = AIAnalysisConfig()

class SwitchPortResponse(BaseModel):
    id: str
    switch_ip: str
    switch_name: str
    port_number: int
    port_name: Optional[str]
    vlan_id: Optional[int]
    description: Optional[str]
    is_enabled: bool
    status: Optional[str] = 'unknown'
    speed: Optional[str] = None
    bytes_in: Optional[int] = 0
    bytes_out: Optional[int] = 0

class DeviceResponse(BaseModel):
    id: str
    ip_address: str
    hostname: Optional[str]
    mac_address: Optional[str]
    vendor: Optional[str]
    vlan_id: Optional[int] = None
    first_seen: datetime
    last_seen: datetime
    bytes_sent: Optional[int] = 0
    bytes_received: Optional[int] = 0

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
    description="API for network traffic monitoring and switch management",
    version="1.0.0",
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
    return {"message": "NetSentry API", "version": "1.0.0"}

@app.get("/api/settings")
async def get_settings():
    """Get application settings"""
    settings = await db.settings.find_one()
    if not settings:
        settings = Settings().model_dump()
    settings.pop('_id', None)
    return settings

@app.post("/api/settings")
async def save_settings(settings: Settings):
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

@app.get("/api/devices", response_model=List[DeviceResponse])
async def get_devices():
    """Get all known devices"""
    try:
        devices = []
        redis_client = app.state.redis
        
        async for device in db.devices.find():
            device['id'] = str(device['_id'])
            device.pop('_id')
            
            # Enrich with Redis data
            device['bytes_sent'] = int(await redis_client.hget(f"device:{device['ip_address']}", "bytes_sent") or 0)
            device['bytes_received'] = int(await redis_client.hget(f"device:{device['ip_address']}", "bytes_received") or 0)
            
            devices.append(device)
        
        return devices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/switches/ports", response_model=List[SwitchPortResponse])
async def get_switch_ports():
    """Get all switch ports"""
    try:
        ports = []
        async for port in db.switch_ports.find():
            port['id'] = str(port['_id'])
            port.pop('_id')
            ports.append(port)
        
        return ports
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AdGuard Endpoints
@app.get("/api/adguard/stats")
async def get_adguard_stats():
    """Get AdGuard statistics (stub)"""
    return {
        "total_queries": 12459,
        "blocked_queries": 3421,
        "allowed_queries": 9038,
        "blocking_percentage": 27.5
    }

@app.get("/api/adguard/queries")
async def get_adguard_queries():
    """Get AdGuard DNS queries (stub)"""
    return [
        {
            "timestamp": datetime.utcnow().isoformat(),
            "domain": "tracking.example.com",
            "client_ip": "10.10.1.100",
            "client_name": "Device-1",
            "status": "blocked"
        },
        {
            "timestamp": datetime.utcnow().isoformat(),
            "domain": "google.com",
            "client_ip": "10.10.1.101",
            "client_name": "Device-2",
            "status": "allowed"
        }
    ]

# OPNsense Endpoints
@app.get("/api/opnsense/stats")
async def get_opnsense_stats():
    """Get OPNsense statistics (stub)"""
    return {
        "total_rules": 42,
        "blocked_connections": 1584,
        "allowed_connections": 45892,
        "active_connections": 127
    }

@app.get("/api/opnsense/logs")
async def get_opnsense_logs():
    """Get OPNsense firewall logs (stub)"""
    return [
        {
            "timestamp": datetime.utcnow().isoformat(),
            "action": "block",
            "source_ip": "192.168.1.100",
            "dest_ip": "8.8.8.8",
            "port": 53,
            "protocol": "UDP",
            "rule_name": "Block DNS"
        }
    ]

@app.get("/api/opnsense/traffic")
async def get_opnsense_traffic():
    """Get OPNsense traffic data (stub)"""
    return [
        {"time": "10:00", "allowed": 1250, "blocked": 85},
        {"time": "10:05", "allowed": 1380, "blocked": 92},
        {"time": "10:10", "allowed": 1420, "blocked": 78}
    ]

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
