module.exports = function (grunt) {
    grunt.initConfig({
        timestamp: {
          options: {
            file: 'your/file/path'
          }
        },
        clean: {
          js: 'build/js',
          css: 'build/css',
        },
        sprite: {
          icons: {
            src: 'public/img/icons/*.png',
            destImg: 'build/img/icons.png',
            destCSS: 'build/css/icons.css'
          }
        },
        jade: {
          debug: {
            options: {
              pretty: true
            },
            files: {
              'build/views/home.html': 'public/views/home.jade'
            }
          },
          release: {
            files: {
              'build/views/home.html': 'public/views/home.jade'
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
          client: [
            'public/js/**/*.js',
            '!public/js/vendor',
            'Gruntfile.js'
          ],
          server: ['server/**/*.js'],
          support: ['Gruntfile.js']
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
          rebuild: {
            tasks: ['build:debug'],
            files: ['public/**/*']
          }
        },
        nodemon: {
          dev: {
            script: 'app.js'
          }
        },
        concurrent: {
          dev: {
            tasks: ['nodemon', 'watch']
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
    grunt.registerTask('build:debug', ['jshint', 'less:debug', 'jade:debug']);
    grunt.registerTask('build:release', ['jshint', 'less:release', 'jade:release']);
};
