from flask import Flask, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Print to ensure we're running this file
print("Running app.py from backend folder...")

# Define the correct path (make sure the JSON file is in the same folder as app.py)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
print(BASE_DIR)
JSON_FILE_PATH = os.path.join(BASE_DIR, "processed_dataset.json")
print(JSON_FILE_PATH)
# Test route to verify the Flask server is running
@app.route("/")
def home():
    return "Hello from Flask backend!"

@app.route("/get-data", methods=["GET"])
def get_data():
    try:
        with open(JSON_FILE_PATH, "r") as file:
            data = json.load(file)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

