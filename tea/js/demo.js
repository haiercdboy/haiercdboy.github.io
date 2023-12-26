define(function(require, exports, module) {
    var Controller = require('core/Controller'),
    	isFunction = require('util.isFunction');
    	
    console.log(isFunction(Function));
    
	module.exports = Controller.extend({
		el: 'body',
		
		className: 'demo',
		
		defaults: {
			name: 'sean1984'
		},
		
		events: {
			'change:name': 'onNameChange',
			'click .init': 'onInitClick'
		},
		
		elements: {
			$container: '#container'	
		},
		
		initialize: function(){
			console.log('initialized');
			
			for(var method in this.constructor.prototype) {
				if(this.constructor.prototype.hasOwnProperty(method)) {
					console.log('method:' + method);
				}
			}
			
			this.append('<p class="init">initialize!</p>');
		},
		
		onNameChange: function(e, name, oldName){
		   console.log(name, oldName, this.defaults.name); 
		},
		
		onInitClick: function(){
			console.log('init click triggered!');
		}
	});

});