from flask import Flask, render_template, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import random



WATER_FREQUENCY = 0

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///leakage_data.db'
db = SQLAlchemy(app)

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.png', mimetype='image/vnd.microsoft.icon')

class FloodData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    location = db.Column(db.String(100))
    flood_detected = db.Column(db.Boolean)
    sensor_value = db.Column(db.Integer)  # <-- Add this line




def generate_dummy_data():
    if FloodData.query.count() == 0:
        now = datetime.now()
        timestamps = [now - timedelta(minutes=i*5) for i in range(100)]
        locations = ['Basement', 'Street', 'Garage', 'Backyard']
        WATER_THRESHOLD = 350

        for i in range(100):
            flood_detected = random.choice([True, False, False, False])
            sensor_value = random.randint(WATER_THRESHOLD + 1, 700) if flood_detected else random.randint(100, WATER_THRESHOLD - 1)

            data = FloodData(
                location=random.choice(locations),
                flood_detected=flood_detected,
                sensor_value=sensor_value,
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
def get_latest_data():
    latest_data = FloodData.query.order_by(FloodData.timestamp.asc()).first()

    if latest_data:
        return jsonify({
            'id': latest_data.id,
            'timestamp': latest_data.timestamp.isoformat(),
            'location': latest_data.location,
            'flood_detected': latest_data.flood_detected,
            'sensor_value': latest_data.sensor_value
        })
    else:
        return jsonify({'error': 'No data found'}), 404


@app.route('/api/live')
def live_data():
    if WATER_FREQUENCY == 0:
        random_data = random.randint(100, 500)  # Generate random frequency
        data = {
            'frequency': random_data,  # Random water frequency
            'location': random.choice(['Basement', 'Street', 'Garage', 'Backyard']),
            'flood_detected': True if random_data > 350 else False,  # Randomly choose flood detected
        }
    else:
        data = {
            'frequency': WATER_FREQUENCY,
            'location': 'City',
            'flood_detected': WATER_FREQUENCY > 350,  # Flood is detected if the frequency is greater than 350
        }
    
    return jsonify(data)


@app.route('/live')
def live():
    return render_template("live.html")

# Function to start the Arduino data reading process in a separate thread
def start_arduino_thread():
    pass



if __name__ == '__main__':
    app.run(debug=True)
