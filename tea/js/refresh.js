define(function(require, exports, module) {
    var Controller = require('core/Controller'),
		Refresh = require('ui/widget/Refresh'),
		REST = require('util/REST'),
		Loading = require('ui/widget/Loading');
    
	module.exports = Controller.extend({
		el: '#demo .ui-refresh',
		
		initialize: function(){
			this.$el.height(window.innerHeight - 45);
			new Refresh({
				el: this.el,
				ready: function (dir, type) {
					 var me = this,
					 	 html = [
						 	'<li>',
								'<img src="images/txt.png"/>',
								'<dl>',
									'<dt>英国地标“大本钟”用女王名 Loaded</dt>',
									'<dd class="content">新华网深圳3月23日电（记者 赵瑞西）23日，深圳市南山区西里医院的大楼</dd>',
									'<dd class="source">来源：新浪</dd>',
								'</dl>',
							'</li>',
							'<li>',
								'<img src="images/txt.png"/>',
								'<dl>',
									'<dt>英国地标“大本钟”用女王名 Loaded</dt>',
									'<dd class="content">新华网深圳3月23日电（记者 赵瑞西）23日，深圳市南山区西里医院的大楼</dd>',
									'<dd class="source">来源：新浪</dd>',
								'</dl>',
							'</li>',
							'<li>',
								'<img src="images/txt.png"/>',
								'<dl>',
									'<dt>英国地标“大本钟”用女王名 Loaded</dt>',
									'<dd class="content">新华网深圳3月23日电（记者 赵瑞西）23日，深圳市南山区西里医院的大楼</dd>',
									'<dd class="source">来源：新浪</dd>',
								'</dl>',
							'</li>'
						 ].join('');
						 
					 REST.read({
						url: 'http://localhost'
					 }).fail(function(){
						me.$el.find('ul')[dir == 'up' ? 'prepend' : 'append'](html);
						me.afterDataLoading(dir);
						me.disable(dir, true);
						me.enable(dir); 
					 });
				 }
			})
			
		}
	});

});