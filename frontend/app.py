from flask import Flask, render_template, jsonify
import json

app = Flask(__name__)

# Load coordinates from JSON file
def load_coordinates():
    with open('coordinates.json') as f:
        data = json.load(f)
    return data

@app.route('/')
def index():
    warning = ''
    coordinates = {}
    try:
        coordinates = load_coordinates()
    except Exception as e:
        warning = 'Could not load file'
    return render_template('index.html', coordinates=coordinates, warning=warning)

if __name__ == '__main__':
    app.run(debug=True)
