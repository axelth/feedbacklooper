if RUBY_PLATFORM == 'java'
  require 'java'
  require 'lib/sqlite-jdbc-3.5.9.jar'
end
require 'erb'
require 'sinatra/base'
require 'data_mapper'
require 'dm-sqlite-adapter'

DataMapper.setup(:default, "sqlite3://#{Dir.pwd}/db/database.db")

class Teacher
  include DataMapper::Resource
  property :id, Serial
  property :name, String, :required => true
end

class Student
  include DataMapper::Resource
  property :id, Serial
  property :name, String, :required => true

  has n, :compositions
end

class Assignment
  include DataMapper::Resource
  property :id, Serial
  property :title, String
  property :active, Boolean

  has n, :compositions
end

class Composition
  include DataMapper::Resource
  property :id, Serial
  property :content, Text, :required => true
  property :created_at, DateTime
  
  belongs_to :student
  belongs_to :assignment
  has n, :errortags
end

class Errortag
  include DataMapper::Resource
  property :id, Serial
  property :start, Integer
  property :end, Integer
  property :string, String
  property :type, String
  property :action, String
  property :correction, String
  property :comment, String

  belongs_to :composition
end

class Response
  include DataMapper::Resource
  property :id, Serial
  property :understanding, String, :required => true
  property :comment, String

  belongs_to :errortag
end

#For a start, let's let the feedback be part of the errortag object
# class Feedback
#   include DataMapper::Resource
#   property :id, Serial
#   property :correction, String
#   property :comment, String
#
#   belongs_to :errortag
# end

DataMapper.finalize

class MasterFrontend < Sinatra::Base
  before do
    @data = request.body.read
  end
  get '/assignments' do
    @assignments = Assignment.all
    erb :assignments
  end
  get '/assignments/:id' do
    @assignment = Assignment.get(params[:id])
    erb :show_assignment
  end
  get '/compositions/new' do
    #here I must add a reference to session user_id as well
    @assignment = params[:assignment]
    erb :new_composition
  end
  post '/compositions/new' do
    @assignment = params[:assignment_id]
    @content = params[:maintext]
    @student = Student.first(name: params[:student_name]).id
    Composition.create(content: @content, student_id: @student, assignment_id: @assignment)
    redirect '/assignments'
  end
  get '/feedback/:id' do
    @composition = Composition.get(params[:id])
    erb :feedback
  end
  post '/feedback/:id' do
    params
  end
  get '/showparam' do
    params[:query]
  end
  run! if app_file == $0
end

