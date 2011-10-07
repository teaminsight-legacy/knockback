CoffeeScriptFiles = Dir['*.coffee', 'test/*.coffee']

def log_and_run(command)
  puts "[watchr] #{command}"
  system command
end

def compile_coffeescript(path)
  source_files = path.respond_to?(:join) ? path.join(' ') : path
  log_and_run "coffee -o build -c #{source_files}"
end

compile_coffeescript CoffeeScriptFiles

watch /.*\.coffee/ do |match_data|
  compile_coffeescript match_data[0]
end
