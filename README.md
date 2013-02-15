# Overview
Feedbacklooper is a prototype system for managment of written assignments and composition feedback in foreign/second language education. The current version is geared towards use in Japanese education but future versions will support different languages.

Currently, Feedbacklooper provides the following functionality
* creating assignments (Teacher)
* turning in compositions in response to assignments (student)
* review compositions (Teacher/student)
* giving feedback to compositions (Teacher)
* responding to feedback (student)
* reviewing feedback and responses (Teacher/student)

# Setup
## System requirements
*nix,
Ruby 1.9+,
sqlite3 

(client requirements: Safari)

## Install gems
bundle install

## setup test db
ruby util/db-setup.rb

## start server on port 8080
ruby master-frontend.rb

# Usage
Access http://localhost:8080/login and login as either 'Teacher', or any of the students 'Joel', 'Thomas', 'Timor' or 'Robert'

Try logging in as a student, submit a composition, log out and log back in as the teacher and add feedback to the composition.