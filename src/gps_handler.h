#ifndef GPS_HANDLER_H
#define GPS_HANDLER_H

#include <TinyGPS++.h>
#include <ArduinoJson.h>

class GPSHandler {
  private:
    TinyGPSPlus gps;
    HardwareSerial *gpsSerial;

  public:
    GPSHandler() {
      gpsSerial = new HardwareSerial(1);
      gpsSerial->begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
    }

    String getLocationJson() {
      DynamicJsonDocument doc(200);
      doc["lat"] = gps.location.lat();
      doc["lon"] = gps.location.lng();
      doc["alt"] = gps.altitude.meters();
      doc["sats"] = gps.satellites.value();
      
      String output;
      serializeJson(doc, output);
      return output;
    }

    void update() {
      while (gpsSerial->available()) {
        gps.encode(gpsSerial->read());
      }
    }
};

#endif