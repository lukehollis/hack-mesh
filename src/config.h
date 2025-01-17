#ifndef CONFIG_H
#define CONFIG_H

// Mesh Network Configuration
#define MESH_PREFIX     "SignalMesh"
#define MESH_PASSWORD   "somethingSneaky"
#define MESH_PORT       5555
#define MESH_CHANNEL    6

// GPS Configuration
#define GPS_RX_PIN     16  // Adjust based on your hardware
#define GPS_TX_PIN     17  // Adjust based on your hardware
#define GPS_BAUD       9600

// Update intervals
#define LOCATION_UPDATE_INTERVAL    10000  // 10 seconds
#define MESH_UPDATE_INTERVAL        1000   // 1 second

#define SIGNAL_UPDATE_INTERVAL 5000  // Send updates every 5 seconds

#endif