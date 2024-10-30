import requests


def test_search_fda():
	response = requests.post("https://api.healthly.dev/",
	                         json={"productDescription": "heart"})

	assert response.status_code == 200
	assert isinstance(response.json(), dict)
	assert response.json() != {}


def test_search_k510():
	response = requests.post("https://api.healthly.dev/k510",
	                         json={"deviceName": "heart"})

	assert response.status_code == 200
	assert isinstance(response.json(), dict)
	assert response.json() != {}


def test_search_cdph():
	response = requests.post("https://api.healthly.dev/cdph",
	                         json={"deviceName": "heart"})

	assert response.status_code == 200
	assert isinstance(response.json(), list)
	assert response.json() != []


def test_search_maude():
	response = requests.post("https://api.healthly.dev/cdph",
	                         json={"deviceName": "heart"})

	assert response.status_code == 200
	assert isinstance(response.json(), list)
	assert response.json() != []
