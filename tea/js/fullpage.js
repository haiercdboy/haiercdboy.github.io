define(function(require, exports, module) {
    var Controller = require('core/Controller'),
		FullPage = require('ui/widget/FullPage');
		
	require('../css/fullpage.css');
    
	module.exports = Controller.extend({
		el: '.fullpage',
		
		events: {
			'swipeStart': 'onSwipeStart',
			'beforeChange': 'beforeChange',
			'change': 'onChange',
			'unload': 'unload'
		},
		
		initialize: function(){
			
			this.innerpage = new FullPage({
				el : '#pageContain',// id of contain
				autoPlay: 'loop',
				//playInterval: 5000,
				//width:500,
				//height:500,
				
				continuous: true,
				slideTime : 1000,            // time of slide
				mode : 'wheel,touch,nav:#navBar',
				easing :  'ease',
			    effect : {                   // slide effect
			        transform : {
			        	translate : 'X',	 // 'X'|'Y'|'XY'|'none'
			        	scale : [.1, 1],	 // [scalefrom, scaleto]
			        	rotate : [60, 0]	 // [rotatefrom, rotateto]
			        },
			        opacity : [0, 1]         // [opacityfrom, opacityto]
			    }, 
			    onSwipeStart: function(){
		        	console.log('handler:onSwipeStart');
		        	//return 'stop';
		        },
		        beforeChange: function(){
		        	console.log('handler:beforeChange');
		        	//return 'stop';
		        },
		        callback: function(index){
		        	console.log('callback:' + index);
		        }
			});
			
			this.page = new FullPage({
				el : '#article', // id of contain
				mode : 'wheel,touch,nav:.navBar',
				//autoPlay: 1,
				continuous: true,
				/*effect: {
			        transform: {
			            translate: 'Y',
			            scale: [1, 1],
			            rotate: [0, 0]
			        },
			        opacity: [0, 1]
			    },
				easing: [.1, 1.8, 0.5, 1] //easing 参数可选*/
			});
			
		},
		
		onSwipeStart: function(){
			console.log('event:swipeStart');
		},
		
		beforeChange: function(){
			console.log('event:beforeChange');
		},
		
		onChange: function(e, index, dom){
			console.log('change:' + index);
		}
	});

});