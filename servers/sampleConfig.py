"""
Copy to config.py
"""

DEBUG = True
HOST = '127.0.0.1'

# secret key for the application used in session

SECRET_KEY = "a long random string, use python UUID.uuid4()"

# the URL pointing to the sweet store this application will sweet to
SWTSTORE_URL = 'http://localhost:5001'


# the URL at which your application is hosted
# when you are deploying the app locally, by default this should be
# app_url= 'http://localhost:5000'
APP_URL = 'http://localhost:5000'

# the app_id or client_id you have recieved when you registered this
# application to swtstore
APP_ID = 'your app id'

# the app_secret or client_secret you have recieved when you registered this
# application to swtstore
APP_SECRET = 'your app secret'

# the absolute url of the OAuth2.0 redirect endpoint
# this is the endpoint where the second part of the oauth handshake happen and
# the endpoint passes the client secret and the recvd code for the final call
# to recieve the OAuth token. For this app, the endpoint is /authenticate
REDIRECT_URI = 'http://localhost:5000/authenticate'
