#include <painlessMesh.h>
#include "config.h"
#include "gps_handler.h"

Scheduler userScheduler;
painlessMesh mesh;
GPSHandler gps;

// Task to send location updates
Task taskSendLocation(LOCATION_UPDATE_INTERVAL, TASK_FOREVER, []() {
    String msg = gps.getLocationJson();
    mesh.sendBroadcast(msg);
});

void receivedCallback(uint32_t from, String &msg) {
    Serial.printf("Received from %u: %s\n", from, msg.c_str());
}

void newConnectionCallback(uint32_t nodeId) {
    Serial.printf("New Connection: %u\n", nodeId);
}

void changedConnectionCallback() {
    Serial.printf("Changed connections\n");
}

void setup() {
    Serial.begin(115200);
    
    // Initialize mesh network
    mesh.setDebugMsgTypes(ERROR | CONNECTION);
    mesh.init(MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT, WIFI_AP_STA, MESH_CHANNEL);
    
    // Set callbacks
    mesh.onReceive(&receivedCallback);
    mesh.onNewConnection(&newConnectionCallback);
    mesh.onChangedConnections(&changedConnectionCallback);
    
    // Add tasks
    userScheduler.addTask(taskSendLocation);
    taskSendLocation.enable();
}

void loop() {
    mesh.update();
    userScheduler.execute();
    gps.update();
}