from flask import Flask, render_template, jsonify
import json
import requests 
from flask import request

import numpy as np
import math
from datetime import datetime, timedelta
import os 
app = Flask(__name__)

# Load coordinates from JSON file
def load_coordinates(mode=3):
    if mode == 1:
        with open('coordinates.json') as f:
            data = json.load(f)
    elif mode == 2:
        url = 'http://104.197.210.87:5000/alerts'
        response = requests.get(url)

        # Check if the request was successful
        if response.status_code == 200:
            # Parse JSON content
            data = response.json()
    elif mode == 3:
        files  = os.listdir('./received_data')
        data = []
        for file in files:
            with open('./received_data/'+file) as f:
                d = json.load(f)
                data.append(d)
    return data

def get_circle_properties(power):
    if 0 >= power > -5:
        color = 'darkred'
        radius = 100
    if -5 >= power > -10:
        color = 'red'
        radius = 250
    elif -10 >= power > -20:
        color = 'orange'
        radius = 500
    elif -20 >= power > -40:
        color = 'yellow'
        radius = 1000
    elif -40 >= power > -100:
        color = 'lightyellow'
        radius = 2000


    return color, radius

@app.route('/')
def index():
    warning = ''
    coordinates = {}
    data = {}
    markers = []
    try:
        data = coordinates = load_coordinates()

        print(data, flush=True)

        markers = []
        for d in data:
            print(d)
            devicetype = d['device']
            frequency = d['frequency']
            timestamp = d['date']
            power = d['power']
            coords = d["GPS coords"].strip('[]').split(',')
            color, radius = get_circle_properties(power)
            markers.append({
                'name': 'device-id',
                'type': devicetype,
                'lat': coords[0],
                'lon': coords[1],
                'color': color,
                'radius': radius,
                'power': power,
                'frequency': frequency,
                'timestamp': timestamp
            })
    except Exception as e:
        warning = 'Could not load file'
        raise e

    if request.args.get('3d'):
        return render_template('marshall.html', coordinates=coordinates, warning=warning,
        markers=markers)
    return render_template('index.html', coordinates=coordinates, warning=warning,
        markers=markers)


# Alcatraz Island coordinates
ALCATRAZ_LAT = 37.8270
ALCATRAZ_LON = -122.4230
ALCATRAZ_ALT = 0  # sea level

def generate_figure_eight(num_points=200, radius=0.001, altitude_range=(50, 150)):
    """
    Generate a 3D figure-8 pattern around Alcatraz Island.
    radius is in degrees (roughly 111km per degree at the equator)
    altitude_range in meters
    """
    t = np.linspace(0, 2 * np.pi, num_points)
    
    # Generate figure-8 pattern
    x = radius * np.sin(t)
    y = radius * np.sin(t) * np.cos(t)
    
    # Add altitude variation
    min_alt, max_alt = altitude_range
    z = ((np.sin(2 * t) + 1) / 2) * (max_alt - min_alt) + min_alt
    
    # Convert to GPS coordinates centered on Alcatraz
    lats = ALCATRAZ_LAT + y
    lons = ALCATRAZ_LON + x
    alts = z
    
    return lats, lons, alts

def calculate_speed_and_heading(lat1, lon1, lat2, lon2):
    """Calculate speed (m/s) and heading (degrees) between two points"""
    
    # Convert to radians
    lat1, lon1 = np.radians(lat1), np.radians(lon1)
    lat2, lon2 = np.radians(lat2), np.radians(lon2)
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    distance = 6371000 * c  # Earth's radius in meters
    
    # Calculate heading
    y = np.sin(dlon) * np.cos(lat2)
    x = np.cos(lat1) * np.sin(lat2) - np.sin(lat1) * np.cos(lat2) * np.cos(dlon)
    heading = np.degrees(np.arctan2(y, x)) % 360
    
    # Assume constant speed of 15 m/s
    speed = 15
    
    return speed, heading

@app.route('/flight-data')
def get_flight_data():
    # Generate the figure-8 pattern
    lats, lons, alts = generate_figure_eight()
    
    # Initialize the flight data list
    flight_data = []
    
    # Generate timestamps (one point per second)
    start_time = datetime.now()
    
    for i in range(len(lats)):
        # Calculate speed and heading
        next_i = (i + 1) % len(lats)
        speed, heading = calculate_speed_and_heading(
            lats[i], lons[i],
            lats[next_i], lons[next_i]
        )
        
        # Create data point
        point = {
            "timestamp": (start_time + timedelta(seconds=i)).isoformat(),
            "latitude": float(lats[i]),
            "longitude": float(lons[i]),
            "altitude": float(alts[i]),
            "speed": float(speed),
            "heading": float(heading)
        }
        flight_data.append(point)
    
    return jsonify({
        "flight_path": flight_data,
        "metadata": {
            "center_point": {
                "latitude": ALCATRAZ_LAT,
                "longitude": ALCATRAZ_LON
            },
            "total_points": len(flight_data),
            "duration_seconds": len(flight_data)
        }
    })

@app.route('/map-3d')
def map3d():
    return render_template('marshall.html')
if __name__ == '__main__':
    app.run(debug=True)
