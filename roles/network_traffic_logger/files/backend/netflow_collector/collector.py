#!/usr/bin/env python3
"""
Network Traffic Collector
Collects NetFlow v5/v9 and sFlow data from OPNsense and other network devices
"""

import os
import socket
import struct
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Any
import redis
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

# Configuration
NETFLOW_PORT = int(os.getenv('NETFLOW_PORT', 2055))
SFLOW_PORT = int(os.getenv('SFLOW_PORT', 6343))
INFLUXDB_URL = os.getenv('INFLUXDB_URL', 'http://influxdb:8086')
INFLUXDB_TOKEN = os.getenv('INFLUXDB_TOKEN')
INFLUXDB_ORG = os.getenv('INFLUXDB_ORG', 'network-monitoring')
INFLUXDB_BUCKET = os.getenv('INFLUXDB_BUCKET', 'traffic')
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379')

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize InfluxDB client
influx_client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
write_api = influx_client.write_api(write_options=SYNCHRONOUS)

# Initialize Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)


class NetFlowV5Parser:
    """Parser for NetFlow v5 packets"""

    HEADER_FORMAT = '!HHIIIIBBH'
    HEADER_SIZE = 24
    FLOW_FORMAT = '!IIIHHIIHHBBxBBBBHHIIHHHHII'
    FLOW_SIZE = 48

    @staticmethod
    def parse(data: bytes) -> Dict[str, Any]:
        """Parse NetFlow v5 packet"""
        try:
            # Parse header
            header = struct.unpack(NetFlowV5Parser.HEADER_FORMAT, data[:NetFlowV5Parser.HEADER_SIZE])
            version, count, sys_uptime, unix_secs, unix_nsecs, flow_sequence, engine_type, engine_id, sampling = header

            if version != 5:
                logger.warning(f"Unexpected NetFlow version: {version}")
                return None

            flows = []
            offset = NetFlowV5Parser.HEADER_SIZE

            for i in range(count):
                if offset + NetFlowV5Parser.FLOW_SIZE > len(data):
                    break

                flow_data = struct.unpack(
                    NetFlowV5Parser.FLOW_FORMAT,
                    data[offset:offset + NetFlowV5Parser.FLOW_SIZE]
                )
                offset += NetFlowV5Parser.FLOW_SIZE

                flow = {
                    'src_addr': socket.inet_ntoa(struct.pack('!I', flow_data[0])),
                    'dst_addr': socket.inet_ntoa(struct.pack('!I', flow_data[1])),
                    'next_hop': socket.inet_ntoa(struct.pack('!I', flow_data[2])),
                    'input_iface': flow_data[3],
                    'output_iface': flow_data[4],
                    'packets': flow_data[5],
                    'bytes': flow_data[6],
                    'first_switched': flow_data[7],
                    'last_switched': flow_data[8],
                    'src_port': flow_data[9],
                    'dst_port': flow_data[10],
                    'tcp_flags': flow_data[11],
                    'protocol': flow_data[12],
                    'tos': flow_data[13],
                    'src_as': flow_data[14],
                    'dst_as': flow_data[15],
                    'src_mask': flow_data[16],
                    'dst_mask': flow_data[17],
                }
                flows.append(flow)

            return {
                'version': version,
                'count': count,
                'timestamp': unix_secs,
                'flows': flows
            }

        except Exception as e:
            logger.error(f"Error parsing NetFlow v5: {e}")
            return None


