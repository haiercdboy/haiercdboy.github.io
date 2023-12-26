/*
custom apis:
core,
data.getPerformance,
device.getNetworkType,
offline.isCached
*/
/**
 * @namespace core
 * @desc mqqapi内核的方法和属性
 */
;
define('biz/qqapi', function(require, exports, module){

(function(name, definition, undefined) {

    var exp = definition(this[name] = this[name] || {});

    /*if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(exp);
    } else if (typeof module === 'object') {
        module.exports = exp;
    }*/

	module.exports = exp;
	
})('mqq', function(exports, undefined) {

    'use strict';

    var ua = navigator.userAgent,

        firebug = window.MQQfirebug, // 调试插件引用

        Report,

    // 借用方法的常量
        SLICE = Array.prototype.slice,
        TOSTRING = Object.prototype.toString,

    // 各种判断用的正则
    //
    // IOS: Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4
    //      Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53

    // ANDROID: Mozilla/5.0 (Linux; Android 4.4.4; en-us; Nexus 5 Build/JOP40D) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2307.2 Mobile Safari/537.36

    // WINDOWS PHONE: Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 520)

        REGEXP_IOS = /\b(iPad|iPhone|iPod)\b.*? OS ([\d_]+)/,

    // fix by jdochen 2015/09/15
    // 个别低端机型UA：Android/2.3.5
        REGEXP_ANDROID = /\bAndroid([^;]+)/, // 小米的奇葩系统没有android内核的这个数字版本号啊

    // Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Mobile/11D257 QQ/5.3.2.424 NetType/WIFI Mem/46
        REGEXP_IPHONE_QQ = /\bQQ\/([\d\.]+)/,

    // Mozilla/5.0 (iPad; CPU OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Mobile/12A365 IPadQQ/5.3.0.0 QQ/5.6
        REGEXP_IPAD_QQ = /\bIPadQQ\/([\d\.]+).*?\bQQ\/([\d\.]+)/,

    // Mozilla/5.0 (Linux; Android 5.0.1; Nexus 4 Build/LRX22C) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/37.0.0.0 Mobile Safari/537.36 V1_AND_SQ_4.7.0_216_HDBM_T QQ/4.7.0.2385 NetType/WIFI
        REGEXP_ANDROID_QQ = /\bV1_AND_SQI?_([\d\.]+)(.*? QQ\/([\d\.]+))?/, // 国际版的 QQ 的 ua 是 sqi

    // TODO winphone qq

        REGEXP_TRIBE = /\bTribe\/([\d\.]+)/, // 部落APP的 ua

    // 内部使用的变量
        aCallbacks = exports.__aCallbacks || {}, // 调用回调
        aReports = exports.__aReports || {}, // API 调用的名字跟回调序号的映射
        aSupports = exports.__aSupports || {}, // 保存 API 的版本支持信息
        aFunctions = exports.__aFunctions || {}, // 保存 API 的名字和生成的方法映射

        UUIDSeed = 1,

        CODE_API_CALL = -100000, // 定义为 API 调用, 跟 API 的回调区分
        CODE_API_CALLBACK = -200000, // 定义为 API 调用的返回, 但是不知道确切返回码


    // 4.7启用了新协议, 但是部分接口不支持, 这里做个黑名单, 目前都是 android 的接口
        NEW_PROTOCOL_BACK_LIST = {
            qbizApi: '5.0', // 5.0 会支持新协议
            pay: '999999', // pay相关的暂时没有修改计划
            SetPwdJsInterface: '999999', // 设置密码?
            GCApi: '999999', // 游戏中心
            q_download: '999999', // 下载器
            qqZoneAppList: '999999', //
            qzone_app: '999999', //
            qzone_http: '999999', //
            qzone_imageCache: '999999', //
            RoamMapJsPlugin: '999999' //
        },

    // 有些接口不能做上报
        NOT_REPORT_METHOD = [
            'pbReport',
            'popBack',
            'close',
            'qqVersion'
        ];


    // 如果已经注入则开启调试模式
    if (firebug) {
        exports.debuging = true;
        ua = firebug.ua || ua;
    } else {
        exports.debuging = false;
    }

    /*
     * 扩展 obj 对象
     * @param  {[type]} obj [description]
     * @param  {[type]} ext [description]
     * @return {[type]}     [description]
     */
    function extend(obj, ext, overwrite) {
        var i;

        for (i in ext) {
            if (ext.hasOwnProperty(i) && !(i in obj) || overwrite) {
                obj[i] = ext[i];
            }
        }

        return obj;
    }

    // 生成一些列的类型判断方法
    extend(exports, (function() {

        var exp = {},
            types = 'Object,Function,String,Number,Boolean,Date,Undefined,Null';

        types.split(',').forEach(function(t, i) {

            exp['is' + t] = function(obj) {
                return TOSTRING.call(obj) === '[object ' + t + ']';
            };

        });


        return exp;
    })());

    /**
     * @attribute core.iOS
     * @desc 如果在 iOS 中，值为 true，否则为 false
     * @support iOS 4.2
     * @support android 4.2
     */
    exports.iOS = REGEXP_IOS.test(ua);
    /**
     * @attribute core.android
     * @desc 如果在 android 中，值为 true，否则为 false
     * @support iOS 4.2
     * @support android 4.2
     */
    exports.android = REGEXP_ANDROID.test(ua);

    if (exports.iOS && exports.android) {

        /*
         * 同时是 iOS 和 android 是不可能的, 但是有些国产神机很恶心,
         * 明明是 android, ua 上还加上个 iPhone 5s...
         * 这里要 fix 掉
         */
        exports.iOS = false;
    }

    /**
     * @attribute core.version
     * @desc mqqapi自身的版本号
     * @support iOS 4.2
     * @support android 4.2
     */
    exports.version = '20160808003';

    /**
     * @attribute core.QQVersion
     * @desc 如果在 手机 QQ中，值为手机QQ的版本号，如：4.6.2，否则为 0
     * @support iOS 4.2
     * @support android 4.2
     */
    exports.QQVersion = '0';

    exports.clientVersion = '0';

    exports.ERROR_NO_SUCH_METHOD = 'no such method';
    exports.ERROR_PERMISSION_DENIED = 'permission denied';


    /*
     * 当a<b返回-1, 当a==b返回0, 当a>b返回1,
     * 约定当a或b非法则返回-1
     */
    function compareVersion(a, b) {
        var i, l, r, len;

        a = String(a).split('.');
        b = String(b).split('.');

        // try {
        for (i = 0, len = Math.max(a.length, b.length); i < len; i++) {
            l = isFinite(a[i]) && Number(a[i]) || 0;
            r = isFinite(b[i]) && Number(b[i]) || 0;
            if (l < r) {
                return -1;
            } else if (l > r) {
                return 1;
            }
        }

        // } catch (e) {
        //     console.error(e);
        //     return -1;
        // }

        return 0;
    }

    /**
     * @function core.compare
     * @desc 比较版本号，返回比较结果（-1，0，1）。如果当前 QQVersion 小于给定版本，返回 -1，等于返回 0，大于返回 1
     * @param {String} version
     *
     * @example
     * mqq.QQVersion = "4.7";
     * mqq.compare("10.0");// 返回-1
     * mqq.compare("4.5.1");// 返回1
     *
     * @support iOS 4.2
     * @support android 4.2
     */
    exports.compare = function(ver) {
        return compareVersion(exports.clientVersion, ver);
    };

    /*
     * 判断各种平台，手Q，iPadQQ，部落App等
     */
    exports.platform = (function() {
        var p = 'browser',
            m,
            ver;

        if (exports.android) {

            // 判断手机QQ
            if ((m = ua.match(REGEXP_ANDROID_QQ)) && m.length) {
                exports.QQVersion = exports.clientVersion = (compareVersion(m[1], m[3]) >= 0 ? m[1] : m[3]) || '0';
                p = 'AndroidQQ';
            } else if ((m = ua.match(REGEXP_TRIBE)) && m.length) { // 判断部落App
                exports.clientVersion = m[1] || '0';
                p = 'AndroidTribe';
            }

            // 兼容 android 旧接口
            window.JsBridge = window.JsBridge || {};
            window.JsBridge.callMethod = invokeClientMethod;
            window.JsBridge.callback = execGlobalCallback;
            window.JsBridge.compareVersion = exports.compare;
        }

        if (exports.iOS) {

            // 用于接收客户端返回值
            exports.__RETURN_VALUE = undefined;

            if ((m = ua.match(REGEXP_IPAD_QQ)) && m.length) {
                exports.clientVersion = m[1] || '0';
                exports.QQVersion = m[2] || exports.clientVersion; // iPadQQ 可能会模拟 QQ 的版本
                p = 'iPadQQ';
            } else if ((m = ua.match(REGEXP_IPHONE_QQ)) && m.length) {
                exports.QQVersion = exports.clientVersion = m[1] || '0';
                p = 'iPhoneQQ';
            } else if ((m = ua.match(REGEXP_TRIBE)) && m.length) { // 判断部落App
                exports.clientVersion = m[1] || '0';
                p = 'iOSTribe';
            } else {

                // ios qq 5.9.5有bug，安装完qq后第一次打开webview，ua的设置不正确，没有qq信息在里面，因此这里尝试去调用一下同步接口，判断是否是qq。qq 6.0已经修复该问题
                // 2015/11/05 by az
                ver = invokeClientMethod('device', 'qqVersion');
                if (!!ver) {
                    exports.QQVersion = exports.clientVersion = ver;
                    p = 'iPhoneQQ';
                }
            }

            // 兼容 iOS 旧接口
            window.iOSQQApi = exports;
        }

        return p;
    })();


    UUIDSeed = (function() {
        var count = 1, // 从1开始, 因为QQ浏览器的注入广告占用了0, 避免冲突
            i;

        for (i in aCallbacks) { // 有些页面会引用多份 qqapi.js，(⊙﹏⊙)b，这里对回调序号做重新矫正
            if (aCallbacks.hasOwnProperty(i)) {
                i = Number(i);

                // 事件的key值是字符串
                if (!isNaN(i)) {
                    count = Math.max(count, i);
                }
            }
        }

        return ++count;
    })();

    Report = (function() {
        var reportCache = [],
            sendFrequency = 500,
            timer = 0,
            lastTimerTime = 0,

            APP_ID = 1000218,
            TYPE_ID = 1000280,

        // 抽样比例
            sample = 100,

            mainVersion = String(exports.QQVersion).split('.').slice(0, 3).join('.'),

            releaseVersion = exports.platform + '_MQQ_' + mainVersion,

            qua = exports.platform + exports.QQVersion + '/' + exports.version;

        function sendReport() {
            var arr = reportCache,
                params = {},
                img;

            reportCache = [];
            timer = 0;

            if (!arr.length) {

                // 这次没有要上报的, 就关掉定时器
                return;
            }


            params.appid = APP_ID; // 手机QQ JS API
            params.typeid = TYPE_ID; // UDP 接口需要
            params.releaseversion = releaseVersion;

            // params.build = location.hostname + location.pathname;
            params.sdkversion = exports.version;
            params.qua = qua;
            params.frequency = sample;

            params.t = Date.now();

            params.key = ['commandid', 'resultcode', 'tmcost'].join(',');

            arr.forEach(function(a, i) {

                params[i + 1 + '_1'] = a[0];
                params[i + 1 + '_2'] = a[1];
                params[i + 1 + '_3'] = a[2];
            });

            params = new String(toQuery(params));

            // api 的上报量太大了, 后台撑不住
            if (exports.compare('4.6') >= 0) {

                // 优先用客户端接口上报
                setTimeout(function() {

                    if (mqq.iOS) {
                        mqq.invokeClient('data', 'pbReport', {
                            type: String(10004),
                            data: params
                        });
                    } else {
                        mqq.invokeClient('publicAccount', 'pbReport', String(10004), params);
                    }
                }, 0);

            } else {
                img = new Image();
                img.onload = function() {
                    img = null;
                };

                img.src = 'http://wspeed.qq.com/w.cgi?' + params;
            }

            timer = setTimeout(sendReport, sendFrequency);
        }

        function send(api, retCode, costTime) {
            var mod;

            // API调用进行抽样上报, 返回则不抽样
            if (retCode === CODE_API_CALL) {

                retCode = 0; // API 调用的状态码用回 0
                mod = Math.round(Math.random() * sample) % sample;
                if (mod !== 1) {
                    return;
                }
            }

            reportCache.push([api, retCode || 0, costTime || 0]);

            // if(Date.now() - lastTimerTime < sendFrequency){

            //     // 连续的 sendFrequency 时间内的上报都合并掉
            //     clearTimeout(timer);
            //     timer = 0;
            // }
            if (!timer) {
                lastTimerTime = Date.now();
                timer = setTimeout(sendReport, sendFrequency);
            }

        }

        return {
            send: send
        };

    })();

    function log(params) {
        var firebug = window.MQQfirebug;

        if (exports.debuging && firebug && firebug.log && params.method !== 'pbReport') {
            try {
                firebug.log(params);
            } catch (e) {}
        }
    }

    /*
     * 上报 API 调用和把 API 的回调跟 API 名字关联起来, 用于上报返回码和返回时间
     */
    function reportAPI(schema, ns, method, argus, sn) {

        if (!schema || !ns || !method) {

            // 非正常的 API 调用就不上报了
            return;
        }

        var uri = schema + '://' + ns + '/' + method,
            a, i, l, m;

        argus = argus || [];

        if (!sn || !(aCallbacks[sn] || window[sn])) {

            // 尝试从参数中找到回调参数名作为 sn
            sn = null;
            for (i = 0, l = argus.length; i < l; i++) {
                a = argus[i];
                if (exports.isObject(a)) {

                    a = a.callbackName || a.callback;
                }

                if (a && (aCallbacks[a] || window[a])) {
                    sn = a;
                    break;
                }
            }
        }

        if (sn) { // 记录 sn 和 uri 的对应关系
            // 新增na, method，用于debug模式输出
            aReports[sn] = {
                from: 'reportAPI',
                ns: ns,
                method: method,
                uri: uri,
                startTime: Date.now()
            };
            m = String(sn).match(/__MQQ_CALLBACK_(\d+)/);
            if (m) { //  兼容直接使用 createCallbackName 生成回调的情况
                aReports[m[1]] = aReports[sn];
            }
        }

        // Console.debug('sn: ' + sn, aReports);
        // 发上报请求
        Report.send(uri, CODE_API_CALL);
    }

    /*
     * 创建名字空间
     * @param  {String} name
     */
    function createNamespace(name) {
        var arr = name.split('.'),
            space = window;

        arr.forEach(function(a) {
            !space[a] && (space[a] = {});
            space = space[a];
        });
        return space;
    }

    /**
     * @function core.callback
     * @desc 用于生成回调名字，跟着 invoke 的参数传给客户端，客户端执行回调时，根据该回调名字找到相应的回调处理函数并执行
     * @param {Function} handler 接口的回调处理函数
     * @param {Boolean} [deleteOnExec] 若为 true 则执行完该回调之后删除之，用于防止同一个回调被多次执行（某些情况下有用）
     * @param {Boolean} [execOnNewThread] 若为 true 则在另一个线程执行回调，iOS 中，以下两种场景须指定该参数为 true
     * @default for execOnNewThread true
     *
     * @important 如果在 UI 相关接口的回调中调用 alert 等 UI 接口，会导致 WebView 假死，只能关进程处理
     * @important 如果在接口 A 的回调中继续调用接口 B，接口 B 的调用可能会无效亦或者返回结果不正确
     *
     * @example
     * var callbackName = mqq.callback(function(type, index){
     *     console.log("type: " + type + ", index: " + index);
     * });
     * //弹出 ActionSheet
     * mqq.invoke("ui", "showActionSheet", {
     *     "title" : "title",
     *     "items" : ["item1", "item2"],
     *     "cancel" : "cancel",
     *     "close" : "close",
     *     "onclick": callbackName
     * }
     *
     * @support iOS 4.2
     * @support android 4.2
     */
    function createCallbackName(callback, deleteOnExec, execOnNewThread) {
        var sn, name;

        callback = exports.isFunction(callback) ? callback : window[callback];
        if (!callback) {
            return;
        }

        // // 默认执行一遍后就删掉
        // if (exports.isUndefined(deleteOnExec)) {
        //     deleteOnExec = true;
        // }

        sn = storeCallback(callback);

        name = '__MQQ_CALLBACK_' + sn;

        // alert(name)

        window[name] = function() {

            var argus = SLICE.call(arguments);

            fireCallback(sn, argus, deleteOnExec, execOnNewThread);

        };

        return name;
    }

    function storeCallback(callback) {
        var sn = '' + UUIDSeed++;

        if (callback) {
            /*window[sn] = */
            aCallbacks[sn] = callback;
        }

        return sn;
    }

    /*
     * 从 obj 中找出错误码
     * @param  {Object} obj
     */
    function getResultCode(obj) {
        var retCode, j, n,
            keys = ['retCode', 'retcode', 'resultCode', 'ret', 'code', 'r'];

        for (j = 0, n = keys.length; j < n; j++) {
            if (keys[j] in obj) {
                retCode = obj[keys[j]];
                break;
            }
        }

        return retCode;
    }

    /*
     * 所有回调的最终被执行的入口函数
     */
    function fireCallback(sn, argus, deleteOnExec, execOnNewThread) {
        // alert(JSON.stringify(arguments))

        var callback = exports.isFunction(sn) ? sn : (aCallbacks[sn] || window[sn]),
            endTime = Date.now(),
            result,
            retCode,
            obj;

        argus = argus || [];
        result = argus[0];

        // 默认都在新线程执行
        if (exports.isUndefined(execOnNewThread)) {
            execOnNewThread = true;
        }

        // 统一回调格式 { code: 0, msg: "", data: {} }
        if (exports.isObject(result)) {

            if (!('data' in result)) {
                result.data = extend({}, result);
            }

            if (!('code' in result)) {
                result.code = getResultCode(result) || 0;
            }

            result.msg = result.msg || '';

        }

        if (exports.isFunction(callback)) {

            if (execOnNewThread) {
                setTimeout(function() {
                    // alert(callback)
                    callback.apply(null, argus);
                }, 0);
            } else {
                callback.apply(null, argus);
            }
        } else {

            console.log('mqqapi: not found such callback: ' + sn);
        }

        if (deleteOnExec) {
            delete aCallbacks[sn];
            delete window['__MQQ_CALLBACK_' + sn];
        }

        // 上报 API 调用返回
        // alert(sn)
        if (aReports[sn]) {
            obj = aReports[sn];
            delete aReports[sn];

            // 输出结果, 上报数据不输出
            log({
                from: 'fireCallback',
                ns: obj.ns,
                method: obj.method,
                ret: JSON.stringify(argus),
                url: obj.uri
            });

            if (Number(sn)) {
                delete aReports['__MQQ_CALLBACK_' + sn];
            }

            if (result) { // 只取第一个参数来判断

                if (result.code !== undefined) {
                    retCode = result.code;
                } else if (/^-?\d+$/.test(String(result))) { // 第一个参数是个整数, 认为是返回码
                    retCode = result;
                }
            }

            // 发上报请求
            Report.send(obj.uri + '#callback', retCode, endTime - obj.startTime);
        }
    }

    /*
     * android / iOS 5.0 开始, client回调 js, 都通过这个入口函数处理
     */

    function execGlobalCallback(sn) {

        // alert(JSON.stringify(arguments))

        var argus = SLICE.call(arguments, 1);

        if (exports.android && argus && argus.length) {

            // 对 android 的回调结果进行兼容
            // android 的旧接口返回会包装个 {r:0,result:123}, 要提取出来
            argus.forEach(function(data, i) {
                if (exports.isObject(data) && ('r' in data) && ('result' in data)) {
                    argus[i] = data.result;
                }
            });
        }

        // alert(argus)

        fireCallback(sn, argus);
    }

    /*
     * 空的api实现, 用于兼容在浏览器调试, 让mqq的调用不报错
     */
    function emptyAPI() {
        // var argus = SLICE.call(arguments);
        // var callback = argus.length && argus[argus.length-1];
        // return (typeof callback === 'function') ? callback(null) : null;
    }

    /**
     * @function core.build
     * @desc 创建 api 方法, 把指定 api 包装为固定的调用形式
     * @param {String} name 需创建的命名空间，如：'mqq.ui.openUrl'
     * @param {Object} data 接口配置信息（包含接口在iOS/android/browser端的执行以及各平台手Q支持的版本）
     *
     * @example
     * mqq.build("ui.openUrl", {
     *     android: function(){},
     *     iOS: fucntion(){},
     *
     *     AndroidQQ: function(){},
     *     iPhoneQQ: fucntion(){},
     *     iPadQQ: function(){},
     *     Buluo: function(){},
     *     browser: function(){}, // 某些 api 可能有浏览器兼容的方式
     *     support: {
     *         AndroidQQ: '4.5',
     *         iPhoneQQ: '4.5',
     *         iPadQQ: '4.5',
     *         Buluo: '4.5'
     *     }
     * })
     *
     * @support iOS 4.2
     * @support android 4.2
     */
    function buildAPI(name, data) {
        var func = null,
            str,
            mayRecursive = false,
            plat = exports.platform,
            arr = name.split('.'),
            index = name.lastIndexOf('.'),

            nsName = arr[arr.length - 2],
            methodName = arr[arr.length - 1],
            ns = createNamespace(name.substring(0, index));

        // 该处增加debug状态判断，允许某些调试行为刻意重写`mqq`方法
        if (ns[methodName] && !exports.debuging) {

            // 多次挂载mqq会导致同一方法多次创建而导致报错终止
            return;
        }

        if (!(func = data[exports.platform]) && plat !== 'browser') {

            // 没有指定特殊平台，且不是浏览器的环境，则尝试用通用的 iOS 和android 去找
            if (func = exports.iOS && data.iOS) {
                plat = 'iOS';
            } else if (func = exports.android && data.android) {
                plat = 'android';
            }
        }

        if (func && data.supportInvoke) {

            // 缓存起来，用于兼容标准的方式调用
            aFunctions[nsName + '.' + methodName] = func;
        }

        // if (func && !data.supportSync) {

        //     var func2 = function() {
        //         var argus = SLICE.call(arguments),
        //             self = this;

        //         setTimeout(function() {
        //             func.apply(self, argus);
        //         }, 0);
        //     };
        // }

        ns[methodName] = func ? func : emptyAPI;

        // 用于 supportVersion 判断
        if (data.support && data.support[plat]) {
            aSupports[nsName + '.' + methodName] = data.support[plat];
        }


    }


    /**
     * @function core.support
     * @desc 检查当前手机QQ环境是否支持该接口，返回 true 则表示支持该接口；false 则不支持。
     * @param {String} apiName 接口名字
     * @example
     * mqq.support("mqq.device.getClientInfo"); // return true | false
     *
     * @support iOS 4.2
     * @support android 4.2
     */
    function supportVersion(name) {

        var support,
            vers,
            arr = name.split('.'),
            shortName = arr[arr.length - 2] + '.' + arr[arr.length - 1];

        support = aSupports[shortName] || aSupports[name.replace('qw.', 'mqq.').replace('qa.', 'mqq.')];

        if (exports.isObject(support)) { // 如果support是个obj，则是旧的情况，要做兼容
            support = support[exports.iOS ? 'iOS' : exports.android ? 'android' : 'browser'];
        }

        if (!support) {
            return false;
        }

        // 增加版本区间检查 20140924
        vers = support.split('-');

        if (vers.length === 1) {
            return exports.compare(vers[0]) > -1;
        } else {
            return exports.compare(vers[0]) > -1 && exports.compare(vers[1]) < 1;
        }

    }

    /*
     * 使用 iframe 发起伪协议请求给客户端
     */
    function openURL(url, ns, method, sn) {
        // Console.debug('openURL: ' + url);
        log({
            from: 'openURL',
            ns: ns || '',
            method: method || '',
            url: url
        });
        var returnValue,
            iframe = document.createElement('iframe');

        iframe.style.cssText = 'display:none;width:0px;height:0px;';

        function failCallback() {

            /*
             正常情况下是不会回调到这里的, 只有客户端没有捕获这个 url 请求,
             浏览器才会发起 iframe 的加载, 但这个 url 实际上是不存在的,
             会触发 404 页面的 onload 事件
             */
            execGlobalCallback(sn, {
                r: -201,
                result: 'error'
            });
        }

        if (exports.iOS) {

            /*
             ios 必须先赋值, 然后 append, 否者连续的 api调用会间隔着失败
             也就是 api1(); api2(); api3(); api4(); 的连续调用,
             只有 api1 和 api3 会真正调用到客户端
             */
            iframe.onload = failCallback;
            iframe.src = url;
        }

        (document.body || document.documentElement).appendChild(iframe);

        /*
         android 这里必须先添加到页面, 然后再绑定 onload 和设置 src
         1. 先设置 src 再 append 到页面, 会导致在接口回调(callback)中嵌套调用 api会失败,
         iframe会直接当成普通url来解析
         2. 先设置onload 在 append , 会导致 iframe 先触发一次 about:blank 的 onload 事件

         */
        if (exports.android) { // android 必须先append 然后赋值
            iframe.onload = failCallback;
            iframe.src = url;
        }

        // iOS 可以同步获取返回值, 因为 iframe 的url 被客户端捕获之后, 会挂起 js 进程
        returnValue = exports.__RETURN_VALUE;
        exports.__RETURN_VALUE = undefined;

        // android 捕获了iframe的url之后, 也是中断 js 进程的, 所以这里可以用个 setTimeout 0 来删除 iframe
        setTimeout(function() {
            iframe && iframe.parentNode && iframe.parentNode.removeChild(iframe);
        }, 0);

        return returnValue;
    }


    function isAndroidQQAndRequireCompatible(ns, method) {

        if (exports.platform === 'AndroidQQ') {

            if (exports.compare('4.7.2') < 0) {
                return true;
            }

            if (NEW_PROTOCOL_BACK_LIST[ns] && exports.compare(NEW_PROTOCOL_BACK_LIST[ns]) < 0) {
                return true;
            }

        }

        return false;
    }


    /**
     * @function core.invokeURL
     * @desc mqq 核心方法，用于调用客户端接口。
     * @param {String} url 最终传给终端的url, 不支持回调.
     * @example
     * // 调用普通接口
     * // ios, android
     * mqq.invokeURL("weixin://ns/method");
     *
     * @important 此方法主要在使用手Q外的其它协议时使用
     */
    function invokeURL(url) {
        openURL(url);
    }

    /**
     * @function core.invoke
     * @desc mqq 核心方法，用于调用客户端接口。invoke 封装了两个系统（android、ios）的不同，同时对不同版本进行了兼容。
     * @param {String} namespace 命名空间，每个客户端接口都属于一个命名空间，若不清楚，请咨询对应的客户端开发
     * @param {String} method 接口名字
     * @param {Object} [params] API 调用的参数
     * @param {Function} [callback] API 调用的回调
     * @important 因历史版本的客户实现问题，同一个接口在 android 和 iOS 命名空间和方法名都不一致，同时接口实现的也可能有些许差异，因此尽量使用下面封装好的方法，如：mqq.ui.openUrl。直接调用 invoke 的情况只建议在 android 和 iOS 的实现命名空间和方法以及参数格式都完全一致时使用。
     * @example
     * // 调用普通接口
     * // ios, android
     * mqq.invoke("ns", "method");
     *
     * @example
     * // 调用需要传参数的接口
     * mqq.invoke("ns", "method", {foo: 'bar'});
     *
     * @example
     * // 调用需要传参数且有回调结果的接口
     * mqq.invoke("ns", "method", {foo: 'bar'}, function(data){
     *     console.log(data);
     * });
     *
     *
     * @support iOS 4.2
     * @support android 4.2
     * @support for params iOS 4.5
     * @support for params android 4.7
     */
    function invokeClientMethod(ns, method, params, callback) {

        // 限制iframe里面调用
        if (!ns || !method || window !== window.top) {
            return null;
        }

        var url,
            sn,
            argus,
            result; // sn 是回调函数的序列号

        argus = SLICE.call(arguments, 2);
        callback = argus.length && argus[argus.length - 1];

        if (exports.isFunction(callback)) { // args最后一个参数是function, 说明存着callback
            argus.pop();
        } else if (exports.isUndefined(callback)) {

            // callback 是undefined的情况, 可能是 api 定义了callback, 但是用户没传 callback, 这时候要把这个 undefined的参数删掉
            argus.pop();
        } else {
            callback = null;
        }

        params = argus[0]; // 一般的接口调用只会有一个参数，这里也只对第一个参数做些特殊处理

        // 统一生成回调序列号, callback 为空也会返回 sn
        sn = storeCallback(callback);

        if (NOT_REPORT_METHOD.indexOf(method) === -1) {

            // 上报 API 调用, openURL 会阻塞 js 线程, 因此要先打点和上报
            reportAPI('jsbridge', ns, method, argus, sn);
        }

        // 如果最后一个参数传了 function, 且 params 里面没有 'callback' 属性的, 把function赋值给params
        // 兼容之后, 任何参数调用都可以直接 mqq.invoke('ns', 'method', params, callback) 了
        // az @ 2015/4/17
        if (callback && exports.isObject(params) && !params['callback']) {
            window['__MQQ_CALLBACK_AUTO_' + sn] = callback;
            params['callback'] = '__MQQ_CALLBACK_AUTO_' + sn;
        }

        if (isAndroidQQAndRequireCompatible(ns, method)) { // android qq 小于 4.7.2的版本需要一些兼容处理

            // 进入到这个分支的，要不版本号小于 4.7.2 ，要不则接口需要用旧协议兼容

            /*
             * Android 4.5 到 4.7.2 支持旧的 jsbridge 协议，4.7.2之后与 ios 进行了统一
             * 三星特供版（ua 里面有_NZ）, 从 4.2.1 拉的分支, 4.2.1 已经去掉了注入到全局对象的方法，但是有支持 jsbridge
             */
            if (exports.compare('4.5') > -1 || /_NZ\b/.test(ua)) {

                // AndroidQQ 且不支持新 jsbridge 协议的版本， 用旧协议拼接
                // 还有部分接口在 4.7.2 还不能使用新协议, 后续版本会修复该问题

                // jsbridge://ns/method/123/test/xxx/yyy
                url = 'jsbridge://' + encodeURIComponent(ns) + '/' + encodeURIComponent(method) + '/' + sn;

                argus.forEach(function(a) {
                    if (exports.isObject(a)) {
                        a = JSON.stringify(a);
                    }

                    url += '/' + encodeURIComponent(String(a));
                });

                openURL(url, ns, method, sn);

            } else { // android 4.5 以下，不支持 jsbridge，但是有注入 java 对象到 js 上下文中
                if (window[ns] && window[ns][method]) {
                    result = window[ns][method].apply(window[ns], argus);
                    if (callback) {

                        fireCallback(sn, [result]);
                    } else {
                        return result;
                    }
                } else if (callback) {
                    fireCallback(sn, [exports.ERROR_NO_SUCH_METHOD]);
                }
            }
        } else { // 剩下的都用新协议

            /*
             android 4.7 以上的支持 ios的协议, 但是客户端的旧接口需要迁移, 4.7赶不上, 需要等到 4.7.2
             jsbridge://ns/method?p=test&p2=xxx&p3=yyy#123
             */
            url = 'jsbridge://' + encodeURIComponent(ns) + '/' + encodeURIComponent(method);

            argus.forEach(function(a, i) {
                if (exports.isObject(a)) {
                    a = JSON.stringify(a);
                }

                if (i === 0) {
                    url += '?p=';
                } else {
                    url += '&p' + i + '=';
                }

                url += encodeURIComponent(String(a));
            });

            // 加上回调序列号
            if (method !== 'pbReport') {

                /*
                 * pbReport 这个接口不能加回调序号, 这个接口本来就不支持回调
                 * 但是 android 的 jsbridge 即使接口没有回调结果, 也会调用一次 js 表示这次接口调用到达了客户端
                 * 同时, 由于 android 一执行 loadUrl('javascript:xxx') 就会导致软键盘收起
                 * 所以上报的时候经常会引发这个问题, 这里就直接不加回调序号了
                 */

                url += '#' + sn;
            }

            result = openURL(url, ns, method);
            if (exports.iOS && result !== undefined && result.result !== undefined) {

                // FIXME 这里可能会导致回调两次, 但是 iOS 4.7.2以前的接口是依靠这里实现异步回调, 因此要验证下
                if (callback) {
                    fireCallback(sn, [result.result]);
                } else {
                    return result.result;
                }
            }
        }

        return null;

    }

    function invoke(ns, method, argus, callback) {
        var func = aFunctions[ns + '.' + method];

        if (exports.isFunction(func)) {

            // 调用参数要去掉ns 和 method
            return func.apply(this, SLICE.call(arguments, 2));
        }

        return invokeClientMethod.apply(this, SLICE.call(arguments));

    }
    /**
     * @function core.invokeSchema
     * @desc 调用手机QQ的原有schema接口，主要用于旧的 schema 接口兼容。
     * @param {String} schema 协议名字
     * @param {String} namespace 命名空间，每个客户端接口都属于一个命名空间，若不清楚，请咨询对应的客户端开发
     * @param {String} method 接口名字
     * @param {Object} [params] API 调用的参数
     * @param {Function} [callback] API 调用的回调
     * @example
     * mqq.invokeSchema("mqqapi", "card", "show_pslcard", { uin: "123456" }, callback);
     *
     * @support iOS 4.2
     * @support android 4.2
     */
    function invokeSchemaMethod(schema, ns, method, params, callback) {
        if (!schema || !ns || !method) {
            return null;
        }

        var argus = SLICE.call(arguments),
            sn,
            url;

        if (exports.isFunction(argus[argus.length - 1])) {
            callback = argus[argus.length - 1];
            argus.pop();
        } else {
            callback = null;
        }

        if (argus.length === 4) {
            params = argus[argus.length - 1];
        } else {
            params = {};
        }

        if (callback) {
            params['callback_type'] = 'javascript';
            sn = createCallbackName(callback);
            params['callback_name'] = sn;
        }

        params['src_type'] = params['src_type'] || 'web';

        if (!params.version) {
            params.version = 1;
        }

        url = schema + '://' + encodeURIComponent(ns) + '/' + encodeURIComponent(method) + '?' + toQuery(params);
        openURL(url, ns, method);

        // 上报 API 调用
        reportAPI(schema, ns, method, argus, sn);
    }

    // ////////////////////////////////// util /////////////////////////////////////////////////
    function mapQuery(uri) {
        var i,
            key,
            value,
            index = uri.indexOf('?'),
            pieces = uri.substring(index + 1).split('&'),
            piece,
            params = {};

        for (i = 0; i < pieces.length; i++) {
            piece = pieces[i];
            index = piece.indexOf('=');
            if (index === -1) { // 只有一个 key的情况
                params[piece] = '';
            } else {
                key = piece.substring(0, index);
                value = piece.substring(index + 1);
                params[key] = decodeURIComponent(value);

            }
        }

        return params;
    }

    function toQuery(obj) {
        var result = [],
            key,
            value;

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                key = String(key);
                value = String(obj[key]);
                if (key === '') {
                    result.push(value);
                } else {
                    result.push(key + '=' + encodeURIComponent(value));
                }
            }
        }

        return result.join('&');
    }

    function removeQuery(url, keys) {
        var a = document.createElement('a'),
            obj;

        a.href = url;

        if (a.search) {
            obj = mapQuery(String(a.search).substring(1));
            keys.forEach(function(k) {
                delete obj[k];
            });
            a.search = '?' + toQuery(obj);
        }

        // if (a.hash) {
        //     obj = mapQuery(String(a.hash).substring(1));
        //     keys.forEach(function(k) {
        //         delete obj[k];
        //     });
        //     a.hash = '#' + toQuery(obj);
        // }

        url = a.href;
        a = null;

        return url;
    }

    // ////////////////////////////////// end util /////////////////////////////////////////////////


    // ////////////////////////////////// event /////////////////////////////////////////////////

    /**
     * @function core.addEventListener
     * @desc 监听客户端事件，该事件可能来自客户端业务逻辑，也可能是其他 WebView 使用 dispatchEvent 抛出的事件
     * @param {String} eventName 事件名字
     * @param {Function} handler 事件的回调处理函数
     * @param {Object} handler.data 该事件传递的数据
     * @param {Object} handler.source 事件来源
     * @param {string} handler.source.url 抛出该事件的页面地址
     * @example
     * mqq.addEventListener("hiEvent", function(data, source){
     *     console.log("someone says hi", data, source);
     * })
     *
     * @support iOS 5.0
     * @support android 5.0
     */
    function addEventListener(eventName, handler) {

        if (eventName === 'qbrowserVisibilityChange') {

            // 兼容旧的客户端事件
            document.addEventListener(eventName, handler, false);
            return true;
        }

        var evtKey = 'evt-' + eventName;

        (aCallbacks[evtKey] = aCallbacks[evtKey] || []).push(handler);
        return true;
    }

    /**
     * @function core.removeEventListener
     * @desc 移除客户端事件的监听器
     * @param {String} eventName 事件名字
     * @param {Function} [handler] 事件的回调处理函数，不指定 handler 则删除所有该事件的监听器
     *
     * @support iOS 5.0
     * @support android 5.0
     */
    function removeEventListener(eventName, handler) {
        var evtKey = 'evt-' + eventName,
            handlers = aCallbacks[evtKey],
            flag = false,
            i;

        if (!handlers) {
            return false;
        }

        if (!handler) {
            delete aCallbacks[evtKey];
            return true;
        }

        for (i = handlers.length - 1; i >= 0; i--) {
            if (handler === handlers[i]) {
                handlers.splice(i, 1);
                flag = true;
            }
        }

        return flag;
    }

    // 这个方法时客户端回调页面使用的, 当客户端要触发事件给页面时, 会调用这个方法
    function execEventCallback(eventName /*, data, source*/ ) {
        var evtKey = 'evt-' + eventName,
            handlers = aCallbacks[evtKey],
            argus = SLICE.call(arguments, 1);

        if (handlers) {
            handlers.forEach(function(handler) {
                fireCallback(handler, argus, false);
            });
        }
    }
    /**
     * @function core.dispatchEvent
     * @desc 抛出一个事件给客户端或者其他 WebView，可以用于 WebView 间通信，或者通知客户端对特殊事件做处理（客户端需要做相应开发）
     * @param {String} eventName 事件名字
     * @param {Object} data 事件传递参数
     * @param {Object} options 事件参数
     * @param {Boolean} options.echo 当前webview是否能收到这个事件，默认为true
     * @param {Boolean} options.broadcast 是否广播模式给其他webview，默认为true
     * @param {Array|String} options.domains 指定能接收到事件的域名，默认只有同域的webview能接收，支持通配符，比如"*.qq.com"匹配所有qq.com和其子域、"*"匹配所有域名。注意当前webview是否能接收到事件只通过echo来控制，这个domains限制的是非当前webview。
     * @example
     * //1. WebView 1(www.qq.com) 监听 hello 事件
     * mqq.addEventListener("hello", function(data, source){
     *    console.log("someone says hi to WebView 1", data, source)
     * });
     * //2. WebView 2(www.tencent.com) 监听 hello 事件
     * mqq.addEventListener("hello", function(data, source){
     *    console.log("someone says hi to WebView 2", data, source)
     * });
     * //3. WebView 2 抛出 hello 事件
     * //不传配置参数，默认只派发给跟当前 WebView 相同域名的页面, 也就是只有 WebView 2能接收到该事件（WebView 1 接收不到事件，因为这两个 WebView 的域名不同域）
     * mqq.dispatchEvent("hello", {name: "abc", gender: 1});
     *
     * //echo 为 false, 即使 WebView 2 的域名在 domains 里也不会收到事件通知, 该调用的结果是 WebView 1 将接收到该事件
     * mqq.dispatchEvent("hello", {name:"alloy", gender:1}, {
     *     //不把事件抛给自己
     *     echo: false,
     *     //广播事件给其他 WebView
     *     broadcast: true,
     *     //必须是这些域名的 WebView 才能收到事件
     *     domains: ["*.qq.com", "*.tencent.com"]
     * });
     *
     * //echo 和 broadcast 都为 false, 此时不会有 WebView 会接收到事件通知, 但是客户端仍会收到事件, 仍然可以对该事件做处理, 具体逻辑可以每个业务自己处理
     * mqq.dispatchEvent("hello", {name:"alloy", gender:1}, {
     *     echo: false,
     *     broadcast: false,
     *     domains: []
     * });
     *
     * @support iOS 5.0
     * @support android 5.0
     */
    function dispatchEvent(eventName, data, options) {

        var params = {
                event: eventName,
                data: data || {},
                options: options || {}
            },
            url;

        if (exports.android && params.options.broadcast === false && exports.compare('5.2') <= 0) {
            // 对 android 的 broadcast 事件进行容错, broadcast 为 false 时,
            // 没有 Webview会接收到该事件, 但客户端依然要能接收
            // 5.2 已经修复该问题
            params.options.domains = ['localhost'];
            params.options.broadcast = true;
        }

        if (exports.platform !== 'browser') { // 浏览器环境不要调用这个接口
            url = 'jsbridge://event/dispatchEvent?p=' + encodeURIComponent(JSON.stringify(params) || '');
            openURL(url, 'event', 'dispatchEvent');

            reportAPI('jsbridge', 'event', 'dispatchEvent');
        }
    }

    /**
     * @event qbrowserTitleBarClick
     * @desc 点击标题栏事件，监听后点击手机QQ标题栏就会收到通知，可以用来实现点击标题滚动到顶部的功能
     * @param {Function} callback 事件回调
     * @param {Object} callback.data 事件参数
     * @param {Object} callback.data.x 点击位置的屏幕x坐标
     * @param {Object} callback.data.y 点击位置的屏幕y坐标
     * @param {Object} callback.source 事件来源
     * @example
     * mqq.addEventListener("qbrowserTitleBarClick", function(data, source){
     *     console.log("Receive event: qbrowserTitleBarClick, data: " + JSON.stringify(data) + ", source: " + JSON.stringify(source));
     * });
     *
     * @support iOS 5.2
     * @support android 5.2
     */

    /**
     * @event qbrowserOptionsButtonClick
     * @desc Android 的物理菜单键的点击事件，点击后会收到通知
     * @param {Function} callback 事件回调
     * @param {Object} callback.data 事件参数
     * @param {Object} callback.source 事件来源
     * @example
     * mqq.addEventListener("qbrowserOptionsButtonClick", function(data, source){
     *     console.log("Receive event: qbrowserOptionsButtonClick, data: " + JSON.stringify(data) + ", source: " + JSON.stringify(source));
     * });
     *
     * @support iOS not support
     * @support android 5.2
     */

    /**
     * @event qbrowserPullDown
     * @desc 页面下拉刷新时候会抛出该事件，主要用于与setPullDown交互，具体可参考setPullDown
     * @example
     * mqq.addEventListener("qbrowserPullDown", function () {
     *     // ... Your Code ...
     * });
     * @note 该事件可配合下拉刷新做交互，具体可参考`setPullDown`
     *
     * @support iOS 5.3
     * @support android 5.3
     */

    /**
     * @event qbrowserVisibilityChange
     * @desc 当webview可见性发生改变时将会抛出该事件
     * @example
     * mqq.addEventListener("qbrowserVisibilityChange", function(e){
     *     console.log(e.hidden);
     * });
     *
     * @support iOS 4.7
     * @support android 4.7
     */


    // ////////////////////////////////// end event /////////////////////////////////////////////////


    // for debug
    exports.__aCallbacks = aCallbacks;
    exports.__aReports = aReports;
    exports.__aSupports = aSupports;
    exports.__aFunctions = aFunctions;

    // for internal use
    exports.__fireCallback = fireCallback;
    exports.__reportAPI = reportAPI;

    // 扩展 exports 对象
    extend(exports, {

        // core
        invoke: invoke,
        invokeClient: invokeClientMethod,
        invokeSchema: invokeSchemaMethod,
        invokeURL: invokeURL,
        build: buildAPI,
        callback: createCallbackName,
        support: supportVersion,
        execGlobalCallback: execGlobalCallback,

        // event
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        dispatchEvent: dispatchEvent,
        execEventCallback: execEventCallback,

        // util
        mapQuery: mapQuery,
        toQuery: toQuery,
        removeQuery: removeQuery
    }, true);

    return exports;

});
;/**
 * @function data.getPerformance
 * @desc 获取 Performance 数据。在统一 WebView 中要在 v4.7.1 才支持。低于 v4.7.1 的建议用非统一 WebView 的接口。
 *
 * @param {Function} callback 回调函数
 * @param {Number} callback.result 返回码。-1：错误，0：成功；
 * @param {String} callback.message 具体错误信息；
 * @param {Object} callback.data 数据对象；
 * @param {Number} callback.data.clickStart 单击按钮的瞬间时间戳，单位毫秒；
 * @param {Number} callback.data.pageStart Web 页面开始加载的时间戳，单位毫秒；
 * @param {Number} callback.data.pageFinish Web 页面完成加载的时间戳，单位毫秒；
 *
 * @example
 * mqq.data.getPerformance(function (ret) {
 *     console.log(JSON.stringify(ret)); // 4.7.2.243
 * });
 *
 * @support iOS 4.7.1
 * @support android 4.7.1
 */

