define(function (require, exports, module) {
  var Controller = require('core/Controller');

  module.exports = Controller.extend({
    el: 'body',

    events: {
      'click .jHelloWorld': 'onClickHelloWorld',
      'click .jThrowError': 'onClickThrowError',
      'click .jUndefinedError': 'onClickUndefinedError',
      'click .jAjax': 'onClickAjax'
    },

    initialize: function () {

    },

    onClickHelloWorld: function() {
      console.log('Hello World');
    },

    onClickThrowError: function() {
      throw 'Error';
    },

    onClickUndefinedError: function() {
      a + b;
    },

    onClickAjax: function() {
      $.ajax({
        type: 'POST',
        url: 'http://www.qq.com',
        data: {
          name: 'oliver',
          password: '123123'
        }
      });
    }
  });

});
