if RUBY_PLATFORM == 'java'
  require 'java'
  require 'lib/sqlite-jdbc-3.5.9.jar'
end
require 'erb'
require 'sinatra/base'
require 'sinatra/partial'
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
  has n, :errortags, :through => :compositions
  has n, :responses, :through => :errortags
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
  belongs_to :student
  has n, :responses
end

class Response
  include DataMapper::Resource
  property :id, Serial
  property :understanding, String, :required => true
  # I must change the name of this property to "response" here and in the view
  property :comment, String

  belongs_to :errortag
  belongs_to :student
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
  helpers do
    # Wrap text included in an errortag in a span tag.
    # the modifier variable keeps count of how many characters of markup has
    # been added to the original string.
    def highlight_error(text, offsets)
      modifier = 0
      content = text.gsub("\r\n","\n")
      offsets.each do |o|
        content.insert(o[0] + modifier, '<span class="error">')
        modifier += 20
        content.insert(o[1] + modifier, '</span>')
        modifier += 7
      end
      return content.gsub("\n","<br>")
    end
    def confirm_or_redirect_user_type(user_type)
      unless session[:usertype] == user_type
        if session[:usertype].nil?
          redirect to '/login'
        else
          @user_type = user_type
          @redirect_url = if user_type == 'Teacher'
                            '/student/dashboard'
                          else
                            '/teacher/dashboard'
                          end
          erb :wronguser
          halt
        end
      end  
    end
  end
  # configuration
  register Sinatra::Partial
  set :partial_template_engine, :erb
  set :sessions, true
  
  # before filters
  before '/teacher/*' do
    confirm_or_redirect_user_type('Teacher')
  end
  before '/student/*' do
    confirm_or_redirect_user_type('Student')
  end
  get '/login' do
    erb :login
  end
  get '/login/submit' do
    if params[:usertype] == 'Teacher'
      session[:usertype] = 'Teacher'
      redirect to '/teacher/dashboard'
    elsif Student.first(name: params[:username])
      session[:usertype] = "Student"
      session[:student_id] = Student.first(name: params[:username]).id
      redirect to '/assignments'
    else
      redirect to '/login'
    end
  end
  get '/teacher/dashboard/?' do

    @assignments = Assignment.all.collect do |a|
      [a, Composition.all(assignment: a).length]
    end

    @compositions = Composition.all(errortags: nil,limit: 10)
    
    @responses = Response.all(limit: 10)
    erb :t_dashboard
  end
  get '/teacher/assignments/:id' do
    @assignment = Assignment.get(params[:id])
    @compositions = Composition.all(:assignment => @assignment)
    erb :show_assignment
  end
  get '/teacher/feedback/:id' do
    @composition = Composition.get(params[:id])
    erb :t_feedback
  end
  # This path is used in both t_feedback.erb and
  # master-frontend.js; in the correctionform
  # building code. This clumsy code needs to be changed.
  post '/teacher/feedback/:id' do
    @composition = Composition.get(params[:id])
    @student = Student.get(@composition.student_id)
    @errors = Hash[params.find_all {|k,v| k =~ /^[0-9]+$/ }]
    @errors.each do |k,v|
      e = Errortag.new(v)
      e.composition = @composition
      e.student = @student
      e.save
    end
    redirect to '/teacher/dashboard'
  end

  get '/assignments' do
    @assignments = Assignment.all
    erb :assignments
  end
  get '/assignments/:title' do
    @assignments = Assignment.all(params[:title])
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
  get '/compositions' do
    if session[:usertype] == "Teacher"
      @compositions = Composition.all(:errortags => nil)
    else
      @compositions = Composition.all(:student_id => session[:student_id])
    end
    erb :compositions
  end

  get '/respond/:id' do
    @composition = Composition.get(params[:id])
    @errors = Errortag.all(composition_id: params[:id])
    @offsets = @errors.collect {|e| [e.start,e.end]}
    @composition.content = highlight_error(@composition.content, @offsets)
    erb :respond
  end
  post '/respond' do
    @responses = Hash[params.find_all {|k,v| k =~ /^[0-9]+$/ }]
    @responses.each do |k,v|
      r = Response.new(v)
      r.errortag = Errortag.get(k)
      r.student = r.errortag.student
      r.save
    end
    '<h1>Responses registered!</h1>'
  end
  get '/showparam' do
    params
  end
  run! if app_file == $0
end