;(function () {
    // 修复 android 5.0 下正常返回的数据和预期的不一样的问题，iOS是正常的
    // 预期值：{result: 0, message: '成功', {clickStart:'1408351124790',pageStart:'1408351144799',pageFinish:'1408351160044'}}
    // 实际值：{clickStart:'1408351124790',pageStart:'1408351144799',pageFinish:'1408351160044'}
    var _wrapCallback = function (callback) {
        return function (responseData) {
            if(mqq.android && responseData && responseData.result === undefined) {
                try {
                    responseData = JSON.parse(responseData);
                } catch (error) {}

                responseData = {
                    result: 0,
                    data: responseData,
                    message: '成功'
                };
            }
            callback(responseData);
        }
    };

    var _handler = function (callback) {
        if (mqq.compare('4.7.1') >= 0) {
            mqq.invokeClient('qw_data', 'getPerformance', _wrapCallback(callback));
        } else {
            try {
                common.getPerformance(_wrapCallback(callback));
            } catch (error) {
                callback({"result": -1, "message": "该接口在手Q v4.7.1 或以上才支持！", "data": null});
            }
        }
    };

    mqq.build('mqq.data.getPerformance', {
        iOS: _handler,
        android: _handler,
        supportInvoke: true,
    support: {
            iOS: '4.7.1',
            android: '4.7.1'
        }
    });

})();
;/**
 * @function device.getNetworkType
 * @desc 获取网络类型
 *
 * @param {Function} callback 回调
 * @param {Number} callback.result 结果
 * @options for callback.result -1: Unknown 未知类型网络
 * @options for callback.result 0: NotReachable
 * @options for callback.result 1: ReachableViaWiFi
 * @options for callback.result 2: ReachableVia2G
 * @options for callback.result 3: ReachableVia3G
 * @options for callback.result 4. 4G
 * @param {Number} callback.carriertype 运营商 (6.5.0 开始支持)
 * @options for callback.carriertype 0: 未知
 * @options for callback.carriertype 1: 中国移动
 * @options for callback.carriertype 2: 中国联通
 * @options for callback.carriertype 3: 中国电信
 * @options for callback.carriertype 4. 中国铁通
 *
 * @example
 * mqq.device.getNetworkType(function(result){
 *     alert(result);
 * });
 *
 * @support iOS 4.5
 * @support android 4.6
 */

