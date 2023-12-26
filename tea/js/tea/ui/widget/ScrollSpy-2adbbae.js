/**
 * @Widget ScrollSpy 滚动条监测（如下滑到底部自动加载功能）
 * 
 * @param {Object} params
 * @param {dom|selector|$} params.el 要监测滚动的对象，默认为window
 * @param {Number} params.buffer 距离顶部或底部多少像素时触发touchTop和touchEnd
 * @param {Function} params.onTouchTop(dir) 触达顶部时触发
 * @param {Function} params.onTouchEnd(dir) 触达底部时触发
 * @param {Function} params.onScroll() 滚动时触发
 * 
 * eg:
 * var spy = new ScrollSpy({
 *     el: '',
 *     onTouchTop: function(dir){},
 *     onTouchEnd: function(dir){},
 *     onScroll: function(data){
 *	   		//data = {dir: 'up', scrollTop: 50, touchTop: false, touchEnd: false}
 * 	   }
 * });
 * 
 * @Methods
 * enable
 * disable(type) //type => touchTop | touchEnd | scroll, 默认禁止监听所有
 * triggerScroll //触发各监听动作
 * 
 * @Events
 * touchTop
 * touchEnd
 * scrolling
 */

define('ui/widget/ScrollSpy', function(require, exports, module){
    var Controller = require('core/Controller'),
    	$ = require('lib.zepto'),
    	isFunction = require('util/isFunction');
    	
    $.noop = function(){};
    
    module.exports = Controller.extend({
    	el: window,
    	
    	defaults: {
			onTouchTop: $.noop,
    		onTouchEnd: $.noop,
    		onScroll: $.noop,
    		buffer: 0
    	},
    	
    	initialize: function(){
			var lastScrollTop = this.$el.scrollTop();
			
			this.set({
				lastScrollTop: lastScrollTop
			});
			
			this.enable();
    	},
    	
    	enable: function(){
			var me = this,
				el = me.el,
				$el = me.$el,
				buffer = me.get('buffer'),
				onScroll = me.get('onScroll'),
				onTouchTop = me.get('onTouchTop'),
				onTouchEnd = me.get('onTouchEnd');
				
			!me.get('binded') && $el.on('scroll.ScrollSpy scrollSpy', function(){
				me.delay(function(){
					var scrollHeight = el.window ? $(document).height() : el.scrollHeight,
						height = el.window ? $(window).height() : $el.height(),
						scrollTop = $el.scrollTop(),
						dir = scrollTop > me.get('lastScrollTop') ? 'down' : 'up',
						touchTop = scrollTop <= buffer ? true : false,
						touchEnd = scrollTop + height + buffer >= scrollHeight ? true : false,
						data = {
							dir: dir,
							scrollTop: scrollTop,
							touchTop: touchTop,
							touchEnd: touchEnd
						};
					
					!me.get('scrollDisabled') && me.trigger('scrolling', [data]) && onScroll(data);
					
					!me.get('touchTopDisabled') && touchTop && me.trigger('touchTop', [dir]) && onTouchTop(dir);
					
					!me.get('touchEndDisabled') && touchEnd && me.trigger('touchEnd', [dir]) && onTouchEnd(dir);
					
					me.set({
						lastScrollTop: scrollTop
					});
					
				}, 100, me);
			});
			
			me.set('binded', true);
		},
		
		disable: function(type){
			if(type){
				this.set(type + 'Disabled', true);
			} else {
				this.off('scroll.ScrollSpy');
				this.set('binded', false);
			}
		},
		
		triggerScroll: function(){
			this.trigger('scrollSpy');
		}
		
    });
	
});