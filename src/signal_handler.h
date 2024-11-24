#ifndef SIGNAL_HANDLER_H
#define SIGNAL_HANDLER_H

#include <Arduino.h>
#include <ArduinoJson.h>

class SignalHandler {
public:
    SignalHandler() {}

    void update() {
        // In a real implementation, this would update with actual sensor readings
        // For now, we'll use mock data
        updateMockData();
    }

    String getSignalJson() {
        StaticJsonDocument<200> doc;
        
        doc["nodeId"] = ESP.getChipId();
        doc["timestamp"] = millis();
        doc["gps"] = {
            "lat": mockLat,
            "lon": mockLon
        };
        doc["signal"] = {
            "strength": mockSignalStrength,
            "frequency": mockFrequency,
            "power": mockPower
        };
        doc["battery"] = mockBatteryLevel;

        String output;
        serializeJson(doc, output);
        return output;
    }

private:
    // Mock data variables
    float mockLat = 37.7749;
    float mockLon = -122.4194;
    int mockSignalStrength = -70;  // dBm
    float mockFrequency = 915.0;   // MHz
    float mockPower = 100.0;       // mW
    int mockBatteryLevel = 85;     // percentage

    void updateMockData() {
        // Add some random variation to mock data
        mockSignalStrength += random(-2, 3);
        mockFrequency += random(-1, 2) * 0.1;
        mockPower += random(-5, 6);
        mockBatteryLevel += random(-1, 2);
        
        // Keep values within realistic ranges
        mockSignalStrength = constrain(mockSignalStrength, -90, -30);
        mockFrequency = constrain(mockFrequency, 914.0, 916.0);
        mockPower = constrain(mockPower, 80.0, 120.0);
        mockBatteryLevel = constrain(mockBatteryLevel, 0, 100);
    }
};

#endif