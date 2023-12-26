/**
 * Created by sean on 16-5-23.
 * 
 * @Events
 * portrait(deg) //竖屏
 * landscape(deg) //横屏
 * rotate(deg) //旋转
 */
define('util/screenRotate', function(require, exports, module){
	var Class = require('core/Class'),
		Event = require('core/Event'),
		screenRotate;
		
    ScreenRotate = Class.extend(Event);
    
    module.exports = screenRotate = new ScreenRotate();
    
    window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize", function(){
		if(window.orientation === 0 || window.orientation === 180){
			//竖屏
			screenRotate.trigger('portrait', [window.orientation]);
			
		} else if(window.orientation === 90 || window.orientation === -90) {
			//横屏
			screenRotate.trigger('landscape', [window.orientation]);
		}
		
		//旋转
		screenRotate.trigger('rotate', [window.orientation]);
		
	}, false);
});
