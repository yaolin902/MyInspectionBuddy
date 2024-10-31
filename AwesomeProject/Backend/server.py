import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import sqlite3
import csv
import os
from bs4 import BeautifulSoup
import requests
import re
from urllib.parse import urljoin
from ultralytics import YOLO
from PIL import Image
import io
import numpy as np
import base64
import cv2
import requests as rq
from datetime import datetime
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

# Initialize the Flask application
app = Flask(__name__)
# Enable Cross-Origin Resource Sharing (CORS) for the app
CORS(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)


# Set up logging configuration
logging.basicConfig(level=logging.INFO)# Function Definitions
def normalize_legal_name(legal_name):
    known_exceptions = {"medtronic-minimed-inc": "medtronic-inc"}
    legal_name_key = re.sub(r'[^a-zA-Z0-9\s]', '', legal_name).replace(' ', '-').lower()
    return known_exceptions.get(legal_name_key, legal_name_key)

def construct_warning_letter_url(case_injunction_id, action_date, legal_name):
    base_warning_letter_url = "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters"
    formatted_date = datetime.strptime(action_date, "%Y-%m-%d").strftime("%m%d%Y")
    normalized_legal_name = normalize_legal_name(legal_name)
    return f"{base_warning_letter_url}/{normalized_legal_name}-{case_injunction_id}-{formatted_date}"


# SQLAlchemy configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///contact_info.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'  # Change this to a secure key

