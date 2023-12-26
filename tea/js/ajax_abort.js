define(function(require, exports, module) {
    var Controller = require('core/Controller'),
    	REST = require('util/REST');
    
	var ajax_abort = Controller.extend({
		initialize: function() {
           this.rest =  REST.read({
                url: '/ajax_abort',
                data: {
                    id: '20'
                },
                timeout: 5000 //方法1： 传入响应超时时间，超过这个响应时间后拿不到数据,即会执行fail()回调中的事件
            }).done(function(e){
                console.log(e);
                alert("done");
            }).fail(function(err){
                console.log(err);
                //timeout或手动abort()之后想要做的事，都可以写在fail()回调方法里
                alert("fail or abort");
            });

        },

        stopAjax: function(){
            //方法2：手动调用REST(每一个REST都是一个promise实例)的xhr.abort方法
            this.rest.xhr.abort();
        }
	});

   var test = new ajax_abort();

   setTimeout(function(){
        test.stopAjax();
    },2000);

});