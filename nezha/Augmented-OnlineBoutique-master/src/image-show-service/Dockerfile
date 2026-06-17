FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
COPY app.py .
COPY ./images ./images

RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /app/images

EXPOSE 8080

CMD ["python", "app.py"]
