import requests


def test_search_fda():
	response = requests.post("https://api.healthly.dev/", json={"productDescription": "heart"})

	assert response.status_code == 200
	assert isinstance(response.json(), dict)
	assert response.json() != {}


def test_search_k510():
	response = requests.post("https://api.healthly.dev/k510", json={"deviceName": "heart"})

	assert response.status_code == 200
	assert isinstance(response.json(), dict)
	assert response.json() != {}


def test_search_cdph():
	response = requests.post("https://api.healthly.dev/cdph", json={"deviceName": "heart"})

	assert response.status_code == 200
	assert isinstance(response.json(), list)
	assert response.json() != []


def test_search_maude():
	response = requests.post("https://api.healthly.dev/maude", json={"deviceName": "heart"})

	assert response.status_code == 200
	assert isinstance(response.json(), dict)
	assert response.json() != {}


def test_search_openhistorical():
	response = requests.post("https://api.healthly.dev/openhistorical", json={"keyword": "heart"})

	assert response.status_code == 200
	assert isinstance(response.json(), list)
	assert response.json() != []


def test_search_cabusinessentity():
	response = requests.post("https://api.healthly.dev/ca-business-entity", json={"searchTerm": "heart"})

	assert response.status_code == 200
	assert isinstance(response.json(), list)
	assert response.json() != []


def test_getcontacts():
	response = requests.get("https://api.healthly.dev/contacts")

	assert response.status_code == 200
	assert isinstance(response.json(), list)
	assert response.json() != []


def test_getlicenses():
	response = requests.get("https://api.healthly.dev/licenses")

	assert response.status_code == 200
	assert isinstance(response.json(), list)
	assert response.json() != []


def test_serpapi():
	response = requests.post("https://api.healthly.dev/serpapi-upload", files={'file': ('ventilator.jpg', open('ventilator.jpg', 'rb'), 'image/jpeg')})

	assert response.status_code == 200
	assert isinstance(response.json(), dict)
	assert response.json() != {}


def test_predict():
	response = requests.post("https://api.healthly.dev/predict", files={'file': ('ventilator.jpg', open('ventilator.jpg', 'rb'), 'image/jpeg')})

	assert response.status_code == 200


def test_warningletter():
	response = requests.post("https://api.healthly.dev/warning_letters", json={"firmName": "heart"})

	assert response.status_code == 200
	assert isinstance(response.json(), list)
	assert response.json() != []
