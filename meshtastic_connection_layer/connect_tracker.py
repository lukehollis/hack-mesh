import meshtastic.ble_interface
import time
import json

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
    # Your device's Bluetooth address
    address = "23488746-A88A-6DC3-CA05-40B01837B853"
    
    # Before connecting, remind user to check device pairing
    print("Please ensure the Meshtastic device is powered on and paired with your computer")
    print("You may need to forget and re-pair the device in your system's Bluetooth settings")
    
    iface = connect_to_tracker(address)
    if iface:
        try:
            # Test the connection
            data = {
                "device": "FM radio",
                "frequency center": 94.855,
                "bandwidth": 0.295,
                "power": -59.35,
                "date": "11-23-2024 13:51:47.215639",
                "probability": 1.0,
                "GPS coords": "[0.0, 0.0]"
            }
            
            # Keep the connection alive and send message every 10 seconds
            while True:
                message = json.dumps(data)
                # iface.sendText("bottle of life")
                iface.sendText(message)
                print("Test message sent successfully")
                time.sleep(15)
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