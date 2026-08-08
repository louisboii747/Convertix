FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY worker.py .

RUN useradd --create-home convertix
USER convertix

CMD ["python", "worker.py"]