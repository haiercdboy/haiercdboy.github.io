define(function(require, exports, module) {
    var Dialog = require('ui/widget/Dialog'),
    	$ = require('lib/zepto');
    
	return function(){
		$('#d1').on('click', function(){
			new Dialog({
				title: '标题文字',
				content: '央行今日公告称，11月12日起发行新版第五套百元人民币，票面中部数字“100”增加光彩光变，右上角面额数字改为竖排，整体防伪性能提升。'
			});
		});
		
		$('#d5').on('click', function(){
			new Dialog({
				title: '标题文字',
				content: '央行今日公告称，11月12日起发行新版第五套百元人民币，票面中部数字“100”增加光彩光变，右上角面额数字改为竖排，整体防伪性能提升。',
				button: ''
			});
		});
		
		$('#d2').on('click', function(){
			new Dialog({
				type: 'block',
				title: '标题文字',
				content: '央行今日公告称，11月12日起发行新版第五套百元人民币，票面中部数字“100”增加光彩光变，右上角面额数字改为竖排，整体防伪性能提升。',
				single: true,
				allowScroll: false
			});
		});
		
		$('#d3').on('click', function(){
			new Dialog({
				el: '#test3',
				type: 'slide',
				content: '你好！Dialog...',
				contentSelector: '.mydialog-info',
				dialogSelector: '.dialog',
				single: true
			});
		});
		
		$('#d6').on('click', function(){
			new Dialog({
				type: 'slide',
				content: '你好！Dialog...',
				button: ['点个赞吧', '残忍拒绝']
			});
		});
		
		$('#d4').on('click', function(){
			new Dialog({
				el: '#test',
				single: true,
				content: 'hello...',
				buttonSelector: '.btn',
				titleSelector: '.mydialog-tit',
				contentSelector: '.mydialog-info',
				dialogSelector: '.mydialog-inner',
				hideOnClickBg: false
			});
		});

		
		$('body').on('action', function(e, index){
			console.log(index);
		});
		
	}
	
});