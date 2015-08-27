from flask import (Flask, session, render_template, request, redirect,
        url_for, make_response, Blueprint)
from flask.ext.session import Session
import requests
import json
from datetime import datetime, timedelta
from flask_cors import CORS, cross_origin


app = Flask(__name__)
CORS(app, allow_headers=('Content-type', 'Authorization'))
app.config.from_pyfile('config.py')


@app.route('/', methods=['GET'])
@cross_origin(origin=['*'],headers=['Content-Type','Authorization'])
def index():

    # if auth_tok is in session already..
    if 'auth_tok' in session:
        auth_tok = session['auth_tok']

        # check if it has expired
        oauth_token_expires_in_endpoint = app.config.get(
                'SWTSTORE_URL')+'/oauth/token-expires-in'
        resp = requests.get(oauth_token_expires_in_endpoint)
        expires_in = json.loads(resp.text)['expires_in']

        # added for backwared compatibility. previous session stores did not
        # have issued key
        try:
            check = datetime.utcnow() - auth_tok['issued']

            if check > timedelta(seconds=expires_in):
                # TODO: try to refresh the token before signing out the user
                auth_tok = {'access_token': '', 'refresh_token': ''}
            else:
                """access token did not expire"""
                pass

        # if issued key is not there, reset the session
        except KeyError:
            auth_tok = {'access_token': '', 'refresh_token': ''}

    else:
        auth_tok = {'access_token': '', 'refresh_token': ''}

    # print 'existing tokens'
    # print auth_tok
    #payload = {'what': 'img-anno',
    #        'access_token': auth_tok['access_token']}
    #req = requests.get(app.config.get(
    #    'SWTSTORE_URL', 'SWTSTORE_URL') + '/api/sweets/q', params=payload)
    #sweets = req.json()
    return render_template('index.html', access_token=auth_tok['access_token'],
                           refresh_token=auth_tok['refresh_token'],
                           config=app.config,
                           url=request.args.get('where'))


@app.route('/authenticate', methods=['GET'])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def authenticateWithOAuth():
    auth_tok = None
    code = request.args.get('code')

    # prepare the payload
    payload = {
        'scopes': 'email sweet context',
        'client_secret': app.config.get('APP_SECRET'),
        'code': code,
        'redirect_uri': app.config.get('REDIRECT_URI'),
        'grant_type': 'authorization_code',
        'client_id': app.config.get('APP_ID')
    }

    # token exchange endpoint
    oauth_token_x_endpoint = app.config.get(
        'SWTSTORE_URL', 'SWTSTORE_URL') + '/oauth/token'
    resp = requests.post(oauth_token_x_endpoint, data=payload)
    auth_tok = json.loads(resp.text)

    if 'error' in auth_tok:
        return make_response(auth_tok['error'], 200)

    # set sessions etc
    session['auth_tok'] = auth_tok
    session['auth_tok']['issued'] = datetime.utcnow()
    return redirect(url_for('index'))
@app.route('/admin', methods=['GET', 'POST'])
def admin():
  error = None
  if request.method == 'POST':
    phone = request.form.get('usertel')
    print repr(phone)
  return render_template('admin.html')


@app.route('/upload', methods=['GET', 'POST'])
def upload():
  return render_template('upload_url.html')


#@app.route('/login', methods=['POST', 'GET'])
#def login():
#  error = None
#  if request.method == 'POST':
#    user=requests.get('http://da.pantoto.org/api/user', params={'phone':
#      '+91'+request.form.get('phonenumber'), 'key': request.form.get('passcode') })
#    return redirect(url_for('index'))
#    print repr(user.json()) 

  #  the code below is executed if the request method
  # was GET or the credentials were invalid
#  return render_template('login.html', error=error)



if __name__ == '__main__' : 
  app.run(debug=app.config.get('DEBUG'), host=app.config.get('HOST'))
