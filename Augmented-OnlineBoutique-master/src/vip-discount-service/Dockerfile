FROM python:3.9-slim

WORKDIR /app

# 复制当前目录下的依赖文件和代码
COPY requirements.txt .
COPY app.py .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 暴露 8080 端口
EXPOSE 8080

# 启动服务
CMD ["python", "app.py"]