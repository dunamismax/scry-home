# frozen_string_literal: true

require 'fileutils'
require 'scry/helpers'

namespace :scry do
  namespace :setup do
    desc 'Ensure storage-related env defaults exist'
    task :storage do
      include Scry::Helpers

      repo_root = File.expand_path('../..', __dir__)
      env_example = ENV.fetch('SCRY_INFRA_ENV_EXAMPLE', File.join(repo_root, 'infra', '.env.example'))
      env_path = ENV.fetch('SCRY_INFRA_ENV_FILE', File.join(repo_root, 'infra', '.env'))

      log_step 'Ensuring infra env file'
      raise "Missing infra env example: #{env_example}" unless File.exist?(env_example)

      if File.exist?(env_path)
        template = File.read(env_example)
        current = File.read(env_path)

        current_keys = current.lines
                              .map(&:strip)
                              .reject { |l| l.empty? || l.start_with?('#') }
                              .map do |l|
                                l.split(
                                  '=', 2
                                ).first.strip
        end
                                                                                          .compact
                                                                                          .to_set

        missing_lines = template.lines
                                .map(&:strip)
                                .reject { |l| l.empty? || l.start_with?('#') }
                                .reject do |l|
                                  current_keys.include?(l.split(
                                    '=', 2
                                  ).first.strip)
        end

        if missing_lines.empty?
          puts "exists: #{env_path}"
        else
          updated = "#{current.rstrip}\n\n#{missing_lines.join("\n")}\n"
          File.write(env_path, updated)
          puts "updated: #{env_path}"
          missing_lines.each { |l| puts "added: #{l.split('=', 2).first}" }
        end
      else
        FileUtils.cp(env_example, env_path)
        puts "created: #{env_path}"
      end

      log_step 'Storage defaults ready'
    end
  end
end
