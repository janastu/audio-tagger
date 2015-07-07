from flask import Flask, session, render_template, request, redirect, url_for
from flask.ext.session import Session
import requests



app = Flask(__name__)
app.config.from_object(__name__)

#TODO Session management

#Session(app)
#@app.route('/set/')
#def set():
#  session['key'] = 'value'
#  return 'ok'

#@app.route('/get/')
#def get():
#  return session.get('key', 'not set')
#sess = Session()


@app.route('/', methods=['GET'])
def index():
  return render_template('index.html') 

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

@app.route('/login', methods=['POST', 'GET'])
def login():
  error = None
  if request.method == 'POST':
    user=requests.get('http://192.168.1.11:5000/user?', params={'phone':
      '+91'+request.form.get('phonenumber'), 'key': request.form.get('passcode') })
    return redirect(url_for('admin'))
    print repr(user.json()) 

  #  the code below is executed if the request method
  # was GET or the credentials were invalid
  return render_template('login.html', error=error)



if __name__ == '__main__' : 
  app.run(debug=True, host= '0.0.0.0')
