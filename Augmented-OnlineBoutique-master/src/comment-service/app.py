import logging
import sqlite3
import os
from datetime import datetime
from flask import Flask, request, jsonify, g
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor

app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("comment-service")

DATABASE = '/app/data/comments.db'


def get_db():
    if 'db' not in g:
        os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute('''CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            content TEXT NOT NULL,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
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


@app.route('/api/comments/<product_id>', methods=['GET'])
def get_comments(product_id):
    db = get_db()
    rows = db.execute(
        'SELECT id, product_id, user_name, content, rating, created_at FROM comments WHERE product_id = ? ORDER BY created_at DESC',
        (product_id,)
    ).fetchall()
    inject_trace_log('msg="Fetched comments" product_id=%s count=%d' % (product_id, len(rows)))
    return jsonify([{
        'id': r['id'],
        'product_id': r['product_id'],
        'user_name': r['user_name'],
        'content': r['content'],
        'rating': r['rating'],
        'created_at': r['created_at']
    } for r in rows])


@app.route('/api/comments', methods=['POST'])
def add_comment():
    data = request.get_json()
    product_id = data.get('product_id', '')
    user_name = data.get('user_name', 'Anonymous')
    content = data.get('content', '')
    rating = data.get('rating', 5)

    if not product_id or not content:
        inject_trace_log('msg="Comment rejected: missing fields"')
        return jsonify({'error': 'product_id and content are required'}), 400

    if rating < 1 or rating > 5:
        rating = 5

    created_at = datetime.utcnow().isoformat()

    db = get_db()
    db.execute(
        'INSERT INTO comments (product_id, user_name, content, rating, created_at) VALUES (?, ?, ?, ?, ?)',
        (product_id, user_name, content, rating, created_at)
    )
    db.commit()

    inject_trace_log('msg="Comment added" product_id=%s user=%s rating=%d' % (product_id, user_name, rating))
    return jsonify({
        'message': 'Comment added successfully',
        'product_id': product_id,
        'user_name': user_name,
        'rating': rating,
        'created_at': created_at
    }), 201


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
