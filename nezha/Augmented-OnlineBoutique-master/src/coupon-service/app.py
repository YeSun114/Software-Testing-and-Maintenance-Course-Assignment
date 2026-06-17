import logging
from flask import Flask, request, jsonify
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor

app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("coupon-service")

# 预设优惠券
COUPONS = {
    "WELCOME10": {"type": "percentage", "value": 10, "desc": "10% off"},
    "SAVE50":   {"type": "fixed",      "value": 50, "desc": "$50 off"},
    "VIP20":    {"type": "percentage", "value": 20, "desc": "20% off"},
}


def inject_trace_log(msg):
    current_span = trace.get_current_span()
    span_context = current_span.get_span_context()
    trace_id = '{:032x}'.format(span_context.trace_id)
    span_id = '{:016x}'.format(span_context.span_id)
    logger.info('Trace_id=%s Span_id=%s %s', trace_id, span_id, msg)


@app.route('/api/validate', methods=['POST'])
def validate_coupon():
    data = request.get_json()
    code = data.get('code', '').upper().strip()
    price = data.get('price', 0)

    if not code:
        inject_trace_log('msg="Coupon validation: empty code"')
        return jsonify({'valid': False, 'error': 'Please enter a coupon code'})

    coupon = COUPONS.get(code)
    if not coupon:
        inject_trace_log('msg="Coupon validation: invalid code" code=%s' % code)
        return jsonify({'valid': False, 'error': 'Invalid coupon code'})

    # 计算折扣金额
    if coupon['type'] == 'percentage':
        discount = round(price * coupon['value'] / 100.0, 2)
    else:
        discount = min(float(coupon['value']), price)

    inject_trace_log('msg="Coupon validated" code=%s discount=%.2f final=%.2f' %
                     (code, discount, price - discount))

    return jsonify({
        'valid': True,
        'code': code,
        'type': coupon['type'],
        'discount': discount,
        'final_price': round(price - discount, 2),
        'desc': coupon['desc']
    })


@app.route('/api/coupons', methods=['GET'])
def list_coupons():
    inject_trace_log('msg="Listing coupons"')
    return jsonify([
        {'code': k, 'type': v['type'], 'value': v['value'], 'desc': v['desc']}
        for k, v in COUPONS.items()
    ])


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
