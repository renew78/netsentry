"""
Database models for NetSentry
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Camera(BaseModel):
    """Camera configuration model"""
    id: Optional[str] = Field(None, alias="_id")
    name: str = Field(..., min_length=1, max_length=100)
    host: str = Field(..., description="IP address or hostname of the camera")
    port: int = Field(default=554, ge=1, le=65535)
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    rtsp_path: str = Field(default="/h264Preview_01_main", description="RTSP path for main stream")
    sub_stream_path: str = Field(default="/h264Preview_01_sub", description="RTSP path for sub stream")
    enabled: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "Eingang Kamera",
                "host": "192.168.1.100",
                "port": 554,
                "username": "admin",
                "password": "password123",
                "rtsp_path": "/h264Preview_01_main",
                "sub_stream_path": "/h264Preview_01_sub",
                "enabled": True
            }
        }


class CameraCreate(BaseModel):
    """Model for creating a new camera"""
    name: str = Field(..., min_length=1, max_length=100)
    host: str
    port: int = Field(default=554, ge=1, le=65535)
    username: str
    password: str
    rtsp_path: str = Field(default="/h264Preview_01_main")
    sub_stream_path: str = Field(default="/h264Preview_01_sub")
    enabled: bool = Field(default=True)


class CameraUpdate(BaseModel):
    """Model for updating an existing camera"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    host: Optional[str] = None
    port: Optional[int] = Field(None, ge=1, le=65535)
    username: Optional[str] = None
    password: Optional[str] = None
    rtsp_path: Optional[str] = None
    sub_stream_path: Optional[str] = None
    enabled: Optional[bool] = None
