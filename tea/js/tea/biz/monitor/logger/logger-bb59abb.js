define('biz/monitor/logger/logger', function(require, exports, module){
	var BJ_REPORT = require('biz/monitor/logger/tryJs'),
		data = require('data'),
		Extend = require('core/Extend'),
		isObject = require('util/isObject');
	
	//执行初始化操作
	var configs = Extend({
		id: 114,
		level: 4,
		random: .8,
		delay: 1000
	}, isObject(data.logger) ? data.logger : {});
	
	BJ_REPORT.init(configs);
	
	module.exports = Tea.logger = BJ_REPORT;
});