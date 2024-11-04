from flask import Flask, jsonify, request, session, redirect, url_for
from fido2.server import Fido2Server
from fido2.webauthn import PublicKeyCredentialRpEntity, PublicKeyCredentialUserEntity
from fido2.webauthn import PublicKeyCredentialCreationOptions, AuthenticatorAssertionResponse
from fido2.utils import websafe_encode, websafe_decode
import os

# Flask app setup
app = Flask(__name__)
app.secret_key = os.urandom(24)

# Relying Party information
rp = PublicKeyCredentialRpEntity("example.com", "Example App")
fido2_server = Fido2Server(rp)

# In-memory user data store (replace with a real DB in production)
users = {}

# Route for registration initiation
@app.route('/register', methods=['POST'])
def register():
    username = request.json.get('username')
    user_id = os.urandom(16)
    user = PublicKeyCredentialUserEntity(id=user_id, name=username, display_name=username)

    # Generate registration options
    registration_data, state = fido2_server.register_begin(user)
    session['state'] = state
    return jsonify(registration_data)

# Route for finalizing registration
@app.route('/register/complete', methods=['POST'])
def register_complete():
    data = request.json
    state = session.pop('state')

    # Validate the registration response
    auth_data = fido2_server.register_complete(state, data)

    # Store user credentials
    username = data.get("username")
    users[username] = auth_data.credential_data
    return jsonify({"status": "Registration completed"})

# Route for login initiation
@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')

    if username not in users:
        return jsonify({"status": "User not found"}), 404

    # Generate assertion options for authentication
    auth_data, state = fido2_server.authenticate_begin([users[username]])
    session['state'] = state
    return jsonify(auth_data)

# Route for finalizing login
@app.route('/login/complete', methods=['POST'])
def login_complete():
    data = request.json
    state = session.pop('state')

    # Validate the login response
    auth_response = AuthenticatorAssertionResponse(data)
    fido2_server.authenticate_complete(state, [users[data['username']]], auth_response)

    session['username'] = data['username']
    return jsonify({"status": "Login successful"})

# Route for testing login status
@app.route('/dashboard', methods=['GET'])
def dashboard():
    if 'username' in session:
        return jsonify({"message": f"Welcome, {session['username']}!"})
    else:
        return jsonify({"status": "Not logged in"}), 403

if __name__ == '__main__':
    app.run(debug=True)