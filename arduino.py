import serial
import time

arduino = serial.Serial('COM4', 9600) 
time.sleep(2)

WATER_THRESHOLD = 350
WATER_FREQUENCY = 0

print("Starting water detection...")

while True:
    if arduino.in_waiting > 0: 
        try:
            # Read raw byte data from the serial port
            raw_data = arduino.readline()
            
            # Attempt to decode the byte data safely
            sensor_value = raw_data.decode('utf-8', errors='ignore').strip()

            # Check if the decoded value is a valid integer
            if sensor_value.isdigit():
                sensor_value = int(sensor_value)
                print(f"Water Sensor Value: {sensor_value}")
                WATER_FREQUENCY = sensor_value
                if sensor_value > WATER_THRESHOLD:
                    print("Water detected! LED blinking...")
                else:
                    print("No water detected.")
            else:
                print(f"Invalid sensor value received: {sensor_value}")
        
        except Exception as e:
            print(f"Error occurred: {e}")
    
    time.sleep(1)


