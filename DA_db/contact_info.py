# This Python script uses SQLite to create a Data Base File
# The database table is populated with contact info collected from an Excel CSV file

import sqlite3
import csv

# Create new database and open database connection
con = sqlite3.connect("contact_info.db")

# Execute SQL statements and fetch results with database cursor object
cur = con.cursor()

# Drop table if already exists to avoid errors
cur.execute("DROP TABLE IF EXISTS contact")

# Create contact table in database 
# TBD: Column Names?
cur.execute("CREATE TABLE contact(County TEXT, Name TEXT, Address TEXT, Phone TEXT, Fax TEXT, Link_to_Website TEXT)")


# List of data to store in the contact table of the database
contact_list = []

# TBD: Can also webscrape?
# Open csv in read mode
with open('info.csv', mode='r', newline='') as file1:
    csv_reader = csv.reader(file1) # Object to read the file
    next(csv_reader) # Skip header

    # Iterate through each row in info.csv
    for row in csv_reader:
        # Append to add elements of row to contact_list
        contact_list.append(((row[0]), row[1], row[2], row[3], row[4], row[5]))


# Insert multiple rows into contact_list
cur.executemany("INSERT INTO contact VALUES(?, ?, ?, ?, ?, ?)", contact_list)

# Commit transaction to save inserted data and changes
con.commit()

# Print
for i in cur.execute("SELECT  * FROM contact"):
    print(i)

# Close existing connection
con.close()