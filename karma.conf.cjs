const path = require('node:path');

module.exports = (config) => {
  config.set({
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-coverage'),
    ],
    browsers: ['Chrome'],
    reporters: ['progress'],
    coverageReporter: {
      dir: path.join(__dirname, 'coverage/wirdlink'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'lcovonly' }, { type: 'text-summary' }],
    },
    restartOnFileChange: true,
  });
};
