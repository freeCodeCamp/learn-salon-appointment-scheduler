# Celestial Bodies Database

> Welcome! Are you ready to build a database of the universe?

## 1. Instructions

For this project, you need to log in to psql. Do that by entering `psql --username=freecodecamp --dbname=postgres` in the terminal. Be sure to get creative, and have fun!

**Don't forget to connect to your database after you create it** :smile:

### 1.1

Complete the tasks below

#### SUBTASKS

- You should create a database named `salon`
- Be sure to connect to your database, then create tables named `customers`, `appointments`, and `services`
- Each table should have a primary key column that automatically increments
- Each primary key column should follow the naming convention, `table_name_id`. For example, the `customers` table should have a `customer_id` key. Note that there’s no `s` at the end of `customer` for these
- The `appointments` table should have a `customer_id` foreign key that references the `customer_id` column from the `customers` table
- The `appointments` table should have a `service_id` foreign key that references the `service_id` column from the `services` table
- The `customer` table should have a `phone` column
- The `services` table should have a `name` column
- The `appointments` table should have a `time` column
- You should have at least three rows in your `services` table for the different services you offer
- You should create script file named `salon.sh`
- Your script file should have a `shebang!`
- Your script file should have executable permissions
- Your script should prompt users to enter a service, phone number, and time
- You can create an appointment for in your database by running your script and entering `1`, `555-5555`, `2:30` at each request for input
- You can create an appointment in your database by running your script and entering `2`, `555-5555`, `3:30` at each request for input
- You can create an appointment in your database by running your script and entering `3`, `555-5555`, `4:30` at each request for input
- After an appointment is successfully added, you should output the message `I have put you down for a cut at 4:30.` if `cut` is entered for the service and `4:30` is entered for the time.
