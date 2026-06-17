import logging
import os
from flask import Flask, jsonify, send_from_directory
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor

app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("image-show-service")

IMAGES_DIR = '/app/images'


def inject_trace_log(msg):
    current_span = trace.get_current_span()
    span_context = current_span.get_span_context()
    trace_id = '{:032x}'.format(span_context.trace_id)
    span_id = '{:016x}'.format(span_context.span_id)
    logger.info('Trace_id=%s Span_id=%s %s', trace_id, span_id, msg)


@app.route('/api/current-image', methods=['GET'])
def current_image():
    os.makedirs(IMAGES_DIR, exist_ok=True)
    files = [f for f in os.listdir(IMAGES_DIR)
             if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))]
    if files:
        filename = files[0]
        inject_trace_log('msg="Serving image" filename=%s' % filename)
        return jsonify({'filename': filename, 'url': '/images/' + filename})
    else:
        inject_trace_log('msg="No images available"')
        return jsonify({'filename': '', 'url': ''}), 404


@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(IMAGES_DIR, filename)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
