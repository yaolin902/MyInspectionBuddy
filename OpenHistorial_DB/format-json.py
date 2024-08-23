import json

input = open("historical-documents.json")
output = open("historical-documents-formatted.json", "w")

data = json.load(input)

for row in data["results"]:
    output.write(json.dumps(row) + "\n")

input.close()
