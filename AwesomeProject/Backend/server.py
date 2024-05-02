from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Apply CORS to all routes and domains

@app.route("/message")
def message():
    return jsonify({"message": "Hello from Flask!"})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)
