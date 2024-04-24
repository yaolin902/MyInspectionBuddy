#! python3
from flask import Flask
import requests
import csv
from openpyxl import Workbook
import os

app = Flask(__name__)

@app.route("/")
def index():
    return "Congratulations, it's a web app!"

@app.route("/")

def search510k():
    # this script is for searching the 510k database by decision date
    # this script provides a clickable url link of the json data
    # this script provides a downloadable Excel file in the directory where the script is ran


    apikey = 'e3oka6wF312QcwuJguDeXVEN6XGyeJC94Hirijj8'

    # Ask user for minimum date
    min_date = input("Enter the minimum date (YYYY-MM-DD): ")
    # Ask user for maximum date
    max_date = input("Enter the maximum date (YYYY-MM-DD): ")

    # Format date range for URL
    date_range = f"{min_date}+TO+{max_date}"

    # Build the URL with user input
    url = f'https://api.fda.gov/device/510k.json?api_key={apikey}&search=decision_date:{date_range}&limit=100'

    # Print the constructed URL
    print("Constructed URL:", url)

    # Send request
    response = requests.get(url)

    # Check if request was successful
    if response.status_code == 200:
        # JSON response
        data = response.json()
        # Export data to CSV
        with open('output.csv', 'w', newline='') as csvfile:
            csvwriter = csv.writer(csvfile)
            # Write header
            csvwriter.writerow(data['results'][0].keys())
            # Write data
            for item in data['results']:
                csvwriter.writerow(item.values())

        # Export data to Excel
        wb = Workbook()
        ws = wb.active
        header = list(data['results'][0].keys())  # Header
        ws.append(header)  # Write header
        for item in data['results']:
            values = [str(v) for v in item.values()]  # Convert all values to strings
            ws.append(values)  # Write data

        # Get the directory where the script is located
        script_directory = os.path.dirname(os.path.abspath(__file__))
        # Create the full path for the Excel file
        excel_filename = os.path.join(script_directory, f"{date_range}_output.xlsx")

        wb.save(excel_filename)
        print(f"Data exported to {excel_filename} successfully.")
    else:
        print("Failed to fetch data from the API.")



# Starts Flask Development Server when script is executed from command line
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, debug=True)