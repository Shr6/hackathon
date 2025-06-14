// Define pin numbers
const int waterSensorPin = A0;  // Pin connected to water sensor signal
const int ledPin = 13;          // Pin connected to LED
const int waterThreshold = 350; // Threshold to detect water (can adjust)

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Set LED pin as an output
  pinMode(ledPin, OUTPUT);
  
  // Set water sensor pin as input
  pinMode(waterSensorPin, INPUT);
}

void loop() {
  // Read the water sensor value
  int sensorValue = analogRead(waterSensorPin);
  
  // Print the sensor value to the Serial Monitor
  Serial.print("Water Sensor Value: ");
  Serial.println(sensorValue);
  
  // If the sensor detects water (sensor value is higher than threshold)
  if (sensorValue > waterThreshold) {
    // Blink the LED when water is detected
    digitalWrite(ledPin, HIGH); // Turn LED on
    delay(500);                  // Wait for 500 ms
    digitalWrite(ledPin, LOW);  // Turn LED off
    delay(500);                  // Wait for 500 ms
  } else {
    // If no water detected, keep the LED ON
    digitalWrite(ledPin, HIGH); // LED stays on when no water detected
  }
}
