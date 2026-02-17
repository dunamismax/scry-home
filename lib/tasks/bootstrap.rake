# frozen_string_literal: true

require 'scry/helpers'

REPO_ROOT = File.expand_path('../..', __dir__)
REQUIRED_TOOLS = %w[ruby bundler git curl].freeze

namespace :scry do
  desc 'Bootstrap root dependencies and managed projects'
  task :bootstrap do
    include Scry::Helpers

    log_step 'Checking prerequisites'
    REQUIRED_TOOLS.each do |tool|
      raise "Missing required tool: #{tool}" unless command_exists?(tool)

      puts "ok: #{tool}"
    end

    log_step 'Installing root dependencies'
    run_or_throw(%w[bundle install], cwd: REPO_ROOT)

    log_step 'Installing managed project dependencies'
    run_or_throw(%w[bundle exec rake scry:projects:install], cwd: REPO_ROOT)

    log_step 'Preparing local storage defaults'
    run_or_throw(%w[bundle exec rake scry:setup:storage], cwd: REPO_ROOT)

    log_step 'Bootstrap complete'
    ruby_version = run_or_throw(%w[ruby --version], quiet: true)
    bundler_version = run_or_throw(%w[bundler --version], quiet: true)
    puts "ruby: #{ruby_version}"
    puts "bundler: #{bundler_version}"
  end
end
