/**
 * Created by seanxphuang on 15-8-28.
 * 为dom节点绑定transition/animate动画的开始、结束、循环事件
 */
define('util/bindCssEvent', function(require, exports, module){
	var el = document.createElement('i'),
		transitions = {
			'transition': 'transitionend',
			'webkitTransition': 'webkitTransitionEnd',
			'OTransition': 'oTransitionEnd',
			'MozTransition': 'transitionend',
			'msTransition': 'msTransitionEnd'
		},
		animations = {
			'animation': 'animationend',
			'webkitAnimation': 'webkitAnimationEnd',
			'OAnimation': 'oAnimationEnd',
			'msAnimation': 'MSAnimationEnd'
		},
		animationsStart = {
			'animation': 'animationstart',
			'webkitAnimation': 'webkitAnimationStart',
			'OAnimation': 'oAnimationStart',
			'msAnimation': 'MSAnimationStart'
		},
		animationsIteration = {
			'animation': 'animationiteration',
			'webkitAnimation': 'webkitAnimationIteration',
			'OAnimation': 'oAnimationIteration',
			'msAnimation': 'MSAnimationIteration'
		},
		getCssEvent = function(type) {
			for (t in type) {
				if (el.style[t] !== undefined){
					return type[t];
				}
			}
		},
		handle = function(e, cb){
			var target = e.target;

			if(!target.triggered && cb){
				cb(e);
				
				target.triggered = true;
				setTimeout(function(){
					target.triggered = false;
				}, 50);
			}
		};
		
	module.exports = {
		onTransitionEnd: function(dom, cb){
			var e = getCssEvent(transitions);
			
			if(dom._transInited) {
				return;
			}
			
			dom._transInited = true;
			
			//css未指定transition时会连续被触发多次，这里设定了50ms延时的事件阻止
			e && dom.addEventListener(e, function(event){
				handle(event, cb);
			});
		},
		
		onStart: function(dom, cb){
			var e = getCssEvent(animationsStart);
			
			if(dom._animStartInited) {
				return;
			}
			
			dom._animStartInited = true;
			
			e && dom.addEventListener(e, function(event){
				handle(event, cb);
			});
		},
		
		onEnd: function(dom, cb){
			var e = getCssEvent(animations);
			
			if(dom._animInited) {
				return;
			}
			
			dom._animInited = true;
			
			e && dom.addEventListener(e, function(event){
				handle(event, cb);
			});
		},
		
		onLoop: function(dom, cb){
			var e = getCssEvent(animationsIteration);
			
			if(dom._animIterationInited) {
				return;
			}
			
			dom._animIterationInited = true;
			
			e && dom.addEventListener(e, function(event){
				handle(event, cb);
			});
		}
	}
	
});
