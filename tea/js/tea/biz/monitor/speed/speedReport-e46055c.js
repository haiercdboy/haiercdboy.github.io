/**
 * Created by amos/seanxphuang on 14-1-16.
 */
define('biz/monitor/speed/speedReport', function(require){
    var report = require('util/report'),
        Class = require('core/Class'),
        serialize = require('util/serialize'),
        Attribute = require('core/Attributes');

    var defaults = {
    	//支持http和https上报
        url: location.protocol.indexOf('https') !== -1 ? 'https://huatuospeed.weiyun.com/cgi-bin/r.cgi' : 'http://isdspeed.qq.com/cgi-bin/r.cgi',
        
        urlHT: location.protocol.indexOf('https') !== -1 ? 'https://huatuo.weiyun.com/report.cgi' : 'http://report.huatuo.qq.com/report.cgi',
        
        rate: 1,
        calGap: false,
        
        appId: 10086, //默认为企点产品
        flag1: 21267,
        flag2: 1
    };

    var PointReport = Class.extend(Attribute, {
        initialize: function(options){
            this
                .set(defaults)
                .set({
                    points: [],
                    start: +new Date()
                })
                .set(options);
        },
		
		/*
		 * @example
		 * var report = create({
		 * 	   flag1: 7831,
		 * 	   flag2: 1,
		 *     flag3: 5,
		 *     proxy: '//host/path/to?proxy={url}', //可选
		 *     calGap: false, //上报时间的内容，calGap表示上报各测速点间隔时间
		 * });
		 * 
		 * report.add(1442548829857);
		 * report.send();
		 */
        add: function(time, pos){
            var points = this.get('points');

            time = time || +new Date();
            pos = pos || points.length;

            points[pos] = time;

            return this;
        },

        send: function(){
            // clear points
            var points = this.get('points').splice(0),
            	type = this.get('type'),
            	platform = this.get('platform'),
            	device = this.get('device'),
            	apn = this.get('apn'),
            	is_offline = this.get('is_offline'),
            	queries = this.get('queries'),
            	url, params;

            if(Math.random() > this.get('rate')){
                return this;
            }

            var start = this.get('start'),
                f1 = this.get('flag1'),
                f2 = this.get('flag2'),
                f3 = this.get('flag3'),
                proxy = this.get('proxy'),
                i;

            if(this.get('calGap')){
                for(i= points.length - 1; i> 0; i--){
                    points[i-1] = points[i-1] || 0;
                    points[i] -= points[i-1];
                }
            } else {
                for(i= points.length - 1; i> 0; i--){
                    if(points[i]){
                        points[i] -= start;
                    }
                }
            }
			
            if(type == 1) {
				url = this.get('urlHT') + '?appid=' + this.get('appId') + '&speedparams=';
				params = 'flag1=' + f1 + '&flag2=' + f2 + '&flag3=' + f3 + '&' + serialize(points);
				
				url += encodeURIComponent(params);
			} else {
				url = this.get('url') + '?';
				params = 'flag1=' + f1 + '&flag2=' + f2 + '&flag3=' + f3 + '&' + serialize(points);
				
				url += params;
			}
			
			platform && (url += '&platform=' + platform);
			device && (url += '&device=' + device);
			apn && (url += '&apn=' + apn);
			is_offline && (url += '&is_offline=' + is_offline);
			queries && (url += '&' + queries);
			
            // when use proxy mode
            if(proxy){
                url = proxy.replace('{url}', type == 1 ? url : encodeURIComponent(url));
            }

            report(url);
        }
    });

    /**
     * 上报Performance timing数据；
     * 如果某个时间点花费时间为0，则此时间点数据不上报。
     *
     * @param {Object} options
     * @param {String} options.flag1，测速系统中的业务ID，如校友业务为164
     * @param {String} options.flag2，测速的站点ID
     * @param {String} options.flag3，测速的页面ID
     * @param {Number} [options.initTime] 统计页面初始化时的时间
     * @param {Number} [options.url] 上报地址 默认为isd地址
     * @param {Number} [options.proxy] 上报代理地址 //host/path/to?proxy={url}
     * @param {Number} [options.appId] 华佗上报需要填写
     * @param {String} [options.platform] 平台类型 如ios
     * @param {String} [options.device] 设备类型 如iphone
     * @param {String} [options.apn] 网络类型
     * @param {Number} [options.is_offline] 是否离线， 0 否 1 是
     * @param {String} [options.queries] 其他需要上报的参数， 如 'version=6.5.3&isPreloadProcess=1&app=wechat'
     * @param {String} [options.type] 0 isd, 1 上报华佗
     */
    var reportPerformance = function(options){
        var appId = options.appId || 10086, //默认企点上报
        	f1 = options.flag1 || 21267,
            f2 = options.flag2 || 1,
            f3 = options.flag3,
            d0 = options.initTime,
            points = options.points || {},
            type = options.type,
            platform = options.platform,
            device = options.device,
            apn = options.apn,
            is_offline = options.is_offline,
            queries = options.queries,
            proxy = options.proxy,
            url, params;

        var _t, _p = window.performance || window.webkitPerformance,
        	_ta = [
        		"navigationStart",//0
        		"unloadEventStart",
        		"unloadEventEnd",
        		"redirectStart",
        		"redirectEnd",
        		"fetchStart", //5
        		"domainLookupStart",
        		"domainLookupEnd",
        		"connectStart",
        		"connectEnd",
        		"requestStart",//10
        		"responseStart",
        		"responseEnd",
        		"domLoading",
        		"domInteractive",
        		"domContentLoadedEventStart",//15
        		"domContentLoadedEventEnd",
        		"domComplete",
        		"loadEventStart",
        		"loadEventEnd" //19
        	], _da = [], _t0, _tmp;

        if (_p && (_t = _p.timing)) {
            _t0 = _t[_ta[0]];
            for (var i = 1, l = _ta.length; i < l; i++) {
                _tmp = _t[_ta[i]];
                _tmp = (_tmp ? (_tmp - _t0) : 0);
                if (_tmp > 0) {
                    _da.push(i + '=' + _tmp);
                }
            }
            
            for(var j in points) {
            	if(points.hasOwnProperty(j)) {
            		_da.push(j + '=' + points[j]);
            	}
            }

            if (d0) {//d0是统计页面初始化时的时间
                _da.push('32=' + (d0 - _t0));
            }
			
			if(type == 1) {
				url = (options.url || defaults.urlHT) + '?appid=' + appId + '&speedparams=';
				params = 'flag1=' + f1 + '&flag2=' + f2 + '&flag3=' + f3 + '&' + _da.join('&');
			
				url += encodeURIComponent(params);
			} else {
				url = (options.url || defaults.url) + '?';
				params = 'flag1=' + f1 + '&flag2=' + f2 + '&flag3=' + f3 + '&' + _da.join('&');
			
				url += params;
			}
			
			platform && (url += '&platform=' + platform);
			device && (url += '&device=' + device);
			apn && (url += '&apn=' + apn);
			is_offline && (url += '&is_offline=' + is_offline);
			queries && (url += '&' + queries);
			
            // when use proxy mode
            if(proxy){
                url = proxy.replace('{url}', type == 1 ? url : encodeURIComponent(url));
            }

            report(url);
        }

    };

    return {
    	/*
		 * @example
		 * create({
		 * 	   flag1: 7831,
		 * 	   flag2: 1,
		 *     flag3: 5,
		 *     url: 'url', //上报地址，默认是isd地址
		 *     proxy: '//host/path/to?proxy={url}', //可选
		 *     calGap: false, //上报时间的内容，calGap表示上报各测速点间隔时间
		 * });
		 */
        create: function(options){
            return new PointReport(options);
        },
		
		/*
		 * @example
		 * reportPerformance({
		 * 	   flag1: 7831,
		 * 	   flag2: 1,
		 *     flag3: 5,
		 *     initTime: 1442548829857, //可选
		 *     proxy: '//host/path/to?proxy={url}' //可选
		 * });
		 */
        reportPerformance: reportPerformance
    }
});