/**
 * Created by amos on 14-1-16.
 */
define('util/RESTPlugins/speedReport', function(require){
    var Extend = require('core/Extend'),
        speedReport = require('biz/monitor/speed/speedReport');

    /**
     * @example
     *  REST.use('speedReport');
     *
     *  REST.read({
     *      url: 'cgiUrl',
     *      data: {},
     *
     *      speed: {
     *          // isd cgi as default
     *          url: 'cgiUrl',
     *
     *          // the proxy url //host/path/to?url={url}
     *          proxy: 'proxyUrl',
     *
     *          // flags are generated on m.isd.com
     *          // all reports go to isd monitor
     *          flag1: xx,
     *          flag2: xx,
     *          flag3: xx,
     *          point: xx
     *      }
     *  });
     */
    return function(REST){
        REST.on('request', function(e, xhr, options){
            var speedOption = Extend({}, REST.get('speed'), options.speed);

            if(speedOption && speedOption.flag1 && speedOption.flag2 && speedOption.flag3){
                var report = speedReport.create(speedOption);

                xhr.done(function(){
                    report
                        .add(+new Date(), speedOption.point || 0)
                        .send();
                });
            }
        });
    }
});