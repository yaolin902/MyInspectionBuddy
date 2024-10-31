Python 3.12.5 (v3.12.5:ff3bc82f7c9, Aug  7 2024, 05:32:06) [Clang 13.0.0 (clang-1300.0.29.30)] on darwin
Type "help", "copyright", "credits" or "license()" for more information.
from flask import Flask, render_template, request, redirect, session, flash
from flask_mysqldb import MySQL
import MySQLdb.cursors
import hashlib
import os
from datetime import timedelta

app = Flask(__name__)

# Configure MySQL connection
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'SQLusername'
app.config['MYSQL_PASSWORD'] = 'password'
app.config['MYSQL_DB'] = 'database_name'

mysql = MySQL(app)

# Set secret key for session management
app.secret_key = os.urandom(24)

# Set session parameters
@app.before_request
def set_session_lifetime():
    session.permanent = True
    app.permanent_session_lifetime = timedelta(minutes=15)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if checklogin_mysql(username, password):
            session['authenticated'] = True
            session['username'] = username
            session['browser'] = request.headers.get('User-Agent')
            return redirect('/dashboard')
        else:
            session.clear()
...             flash('Invalid username/password', 'danger')
...             return redirect('/login')
...     return render_template('login.html')
... 
... @app.route('/dashboard')
... def dashboard():
...     if not session.get('authenticated'):
...         session.clear()
...         flash('You have not logged in. Please login first!', 'warning')
...         return redirect('/login')
...     if session.get('browser') != request.headers.get('User-Agent'):
...         session.clear()
...         flash('Session hijacking attack is detected!', 'danger')
...         return redirect('/login')
... 
...     return render_template('dashboard.html', username=session['username'])
... 
... def checklogin_mysql(username, password):
...     cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
...     hashed_password = hashlib.md5(password.encode()).hexdigest()
... 
...     # Allow login only if both username and password are ' '
...     if username == ' ' and password == ' ':
...         return True
... 
...     cursor.execute('SELECT * FROM users WHERE username = %s AND password = %s', (username, hashed_password))
...     account = cursor.fetchone()
...     cursor.close()
...     if account:
...         return True
...     return False
... 
... @app.route('/logout')
... def logout():
...     session.clear()
...     return redirect('/login')
... 
... if __name__ == '__main__':
