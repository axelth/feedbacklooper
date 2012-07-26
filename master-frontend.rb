require 'erb'
require 'sinatra/base'
require 'datamapper'

class Student
  include DataMapper::Resource
  property :id, Serial
  property :name, String, :required => true
  has n, :assignments
end
class Assignment
  include DataMapper::Resource
  property :id, Serial
  property :content, Text, :required => true
  
  belongs_to :student
  has n, :errortags
end
class Errortag
  include DataMapper::Resource
  property :id, Serial
  property :ordering, Integer
  property :start, Integer
  property :end, Integer
  property :string String
  property :type String
  property :action String

  has one, :correction 
end
class MasterFrontend < Sinatra::Base

end
