/**
 * @widget Tips 顶部下滑轻提示
 * 
 * @param {Object} params
 * @param {dom|selector|$} params.el 传入已有dom创建Tips
 * @param {String} params.content 文字内容
 * @param {Boolean} params.showIcon 是否显示icon
 * @param {Number} params.delay 自动消失前停留时长
 * @param {Boolean} params.single 是否单例模式，hide时不会移除dom
 * @param {Boolean} params.dragonfly 显示时是否自动消失
 * 
 * @Source
 * Frozenui jeakeyliang@tips.js
 */

define('ui/widget/Tips', function(require){
    var Controller = require('core/Controller'),
    	template = require('util/template');
    
    require('{theme}/TeaUI/Tips/tips.css');

    var Tips = Controller.extend({
    	defaults: {
    		content: '',
			delay: 1000,
			showIcon: false,
			dragonfly: true,
			type: 'info',
    		template: [
    			'<div class="ui-poptips">',
					'<p class="ui-poptips-cnt">',
						'<%if(showIcon) {%>',
    					'<i></i>',
    					'<%}%>',
    					'<span class="ui-poptips-txt"><%=content%></span>',
					'</p>',
				'</div>'
		 	].join('')
    	},
    	
    	initialize: function(){
    		var isOriginalEl = this.isOriginalEl(),
    			me = this;
    		
    		//如果传入过el参数，那么就是需要把页面已有dom创建为tips对象
    		//没有传的话创建dom
    		if(isOriginalEl) {
	    		var	render = template(me.get('template')),
	    			html = render({
	    				showIcon: me.get('showIcon'),
		    			content: me.get('content')
		    		});
	    		
	    		me._setElement(html);
	    		me.$('body').append(me.el);
			} else {
				me.$el.show();
			}

			me.css({
				"-webkit-transform": "translateY(-" + (me.height() || 150) + "px)"
			});
			
			setTimeout(function(){
				me.css({
					"-webkit-transition":"all .3s"
				});
				
				me.show('', me.get('dragonfly'));
				
			}, 20);
			
    	},
    	
    	/*
		 * @function show 显示tips
		 * @param {String} msg 要显示的信息
		 * @param {Boolean} dragonfly 显示后是否自动关闭
		 * 
		 * @example tip.show('提示内容') 显示后不自动消失
		 * @example tip.show('提示内容', true) 显示后自动消失
		 */
    	show: function(msg, dragonfly){
			var me = this,
				delay = me.get('delay');
			
			me.trigger('show');
			
			me.css({
				"-webkit-transform":"translateY(0px)"
			});
			
			msg && this.html(msg);
			
			dragonfly === true && setTimeout(function(){
				me.hide();
			}, delay);
			
			return this;
		},
		
		/*
		 * @function hide 隐藏tips
		 * @param {Boolean} remove 收起后是否移除dom
		 */
		hide: function(remove){
			var me = this;
			
			me.trigger('hide');
			
			me.css({
				"-webkit-transform": "translateY(-" + (me.height() || 150) + "px)"
			});
			
			(remove === true || !me.get('single')) && setTimeout(function(){
				me.remove();
			}, 300);
			
			return this;
		},
		
		//修改tips文字
		text: function(msg){
			this.find('.ui-poptips-txt').text(msg);
			return this;
		}
    });
	
	return Tips;
});
