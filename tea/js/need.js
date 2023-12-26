define(function(require, exports, module, need) {
    var Controller = require('core/Controller'),
    	dialoger = need(['ui/widget/Dialog', 'ui/widget/Tips']).get(2,1);
    	
    // 还可以这样用(预定一批依赖模块，可以是css)！
    /* loader = need(['moduleA', 'moduleB', 'moduleC']);
     * 
     * 可以这样(预加载所有或预加载指定模块，只加载不执行)：
     * loader.get()  or loader.get(1) or loader.get(0, 1, 2...)
     * 
     * 还可以这样(加载指定模块并执行)：
     * loader.eq(0).done(function(moduleA){
     *	 //to do...
     * });
     *
     * 或者这样：
     * loader.done(function(moduleA, moduleB, moduleC){
     *	 //to do...
     * });
     **/
	
	var Demo = Controller.extend({
		el: 'body',
		
		events: {
			'click #dialog': 'showDialog'
		},
		
		showDialog: function(){
			dialoger.eq(0).done(function(Dialog){
				new Dialog({
					title: '标题文字',
					content: '央行今日公告称，11月12日起发行新版第五套百元人民币，票面中部数字“100”增加光彩光变，右上角面额数字改为竖排，整体防伪性能提升。',
					button: ['取消', '确定']
				});
			});
		}
	});
	
	new Demo();
	
});