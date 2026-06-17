import logging
from flask import Flask, request, jsonify
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor

# 1. 初始化 Flask 应用
app = Flask(__name__)

# 2. 开启 Flask 的自动化链路追踪 (极其关键)
FlaskInstrumentor().instrument_app(app)

# 3. 配置基本日志格式
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vip-discount-service")

@app.route('/calculate_discount', methods=['GET'])
def calculate_discount():
    # 获取商品原价参数，默认 100
    price = request.args.get('price', default=100, type=float)
    discounted_price = price * 0.9  # 打 9 折

    # ==========================================
    # 核心硬核部分：按照 Nezha 论文要求提取 Trace 注入日志
    # ==========================================
    current_span = trace.get_current_span()
    span_context = current_span.get_span_context()
    
    # 将十进制的 ID 格式化为 32位 和 16位的十六进制字符串 (严格契合论文格式)
    trace_id = '{:032x}'.format(span_context.trace_id)
    span_id = '{:016x}'.format(span_context.span_id)
    
    # 打印带有 Trace ID 和 Span ID 的日志，Nezha 算法全靠这行代码抓取图谱！
    logger.info('Trace_id=%s Span_id=%s msg="Calculated discount: original=%s, new=%s"', 
                trace_id, span_id, price, discounted_price)
    # ==========================================

    return jsonify({
        "original_price": price,
        "discounted_price": discounted_price,
        "message": "90% VIP discount applied successfully"
    })

if __name__ == '__main__':
    # 监听 8080 端口，供集群内其他服务调用
    app.run(host='0.0.0.0', port=8080)