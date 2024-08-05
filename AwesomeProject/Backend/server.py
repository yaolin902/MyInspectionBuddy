import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin
import time, uuid
import serpapi
from flask import send_from_directory, flash, redirect

# define constants
UPLOAD_FOLDER = "/uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
MAX_FILE_TIME = 3 * 86400
PUBLIC_IP = "98.208.96.137"

# Initialize the Flask application
app = Flask(__name__)
# Enable Cross-Origin Resource Sharing (CORS) for the app
CORS(app)

# set up upload config
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

# Set up logging configuration
logging.basicConfig(level=logging.INFO)

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
        return jsonify({"error": "Failed to fetch data from the API", "details": str(e)}), 500

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
        return jsonify({"error": "Failed to fetch data from the API", "details": str(e)}), 500

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
        return jsonify({"error": "Failed to fetch data from the API", "details": str(e)}), 500

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
                "knn": {
                    "field": "text_embedding.predicted_value",
                    "query_vector_builder": {
                        "text_embedding": {
                            "model_id": "sentence-transformers__msmarco-minilm-l12-cos-v5",
                            "model_text": keyword,
                        }
                    },
                    "k": 10,
                    "num_candidates": 10,
                },
                "fields": ["id", "text", "num_of_pages", "year", "doc_type"],
                "_source": False,
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
        return (
            jsonify({"error": "Failed to fetch data from the API", "details": str(e)}), 500)

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
    search_url = "https://bizfileonline.sos.ca.gov/search/business"

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://bizfileonline.sos.ca.gov/',
        'Origin': 'https://bizfileonline.sos.ca.gov'
    }

    try:
        # Perform the initial request to get the search page
        logging.info(f"Sending initial request to CA Secretary of State business search: {search_url}")
        initial_response = requests.get(search_url, headers=headers)
        initial_response.raise_for_status()

        # Parse the search page to get the necessary form data and cookies
        soup = BeautifulSoup(initial_response.content, 'html.parser')
        form_data = {
            "SearchType": "CORP",
            "SearchCriteria": search_term,
            "SearchSubType": "Keyword"
        }

        # Use the form data to perform the search
        logging.info(f"Performing search with criteria: {form_data}")
        response = requests.post(search_url, data=form_data, headers=headers, cookies=initial_response.cookies)
        response.raise_for_status()

        # Parse the search results
        soup = BeautifulSoup(response.content, 'html.parser')
        results = []

        # Example scraping logic: Extract table rows containing the business entity data
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


serp_client = serpapi.Client(api_key=os.getenv('FDA_API_KEY'))


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
                "image_url": "http://"
                + PUBLIC_IP
                + ":5001"
                + "/serpapi-uploads/"
                + filename,
            }
            search = serp_client.search(params)

            # parsing results, looking for object name
            results = search.as_dict()

            # if "search_information" in results:
            #     results = results["search_information"]["query_displayed"]
            # else:
            #     results = "object not recognized"

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

# Run the Flask app on the specified host and port
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
