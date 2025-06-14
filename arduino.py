import serial
import time
import re
from datetime import datetime
from main import app, db, FloodData

# Set up serial connection
arduino = serial.Serial('COM4', 9600)
time.sleep(2)

WATER_THRESHOLD = 350
last_insert_time = time.time()

print("🚰 Starting flood detection logging...")

with app.app_context():  # <-- required for using db.session
    while True:
        if arduino.in_waiting > 0:
            try:
                raw_data = arduino.readline()
                sensor_value_str = raw_data.decode('utf-8', errors='ignore').strip()

                match = re.search(r'\d+', sensor_value_str)
                if match:
                    sensor_value = int(match.group())
                    print(f"📟 Water Sensor Value: {sensor_value}")
                    flood_detected = sensor_value > WATER_THRESHOLD

                    if flood_detected:
                        print("🚨 Water detected! Logging...")
                    else:
                        print("✅ No water detected.")

                    data = FloodData(
                        location="City",
                        flood_detected=flood_detected,
                        sensor_value=sensor_value,
                        timestamp=datetime.utcnow()
                    )
                    db.session.add(data)
                    db.session.commit()
                    last_insert_time = time.time()
                    print("📦 Logged to DB:", data)

                else:
                    print("⚠️ Invalid data received (no numeric value found):", sensor_value_str)

            except Exception as e:
                print("❌ Error reading from serial:", e)

        time.sleep(1)