db = SQLAlchemy(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

# Contact model
class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    county = db.Column(db.String(100))
    name = db.Column(db.String(100))
    address = db.Column(db.String(200))
    phone = db.Column(db.String(20))
    fax = db.Column(db.String(20))
    link_to_website = db.Column(db.String(100))

    def to_dict(self):
        return {
            'id': self.id,
            'county': self.county,
            'name': self.name,
            'address': self.address,
            'phone': self.phone,
            'fax': self.fax,
            'link_to_website': self.link_to_website
        }

# Initialize the database
with app.app_context():
    db.create_all()
    # Check if the database is empty and populate it with data from info.csv if needed
    if not Contact.query.first():
        with open('info.csv', mode='r', newline='') as file:
            csv_reader = csv.reader(file)
            next(csv_reader)  # Skip header
            for row in csv_reader:
                new_contact = Contact(
                    county=row[0],
                    name=row[1],
                    address=row[2],
                    phone=row[3],
                    fax=row[4],
                    link_to_website=row[5]
                )
                db.session.add(new_contact)
            db.session.commit()
        logging.info("Database populated with initial data from info.csv")

# User registration route
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

# User login route
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and bcrypt.check_password_hash(user.password, password):
        access_token = create_access_token(identity={'username': user.username})
        return jsonify(access_token=access_token), 200

    return jsonify({"error": "Invalid credentials"}), 401

# Protected route
@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

# Define the route for managing district attorney office contacts
@app.route("/contacts", methods=['GET', 'POST'])
def manage_contacts():
    if request.method == 'GET':
        contacts = Contact.query.all()
        if not contacts:
            logging.info("No contacts found in the database.")
        return jsonify([contact.to_dict() for contact in contacts])

    if request.method == 'POST':
        data = request.get_json()
        new_contact = Contact(
            county=data['county'],
            name=data['name'],
            address=data['address'],
            phone=data['phone'],
            fax=data.get('fax'),
            link_to_website=data.get('link_to_website')
        )
        db.session.add(new_contact)
        db.session.commit()
        return jsonify(new_contact.to_dict()), 201

# Define a route for the root URL that accepts POST requests
@app.route("/", methods=['POST'])
def search_fda():
    logging.info("Received a request.")
    data = request.get_json()
    logging.info(f"Request data: {data}")

    product_description = data.get('productDescription', '')
    recalling_firm = data.get('recallingFirm', '')
    recall_number = data.get('recallNumber', '')
    recall_class = data.get('recallClass', '')
    from_date = data.get('fromDate', '')
    to_date = data.get('toDate', '')

    if not product_description:
        return jsonify({"error": "Product description is required"}), 400

    apikey = os.getenv('FDA_API_KEY')
    if not apikey:
        return jsonify({"error": "API key is missing"}), 500

    query_params = []
    if product_description:
        query_params.append(f'product_description:"{product_description}"')
    if recalling_firm:
        query_params.append(f'recalling_firm:"{recalling_firm}"')
    if recall_number:
        query_params.append(f'recall_number:"{recall_number}"')
    if recall_class:
        query_params.append(f'classification:"{recall_class}"')

    query = ' AND '.join(query_params)
    url = f'https://api.fda.gov/device/enforcement.json?api_key={apikey}&search={query}&limit=100'

    try:
        logging.info(f"Sending request to FDA API: {url}")
        response = requests.get(url)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        logging.error(f"Error fetching data from FDA API: {e}")
        return jsonify({"error": "Failed to fetch data from the API", "details": str(e)}), 500

# Define a new route for K510 database search
@app.route("/k510", methods=['POST'])
def search_k510():
    logging.info("Received a K510 search request.")
    data = request.get_json()
    logging.info(f"K510 request data: {data}")

    k510_number = data.get('k510Number', '')
    applicant_name = data.get('applicantName', '')
    device_name = data.get('deviceName', '')
    from_date = data.get('fromDate', '')
    to_date = data.get('toDate', '')

    if not (k510_number or applicant_name or device_name or from_date or to_date):
        return jsonify({"error": "At least one search parameter is required"}), 400

    apikey = os.getenv('FDA_API_KEY')
    if not apikey:
        return jsonify({"error": "API key is missing"}), 500

    query_params = []
    if k510_number:
        query_params.append(f'k_number.exact:"{k510_number}"')
    if applicant_name:
        query_params.append(f'applicant:"{applicant_name}"')
    if device_name:
        query_params.append(f'device_name:"{device_name}"')

    query = ' AND '.join(query_params)
    url = f'https://api.fda.gov/device/510k.json?api_key={apikey}&search={query}&limit=100'

    try:
        logging.info(f"Sending request to FDA K510 API: {url}")
        response = requests.get(url)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        logging.error(f"Error fetching data from FDA K510 API: {e}")
        return jsonify({"error": "Failed to fetch data from the API", "details": str(e)}), 500

# Define a new route for CDPH device recall search
@app.route("/cdph", methods=['POST'])
def search_cdph():
    logging.info("Received a CDPH search request.")
    data = request.get_json()
    logging.info(f"CDPH request data: {data}")

    device_name = data.get('deviceName', '')
    firm_name = data.get('firmName', '')

    if not (device_name or firm_name):
        return jsonify({"error": "At least one search parameter is required"}), 400

    try:
        results = perform_cdph_search(device_name, firm_name)
        return jsonify(results)
    except Exception as e:
        logging.error(f"Error fetching data from CDPH: {e}")
        return jsonify({"error": "Failed to fetch data from the CDPH website", "details": str(e)}), 500

def perform_cdph_search(device_name, firm_name):
    base_url = "https://www.cdph.ca.gov"
    url = base_url + "/Programs/CEH/DFDCS/Pages/FDBPrograms/DeviceRecalls.aspx"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        soup = BeautifulSoup(response.content, "html.parser")
        links = soup.find_all("a", href=True)

        results = []
        for link in links:
            if ((device_name and re.search(r'\b{}\b'.format(re.escape(device_name)), link.text, re.IGNORECASE)) or
                (firm_name and re.search(r'\b{}\b'.format(re.escape(firm_name)), link.text, re.IGNORECASE)) or
                (device_name and re.search(r'\b{}\b'.format(re.escape(device_name)), link["href"], re.IGNORECASE)) or
                (firm_name and re.search(r'\b{}\b'.format(re.escape(firm_name)), link["href"], re.IGNORECASE))):
                result = {
                    "text": link.text.strip(),
                    "url": urljoin(base_url, link["href"])
                }
                results.append(result)

        logging.info(f"CDPH search results: {results}")
        return results
    else:
        raise Exception("Failed to retrieve data from the website.")

# Define a new route for Maude database search
@app.route("/maude", methods=['POST'])
def search_maude():
    logging.info("Received a Maude search request.")
    data = request.get_json()
    logging.info(f"Maude request data: {data}")

    device_generic_name = data.get('deviceName', '')
    firm_name = data.get('firmName', '')
    from_date = data.get('fromDate', '')
    to_date = data.get('toDate', '')

    if not (device_generic_name or firm_name):
        return jsonify({"error": "At least one search parameter is required"}), 400

    apikey = os.getenv('FDA_API_KEY')
    if not apikey:
        return jsonify({"error": "API key is missing"}), 500

    query_params = []
    if device_generic_name:
        query_params.append(f'device.generic_name:"{device_generic_name}"')

    query = ' AND '.join(query_params)
    url = f'https://api.fda.gov/device/event.json?api_key={apikey}&search={query}&limit=100'

    try:
        logging.info(f"Sending request to FDA Maude API: {url}")
        response = requests.get(url)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        logging.error(f"Error fetching data from FDA Maude API: {e}")
        return jsonify({"error": "Failed to fetch data from the API", "details": str(e)}), 500

# Define a new route for OpenHistorical search
@app.route("/openhistorical", methods=['POST'])
def search_openhistorical():
    logging.info("Received an OpenHistorical search request.")
    data = request.get_json()
    logging.info(f"OpenHistorical request data: {data}")

    keyword = data.get('keyword', '')
    year = data.get('year', '')

    if not keyword:
        return jsonify({"error": "Keyword is required"}), 400

    query_params = []
    if keyword:
        query_params.append(f'text:"{keyword}"')
    if year:
        query_params.append(f'year:{year}')

    query_string = ' AND '.join(query_params)
    url = f"https://api.fda.gov/other/historicaldocument.json?api_key=e3oka6wF312QcwuJguDeXVEN6XGyeJC94Hirijj8&search={query_string}&limit=100"

    try:
        logging.info(f"Sending request to FDA OpenHistorical API: {url}")
        response = requests.get(url)
        response.raise_for_status()

        response_data = response.json()
        results = [{
            "num_of_pages": document.get('num_of_pages', 'N/A'),
            "year": document.get('year', 'N/A'),
            "text": document.get('text', 'N/A'),
            "doc_type": document.get('doc_type', 'N/A')
        } for document in response_data.get('results', [])]

        return jsonify(results)
    except requests.RequestException as e:
        logging.error(f"Error fetching data from FDA OpenHistorical API: {e}")
        return jsonify({"error": "Failed to fetch data from the API", "details": str(e)}), 500

# Define a new route for CA business entity keyword search
@app.route("/ca-business-entity", methods=['POST'])
def search_ca_business_entity():
    logging.info("Received a CA business entity search request.")
    data = request.get_json()
    logging.info(f"CA business entity request data: {data}")

    search_term = data.get('searchTerm', '')

    if not search_term:
        return jsonify({"error": "Search term is required"}), 400

    search_url = "https://bizfileonline.sos.ca.gov/search/business"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://bizfileonline.sos.ca.gov/',
        'Origin': 'https://bizfileonline.sos.ca.gov'
    }

    try:
        logging.info(f"Sending initial request to CA Secretary of State business search: {search_url}")
        initial_response = requests.get(search_url, headers=headers)
        initial_response.raise_for_status()

        soup = BeautifulSoup(initial_response.content, 'html.parser')
        form_data = {
            "SearchType": "CORP",
            "SearchCriteria": search_term,
            "SearchSubType": "Keyword"
        }

        logging.info(f"Performing search with criteria: {form_data}")
        response = requests.post(search_url, data=form_data, headers=headers, cookies=initial_response.cookies)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        results = []

        table_rows = soup.select('table tbody tr')
        for row in table_rows:
            cells = row.find_all('td')
            if len(cells) > 0:
                result = {
                    "entityInformation": cells[0].text.strip(),
                    "initialFilingDate": cells[1].text.strip(),
                    "status": cells[2].text.strip(),
                    "entityType": cells[3].text.strip(),
                    "formedIn": cells[4].text.strip(),
                    "agent": cells[5].text.strip() if len(cells) > 5 else 'N/A'
                }
                results.append(result)

        return jsonify(results)
    except requests.RequestException as e:
        logging.error(f"Error fetching data from CA Secretary of State business search: {e}")
        return jsonify({"error": "Failed to fetch data from the website", "details": str(e)}), 500
    
