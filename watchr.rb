CoffeeScriptFiles = Dir['*.coffee', 'test/*.coffee']

def log_and_run(command)
  puts "[watchr] #{command}"
  system command
end

def compile_coffeescript(source_files, output_filename)
  source_files = source_files.respond_to?(:join) ? source_files.join(' ') : source_files
  log_and_run "coffee -j build/#{output_filename}.js -c #{source_files}"
end

def build_knockback_test
  test_files = [
    'test/fixtures.coffee',
    'test/fixtures.models.coffee',
    'test/fixtures.controllers.coffee',
    'test/knockback_model_test.coffee',
    'test/knockback_controller_test.coffee'
  ]
  compile_coffeescript test_files, 'knockback_test'
end

def build_knockback
  knockback_files = [
    'lib/knockback.coffee',
    'lib/knockback.model.coffee',
    'lib/knockback.controller.coffee',
  ]
  compile_coffeescript knockback_files, 'knockback'
end

# Compile all coffeescript on startup
build_knockback
build_knockback_test

watch('lib/.*\.coffee') { build_knockback }
watch('test/.*\.coffee') { build_knockback_test }
