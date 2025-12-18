#!/usr/bin/env python3
"""
Network Traffic Logger - Backend API
FastAPI application for network traffic monitoring and switch management
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import redis.asyncio as redis
from influxdb_client.client.influxdb_client_async import InfluxDBClientAsync
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://ntl_user:password@postgres:5432/network_traffic')
INFLUXDB_URL = os.getenv('INFLUXDB_URL', 'http://influxdb:8086')
INFLUXDB_TOKEN = os.getenv('INFLUXDB_TOKEN')
INFLUXDB_ORG = os.getenv('INFLUXDB_ORG', 'network-monitoring')
INFLUXDB_BUCKET = os.getenv('INFLUXDB_BUCKET', 'traffic')
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379')
SNMP_COMMUNITY = os.getenv('SNMP_COMMUNITY', 'public')

# Database setup
Base = declarative_base()
engine = create_engine(DATABASE_URL, poolclass=StaticPool, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Database Models
class SwitchPort(Base):
    """Switch port configuration and metadata"""
    __tablename__ = 'switch_ports'

    id = Column(Integer, primary_key=True, index=True)
    switch_ip = Column(String, index=True)
    switch_name = Column(String)
    port_number = Column(Integer)
    port_name = Column(String)
    vlan_id = Column(Integer, nullable=True)
    description = Column(String, nullable=True)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Device(Base):
    """Network device information"""
    __tablename__ = 'devices'

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    hostname = Column(String, nullable=True)
    mac_address = Column(String, nullable=True)
    vendor = Column(String, nullable=True)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON, nullable=True)


# Create tables
Base.metadata.create_all(bind=engine)


# Pydantic Models
class SwitchPortCreate(BaseModel):
    switch_ip: str
    switch_name: str
    port_number: int
    port_name: Optional[str] = None
    vlan_id: Optional[int] = None
    description: Optional[str] = None
    is_enabled: bool = True


class SwitchPortUpdate(BaseModel):
    port_name: Optional[str] = None
    vlan_id: Optional[int] = None
    description: Optional[str] = None
    is_enabled: Optional[bool] = None


class SwitchPortResponse(BaseModel):
    id: int
    switch_ip: str
    switch_name: str
    port_number: int
    port_name: Optional[str]
    vlan_id: Optional[int]
    description: Optional[str]
    is_enabled: bool
    status: Optional[str] = None
    speed: Optional[str] = None
    bytes_in: Optional[int] = None
    bytes_out: Optional[int] = None

    class Config:
        from_attributes = True


class DeviceResponse(BaseModel):
    id: int
    ip_address: str
    hostname: Optional[str]
    mac_address: Optional[str]
    vendor: Optional[str]
    first_seen: datetime
    last_seen: datetime
    bytes_sent: Optional[int] = 0
    bytes_received: Optional[int] = 0

    class Config:
        from_attributes = True


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
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


# Application lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.redis = await redis.from_url(REDIS_URL, decode_responses=True)
    app.state.influx = InfluxDBClientAsync(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)

    # Start background tasks
    asyncio.create_task(broadcast_realtime_stats(app.state.redis))
    asyncio.create_task(poll_switches())

    yield

    # Shutdown
    await app.state.redis.close()
    await app.state.influx.close()


# FastAPI app
app = FastAPI(
    title="Network Traffic Logger API",
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


# Helper functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# SNMP Functions
async def snmp_get_switch_info(switch_ip: str) -> Dict[str, Any]:
    """Get switch information via SNMP"""
    from pysnmp.hlapi import *

    try:
        # System Description
        iterator = getCmd(
            SnmpEngine(),
            CommunityData(SNMP_COMMUNITY),
            UdpTransportTarget((switch_ip, 161)),
            ContextData(),
            ObjectType(ObjectIdentity('SNMPv2-MIB', 'sysDescr', 0)),
            ObjectType(ObjectIdentity('SNMPv2-MIB', 'sysName', 0))
        )

        errorIndication, errorStatus, errorIndex, varBinds = next(iterator)

        if errorIndication or errorStatus:
            return None

        info = {
            'description': str(varBinds[0][1]),
            'name': str(varBinds[1][1])
        }

        return info

    except Exception as e:
        print(f"Error getting switch info: {e}")
        return None


async def snmp_get_port_status(switch_ip: str, port: int) -> Dict[str, Any]:
    """Get port status via SNMP"""
    from pysnmp.hlapi import *

    try:
        # Interface status and statistics
        iterator = getCmd(
            SnmpEngine(),
            CommunityData(SNMP_COMMUNITY),
            UdpTransportTarget((switch_ip, 161)),
            ContextData(),
            ObjectType(ObjectIdentity('IF-MIB', 'ifOperStatus', port)),
            ObjectType(ObjectIdentity('IF-MIB', 'ifSpeed', port)),
            ObjectType(ObjectIdentity('IF-MIB', 'ifInOctets', port)),
            ObjectType(ObjectIdentity('IF-MIB', 'ifOutOctets', port))
        )

        errorIndication, errorStatus, errorIndex, varBinds = next(iterator)

        if errorIndication or errorStatus:
            return None

        status_map = {1: 'up', 2: 'down', 3: 'testing', 4: 'unknown', 5: 'dormant', 6: 'notPresent', 7: 'lowerLayerDown'}

        status = {
            'status': status_map.get(int(varBinds[0][1]), 'unknown'),
            'speed': int(varBinds[1][1]),
            'bytes_in': int(varBinds[2][1]),
            'bytes_out': int(varBinds[3][1])
        }

        return status

    except Exception as e:
        print(f"Error getting port status: {e}")
        return None


# Background tasks
async def broadcast_realtime_stats(redis_client):
    """Broadcast real-time statistics to WebSocket clients"""
    pubsub = redis_client.pubsub()
    await pubsub.subscribe('realtime_traffic')

    async for message in pubsub.listen():
        if message['type'] == 'message':
            try:
                data = eval(message['data'])
                await manager.broadcast({
                    'type': 'traffic_update',
                    'data': data
                })
            except:
                pass


async def poll_switches():
    """Poll TP-Link switches for port status"""
    while True:
        try:
            db = next(get_db())
            switches = db.query(SwitchPort).all()

            for switch_port in switches:
                status = await snmp_get_port_status(switch_port.switch_ip, switch_port.port_number)
                if status:
                    await manager.broadcast({
                        'type': 'switch_update',
                        'data': {
                            'switch_ip': switch_port.switch_ip,
                            'port_number': switch_port.port_number,
                            **status
                        }
                    })

            db.close()
        except Exception as e:
            print(f"Error polling switches: {e}")

        await asyncio.sleep(10)  # Poll every 10 seconds


# API Endpoints

@app.get("/")
async def root():
    return {"message": "Network Traffic Logger API", "version": "1.0.0"}


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
        devices_active = await redis_client.scard("devices")

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
    start: Optional[str] = Query(None, description="Start time (ISO format)"),
    end: Optional[str] = Query(None, description="End time (ISO format)"),
    interval: str = Query("1m", description="Time interval (e.g., 1m, 5m, 1h)")
):
    """Get historical traffic data from InfluxDB"""
    try:
        query_api = app.state.influx.query_api()

        # Default to last 1 hour
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

        # Process results
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
async def get_devices(db: Session = next(get_db())):
    """Get all known devices"""
    try:
        devices = db.query(Device).all()
        redis_client = app.state.redis

        # Enrich with Redis data
        for device in devices:
            device.bytes_sent = int(await redis_client.hget(f"device:{device.ip_address}", "bytes_sent") or 0)
            device.bytes_received = int(await redis_client.hget(f"device:{device.ip_address}", "bytes_received") or 0)

        return devices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/switches/ports", response_model=List[SwitchPortResponse])
async def get_switch_ports(db: Session = next(get_db())):
    """Get all switch ports"""
    try:
        ports = db.query(SwitchPort).all()

        # Enrich with SNMP data
        result = []
        for port in ports:
            status = await snmp_get_port_status(port.switch_ip, port.port_number)
            port_data = SwitchPortResponse.from_orm(port)
            if status:
                port_data.status = status.get('status')
                port_data.speed = f"{status.get('speed', 0) / 1000000} Mbps"
                port_data.bytes_in = status.get('bytes_in')
                port_data.bytes_out = status.get('bytes_out')
            result.append(port_data)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/switches/ports", response_model=SwitchPortResponse)
async def create_switch_port(port: SwitchPortCreate, db: Session = next(get_db())):
    """Create or update a switch port configuration"""
    try:
        # Check if exists
        existing = db.query(SwitchPort).filter(
            SwitchPort.switch_ip == port.switch_ip,
            SwitchPort.port_number == port.port_number
        ).first()

        if existing:
            # Update
            for key, value in port.dict(exclude_unset=True).items():
                setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Create
            db_port = SwitchPort(**port.dict())
            db.add(db_port)
            db.commit()
            db.refresh(db_port)
            return db_port
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/switches/ports/{port_id}", response_model=SwitchPortResponse)
async def update_switch_port(port_id: int, port_update: SwitchPortUpdate, db: Session = next(get_db())):
    """Update a switch port configuration"""
    try:
        db_port = db.query(SwitchPort).filter(SwitchPort.id == port_id).first()
        if not db_port:
            raise HTTPException(status_code=404, detail="Port not found")

        for key, value in port_update.dict(exclude_unset=True).items():
            setattr(db_port, key, value)

        db_port.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_port)
        return db_port
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/switches/ports/{port_id}")
async def delete_switch_port(port_id: int, db: Session = next(get_db())):
    """Delete a switch port configuration"""
    try:
        db_port = db.query(SwitchPort).filter(SwitchPort.id == port_id).first()
        if not db_port:
            raise HTTPException(status_code=404, detail="Port not found")

        db.delete(db_port)
        db.commit()
        return {"message": "Port deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
