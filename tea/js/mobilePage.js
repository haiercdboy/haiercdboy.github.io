define(function(require, exports, module) {
    var $ = require('lib/zepto'),
		MobilePage = require('ui/widget/MobilePage');
    
	var mobilePage = function(){
		window.mp = new MobilePage({
			el: '.main',
			//pages: '.tea-page',
			//homePage: '.test1',
			//currentPage: '.test1',
			//transition: 'Y',
			
			//touchBack: false,
			touchNext: true,
			touchBackRate: .3,
			touchableAtan: .5,
			touchableRate: 1,
			adjustDom: true
		});
		
		mp.on('swiping', function(e, $pageOut, $pageIn, rate, move, offset){
			/*
			 * $pageOut：要移出的页面, 
			 * $pageIn：要移入的页面, 
			 * rate：滑动距离的百分比, 
			 * move：滑动距离, 
			 * offset：移入页面需要移动的距离
			 */
	    	
	    	move > 0 && $pageIn.css({
	    		opacity: rate
	    	});
		});
		
		$('#btn1').tap(function(){
			//mp.page('test', 'hello world!');
			//mp.page('test3', 'aha~ hello world!');
			mp.page('tea-page-3');
		});
		
		$('#btn2, #btn4').tap(function(){
			mp.page('demoSub', '-<b>touchable</b>-<br>hello world!<br><a href="javascript:;" class="back">back</a>');
		});
		
		$('#btn3').tap(function(){
			mp.page('tea-page-2');
		});
		
		$('body').on('tap', '.back', function(){
			this.id == 'backHome' ? mp.trigger('backHome') : mp.back();
		});
		
		mp.on('pageShow', function(e, pageIn, pageOut){
			//阻止事件冒泡被父级重复监听
			e.stopPropagation();
			
			console.log('pageIn:' + pageIn + '  ###  pageOut:' + pageOut);
			
			if(pageIn === 'tea-page-1') {
				mp.trigger('enableTouch');
			} else {
				mp.trigger('disableTouch');
			}
		});
		
	}
	
	return mobilePage;

});