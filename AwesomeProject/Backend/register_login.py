import requests

# Backend URL
backend_url = 'http://localhost:5001'

# Register a user
def register_user(username, password):
    register_response = requests.post(
        f'{backend_url}/register',
        json={'username': username, 'password': password}
    )
    if register_response.status_code == 201:
        print('User registered successfully')
    else:
        print('Error registering user:', register_response.json())

# Log in with the registered user
def login_user(username, password):
    login_response = requests.post(
        f'{backend_url}/login',
        json={'username': username, 'password': password}
    )
    if login_response.status_code == 200:
        access_token = login_response.json().get('access_token')
        print('Login successful, access token:', access_token)
    else:
        print('Error logging in:', login_response.json())

if __name__ == '__main__':
    username = 'testuser'
    password = 'testpassword'
    
    print('Registering user...')
    register_user(username, password)
    
    print('Logging in...')
    login_user(username, password)
