# encoding: utf-8
# make sure we work in the top-level dir
unless Dir["*"].include? "util" #Dir.pwd =~ /master-frontend$/
  abort "run from top-level with (j)ruby util/db-setup.rb"
end
begin
  puts Dir.pwd
  require "#{Dir.pwd}/master-frontend"
end
def get_datapath(path)
  print "enter datapath: "
  datapath = gets.chomp
  return datapath
end
begin
  datapath = ARGV[0] ? ARGV[0] : get_datapath
  texts = Dir["#{datapath}/**/*.txt"].collect do |f|
    [f,File.basename(f)]
  end
  texts = Hash[texts]
  puts "Create tables"
  DataMapper.auto_migrate!
  puts "Create teacher"
  Teacher.create name:"Teacher"
  puts "Create Students"
  texts.values.collect {|t| t[4..8]}.uniq.each do |s|
    Student.create name:"#{s}"
  end
  puts "Create Assignments"
  d = Time.now + (4 * 7 * 24 * 60 * 60)
  texts.values.collect {|t| t[10..11]}.uniq.each do |a|
    Assignment.create title: "#{a}",description: "",deadline: Date.new(d.year, d.month, d.day)
  end
  ["ワープロについて", "昔話", "タバコ・禁煙について", "外国語の学習について", "学習能力について", "大学入学試験について", "料理について", "歴史の出来事について"].each_with_index do |d,i|
    Assignment.get(i + 1).update(description: d)
  end
  puts "Create Compositions"
  texts.each do |path,t|
    text = File.open(path,'r').read
    student = t[4..8]
    assignment = t[10..11]
    Composition.create content: text, student_id: Student.first(name: student).id, assignment_id: Assignment.first(title: assignment).id
  end
end
