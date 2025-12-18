FROM python:3.11-slim

# Install nfdump for NetFlow/sFlow processing
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nfdump \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY collector.py .

# Create data directory
RUN mkdir -p /data

# Run the collector
CMD ["python", "collector.py"]
