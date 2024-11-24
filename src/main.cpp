#include <painlessMesh.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"
#include "signal_handler.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1  // Reset pin (-1 if sharing Arduino reset pin)

Scheduler userScheduler;
painlessMesh mesh;
SignalHandler signalHandler;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Task to update display
Task taskUpdateDisplay(1000, TASK_FOREVER, []() {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0,0);
    
    // Show node info
    display.print("Node: ");
    display.println(mesh.getNodeId());
    
    // Show network info
    display.print("Nodes: ");
    display.println(mesh.getNodeList().size() + 1);
    
    // Show latest signal data
    display.print("Sig: ");
    display.print(signalHandler.getLastSignalStrength());
    display.println(" dBm");
    
    display.print("Freq: ");
    display.print(signalHandler.getLastFrequency());
    display.println(" MHz");
    
    display.display();
});

// Task to send signal updates
Task taskSendSignal(SIGNAL_UPDATE_INTERVAL, TASK_FOREVER, []() {
    String msg = signalHandler.getSignalJson();
    mesh.sendBroadcast(msg);
});

void receivedCallback(uint32_t from, String &msg) {
    Serial.printf("Received from %u: %s\n", from, msg.c_str());
    // Parse and display received signal data
    signalHandler.parseSignalJson(msg);
}

void newConnectionCallback(uint32_t nodeId) {
    Serial.printf("New Connection: %u\n", nodeId);
}

void changedConnectionCallback() {
    Serial.printf("Changed connections\n");
}

void setup() {
    Serial.begin(115200);
    
    // Initialize OLED display
    if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println(F("SSD1306 allocation failed"));
        for(;;); // Don't proceed, loop forever
    }
    display.clearDisplay();
    
    // Initialize mesh network
    mesh.setDebugMsgTypes(ERROR | CONNECTION);
    mesh.init(MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT, WIFI_AP_STA, MESH_CHANNEL);
    
    // Set callbacks
    mesh.onReceive(&receivedCallback);
    mesh.onNewConnection(&newConnectionCallback);
    mesh.onChangedConnections(&changedConnectionCallback);
    
    // Add tasks
    userScheduler.addTask(taskSendSignal);
    userScheduler.addTask(taskUpdateDisplay);
    taskSendSignal.enable();
    taskUpdateDisplay.enable();
}

void loop() {
    mesh.update();
    userScheduler.execute();
    signalHandler.update();
}