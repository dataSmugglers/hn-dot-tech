'use strict'

module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
          build: 'build',
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
        less: {
          debug: {
            files: {
              'build/css/layout.css' : 'public/css/layout.less',
              'build/css/home.css' : 'public/css/home.less'
            }
          },
          release: { 
            files: {
                'build/css/all.css': ['public/css/**/*.less']
            }
          }
        },
        jshint: {
          client: {
            src: [
            'public/javascript/**/*.js',
            '!public/js/vendor',
            'Gruntfile.js',
            'controllers/**/*.js',
            'models/**/*.js',
            'routes/**/*.js',
            ],
            options: {
              jshintrc: 'public/.jshintrc'
            }

          },
          server: {
            src: [
            'server/**/*.js',
            'app.js',
            'www/**/*.js',
            ],
            options: {
              jshintrc: 'public/.jshintrc'
            }
          },
          build: {
            src: {
              ['Gruntfile.js']
            },
            options: {
              jshintrc: 'public/.jshintrc'
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
              'views/**/*.html'
            ]
          },
          js: {
            // TODO: Why does GM copy files after linting?
            files: 
            [
              'public/js/**/*.js', 'controllers/**/*.js',
              'models/**/*.js', 'routes/**/*.js'
            ],
            tasks: ['jshint:client']
          },
          lint_server: {
            files: ['app.js', 'bin/www.js'],
            tasks: ['jshint:server']
          },
          less: {
            files: ['public/css/**/*.less'],
            tasks: ['less:debug']
          },

          // TODO: add Grunt task for pug!
          
          rebuild: {
            files: ['Gruntfile.js'],
            tasks: ['jshint:build', 'build:debug'],
          }
        },
        nodemon: {
          dev: {
            script: 'app.js'
          }
        },
        concurrent: {
          dev: {
            tasks: ['nodemon', 'watch'],
            options: {
            }
          }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-spritesmith');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');
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
    grunt.registerTask('build:debug', ['jshint', 'less:debug', 'pug:debug']);
    grunt.registerTask('build:release', ['jshint', 'less:release', 'pug:release']);
};
