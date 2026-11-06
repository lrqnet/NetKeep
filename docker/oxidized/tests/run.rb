# Run the upstream regression suite against NetKeep's installed 0.37.0 engine.
require 'json'
require 'digest'
Dir.chdir(__dir__)
require 'oxidized'
manifest = JSON.parse(File.read('/usr/local/share/netkeep-oxidized/upstream.json'))
root = Gem::Specification.find_by_name('oxidized').full_gem_path
manifest.fetch('files').each do |path, sha|
  abort "Installed file differs: #{path}" unless Digest::SHA256.file("#{root}/#{path}").hexdigest == sha
  require path.delete_prefix('lib/').delete_suffix('.rb')
end
Dir[File.join(__dir__, 'spec/**/*_spec.rb')].sort.each { |path| require path }
