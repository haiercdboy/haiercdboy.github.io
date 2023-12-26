/**
 * @widget Loading 加载中提示组件
 * 
 * @param {Object} params
 * @param {dom|selector|$} params.el 传入el，loading会显示在el中，也可以指定页面已有的dom为loading对象，这时候下面的设置参数无效
 * @param {String} params.type 'block'|'inline' 默认'block' 指定loading样式
 * @param {String} params.content 文字内容
 * 
 * @Source
 * Frozenui jeakeyliang@loading.js
 */

define('ui/widget/Loading', function(require){
    var Controller = require('core/Controller'),
    	template = require('util/template');
    
    require('{theme}/TeaUI/Loading/loading.css');

    var Loading = Controller.extend({
    	defaults: {
    		type: 'block',
    		content:'加载中...',
    		
    		template: [
    			'<%if(type === "inline") {%>',
    				'<div class="ui-cont-loading">',
    					'<i class="ui-loading-icon"></i> ',
    					'<span class="ui-loading-text"><%=content%></span>',
    				'</div>',
    			'<%} else {%>',
					'<div class="ui-cont-loading">',
						'<div class="ui-loading-cnt">',
							'<i class="ui-loading-icon-bright"></i>',
							'<p class="ui-loading-text"><%=content%></p>',
						'</div>',
					'</div>',
				'<%}%>'
		 	].join('')
    	},
    	
    	initialize: function(){
    		var isOriginalEl = this.isOriginalEl(),
    			html = '';
    		
    		//如果传入的是页面已有dom
    		//el可以是容器，也可以是已有dom节点创建loading对象，所以这里需要判断.ui-loading
    		if(!isOriginalEl && this.$el.is('.ui-cont-loading')) {
    			html = this.el;
    			this.$loading = this.$(html);
    			
    		} else {
	    		var	render = template(this.get('template'));
    		
    			html = render({
    				type: this.get('type'),
	    			content: this.get('content')
	    		});
	    		
	    		this.$loading = this.$(html);
	    		
	    		//如果未传入el
	    		if(isOriginalEl) {
	    			this._setElement(this.$loading);
	    			this.$('body').append(this.$loading);
	    		} else {
	    			this.$el.append(this.$loading);
	    		}
			}
    		
    	},
    	
    	show: function(){
			this.trigger('show');
			this.$loading.show();
			return this;
		},
		
		hide: function () {
			this.trigger('hide');
			this.$loading.hide();
			return this;
		},
		
		//修改loading文字
		text: function(msg){
			this.$loading.find('.ui-loading-text').text(msg);
			return this;
		}
    });
	
	return Loading;
});
