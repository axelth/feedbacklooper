# Setup
## System requirements
*nix,
Ruby 1.9+,
sqlite3 

## Install gems
bundle install

## setup test db
ruby util/db-setup.rb

## start server on port 8080
ruby master-frontend.rb

# Usage
Access http://localhost:8080/login and login as either 'Teacher', or any of the students 'Joel', 'Thomas', 'Timor' or 'Robert'

Try logging in as a student, submit a composition, log out and log back in as the teacher and add feedback to the composition.