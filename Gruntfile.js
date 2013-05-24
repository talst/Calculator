module.exports = function(grunt) {
  grunt.initConfig({
	  notify_hooks: {
	    options: {
	      enabled: true,
	      title: "d3up-calc"
	    }
	  },
		watch: {
		  scripts: {
		    files: [
					'data/*.json',
					'lib/*.js',
					'test/*.js',
					'test/data/*.json',
					'Gruntfile.js'
				],
		    tasks: ['default']
		  },
		},
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: false,
        boss: true,
        eqnull: true,
        node: true,
        strict: false,
        globals: {
          describe: false,
          it: false,
					setup: false,
					teardown: false,
					window: false,
          suite: false,
          test: false
        }
      },
      all: {
        src: ['grunt.js', 'lib/*.js', 'test/*.js']
      }
    },
	  simplemocha: {
	    options: {
	      timeout: 3000,
	      ui: 'tdd',
	      reporter: 'Spec'
	    },

	    all: { 
				src: ['test/*_test.js'],
			}
	  }
  });

	grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-simple-mocha');

	grunt.task.run('notify_hooks');
	
  grunt.registerTask('default', ['jshint', 'simplemocha']);

	// Travis CI task.
  grunt.registerTask('travis', ['jshint', 'simplemocha']);
};