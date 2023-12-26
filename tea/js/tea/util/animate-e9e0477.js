/**
 * Created by seanxphuang on 16-5-3.
 * 动画插件
 */
define('util/animate', function(require, exports, module){
	var isArray = require('util/isArray'),
		delta = navigator.userAgent.indexOf('QQBrowser') !== -1 ? 200 : 0;
	
	module.exports = {
		cssCore: function(testCss) {
            switch (true) {
                case testCss.webkitTransition === '':
                	return 'webkit';
                
                case testCss.MozTransition === '':
                	return 'Moz';
                	
                case testCss.msTransition === '':
                	return 'ms';
                	
                case testCss.OTransition === '':
                	return 'O';
                	
                default:
                	return '';
            }
        }(document.createElement('Tea').style),
		
		getStyleName: function(styleName){
			var prefix = this.cssCore + (this.cssCore ? 'T' : 't');
			
			switch(styleName) {
				case 'transitionTimingFunction':
					return prefix + 'ransitionTimingFunction';
					
				case 'transitionDuration':
					return prefix + 'ransitionDuration';
				
				case 'transformOrigin':
					return prefix + 'ransformOrigin';
				
				case 'transform':
					return prefix + 'ransform';
					
				default:
					return styleName;
				
			}
			
		},
		
		_setCubic: function(a, b, c, d) {
			this.cubicCurveA = a;
			this.cubicCurveB = b;
			this.cubicCurveC = c;
			this.cubicCurveD = d;
			
			return this;
		},
		
		setEasing: function(dom, easing){
			if(!dom) {
				return this;
			}
			
			if (typeof easing === 'string') {
				switch (easing) {
					case 'ease' : 
						this._setCubic(0.25, 0.1, 0.25, 1);
						break;
		
					case 'linear' :
						this._setCubic(0, 0, 1, 1);
						break;
		
					case 'ease-in' : 
						this._setCubic(0.42, 0, 1, 1);
						break;
		
					case 'ease-out' :
						this._setCubic(0, 0, 0.58, 1);
						break;
		
					case 'ease-in-out' :
						this._setCubic(0.42, 0, 0.58, 1);
				}
			} else if(isArray(easing)) {
				this._setCubic(easing[0], easing[1], easing[2], easing[3]);
			}
			
			dom.style[this.getStyleName('transitionTimingFunction')] = 'cubic-bezier(' 
																		   + (this.cubicCurveA || 0) + ',' 
																		   + (this.cubicCurveB || 0) + ',' 
																		   + (this.cubicCurveC || 0) + ',' 
																		   + (this.cubicCurveD || 0) + ')';
																		   
			return this;
		},
		
		setDuration: function(dom, time, ignore){
			var time = time !== undefined ? time : 800;
			
			if(dom) {
				!ignore && (dom.time = time);
				dom.style[this.getStyleName('transitionDuration')] = time + 'ms';
			}
			
			return this;
		},
		
		setOrigin: function(dom, xy){
			dom && (dom.style[this.getStyleName('transformOrigin')] = xy || '50% 50%');
			return this;
		},
		
		setDelay: function(dom, time){
			dom && (dom.style[this.getStyleName('transitionDelay')] = (time ? (time + 'ms') : ''));
			return this;
		},
		
		/* options:
		 * {
		 * 	   translateX: {from:0, to: 100},
		 *     translateY: {from:0, to: 100},
		 *     scale: {from:0, to: 1},
		 *     rotate: {from:0, to: 60},
		 *     opacity: {from:0, to: 1}
		 * }
		 */
        between: function(dom, options){
        	var me = this,
        		from = {},
        		to = {},
        		transform = false,
        		fix;
        		
        	if(options.translateX) {
        		transform = true;
        		options.translateX.from !== undefined && (from.translateX = options.translateX.from);
        		options.translateX.to !== undefined && (to.translateX = options.translateX.to);
        	}
        	
        	if(options.translateY) {
        		transform = true;
        		options.translateY.from !== undefined && (from.translateY = options.translateY.from);
        		options.translateY.to !== undefined && (to.translateY = options.translateY.to);
        	}
        	
        	if(options.translateY) {
        		transform = true;
        		options.translateY.from !== undefined && (from.translateY = options.translateY.from);
        		options.translateY.to !== undefined && (to.translateY = options.translateY.to);
        	}
        	
        	if(options.skewX) {
        		transform = true;
        		options.skewX.from !== undefined && (from.skewX = options.skewX.from);
        		options.skewX.to !== undefined && (to.skewX = options.skewX.to);
        	}
        	
        	if(options.skewY) {
        		transform = true;
        		options.skewY.from !== undefined && (from.skewY = options.skewY.from);
        		options.skewY.to !== undefined && (to.skewY = options.skewY.to);
        	}
        	
        	if(options.scale) {
        		transform = true;
        		options.scale.from !== undefined && (from.scale = options.scale.from);
        		options.scale.to !== undefined && (to.scale = options.scale.to);
        	}
        	
        	if(options.rotate) {
        		transform = true;
        		options.rotate.from !== undefined && (from.rotate = options.rotate.from);
        		options.rotate.to !== undefined && (to.rotate = options.rotate.to);
        	}
        	
        	if(options.opacity) {
        		options.opacity.from !== undefined && (from.opacity = options.opacity.from);
        		options.opacity.to !== undefined && (to.opacity = options.opacity.to);
        	}
        	
        	fix = me.cssCore === '' && transform ? -50 : delta;
        	
        	me.setDuration(dom, 0, true);
        	me._setCss(dom, from);
				
			setTimeout(function() {
				me.setDuration(dom, dom && dom.time);
				me._setCss(dom, to);
			}, fix + 50);
			
			return this;
        },
        
        _setCss: function(dom, options){
        	var css = [];
        	
        	if(options.translateX !== undefined) {
        		css.push('translateX(' + (isNaN(options.translateX) ? options.translateX : (options.translateX + 'px')) + ')');
        	}
        	
        	if(options.translateY !== undefined) {
        		css.push('translateY(' + (isNaN(options.translateY) ? options.translateY : (options.translateY + 'px')) + ')');
        	}
        	
        	if(options.skewX !== undefined) {
        		css.push('skewX(' + options.skewX + 'deg)');
        	}
        	
        	if(options.skewY !== undefined) {
        		css.push('skewY(' + options.skewY + 'deg)');
        	}
        	
        	if(options.scale !== undefined) {
        		css.push('scale(' + options.scale + ')');
        	}
        	
        	if(options.rotate !== undefined) {
        		css.push('rotate(' + options.rotate + 'deg)');
        	}
			
			dom && (dom.style[this.getStyleName('transform')] = css.join(' '));
			
			if(options.opacity !== undefined) {
        		dom && (dom.style.opacity = options.opacity);
        	}
			
			return this;
        	
        },
        
        translateX: function(dom, from, to, time, easing){
        	time && this.setDuration(dom, time);
        	easing && this.setEasing(dom, easing);
        	
        	return this.between(dom, {
        		translateX: {
        			from: from,
        			to: to
        		}
        	});
        },
        
        translateY: function(dom, from, to, time, easing){
        	time && this.setDuration(dom, time);
        	easing && this.setEasing(dom, easing);
        	
        	return this.between(dom, {
        		translateY: {
        			from: from,
        			to: to
        		}
        	});
        },
        
        skewX: function(dom, from, to, time, easing){
        	time && this.setDuration(dom, time);
        	easing && this.setEasing(dom, easing);
        	
        	return this.between(dom, {
        		skewX: {
        			from: from,
        			to: to
        		}
        	});
        },
        
        skewY: function(dom, from, to, time, easing){
        	time && this.setDuration(dom, time);
        	easing && this.setEasing(dom, easing);
        	
        	return this.between(dom, {
        		skewY: {
        			from: from,
        			to: to
        		}
        	});
        },
        
        scale: function(dom, from, to, time, easing){
        	time && this.setDuration(dom, time);
        	easing && this.setEasing(dom, easing);
        	
        	return this.between(dom, {
        		scale: {
        			from: from,
        			to: to
        		}
        	});
        },
        
        rotate: function(dom, from, to, time, easing){
        	time && this.setDuration(dom, time);
        	easing && this.setEasing(dom, easing);
        	
        	return this.between(dom, {
        		rotate: {
        			from: from,
        			to: to
        		}
        	});
        },
        
        opacity: function(dom, from, to, time, easing){
        	time && this.setDuration(dom, time);
        	easing && this.setEasing(dom, easing);
        	
        	return this.between(dom, {
        		opacity: {
        			from: from,
        			to: to
        		}
        	});
        }
	}
	
});
