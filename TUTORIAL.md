# Celestial Bodies Database

> Welcome! Are you ready to build a database of the universe?

## 1. Instructions

Create your database by logging in to psql with the command `psql --username=freecodecamp --dbname=postgres`. You can query the database in your script with `psql --username=freecodecamp --dbname=salon -c "SQL QUERY HERE"` Be sure to get creative, and have fun!

**Don't forget to connect to your database to add tables after you create it** :smile:

### 1.1

Complete the tasks below

#### SUBTASKS

- You should create a database named `salon`
- You should connect to your database, then create tables named `customers`, `appointments`, and `services`
- Each table should have a primary key column that automatically increments
- Each primary key column should follow the naming convention, `table_name_id`. For example, the `customers` table should have a `customer_id` key. Note that there’s no `s` at the end of `customer`
- Your `appointments` table should have a `customer_id` foreign key that references the `customer_id` column from the `customers` table
- Your `appointments` table should have a `service_id` foreign key that references the `service_id` column from the `services` table
- Your `customers` table should have `phone` and `name` columns
- Your `services` table should have a `name` column
- Your `appointments` table should have a `time` column
- You should have at least three rows in your `services` table for the different services you offer
- You should create a script file named `salon.sh` in the `project` folder
- Your script file should have a “shebang!” that uses bash when the file is executed (use `#! /bin/bash`)
- Your script file should have executable permissions
- You should not use the `clear` command in your script
- You should greet users with a numbered list of the services you offer 
- Your script should prompt users to enter a service, phone number, a name if they aren’t already a customer, and a time
- If a phone number entered doesn’t exist, you should get the customers name and enter it and the phone number into the `customers` table
- You can create an appointment in your database by running your script and entering `1`, `555-555-5555`, `Fabio`, `10:30` at each request for input if that phone number isn’t in the `customers` table
- You can create another appointment in your database by running your script and entering `2`, `555-555-5555`, `noon` at each request for input if that phone number is already in the database
- After an appointment is successfully added, you should output the message `I have put you down for a <service> at <time>, <name>.` For example, if the user chooses `cut` as the service, `10:30` is entered for the time, and their name is `Fabio` in the database the output would be `I have put your down for a cut at 10:30, Fabio.`
