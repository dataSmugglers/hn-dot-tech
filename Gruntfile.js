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
          compile: {
            files: {
              'build/css/compiled.css' : 'public/css/**/*.less'
            }
          }
        },
        jshint: {
          client: [
            'public/js/**/*.js',
            '!public/js/vendor',
            'Gruntfile.js'
          ]
        }
    });
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-spritesmith');
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
};
