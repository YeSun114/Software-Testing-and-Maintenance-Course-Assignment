import logging
import sqlite3
import os
import json
from datetime import datetime
from flask import Flask, request, jsonify, g
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor

app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("order-history-service")

DATABASE = '/app/data/orders.db'


def get_db():
    if 'db' not in g:
        os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute('''CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            order_id TEXT NOT NULL,
            items_json TEXT NOT NULL,
            shipping_cost TEXT NOT NULL,
            total_paid TEXT NOT NULL,
            discount_saved TEXT NOT NULL,
            currency TEXT NOT NULL,
            created_at TEXT NOT NULL
        )''')
        g.db.commit()
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def inject_trace_log(msg):
    current_span = trace.get_current_span()
    span_context = current_span.get_span_context()
    trace_id = '{:032x}'.format(span_context.trace_id)
    span_id = '{:016x}'.format(span_context.span_id)
    logger.info('Trace_id=%s Span_id=%s %s', trace_id, span_id, msg)


@app.route('/api/orders', methods=['POST'])
def save_order():
    data = request.get_json()
    session_id = data.get('session_id', '')
    order_id = data.get('order_id', '')
    items_data = data.get('items_json', [])
    # items_json 在请求中是数组，需要转为 JSON 字符串存储
    if isinstance(items_data, list):
        items_json = json.dumps(items_data)
    elif isinstance(items_data, str):
        items_json = items_data
    else:
        items_json = '[]'
    shipping_cost = data.get('shipping_cost', '')
    total_paid = data.get('total_paid', '')
    discount_saved = data.get('discount_saved', '')
    currency = data.get('currency', 'USD')

    if not session_id or not order_id:
        inject_trace_log('msg="Order rejected: missing fields"')
        return jsonify({'error': 'session_id and order_id are required'}), 400

    created_at = datetime.utcnow().isoformat()

    db = get_db()
    db.execute(
        'INSERT INTO orders (session_id, order_id, items_json, shipping_cost, total_paid, discount_saved, currency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        (session_id, order_id, items_json, shipping_cost, total_paid, discount_saved, currency, created_at)
    )
    db.commit()

    inject_trace_log('msg="Order saved" order_id=%s session_id=%s' % (order_id, session_id))
    return jsonify({'message': 'Order saved successfully', 'order_id': order_id}), 201


@app.route('/api/orders', methods=['GET'])
def get_orders():
    session_id = request.args.get('session_id', '')
    if not session_id:
        inject_trace_log('msg="Get orders rejected: missing session_id"')
        return jsonify({'error': 'session_id is required'}), 400

    db = get_db()
    rows = db.execute(
        'SELECT id, session_id, order_id, items_json, shipping_cost, total_paid, discount_saved, currency, created_at FROM orders WHERE session_id = ? ORDER BY created_at DESC',
        (session_id,)
    ).fetchall()

    inject_trace_log('msg="Fetched orders" session_id=%s count=%d' % (session_id, len(rows)))
    return jsonify([{
        'id': r['id'],
        'session_id': r['session_id'],
        'order_id': r['order_id'],
        'items_json': r['items_json'],
        'shipping_cost': r['shipping_cost'],
        'total_paid': r['total_paid'],
        'discount_saved': r['discount_saved'],
        'currency': r['currency'],
        'created_at': r['created_at']
    } for r in rows])


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
