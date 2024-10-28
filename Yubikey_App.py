import requests
from bs4 import BeautifulSoup
from yubico_client.yubico import Yubico

email = input('Enter your email: ')
otp = input('Enter your otp: ')

# retrieve client id and api key from yubico
response = requests.post('https://upgrade.yubico.com/getapikey/',
                         data={
                             'email': email,
                             'otp': otp,
                             'terms_conditions': 'consented'
                         })
soup = BeautifulSoup(response.content, "html.parser")
info = [element.get_text() for element in soup.find_all("td")]
print(info) # parsed client id and api key from html response

client_id = info[0]
api_key = info[1]
yubico_client = Yubico(client_id, api_key)

otp = input('Enter your otp again: ')

# attempt to verify otp
try:
    if yubico_client.verify(otp):
        print("YubiKey OTP verification successful!")
    else:
        print("OTP verification failed.")
except Exception as e:
    print(f"An error occurred during verification: {e}")

# example output:
# $ python3 yubi.py
# Enter your email: anyaccountworks@cdph.ca.gov
# Enter your otp: cccccblidrhfuugektnfkjcftdhllcduhrkggurernuf
# ['104423', 'lD/ABRT0cePHzz8ldMFYkax6dso=']
# Enter your otp again: cccccblidrhfhdjribdkdfgltbindvnglrtthjrblhcj
# YubiKey OTP verification successful!