# make sure we work in the top-level dir
unless Dir.pwd =~ /master-frontend$/
  abort "run from top-level with (j)ruby util/db-setup.rb"
end
begin
  puts Dir.pwd
  require "master-frontend"
end
begin
  DataMapper.auto_migrate!
  
end
