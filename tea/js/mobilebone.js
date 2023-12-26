define(function(require, exports, module) {
    var Controller = require('core/Controller'),
		Mobilebone = require('ui/widget/Mobilebone');
    
	module.exports = Controller.extend({
		events: {
			'pageInStart:page1': 'onPageInStartPage1',
			'pageInEnd:page1': 'onPageInEndPge1'
		},
		
		initialize: function(){
			var opts = this.attributes();
			
			//注意一定要把本模块的el传入，不然上面的events里监听不到页面切换事件
			//animation type:fade,pop,slide,slidefade,slidedown,slideup,flip,turn,flow
			var bone = new Mobilebone({
				el: this.el,
				
				//是否所有链接都ajax加载
				captureLink: true,
				
				//是否使用ajax提交表单
				captureForm: true,
				
				//页面类名
				classPage: 'page',
				
				//loading浮层类名
				classMask: 'mask',
				
				//是否使用pushState
				pushStateEnabled: true,
				
				//是否执行ajax载入页面的脚本
				evalScript: true,
				
				//页面动画效果
				classAnimation: 'slide'
			});
			
			//两种事件绑定方式
			bone.on('pageChange', function(e, page, pageout){
				console.log(page + ' show!\n' + pageout + ' leave!');
			});

		},
		
		onPageInStartPage1: function(){
			console.log('page1 show start!');
		},
		
		onPageInEndPge1: function(){
			console.log('page1 show end!');
		}
	});

});