source 'http://rubygems.org'

require 'rbconfig'

gem 'watchr'

case Config::CONFIG['host_os']
when /darwin|mach|osx/i
  gem 'rb-fsevent'
when /sunos|solaris|bsd|linux|unix/i
  gem 'rev'
end
