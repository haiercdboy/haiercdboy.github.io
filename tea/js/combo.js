define('combo', function(require, exports, module) {
    var Controller = require('core/Controller'),
    	moduleMemory = require('util/moduleMemory');
    
	var a = Controller.extend({
		length: 'sean',
		initialize: function(){
			this.on('change', function(){
		    	console.log(arguments);
		    });
		}	
	});
	
	var c = new a();
	c.set('name', 'sean');
	
	var b = Controller.extend(moduleMemory, {
		name: 'bella',
		initialize: function(){
			console.log(this.name);	
			
			var html = this.template('<h1><%=name%></h1>')({name: 'sean'});
			console.log(html);
		}	
	});
	
	var d = new b();
	
	var e = function(){
		this.name = 'test';	
	};
		
	var f = new e();
	
	console.log(c.name, d.name, f.name);

});