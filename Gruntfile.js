'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
          build: 'build',
        },
        // used by the changelog task
        pkg: grunt.file.readJSON('package.json'),

        bump: {
          options: {
            updateConfigs: ['pkg'],
            commitFiles: ['package.json', 'CHANGELOG.md'],
            //commit: true,
            //createTag: true,
            //push: true,
            pushTo: 'origin'
          }
        },
        conventionalChangelog: {
          options: {
            editor: 'vim',
            github: 'git://github.com/dataSmugglers/hn-dot-tech.git'
          }
        },
        sprite: {
          icons: {
            src: 'public/img/icons/*.png',
            destImg: 'build/img/icons.png',
            destCSS: 'build/css/icons.css'
          }
        },
        pug: {
          debug: {
            options: {
              pretty: true
            },
            files: {
              'build/views/index.html': 'public/views/index.pug'
            }
          },
          release: {
            files: {
              'build/views/index.html': 'public/views/index.pug'
            }
          }
        },
        uglify: {
          bundle: {
            files: {
              'build/js/bundle.min.js': 'build/js/bundle.js'
            }
          },
          cobra: {
            files: {
              'build/js/cobra.min.js': 'public/js/cobra.js'
            }
          }
        },
        concat: {
          js: {
            files: {
              'build/js/bundle.js': 'public/js/**/*.js'
            }
          }
        },
        jshint: {
          client: {
            src: [
            './public/javascripts/**/*.js',
            ],
            options: {
              jshintrc: 'public/.jshintrc',
              reporterOutput: ''
            }

          },
          server: {
            src: [
            'server/**/*.js',
            'app.js',
            'www/**/*.js',
            ],
            options: {
              jshintrc: '.jshintrc',
              reporterOutput: ''
            }
          },
          build: {
            src: ['Gruntfile.js'],
            options: {
              jshintrc: '.jshintrc',
              reporterOutput: ''
            }
          }
        },
        watch: { // TODO: This should be fixed to only re-build what was changed
          livereload: {
            options: {
              livereload: true
            },
            files: [
              'public/**/*.{css,js}',
              'views/**/*.{html,pug}'
            ]
          },
          js: {
            // TODO: Why does author copy files after linting?
            files: [ 'public/js/**/*.js'],
            tasks: ['jshint:client']
          },
          lint_server: {
            files: ['app.js', 'bin/www', 'server/**/*.js'
            ],
            tasks: ['jshint:server']
          },
          rebuild: {
            files: ['Gruntfile.js'],
            tasks: ['jshint:build', 'build:debug'],
          }
        },
        copy: {
          js_debug: {
            expand: true,
            cwd: 'public/javascripts',
            src: '**/*.js',
            dest: 'build/javascripts/'
          }
        },
        nodemon: {
          dev: {
            script: 'bin/www',
            env: {
              DEBUG: 'hn-dot-tech:*'
            }
          }
        },
        concurrent: {
          dev: {
            tasks: ['nodemon', 'watch'],
            options: {
              logConcurrentOutput: true
            }
          }
        }
    });
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-spritesmith');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-conventional-changelog');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-contrib-pug');
    grunt.registerTask('default', ['jshint']); // register a default task alias
    grunt.registerTask('js', 'Concatenate and minify static JavaScript assets',
      ['concat:js', 'uglify:bundle']);
    grunt.registerTask('timestamp', function() {
      var options = this.options({
        file: '.timestamp'
      });
      var timestamp = +new Date();
      var contents = timestamp.toString();

      grunt.file.write(options.file, contents);
    });
    // TODO: See if we need a build task for pug
    grunt.registerTask('build:debug', "Lint and Compile", ['jshint']);
    grunt.registerTask('build:release', ['jshint', 'less:release', 'pug:release']);
    grunt.registerTask('dev', ['build:debug', 'concurrent']);
    grunt.registerTask('notes', ['bump-only', 'conventionalChangelog', 'bump-commit']);
};
