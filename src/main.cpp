#include <painlessMesh.h>
#include "config.h"
#include "signal_handler.h"

Scheduler userScheduler;
painlessMesh mesh;
SignalHandler signalHandler;

// Task to send signal updates
Task taskSendSignal(SIGNAL_UPDATE_INTERVAL, TASK_FOREVER, []() {
    String msg = signalHandler.getSignalJson();
    mesh.sendBroadcast(msg);
});

void receivedCallback(uint32_t from, String &msg) {
    Serial.printf("Received from %u: %s\n", from, msg.c_str());
    // Here we could process the received signal data if needed
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
    userScheduler.addTask(taskSendSignal);
    taskSendSignal.enable();
}

void loop() {
    mesh.update();
    userScheduler.execute();
    signalHandler.update();
}