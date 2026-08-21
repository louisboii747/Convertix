FROM python:3.13-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libreoffice-writer \
        libreoffice-calc \
        ffmpeg \
        ghostscript \
        librsvg2-bin \
        fonts-dejavu-core \
        fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
    
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY worker.py .
COPY svg_worker.py .
COPY merge_worker.py .

RUN useradd --create-home convertix \
    && chown -R convertix:convertix /app

USER convertix

CMD ["python", "merge_worker.py"]