class NetFlowCollector:
    """NetFlow/sFlow Collector"""

    def __init__(self):
        self.running = False

    async def handle_netflow(self, data: bytes, addr: tuple):
        """Handle incoming NetFlow packet"""
        try:
            parsed = NetFlowV5Parser.parse(data)
            if not parsed:
                return

            logger.info(f"Received NetFlow from {addr[0]} with {parsed['count']} flows")

            # Write to InfluxDB
            for flow in parsed['flows']:
                await self.write_flow_to_influx(flow, addr[0])
                await self.update_device_cache(flow)

        except Exception as e:
            logger.error(f"Error handling NetFlow: {e}")

    async def write_flow_to_influx(self, flow: Dict[str, Any], source: str):
        """Write flow data to InfluxDB"""
        try:
            # Resolve hostnames
            src_hostname = await self.resolve_hostname(flow['src_addr'])
            dst_hostname = await self.resolve_hostname(flow['dst_addr'])

            # Determine direction
            direction = self.determine_direction(flow['src_addr'], flow['dst_addr'])

            point = (
                Point("network_traffic")
                .tag("source", source)
                .tag("src_addr", flow['src_addr'])
                .tag("dst_addr", flow['dst_addr'])
                .tag("src_hostname", src_hostname)
                .tag("dst_hostname", dst_hostname)
                .tag("protocol", self.protocol_name(flow['protocol']))
                .tag("direction", direction)
                .field("bytes", flow['bytes'])
                .field("packets", flow['packets'])
                .field("src_port", flow['src_port'])
                .field("dst_port", flow['dst_port'])
                .time(datetime.utcnow())
            )

            write_api.write(bucket=INFLUXDB_BUCKET, record=point)

            # Update real-time stats in Redis
            await self.update_realtime_stats(flow, direction)

        except Exception as e:
            logger.error(f"Error writing to InfluxDB: {e}")

    async def resolve_hostname(self, ip: str) -> str:
        """Resolve IP to hostname with caching"""
        try:
            # Check cache first
            cached = redis_client.get(f"hostname:{ip}")
            if cached:
                return cached

            # Resolve hostname
            loop = asyncio.get_event_loop()
            hostname = await loop.run_in_executor(None, socket.gethostbyaddr, ip)
            hostname = hostname[0] if hostname else ip

            # Cache for 1 hour
            redis_client.setex(f"hostname:{ip}", 3600, hostname)
            return hostname

        except Exception:
            return ip

    def determine_direction(self, src_ip: str, dst_ip: str) -> str:
        """Determine traffic direction based on IP addresses"""
        # Check if source is internal
        src_parts = src_ip.split('.')
        dst_parts = dst_ip.split('.')

        # RFC 1918 private address spaces
        is_src_private = (
            src_parts[0] == '10' or
            (src_parts[0] == '172' and 16 <= int(src_parts[1]) <= 31) or
            (src_parts[0] == '192' and src_parts[1] == '168')
        )

        is_dst_private = (
            dst_parts[0] == '10' or
            (dst_parts[0] == '172' and 16 <= int(dst_parts[1]) <= 31) or
            (dst_parts[0] == '192' and dst_parts[1] == '168')
        )

        if is_src_private and not is_dst_private:
            return "outbound"
        elif not is_src_private and is_dst_private:
            return "inbound"
        elif is_src_private and is_dst_private:
            return "internal"
        else:
            return "external"

    def protocol_name(self, protocol: int) -> str:
        """Convert protocol number to name"""
        protocols = {
            1: "ICMP",
            6: "TCP",
            17: "UDP",
            47: "GRE",
            50: "ESP",
            51: "AH",
            58: "ICMPv6"
        }
        return protocols.get(protocol, f"Protocol-{protocol}")

    async def update_realtime_stats(self, flow: Dict[str, Any], direction: str):
        """Update real-time statistics in Redis"""
        try:
            # Update total traffic counter
            redis_client.incrby(f"stats:total_bytes", flow['bytes'])
            redis_client.incrby(f"stats:total_packets", flow['packets'])

            # Update directional traffic
            redis_client.incrby(f"stats:{direction}_bytes", flow['bytes'])
            redis_client.incrby(f"stats:{direction}_packets", flow['packets'])

            # Update per-device stats
            redis_client.hincrby(f"device:{flow['src_addr']}", "bytes_sent", flow['bytes'])
            redis_client.hincrby(f"device:{flow['dst_addr']}", "bytes_received", flow['bytes'])

            # Publish to WebSocket channel for real-time updates
            stats = {
                'timestamp': datetime.utcnow().isoformat(),
                'bytes': flow['bytes'],
                'packets': flow['packets'],
                'direction': direction,
                'src_addr': flow['src_addr'],
                'dst_addr': flow['dst_addr']
            }
            redis_client.publish('realtime_traffic', str(stats))

        except Exception as e:
            logger.error(f"Error updating realtime stats: {e}")

    async def update_device_cache(self, flow: Dict[str, Any]):
        """Update device information in cache"""
        try:
            # Update device last seen timestamp
            timestamp = datetime.utcnow().isoformat()
            redis_client.hset(f"device:{flow['src_addr']}", "last_seen", timestamp)
            redis_client.hset(f"device:{flow['dst_addr']}", "last_seen", timestamp)

            # Add to device set
            redis_client.sadd("devices", flow['src_addr'], flow['dst_addr'])

        except Exception as e:
            logger.error(f"Error updating device cache: {e}")

    async def start_udp_server(self, port: int, handler):
        """Start UDP server for NetFlow/sFlow collection"""
        loop = asyncio.get_event_loop()

        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(('0.0.0.0', port))
        sock.setblocking(False)

        logger.info(f"UDP server listening on port {port}")

        while self.running:
            try:
                data, addr = await loop.sock_recvfrom(sock, 65535)
                asyncio.create_task(handler(data, addr))
            except Exception as e:
                logger.error(f"Error in UDP server: {e}")

    async def run(self):
        """Run the collector"""
        self.running = True
        logger.info("Starting Network Traffic Collector")

        # Start NetFlow collector
        netflow_task = asyncio.create_task(
            self.start_udp_server(NETFLOW_PORT, self.handle_netflow)
        )

        # Start sFlow collector (using same handler for now)
        sflow_task = asyncio.create_task(
            self.start_udp_server(SFLOW_PORT, self.handle_netflow)
        )

        try:
            await asyncio.gather(netflow_task, sflow_task)
        except KeyboardInterrupt:
            logger.info("Shutting down collector")
            self.running = False


if __name__ == "__main__":
    collector = NetFlowCollector()
    asyncio.run(collector.run())
