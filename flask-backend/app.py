from flask import Flask, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Define the correct path inside Flask backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Get Flask backend directory
JSON_FILE_PATH = os.path.join(BASE_DIR, "processed_data.json")

@app.route("/get-data", methods=["GET"])
def get_data():
    try:
        with open(JSON_FILE_PATH, "r") as file:
            data = json.load(file)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)  # Run on localhost:5000
