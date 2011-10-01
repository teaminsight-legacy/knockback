desc 'compile coffeescript to javascript'
task 'build' do
  source_files = Dir['*.coffee', 'test/*.coffee'].join(' ')
  sh "coffee -o build -c #{source_files}"
end

desc 'remove compiled files'
task 'clean' do
  sh 'rm -r build/*'
end
