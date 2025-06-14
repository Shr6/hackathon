from flask import Flask, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import random
import serial
import time
from threading import Thread




WATER_FREQUENCY = 0

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



# def read_from_arduino():
#     arduino = serial.Serial('COM4', 9600) 
#     while True:
#         if arduino.in_waiting > 0:
#             try:
#                 # Read and decode data from the Arduino serial output
#                 raw_data = arduino.readline().decode('utf-8', errors='ignore').strip()
#                 if raw_data.isdigit():
#                     WATER_FREQUENCY = int(raw_data)
#                 else:
#                     print("Invalid data from Arduino.")
#             except Exception as e:
#                 print(f"Error occurred while reading from Arduino: {e}")
#         time.sleep(1)


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
    # arduino_thread = Thread(target=read_from_arduino)
    # arduino_thread.daemon = True  # Daemon thread will automatically close when the main program exits
    # arduino_thread.start()
    pass



if __name__ == '__main__':
    # start_arduino_thread()
    app.run(debug=True)
