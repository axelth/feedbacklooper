# encoding: utf-8
# make sure we work in the top-level dir
unless Dir["*"].include? "util" #Dir.pwd =~ /master-frontend$/
  abort "run from top-level with (j)ruby util/db-setup.rb"
end
begin
  puts Dir.pwd
  require "#{Dir.pwd}/master-frontend"
end

begin
  Dir.mkdir("db") unless Dir.exists?("db")
  
  puts "Create tables"
  DataMapper.auto_migrate!
  puts "Create teacher"
  Teacher.create name:"Teacher"
  puts "Create Students"
  %w{Joel Thomas Robert Timor}.each do |s|
    Student.create name:"#{s}"
  end
  puts "Create Assignments"
  d = Time.now + (4 * 7 * 24 * 60 * 60)
  %w{Family Hometown Future}.each do |a|
    Assignment.create title: "#{a}",description: "",deadline: Date.new(d.year, d.month, d.day)
  end
  ["Write about your family", "Write about your hometown", "Write about you future"].each_with_index do |d,i|
    Assignment.get(i + 1).update(description: d)
  end
  #puts "Create Compositions"
#  texts.each do |path,t|
#    text = File.open(path,'r').read
 #   student = t[4..8]
  #  assignment = t[10..11]
   # Composition.create content: text, student_id: Student.first(name: student).id, assignment_id: Assignment.first(title: assignment).id
  #end
end
