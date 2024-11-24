import meshtastic.ble_interface
import time
import requests
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

def fetch_alerts(endpoint):
    try:
        response = requests.get(endpoint)
        response.raise_for_status()  # Raise an error for bad HTTP status
        return response.json()
    except Exception as e:
        print(f"Failed to fetch alerts: {e}")
        return {}

def send_message(iface, data):
    try:
        message = json.dumps(data)
        iface.sendText(message)
        print(f"Sent message: {message}")
    except Exception as e:
        print(f"Failed to send message: {e}")

def main():
    # Your device's Bluetooth address
    address = "0F6EDECA-DE9B-D560-46B2-7383161B1F1D"
    endpoint = "http://104.197.210.87:5000/alerts"
    
    # Before connecting, remind user to check device pairing
    print("Please ensure the Meshtastic device is powered on and paired with your computer")
    print("You may need to forget and re-pair the device in your system's Bluetooth settings")
    
    iface = connect_to_tracker(address)
    if iface:
        try:
            sent_ids = set()  # Track sent alert IDs to avoid resending
            while True:
                alerts = fetch_alerts(endpoint)
                if alerts:
                    for alert_id, alert_data in alerts.items():
                        if alert_id not in sent_ids:
                            # Prepare the alert data for sending
                            data = {
                                "device": alert_data[0],
                                "frequency": alert_data[1],
                                "power": alert_data[2],
                                "date": alert_data[3],
                                "GPS coords": alert_data[4]
                            }
                            send_message(iface, data)
                            sent_ids.add(alert_id)
                            time.sleep(15)  # Wait 30 seconds between messages
                else:
                    print("No new alerts found.")
                time.sleep(10)  # Poll for new alerts every 10 seconds
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
