let prompt = require('prompt'),
    colors = require("colors/safe"),
    optimist = require('optimist'),
    fs = require('fs')

let period  = require('./utilities/periods')

let schema = {
  properties: {
    are_you_sure: {
      type: 'string',
      description: colors.yellow('SIGINT detected, are you sure you want to exit?'),
      message: 'y or n',
      default: "n",
      conform: function (str) {
        if(str == "y" || str == "n")
          return true
      }
    }
  }
};

module.exports = {
  schema: schema,
  start: () => prompt.start({noHandleSIGINT: true}),
  // start: () => prompt.start(),
  get: prompt.get
}