# Initialize the YOLO model
model = YOLO("last.pt")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        file = request.files['file'].read()
        image = Image.open(io.BytesIO(file)).convert("RGB")
        image_np = np.array(image)

        results = model.predict(source=image_np, save=True)

        result_image_path = "runs/detect/predict7/result.png"
        cv2.imwrite(result_image_path, results[0].plot())

        with open(result_image_path, "rb") as image_file:
            img_str = base64.b64encode(image_file.read()).decode("utf-8")

        return jsonify({'result': img_str})
    except Exception as e:
        logging.error(f"Error in prediction: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/warning_letters", methods=['POST'])
def search_warning_letters():
    data = request.get_json()
    keyword = data.get('firmName', '')  # Assume 'firmName' is sent as the keyword

    logging.info(f"Received keyword: {keyword}")  # Log the received keyword

    api_url = 'https://api-datadashboard.fda.gov/v1/compliance_actions'
    request_body = {
        "start": 1,
        "rows": 50,
        "returntotalcount": "true",
        "sort": "ActionTakenDate",
        "sortorder": "DESC",
        "filters": {
            "ProductType": ["Biologics", "Devices"],
            "ActionType": ["Warning Letter"],
            "LegalName": [keyword]
        },
        "columns": [
            "FirmProfile",
            "FEINumber",
            "ActionType",
            "State",
            "ActionTakenDate",
            "LegalName",
            "CaseInjunctionID"  # Add CaseInjunctionID column
        ]
    }

    headers = {
        'Content-Type': 'application/json',
        'Authorization-User': os.getenv('AUTHORIZATION_USER'),  # Should ideally be secured
        'Authorization-Key': os.getenv('AUTHORIZATION_KEY')  # Should ideally be secured
    }

    try:
        response = rq.post(api_url, json=request_body, headers=headers)
        response.raise_for_status()  # Will raise an HTTPError if the HTTP request returned an unsuccessful status code
        out = response.json()
        
        logging.info(f"API response: {out}")  # Log the API response

        # Construct URLs to warning letters and add to response data
        results = []
        for result in out.get('result', []):  # Corrected to 'result'
            logging.info(f"Processing result: {result}")  # Log each result being processed
            if all(key in result for key in ['CaseInjunctionID', 'ActionTakenDate', 'LegalName']):
                warning_letter_url = construct_warning_letter_url(
                    result['CaseInjunctionID'], result['ActionTakenDate'], result['LegalName'])
                result['warning_letter_url'] = warning_letter_url
                results.append(result)

        logging.info(f"Processed results: {results}")  # Log the processed results
        return jsonify(results)
    except rq.RequestException as e:
        logging.error(f"Error fetching data from FDA API: {e}")  # Log any errors
        return jsonify({"error": "Failed to fetch data from FDA API", "details": str(e)}), 500


    
# Run the Flask app on the specified host and port
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)