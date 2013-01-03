# encoding: UTF-8
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
  property :description, String, :length => 400
  property :deadline, Date

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

  def sentence_arr
    text = self.composition.content
    sent_start = text.rindex(/[。？?！!\n]/,self.start) || 0
    sent_start += 1 if sent_start > 0
    sent_end = text.index(/[。？?！!\n]/,self.end) || -1
    before = text[sent_start..[(self.start - 1),0].max].strip
    after = text[self.end..sent_end].strip
    return [before, self.string, after]
  end

  def styled_string(string, class_str)
    return "<span class=\"#{class_str}\">#{string}</span>"
  end

  def styled_line_with_breaks(length=25)
    # arr = [before, error, after]
    arr = self.sentence_arr
    if arr.inject(0) {|t,f| t += f.length} <= length
      return arr[0] + self.styled_string(arr[1],"error") + arr[2]
    end
    # Find out how many time length fits  before and after the error
    pre = [arr[0].length / length, arr[0].length % length]
    post = [arr[2].length / length, arr[0].length % length]
    # Insert the correct number of linebreaks
    if pre[0] > 0
      modifier = 0
      1.upto(pre[0]) do |i|
        arr[0].insert((i * length) + modifier, "<br />")
        modifier += 6
      end
    end
    modifier = 0
    if pre[1] + arr[1].length > length
      arr[2].prepend('<br />')
      modifier = 6
    end
    if post[0] > 0
      1.upto(post[0]) do |i|
        arr[2].insert((i * length) + modifier, "<br />")
        modifier += 6
      end
    end
    
    return arr[0] + self.styled_string(arr[1], "error") + arr[2]
  end
  def styled_line_no_breaks
    arr = self.sentence_arr
    return arr[0] + self.styled_string(arr[1], "error") + arr[2]
  end
  def sentence
    self.sentence_arr.join("")
  end
  def trunc_string
    if @string.length > 7
      return @string[0..7] + "…"
    else
      return @string
    end
  end
end

class Response
  include DataMapper::Resource
  property :id, Serial
  property :understanding, String, :required => true
  # I must change the name of this property to "response" here and in the view
  property :comment, String
  property :viewed, Boolean, :default => false
  
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
          @the_path = request.path_info
          @user_type = user_type
          @redirect_url = if user_type == 'Teacher'
                            url '/student/dashboard'
                          else
                            url '/teacher/dashboard'
                          end
          redirect to '/wronguser?url='+ @the_path + '&' + 'redirect=' + @redirect_url
        end
      end  
    end
  end
  # configuration
  register Sinatra::Partial
  set :port, 8080
  set :partial_template_engine, :erb
  set :sessions, true
  set :logging, true
  
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
      session[:studentname] = params[:username]
      session[:student_id] = Student.first(name: params[:username]).id
      redirect to '/student/dashboard'
    else
      redirect to '/login'
    end
  end
  get '/teacher/dashboard/?' do
    @assignments = Assignment.all.collect do |a|
      [a, Composition.all(assignment: a).length]
    end
    @compositions = Composition.all(errortags: nil,limit: 10)
    @responses = Response.all(viewed: false, limit: 10)
    erb :t_dashboard
  end

  get '/teacher/assignments/new' do
    erb :t_new_assignment
  end
  get '/teacher/assignments/:id' do
    @assignment = Assignment.get(params[:id])
    @compositions = Composition.all(:assignment => @assignment)
    erb :t_show_assignment
  end
  post '/teacher/assignment' do
    title = params[:title]
    description = params[:description]
    datearr = params[:date].split("-").map {|c| c.to_i}
    Assignment.create(title: title,description: description,deadline: Date.new(*datearr))
    redirect to '/teacher/dashboard'
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
    unless @composition.errortags.empty?
      @composition.errortags.destroy
    end
    @errors = Hash[params.find_all {|k,v| k =~ /^[0-9]+$/ }]
    @errors.each do |k,v|
      e = Errortag.new(v)
      e.composition = @composition
      e.student = @student
      e.save
    end
    redirect to '/teacher/dashboard'
  end
  get '/teacher/compositions' do
    @compositions = Composition.all
    erb :t_compositions
  end
  get '/teacher/compositions/json/:id' do
    content_type :json
    Composition.get(params[:id]).to_json
  end
  get '/teacher/compositions/*/errors' do
    composition = Composition.get(params[:splat])
    errortags = composition.errortags
    content_type :json
    errortags.to_json
  end
  get '/teacher/errors' do
    @errortags = Errortag.all.collect do |e|
      [Student.get(e.student_id).name,
       e.type,
       e.string,
       e.correction,
       e.styled_line_with_breaks,
       Assignment.get(Composition.get(e.composition_id).assignment_id).title]
      end
    
    erb :t_errors
  end
  get '/student/dashboard/?' do
    @student = Student.get(session[:student_id])
    @assignments = Assignment.all- @student.compositions.assignments
    @feedback = @student.errortags
    @compositions = @student.compositions
    erb :s_dashboard
  end
  get '/student/compositions/new/:id' do
    @assignment = Assignment.get(params[:id])
    erb :s_new_composition
  end
  post '/student/compositions/new' do
    @assignment = params[:assignment_id]
    @content = params[:maintext]
    @student = Student.first(name: params[:student_name]).id
    Composition.create(content: @content, student_id: @student, assignment_id: @assignment)
    redirect to '/student/dashboard'
  end
# rewrite s_respond to be a partial that give only the response form
# draw them together with the composition if there is feedback to respond to
  get '/student/composition/:id' do
    return "作文を表示するページ"
  end
  get '/student/respond/:id' do
    @composition = Composition.get(params[:id])
    @errors = Errortag.all(composition_id: params[:id])
    @offsets = @errors.collect {|e| [e.start,e.end]}
    @composition.content = @composition.content #highlight_error(@composition.content, @offsets)
    erb :s_respond
  end
  post '/student/respond' do
    @responses = Hash[params.find_all {|k,v| k =~ /^[0-9]+$/ }]
    @responses.each do |k,v|
      r = Response.new(v)
      r.errortag = Errortag.get(k)
      r.student = r.errortag.student
      r.save
    end
    redirect to '/student/dashboard'
  end
  get '/student/compositions/*/errors' do
    composition = Student.first(name: session[:studentname]).compositions.get(params[:splat])
    errortags = composition.errortags
    content_type :json
    errortags.to_json    
  end
  get '/wronguser' do
    erb :wronguser
  end
  get '/showparams' do
    params
  end
  post '/showparams' do
    params
  end
  run! if app_file == $0
end

