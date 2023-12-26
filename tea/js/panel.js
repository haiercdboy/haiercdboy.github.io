define(function(require, exports, module) {
    var Controller = require('core/Controller'),
		Panel = require('ui/widget/Panel');
    
	module.exports = Controller.extend({
		defaults: {
			el: '.panel',
			trigger: '#btn-default',
			contentWrap: '.cont',
			display: 'reveal',
			position: 'left',
			scrollMode: 'hide',
			//dismissible: false,
			swipeClose: true
		},
		
		events: {
			'beforeopen': 'onBeforeopen',
			'open': 'onOpen',
			'beforeclose': 'onBeforeclose',
			'close': 'onClose',
			'destroy': 'onDestroy',
			'click .panel-close': 'close'
		},
		
		initialize: function(){
			var opts = this.attributes();
			
			this.panel = new Panel(opts);
			//this.panel.open('push', 'right');
		},
		
		onBeforeopen: function(){
			console.log('beforeopen' + JSON.stringify(arguments));
		},
		
		onOpen: function(){
			console.log('open' + JSON.stringify(arguments));
		},
		
		onBeforeclose: function(){
			console.log('beforeclose' + JSON.stringify(arguments));
		},
		
		onClose: function(){
			console.log('close' + JSON.stringify(arguments));
			//this.panel.destroy();
		},
		
		onDestroy: function(){
			console.log('destroy' + JSON.stringify(arguments));
		},
		
		close: function(){
			this.panel.close();
		}
	});

});