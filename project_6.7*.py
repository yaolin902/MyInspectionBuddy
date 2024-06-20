# searches fda data dashboard to get info to build URL to fda warning letters 
# provides link to firm profiles that users can view to get links to warning letters
# the portion of the script providing direct URLs to the warning letters does not consistently work

# import packages
import requests as rq
from datetime import datetime
import re

# base URL for the API request
api_url = 'https://api-datadashboard.fda.gov/v1/compliance_actions'

# ask for user input
keyword = input("Please enter the keyword(s) for the Legal Name to filter by: ")

# request body
request = {
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

# send post request
response = rq.post(api_url, json=request,
                   headers={'Content-Type': 'application/json', 'Authorization-User': 'INSERT EMAIL ADDRESS',
                            'Authorization-Key': 'INSERT KEY'})

# parse response
out = response.json()

# print response
print(response)
print(out)

# construct direct URLs to warning letters
# define a normalization function for LegalName
def normalize_legal_name(legal_name):
    known_exceptions = {
        "medtronic-minimed-inc": "medtronic-inc"
    }
    legal_name_key = re.sub(r'[^a-zA-Z0-9\s]', '', legal_name).replace(' ', '-').lower()
    return known_exceptions.get(legal_name_key, legal_name_key)


# define a function to construct the warning letter URL
def construct_warning_letter_url(case_injunction_id, action_date, legal_name):
    base_warning_letter_url = "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters"
    formatted_date = datetime.strptime(action_date, "%Y-%m-%d").strftime("%m%d%Y")
    normalized_legal_name = normalize_legal_name(legal_name)
    return f"{base_warning_letter_url}/{normalized_legal_name}-{case_injunction_id}-{formatted_date}"


# extract and print warning letter links
for result in out.get('result', []):
    case_injunction_id = result.get('CaseInjunctionID')
    action_date = result.get('ActionTakenDate')
    legal_name = result.get('LegalName')

    # Ensure case_injunction_id, action_date, and legal_name are not None
    if case_injunction_id and action_date and legal_name:
        # Construct the warning letter URL
        warning_letter_url = construct_warning_letter_url(case_injunction_id, action_date, legal_name)
        print(f"Firm: {legal_name} - {case_injunction_id} - {action_date}")
        print(f"URL: {warning_letter_url}")
        print(f"Subject: {result.get('ActionType')}")
        print(f"Issue Date: {action_date}")
        print(f"Snippet: Letters {legal_name} - {case_injunction_id} - {action_date}\n")
