from flask import Flask, render_template, jsonify
import json
import requests 

app = Flask(__name__)

# Load coordinates from JSON file
def load_coordinates():
    # with open('coordinates.json') as f:
    #     data = json.load(f)

    url = 'http://104.197.210.87:5000/alerts'
    response = requests.get(url)

    # Check if the request was successful
    if response.status_code == 200:
        # Parse JSON content
        data = response.json()
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

        markers = []
        for key, value in data.items():
            devicetype, frequency, power, timestamp, coords = value
            coords = json.loads(coords)
            color, radius = get_circle_properties(power)
            markers.append({
                'name': key,
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


    return render_template('index.html', coordinates=coordinates, warning=warning,
        markers=markers)

if __name__ == '__main__':
    app.run(debug=True)
