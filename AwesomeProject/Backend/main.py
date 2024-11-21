import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from flask_sqlalchemy import SQLAlchemy
import sqlite3
import csv
import os
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin
import time, uuid
import serpapi
from flask import send_from_directory, flash, redirect
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


# define constants
UPLOAD_FOLDER = "/uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
MAX_FILE_TIME = 3 * 86400
PUBLIC_IP = "api.healthly.dev"

# Initialize the Flask application
app = Flask(__name__)
# Enable Cross-Origin Resource Sharing (CORS) for the app
CORS(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# set up upload config
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

# Set up logging configuration
logging.basicConfig(level=logging.INFO)
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

# licenses
class License(db.Model):
    license_address_id = db.Column(db.Integer, primary_key=True) # specify type of field
    license_id = db.Column(db.Integer) # unique
    license_number = db.Column(db.Integer) # unique
    license_code_description = db.Column(db.String(10), unique=True, nullable=True)
    application_form_type_id = db.Column(db.Integer)
    license_type_id = db.Column(db.Integer)
    license_type_code = db.Column(db.String(2), unique=True, nullable=True)
    license_status_id = db.Column(db.Integer)
    license_status_code = db.Column(db.String(2), unique=True, nullable=True) # String
    license_classification_id = db.Column(db.Integer) # edited (db.Datetime, nullable=True, default=datetime.now)
    license_classification_code = db.Column(db.String(80), unique=False, nullable=True) 
    license_classification_description = db.Column(db.String(80), unique=False, nullable=True) 
    expiration_date = db.Column(db.DateTime, nullable=True, default=datetime.utcnow)
    firm_id = db.Column(db.Integer) # unique
    corporate_name = db.Column(db.String(80), unique=False, nullable=True)
    business_name = db.Column(db.String(80), unique=False, nullable=True)
    doing_business_as = db.Column(db.String(80), unique=False, nullable=True)
    state_incorporation = db.Column(db.String(80), unique=False, nullable=True)
    address_line_1 = db.Column(db.String(80), unique=True, nullable=True) # unique
    address_line_2 = db.Column(db.String(80), unique=False, nullable=True) 
    city = db.Column(db.String(80), unique=False, nullable=True) 
    state = db.Column(db.String(80), unique=False, nullable=True) 
    zip = db.Column(db.String(80), unique=False, nullable=True) 
    county_id = db.Column(db.Integer)
    county_code = db.Column(db.String(80), unique=False, nullable=True) 
    license_address_type_id = db.Column(db.Integer)
    license_address_type_code = db.Column(db.String(80), unique=False, nullable=True) 
    license_address_type_description = db.Column(db.String(80), unique=False, nullable=True) 
    exemptee_last_name = db.Column(db.String(80), unique=False, nullable=True) 
    exemptee_first_name = db.Column(db.String(80), unique=False, nullable=True)
 


    def to_json(self):
        return {
            "licenseAddressId": self.license_address_id,
            "licenseId": self.license_id,
            "licenseNumber": self.license_number,
            "licenseCodeDescription": self.license_code_description,
            "applicationFormTypeId": self.application_form_type_id,
            "licenseTypeId": self.license_type_id,
            "licenseTypeCode": self.license_type_code,
            "licenseStatusId": self.license_status_id,
            "licenseStatusCode # String": self.license_status_code,
            "licenseClassificationId": self.license_classification_id,
            "licenseClassificationCode": self.license_classification_code,
            "licenseClassificationDescription": self.license_classification_description,
            "expirationDate": self.expiration_date,
            "firmId": self.firm_id,
            "corporateName": self.corporate_name,
            "businessName": self.business_name,
            "doingBusinessAs": self.doing_business_as,
            "stateIncorporation": self.state_incorporation,
            "addressLine1": self.address_line_1,
            "addressLine2": self.address_line_2,
            "city": self.city,
            "state": self.state,
            "zip": self.zip,
            "countyId": self.county_id,
            "countyCode": self.county_code,
            "licenseAddressTypeId": self.license_address_type_id,
            "licenseAddressTypeCode": self.license_address_type_code,
            "licenseAddressTypeDescription": self.license_address_type_description,
            "exempteeLastName": self.exemptee_last_name,
            "exempteeFirstName": self.exemptee_first_name
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

    if not License.query.first():
        with open('license.csv', mode='r', newline='') as file:
            csv_reader = csv.reader(file)
            next(csv_reader)  # Skip header
            for row in csv_reader:
                new_contact = License(
                    license_address_id=int(row[0]),
                    license_id=int(row[1]),
                    license_number=int(row[2]),
                    license_code_description=row[3],
                    application_form_type_id=int(row[4]),
                    license_type_id=int(row[5]),
                    license_type_code=row[6],
                    license_status_id=int(row[7]),
                    license_status_code=row[8],
                    license_classification_id=int(row[9]),
                    license_classification_code=row[10],
                    license_classification_description=row[11],
                    expiration_date=datetime.strptime(row[12], '%Y-%m-%d'),
                    firm_id=int(row[13]),
                    corporate_name=row[14],
                    business_name=row[15],
                    doing_business_as=row[16],
                    state_incorporation=row[17],
                    address_line_1=row[18],
                    address_line_2=row[19],
                    city=row[20],
                    state=row[21],
                    zip=row[22],
                    county_id=int(row[23]),
                    county_code=row[24],
                    license_address_type_id=int(row[25]),
                    license_address_type_code=row[26],
                    license_address_type_description=row[27],
                    exemptee_last_name=row[28],
                    exemptee_first_name=row[29]
                )
                db.session.add(new_contact)
            db.session.commit()
        logging.info("Database populated with initial data from license.csv")

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

@app.route("/licenses", methods=['GET'])
def manage_licenses():
    licenses = License.query.all()
    if not licenses:
        logging.info("No license found in the database.")
    return jsonify([license.to_json() for license in licenses])


@app.route("/license-search", methods=["GET"])
def search_licenses():
    business_name = request.args.get('businessName')
    license_code_description = request.args.get('licenseCodeDescription')
    license_status_code = request.args.get('licenseStatusCode')
    license_address_type_description = request.args.get('licenseAddressTypeDescription')
    address_line1 = request.args.get('addressLine1')
    city = request.args.get('city')
    state = request.args.get('state')
    zip_code = request.args.get('zip')
    county_code = request.args.get('countyCode')
    expiration_date = request.args.get('expirationDate')

    # Query the database and apply filtering dynamically using SQLAlchemy
    query = Contact.query
    
    # Apply filters dynamically only if the parameter exists
    if business_name:
        query = query.filter(Contact.businessName == business_name)
    if license_code_description:
        query = query.filter(Contact.licenseCodeDescription == license_code_description)
    if license_status_code:
        query = query.filter(Contact.licenseStatusCode == license_status_code)
    if license_address_type_description:
        query = query.filter(Contact.licenseAddressTypeDescription == license_address_type_description)
    if address_line1:
        query = query.filter(Contact.addressLine1 == address_line1)
    if city:
        query = query.filter(Contact.city == city)
    if state:
        query = query.filter(Contact.state == state)
    if zip_code:
        query = query.filter(Contact.zip == zip_code)
    if county_code:
        query = query.filter(Contact.countyCode == county_code)
    if expiration_date:
        query = query.filter(Contact.expirationDate == expiration_date)

    # Execute the query and get all matching contacts
    licenses = query.all()
    if not licenses:
        logging.info("No license found in the database.")
    return jsonify([license.to_json() for license in licenses])


# Define a route for the root URL that accepts POST requests
@app.route("/", methods=['POST'])
def search_fda():
    logging.info("Received a request.")  # Log that a request has been received
    data = request.get_json()  # Get JSON data from the request
    logging.info(f"Request data: {data}")  # Log the received data

    # Extract parameters from the request data
    product_description = data.get('productDescription', '')
    recalling_firm = data.get('recallingFirm', '')
    recall_number = data.get('recallNumber', '')
    recall_class = data.get('recallClass', '')
    from_date = data.get('fromDate', '')
    to_date = data.get('toDate', '')

    # Ensure the product description is provided
    if not product_description:
        return jsonify({"error": "Product description is required"}), 400

    # Get the FDA API key from the environment variables
    apikey = os.getenv('FDA_API_KEY')
    if not apikey:
        return jsonify({"error": "API key is missing"}), 500

    # Build query parameters based on the request data
    query_params = []
    if product_description:
        query_params.append(f'product_description:"{product_description}"')
    if recalling_firm:
        query_params.append(f'recalling_firm:"{recalling_firm}"')
    if recall_number:
        query_params.append(f'recall_number:"{recall_number}"')
    if recall_class:
        query_params.append(f'classification:"{recall_class}"')
    # Temporarily remove the date filter to test the basic query

    # Construct the final query string
    query = ' AND '.join(query_params)
    url = f'https://api.fda.gov/device/enforcement.json?api_key={apikey}&search={query}&limit=100'

    try:
        logging.info(f"Sending request to FDA API: {url}")  # Log the API request URL
        response = requests.get(url)  # Send the request to the FDA API
        response.raise_for_status()  # Raise an error for bad responses
        return jsonify(response.json())  # Return the JSON response from the API
    except requests.RequestException as e:
        logging.error(f"Error fetching data from FDA API: {e}")  # Log any errors
        return jsonify({"error": "Failed to fetch data from the API", "details": str(e).replace(apikey, "<HIDDEN>")}), 500

# Define a new route for K510 database search
@app.route("/k510", methods=['POST'])
def search_k510():
    logging.info("Received a K510 search request.")  # Log that a K510 request has been received
    data = request.get_json()  # Get JSON data from the request
    logging.info(f"K510 request data: {data}")  # Log the received data

    # Extract parameters from the request data
    k510_number = data.get('k510Number', '')
    applicant_name = data.get('applicantName', '')
    device_name = data.get('deviceName', '')
    from_date = data.get('fromDate', '')
    to_date = data.get('toDate', '')

    # Ensure at least one parameter is provided
    if not (k510_number or applicant_name or device_name or from_date or to_date):
        return jsonify({"error": "At least one search parameter is required"}), 400

    # Get the FDA API key from the environment variables
    apikey = os.getenv('FDA_API_KEY')
    if not apikey:
        return jsonify({"error": "API key is missing"}), 500

    # Build query parameters based on the request data
    query_params = []
    if k510_number:
        query_params.append(f'k_number.exact:"{k510_number}"')
    if applicant_name:
        query_params.append(f'applicant:"{applicant_name}"')
    if device_name:
        query_params.append(f'device_name:"{device_name}"')

    # Construct the final query string
    query = ' AND '.join(query_params)
    url = f'https://api.fda.gov/device/510k.json?api_key={apikey}&search={query}&limit=100'

    try:
        logging.info(f"Sending request to FDA K510 API: {url}")  # Log the API request URL
        response = requests.get(url)  # Send the request to the FDA API
        response.raise_for_status()  # Raise an error for bad responses
        return jsonify(response.json())  # Return the JSON response from the API
    except requests.RequestException as e:
        logging.error(f"Error fetching data from FDA K510 API: {e}")  # Log any errors
        return jsonify({"error": "Failed to fetch data from the API", "details": str(e).replace(apikey, "<HIDDEN>")}), 500

# Define a new route for CDPH device recall search
@app.route("/cdph", methods=['POST'])
def search_cdph():
    logging.info("Received a CDPH search request.")  # Log that a CDPH request has been received
    data = request.get_json()  # Get JSON data from the request
    logging.info(f"CDPH request data: {data}")  # Log the received data

    # Extract parameters from the request data
    device_name = data.get('deviceName', '')
    firm_name = data.get('firmName', '')

    # Ensure at least one parameter is provided
    if not (device_name or firm_name):
        return jsonify({"error": "At least one search parameter is required"}), 400

    # Perform the search
    try:
        results = perform_cdph_search(device_name, firm_name)
        return jsonify(results)
    except Exception as e:
        logging.error(f"Error fetching data from CDPH: {e}")  # Log any errors
        return jsonify({"error": "Failed to fetch data from the CDPH website", "details": str(e)}), 500

def perform_cdph_search(device_name, firm_name):
    base_url = "https://www.cdph.ca.gov"
    url = base_url + "/Programs/CEH/DFDCS/Pages/FDBPrograms/DeviceRecalls.aspx"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    }  # Some websites require a User-Agent header to mimic a web browser

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

        logging.info(f"CDPH search results: {results}")  # Log the search results
        return results
    else:
        raise Exception("Failed to retrieve data from the website.")

# Define a new route for Maude database search
@app.route("/maude", methods=['POST'])
def search_maude():
    logging.info("Received a Maude search request.")  # Log that a Maude request has been received
    data = request.get_json()  # Get JSON data from the request
    logging.info(f"Maude request data: {data}")  # Log the received data

    # Extract parameters from the request data
    device_generic_name = data.get('deviceName', '')  # Use deviceName for the generic name
    firm_name = data.get('firmName', '')
    from_date = data.get('fromDate', '')
    to_date = data.get('toDate', '')

    # Ensure at least one parameter is provided
    if not (device_generic_name or firm_name):
        return jsonify({"error": "At least one search parameter is required"}), 400

    # Get the FDA API key from the environment variables
    apikey = os.getenv('FDA_API_KEY')
    if not apikey:
        return jsonify({"error": "API key is missing"}), 500

    # Build query parameters based on the request data
    query_params = []
    if device_generic_name:
        query_params.append(f'device.generic_name:"{device_generic_name}"')

    # Construct the final query string
    query = ' AND '.join(query_params)
    url = f'https://api.fda.gov/device/event.json?api_key={apikey}&search={query}&limit=100'

    try:
        logging.info(f"Sending request to FDA Maude API: {url}")  # Log the API request URL
        response = requests.get(url)  # Send the request to the FDA API
        response.raise_for_status()  # Raise an error for bad responses
        return jsonify(response.json())  # Return the JSON response from the API
    except requests.RequestException as e:
        logging.error(f"Error fetching data from FDA Maude API: {e}")  # Log any errors
        return jsonify({"error": "Failed to fetch data from the API", "details": str(e).replace(apikey, "<HIDDEN>")}), 500

# Define a new route for OpenHistorical search
@app.route("/openhistorical", methods=['POST'])
def search_openhistorical():
    logging.info("Received an OpenHistorical search request.")
    data = request.get_json()
    logging.info(f"OpenHistorical request data: {data}")

    keyword = data.get("keyword", "")
    year = data.get("year", "")

    if not keyword:
        return jsonify({"error": "Keyword is required"}), 400

    # Construct the query parameters
    query_params = {}
    if year:
        query_params.update(
            {
                "query": {"term": {"year": year}},
            }
        )
    if keyword:
        query_params.update(
            {
                "query": {
                    "match": {
                        "text": {
                            "query": keyword,
                            "boost": 0.5
                        }
                    }
                },
                "knn": {
                    "field": "text_embedding.predicted_value",
                    "query_vector_builder": {
                        "text_embedding": {
                            "model_id": "sentence-transformers__msmarco-minilm-l12-cos-v5",
                            "model_text": keyword,
                        }
                    },
                    "k": 10,
                    "num_candidates": 100,
                    "boost": 0.2
                },
                "fields": ["id", "text", "num_of_pages", "year", "doc_type"],
                "_source": False,
                "size": 25
            }
        )

    url = "http://localhost:9200/document-with-vector/_search"

    try:
        logging.info(f"Sending request to FDA OpenHistorical API: {url}")
        response = requests.get(
            url, json=query_params, headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()

        response_data = response.json()

        # Ensure we correctly handle the API response structure
        hits = response_data.get("hits", {}).get("hits", [])
        results = [
            {
                "num_of_pages": document.get("fields").get("num_of_pages", "N/A")[0],
                "year": document.get("fields").get("year", "N/A")[0],
                "text": document.get("fields").get("text", "N/A")[0],
                "doc_type": document.get("fields").get("doc_type", "N/A")[0],
            }
            for document in hits
        ]

        return jsonify(results)
    except requests.RequestException as e:
        logging.error(f"Error fetching data from FDA OpenHistorical API: {e}")
        pass

    # Construct the query parameters
    query_params = []
    if keyword:
        query_params.append(f'text:"{keyword}"')
    if year:
        query_params.append(f"year:{year}")

    apikey = os.getenv('FDA_API_KEY')
    if not apikey:
        return jsonify({"error": "API key is missing"}), 500

    query_string = " AND ".join(query_params)
    url = f"https://api.fda.gov/other/historicaldocument.json?api_key={apikey}&search={query_string}&limit=100"

    try:
        logging.info(f"Sending request to FDA OpenHistorical API: {url}")
        response = requests.get(url)
        response.raise_for_status()

        response_data = response.json()

        # Ensure we correctly handle the API response structure
        results = [
            {
                "num_of_pages": document.get("num_of_pages", "N/A"),
                "year": document.get("year", "N/A"),
                "text": document.get("text", "N/A"),
                "doc_type": document.get("doc_type", "N/A"),
            }
            for document in response_data.get("results", [])
        ]

        return jsonify(results)
    except requests.RequestException as e:
        logging.error(f"Error fetching data from FDA OpenHistorical API: {e}")
        return (
            jsonify({"error": "Failed to fetch data from the API", "details": str(e).replace(apikey, "<HIDDEN>")}),
            500,
        )

# Define a new route for CA business entity keyword search
@app.route("/ca-business-entity", methods=['POST'])
def search_ca_business_entity():
    logging.info("Received a CA business entity search request.")
    data = request.get_json()
    logging.info(f"CA business entity request data: {data}")

    search_term = data.get('searchTerm', '')

    if not search_term:
        return jsonify({"error": "Search term is required"}), 400

    # Build the search URL for the new data source
    search_url = "https://bizfileonline.sos.ca.gov/api/Records/businesssearch"

    try:
        # Perform the initial request to get the search page
        logging.info(f"Sending initial request to CA Secretary of State business search: {search_url}")

        # Parse the search page to get the necessary form data and cookies
        json_data = {
            'SEARCH_VALUE': 'test',
            'SEARCH_TYPE_ID': '1',
        }
        headers = {
            'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://bizfileonline.sos.ca.gov/search/business',
            'authorization': 'undefined',
            'content-type': 'application/json',
            'Origin': 'https://bizfileonline.sos.ca.gov',
            'Sec-GPC': '1',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'DNT': '1',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
        }

        # Use the form data to perform the search
        logging.info(f"Performing search with criteria: {json_data}")
        response = requests.post(search_url, json=json_data, headers=headers)
        response.raise_for_status()

        # Parse the search results
        table_rows = response.json()["rows"]
        results = []
        for k, v in table_rows.items():
            result = {
                "entityInformation": v["TITLE"][0],
                "initialFilingDate": v["FILING_DATE"],
                "status": v["STATUS"],
                "entityType": v["ENTITY_TYPE"],
                "formedIn": v["FORMED_IN"],
                "agent": v["AGENT"]
            }
            results.append(result)

        return jsonify(results)
    except requests.RequestException as e:
        logging.error(f"Error fetching data from CA Secretary of State business search: {e}")
        return jsonify({"error": "Failed to fetch data from the website", "details": str(e)}), 500


serp_client = serpapi.Client(api_key=os.getenv('SERP_API_KEY'))



def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/serpapi-upload", methods=["GET", "POST"])
def upload_file():
    if request.method == "POST":
        # check if the post request has the file part
        if "file" not in request.files:
            flash("No file part")
            return redirect(request.url)
        file = request.files["file"]
        # if user does not select file, browser also
        # submit an empty part without filename
        if file.filename == "":
            flash("No selected file")
            return redirect(request.url)
        # if file is allowed upload to /uploads
        if file and allowed_file(file.filename):
            # filename = secure_filename(file.filename)
            filename = str(uuid.uuid4()) + ".png"
            file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))

            # setup google reverse image search
            params = {
                "engine": "google_reverse_image",
                "image_url": "https://"
                + PUBLIC_IP
                + "/serpapi-uploads/"
                + filename,
            }
            search = serp_client.search(params)

            # parsing results, looking for object name
            results = search.as_dict()

            if "search_information" in results:
                results = results["search_information"]["query_displayed"]
            else:
                results = "object not recognized"

            # automatically remove files 3 days old
            for f in os.listdir(UPLOAD_FOLDER):
                path = os.path.join(UPLOAD_FOLDER, f)

                if os.stat(path).st_mtime <= (time.time() - MAX_FILE_TIME):
                    if os.path.isfile(path):
                        try:
                            os.remove(path)
                        except:
                            print("Cannot remove file", path)

            return results
    return """
    <!doctype html>
    <title>Upload new File</title>
    <h1>Upload new File</h1>
    <form method=post enctype=multipart/form-data>
      <input type=file name=file>
      <input type=submit value=Upload>
    </form>
    """


@app.route("/serpapi-uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


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
    app.run(host='0.0.0.0', port=80)
