module.exports = function (grunt) {
    grunt.initConfig({
        jshint: ['Gruntfile.js'] 
    });
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('default', ['jshint']); // register a default task alias
};
