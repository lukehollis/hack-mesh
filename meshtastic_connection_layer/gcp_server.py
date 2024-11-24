import requests
from bs4 import BeautifulSoup
import json
import threading
import time
from flask import Flask, jsonify

# Flask app
app = Flask(__name__)

# Configuration
base_url = "http://3.87.173.43"
login_url = f"{base_url}/admin/login/"
data_url = f"{base_url}/admin/api/useralerts/8/change/"
username = ""  # Replace with your admin username
password = ""  # Replace with your admin password
alerts_data = {}  # Store the fetched alerts
last_alerts_data = {}  # Store the last fetched alerts to detect changes

# Function to log in and fetch data
def fetch_alerts():
    global alerts_data, last_alerts_data
    while True:
        try:
            # Create a session to persist cookies
            session = requests.Session()

            # Step 1: Get the login page to fetch the CSRF token
            login_page = session.get(login_url)
            login_page.raise_for_status()

            # Parse the login page to extract the CSRF token
            soup = BeautifulSoup(login_page.text, "html.parser")
            csrf_token = soup.find("input", {"name": "csrfmiddlewaretoken"})["value"]

            # Step 2: Perform login
            login_payload = {
                "username": username,
                "password": password,
                "csrfmiddlewaretoken": csrf_token,
                "next": "/admin/api/useralerts/8/change/"
            }
            headers = {"Referer": login_url}  # Referer header for CSRF validation
            login_response = session.post(login_url, data=login_payload, headers=headers)
            login_response.raise_for_status()

            if "Log out" not in login_response.text:
                print("Login failed. Check your credentials.")
                time.sleep(10)  # Wait and retry
                continue

            # Step 3: Access the desired endpoint
            response = session.get(data_url)
            response.raise_for_status()

            # Parse the HTML response to extract the JSON data
            soup = BeautifulSoup(response.text, "html.parser")
            pre_tag = soup.find("pre")

            if pre_tag:
                new_alerts_data = json.loads(pre_tag.text)
                
                # Check if new data is available
                if new_alerts_data != alerts_data:
                    alerts_data = new_alerts_data
                    print("Fetched and updated alerts data.")
                else:
                    print("No new alerts.")
            else:
                print("No <pre> tag with alerts found in the response.")
        except Exception as e:
            print(f"Error occurred: {e}")
        finally:
            time.sleep(10)  # Check every 10 seconds

# Start the background thread to fetch alerts
threading.Thread(target=fetch_alerts, daemon=True).start()

# Flask route to expose the alerts data
@app.route('/alerts', methods=['GET'])
def get_alerts():
    return jsonify(alerts_data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