mqq.build('mqq.device.getNetworkType', {
    iOS: function(callback) {
        var result = mqq.invokeClient('device', 'networkStatus');
        result = Number(result); // 4.7.1 返回的是字符串数字...
        if (typeof callback === 'function') {
            mqq.__fireCallback(callback, [result]);
        } else {
            return result;
        }
    },
    android: function(callback) {
        if (mqq.compare('4.6') >= 0) {
            mqq.invokeClient('qbizApi', 'getNetworkType', callback);
        } else {
            mqq.invokeClient('publicAccount', 'getNetworkState', function(state) {
                // 0: mobile, 1: wifi, 2...: other
                var map = {
                    '-1': 0,
                    '0': 3,
                    '1': 1
                };
                var newState = (state in map) ? map[state] : 4;
                callback(newState);
            });
        }
    },
    supportInvoke: true,
    support: {
        iOS: '4.5',
        android: '4.6'
    }
});

/* iOS 的接口兼容 */
mqq.build('mqq.device.networkStatus', {
    iOS: mqq.device.getNetworkType,
    supportInvoke: true,
    support: {
        iOS: '4.5'
    }
});

mqq.build('mqq.device.networkType', {
    iOS: mqq.device.getNetworkType,
    supportInvoke: true,
    support: {
        iOS: '4.5'
    }
});
/* end iOS 的接口兼容 */
;/**
 * @function offline.isCached
 * @desc 查询本地是否有指定业务的离线包
 *
 * @param {Object} param
 * @param {Number} param.bid
 * @param {Function} callback
 * @param {Number} callback.localVersion 本地离线包版本号；-1: 无离线包
 *
 * @example
 * mqq.offline.isCached({bid: 123456}, function(localVersion){
 *     if(localVersion === -1){
 *         alert("no local offline data!");
 *     }
 * });
 *
 * @support iOS 4.6
 * @support android 4.6
 */

mqq.build('mqq.offline.isCached', {
    iOS: function(params, callback) {
        var callbackName = mqq.callback(callback);
        if (callbackName) {
            params.callback = callbackName;
            mqq.invokeClient('offline', 'isCached', params);
        }
    },
    android: function(params, callback) {

        mqq.invokeClient('qbizApi', 'isCached', params.bid, mqq.callback(callback));
    },
    supportInvoke: true,
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});

});