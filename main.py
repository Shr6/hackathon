from flask import Flask, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import random

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///leakage_data.db'
db = SQLAlchemy(app)


class FloodData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String(50))
    flood_detected = db.Column(db.Boolean)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


def generate_dummy_data():
    if FloodData.query.count() == 0:
        now = datetime.now()
        timestamps = [now - timedelta(minutes=i*5) for i in range(100)]
        locations = ['Basement', 'Street', 'Garage', 'Backyard']

        for i in range(100):
            data = FloodData(
                location=random.choice(locations),
                flood_detected=random.choice([True, False, False, False]),
                timestamp=timestamps[i]
            )
            db.session.add(data)
        db.session.commit()
        print("✅ Dummy flood detection data inserted")


@app.route('/')
def index():
    data = FloodData.query.order_by(FloodData.timestamp.desc()).all()
    return render_template("index.html", data=data)

@app.route('/dashboard')
def dashboard():
    data = FloodData.query.order_by(FloodData.timestamp.desc()).all()
    return render_template("dashboard.html", data=data)

@app.route('/api/all')
def all_data():
    data = FloodData.query.order_by(FloodData.id.desc()).all()
    return jsonify([
        {
            'id': d.id,
            'location': d.location,
            'flood_detected': d.flood_detected,
            'timestamp': d.timestamp.isoformat()
        } for d in data
    ])


@app.route('/api/latest')
def latest_data():
    d = FloodData.query.order_by(FloodData.id.desc()).first()
    if not d:
        return jsonify({'error': 'No data available'})
    return jsonify({
        'id': d.id,
        'location': d.location,
        'flood_detected': d.flood_detected,  # Changed from 'leak_detected' to 'flood_detected'
        'timestamp': d.timestamp.isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True)
