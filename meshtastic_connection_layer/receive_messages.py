import meshtastic.ble_interface
import time
from pubsub import pub
import json
import os
from datetime import datetime

def onReceive(packet):
    """Callback function that runs when a message is received"""
    try:
        print(f"Received packet: {packet}")  # Debug print to see full packet structure
        
        # Check for message in different possible packet structures
        if 'decoded' in packet:
            if 'text' in packet['decoded']:
                message = packet['decoded']['text']
                sender = packet.get('fromId', packet.get('from', 'Unknown'))
                try:
                    # Try to parse the message as JSON
                    json_data = json.loads(message)
                    
                    # Create directory if it doesn't exist
                    os.makedirs('received_data', exist_ok=True)
                    
                    # Create filename with timestamp and device ID
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    filename = f"received_data/device_{sender}_{timestamp}.json"
                    
                    # Write the JSON data to timestamped file
                    with open(filename, 'w') as f:
                        json.dump(json_data, f, indent=4)
                    
                    # Update latest.json file
                    latest_file = f"received_data/latest.json"
                    with open(latest_file, 'w') as f:
                        json.dump(json_data, f, indent=4)
                    
                    print(f"Saved message from {sender} to {filename} and updated {latest_file}")
                except json.JSONDecodeError:
                    # Not JSON data, just print the message
                    print(f"Message from {sender}: {message}")
                    
            elif 'portnum' in packet['decoded'] and packet['decoded']['portnum'] == 'TEXT_MESSAGE_APP':
                message = packet['decoded'].get('text', '')
                sender = packet.get('fromId', packet.get('from', 'Unknown'))
                try:
                    # Try to parse the message as JSON
                    json_data = json.loads(message)
                    
                    # Create directory if it doesn't exist
                    os.makedirs('received_data', exist_ok=True)
                    
                    # Create filename with timestamp and device ID
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    filename = f"received_data/device_{sender}_{timestamp}.json"
                    
                    # Write the JSON data to timestamped file
                    with open(filename, 'w') as f:
                        json.dump(json_data, f, indent=4)
                    
                    # Update latest.json file
                    latest_file = f"received_data/latest.json"
                    with open(latest_file, 'w') as f:
                        json.dump(json_data, f, indent=4)
                    
                    print(f"Saved message from {sender} to {filename} and updated {latest_file}")
                except json.JSONDecodeError:
                    # Not JSON data, just print the message
                    print(f"Message from {sender}: {message}")
                    
        elif 'payload' in packet:
            message = packet.get('payload', '')
            sender = packet.get('from', 'Unknown')
            print(f"Message from {sender}: {message}")
            
    except Exception as e:
        print(f"Error processing message: {e}")
        print(f"Packet structure: {packet}")  # Print packet structure on error

def onConnection(interface, topic=pub.AUTO_TOPIC):
    """Called when we (re)connect to the radio"""
    print("Connected to radio!")

def connect_to_tracker(address, max_retries=3, retry_delay=2):
    for attempt in range(max_retries):
        try:
            print(f"Attempt {attempt + 1}/{max_retries} to connect to device at {address}...")
            iface = meshtastic.ble_interface.BLEInterface(address=address)
            print("Successfully connected!")
            return iface
        except Exception as e:
            print(f"Connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print(f"Waiting {retry_delay} seconds before retrying...")
                time.sleep(retry_delay)
    return None

def main():
    # Use the same device address as your sender
    address = "41CB0D12-D80D-600A-F5E7-A1A2A9A08828"
    
    print("Please ensure the Meshtastic device is powered on and paired with your computer")
    print("You may need to forget and re-pair the device in your system's Bluetooth settings")

    pub.subscribe(onReceive, "meshtastic.receive")
    pub.subscribe(onConnection, "meshtastic.connection.established")
         
    iface = connect_to_tracker(address)
    if iface:
        try:
            # Subscribe to messages
            print("Listening for messages... (Press Ctrl+C to stop)")
            
            # Keep the script running
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nStopping message receiver...")
        except Exception as e:
            print(f"Error during operation: {e}")
        finally:
            iface.close()
    else:
        print("Failed to establish connection after all retries. Please check:")
        print("1. Device is powered on")
        print("2. Bluetooth is enabled on your computer")
        print("3. Device is properly paired in system Bluetooth settings")

if __name__ == "__main__":
    main()