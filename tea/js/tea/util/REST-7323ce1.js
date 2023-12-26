/**
 * Created by amos/sean on 14-1-14.
 */
define('util/REST', function(require, exports, module, need){
    var $ = require('lib/zepto'),
		Attributes = require('core/Attributes'),
        Event = require('core/Event'),
		Promise = require('util/Promise');

    var plugins = {
    	speedReport: need('util/RESTPlugins/speedReport'),
        CSRFPatch: need('util/RESTPlugins/CSRFPatch')
    };

    // Map from CRUD to HTTP for our default sync implementation.
    var methodMap = {
        'create': 'POST',
        'update': 'PUT',
        'patch':  'PATCH',
        'del': 'DELETE',
        'read': 'GET',
        
        'post': 'POST'
    };

    var defaults = {
        errorStatusCode: 508,
        ajax: {},
        CSRF: {
            token: '_bqq_csrf'
        }
    };
    
    var globalErrorOcurred = false,
    	lastRequestSettings = [],
    	xhrs = [],
    	going = false,
    	hold;

    /**
     * Restful sync component, provides CRUD methods for ajax programing.
     * REST component supports middle ware plugin and has built-in middle wares of auto error log, auto speed report, auto CSRF patch
     * @class REST
     * @namespace app
     * @module app
     */
    var REST = $.extend({
        /**
         * An interface to $.ajax
         * @method ajax
         * @static
         * @see $.ajax
         */
        ajax: $.ajax,

        /**
         * Main method for REST to communicate with backend
         * @method sync
         * @static
         * @param {String} method Accept CRUD methods only
         * @param {Object} options Sync options
         * @param {Object} [options.data] Data to be sent
         * @returns {$.xhr} $ xhr object, supports promise
         */
        sync: function(method, options) {
            var type = methodMap[method],
				promise = new Promise();

            // Default options, unless specified.
            var ajaxDefaults = this.attributes().ajax;

            // Default JSON-request options.
            var params = {type: type, dataType: 'json'};

            // Ensure that we have a URL.
            !options.url && urlError();
			options.promise = promise;

            // Ensure that we have the appropriate request data.
            if (typeof options.data === 'object' && (type === 'PUT' || type === 'DELETE')) {
                params.contentType = 'application/json';
                params.data = options.data = JSON.stringify(options.data || {});
            }

            // Wrap success & error handler
            wrapHandler(this, options);

            var ajaxSettings = $.extend(params, ajaxDefaults, options);

            /**
             * Event triggered when before sending a request, unless quiet setted;
             * @event beforeSend
             * @param ajaxSettings The final settings(params) of sync
             */
            !ajaxSettings.quiet && this.trigger('beforeSend', ajaxSettings);

            // Make the request, allowing the user to override any Ajax options.
            var xhr = promise.xhr = options.xhr = this.ajax(ajaxSettings);

            // Replace xhr.fail to transformed arguments
            //wrapXHR( xhr );
            
            /**
             * Event triggered when a request been made
             * @event request
             * @param xhr The XMLHttpRequest instance from $.ajax
             * @param ajaxSettings The final settings(params) of sync
             */
            !ajaxSettings.quiet && this.trigger('request', promise, ajaxSettings);

            //非重发的请求才存储参数
            if(!options.ignore){
	            //记录上次执行的参数
	            if(hold !== true || options.hold === true && options.hold !== hold) {
	            	lastRequestSettings = [];
	            }
	            
	            hold = options.hold;
	        	lastRequestSettings.push(ajaxSettings);
        	}

            return promise;
        },
        
        //继续上次请求，如登录态续期后继续发起请求
        goon: function(){
        	var len = lastRequestSettings.length,
        		xhr;
        	
        	if(len === 0 || going) {
        		return;
        	}
        	
        	//防止同组ajax的goon多次触发
        	going = true;
        	xhrs = [];
        	
        	for(var i = 0; i < len; i++) {
        		//重发的请求不再存储参数
        		lastRequestSettings[i].ignore = true;
        		
        		this.trigger('beforeSend', lastRequestSettings[i]);
			
	        	xhr = this.ajax(lastRequestSettings[i]);
	        	xhrs.push(xhr);
	        	
	        	this.trigger('request', xhr, lastRequestSettings[i]);
        	}
        	
        	Promise.any.apply(Promise, xhrs).then(function(){
        		lastRequestSettings = [];
        		going = false;
        	});
        	
        	return this;
        	
        },
        
        //阻止业务的错误逻辑被触发
        preventDefault: function(){
        	globalErrorOcurred = true;
        },
        
        //判断是否需要执行业务的错误逻辑
        isDefaultPrevented: function(){
        	return globalErrorOcurred;
        },

        /**
         * Use plugin ( middle ware )
         * 3 built-in plugins (errorLog/speedReport/CSRFPatch) provided right now.
         * @method use
         * @static
         * @param {String|Function} plugin Plugin name, or plugin function. A plugin is a middle ware that will be invoked before sync action (right before event beforeSend)
         * @chainable
         * @example
         *      // Set plugin(middle ware) config
         *      REST.set({
         *          CSRF: {
         *              token: '_bqq_csrf'
         *          }
         *      });
         */
        use: function(plugin){
        	var me = this;
        	
            $.isFunction(plugin) ?
                plugin(this) :
                plugins[plugin] && plugins[plugin].done(function(fn){
                	fn(me);
                });

            return this;
        }
    }, Attributes, Event);

    /**
     * Create operation on backend
     * @method create
     * @static
     * @param {Object} options Sync options
     * @param {Object} [options.data] Data to be sent
     * @returns {$.xhr} $ xhr object, supports promise
     */

    /**
     * Read data from backend
     * @method read
     * @static
     * @param {Object} options Sync options
     * @param {Object} [options.data] Data to be sent
     * @returns {$.xhr} $ xhr object, supports promise
     * @example
     *      Tea.use(['util/REST'], function(REST){
     *          // Read data from backend
     *          // Create/update/del are mostly the same
     *          var xhr = REST.read({
     *              url: 'readApi',
     *
     *              // Success callback
     *              success: function(res, options){
     *                  logger.log('read success');
     *              },
     *
     *              // Error callback
     *              error: function(err, xhr, jQErr){
     *                  logger.log('read error');
     *                  logger.log(err.message);
     *              }
     *          });
     *
     *          // $ xhr object, supports promise
     *          xhr
     *              .done(function(res, options){
     *                  logger.log('read done');
     *              })
     *              .fail(function(err, xhr, jQErr){
     *                  logger.log('read fail');
     *              })
     *              // Arguments to then callbacks depend on promise state
     *              .then(function(){
     *                  logger.log('read then');
     *              });
     *      });
     */

    /**
     * Update operation on backend
     * @method update
     * @static
     * @param {Object} options Sync options
     * @param {Object} [options.data] Data to be sent
     * @returns {$.xhr} $ xhr object, supports promise
     */

    /**
     * delete operation on backend
     * use method name 'del' because 'delete' is reserved in IE
     * @method del
     * @static
     * @param {Object} options Sync options
     * @param {Object} [options.data] Data to be sent
     * @returns {$.xhr} $ xhr object, supports promise
     */
    $.each(['create', 'read', 'update', 'del', 'post'], function(index, method){
        REST[method] = function(options){
            return this.sync(method, options);
        };
    });

    REST.on('error', function(e, err, xhr, textStatus, jQErr){
        var status = err.status,
            code = err.code,
            errorStatusCode = this.get('errorStatusCode');

        /**
         * Event triggered at a particular http status, like 500/404/509 etc
         * When status is 500, the name of triggered event is 500, not 'status'
         * @event status
         * @param {Error} err Error instance
         * @param {XMLHttpRequest} xhr XMLHttpRequest instance created by $.ajax
         * @param {String} textStatus Description text of the status
         * @param {$Error} jQErr Error instance created by $.ajax
         * @example
         *      // Watch http status 404
         *      REST.on(404, function(){
         *          logger.log(404);
         *      });
         */
        this.trigger(status, err, xhr, textStatus, jQErr);

        /**
         * Event triggered when status is the specified one (like 509) and an error code come up
         * @event errorCode
         * @param {Error} err Error instance
         * @param {XMLHttpRequest} xhr XMLHttpRequest instance created by $.ajax
         * @param {String} textStatus Description text of the status
         * @param {$Error} jQErr Error instance created by $.ajax
         * @example
         *      // Watch code 1001
         *      REST.on('error1001', function(){
         *          logger.log(1001);
         *      });
         */
        status === errorStatusCode && this.trigger('error' + code, err, xhr, textStatus, jQErr);
    });
    
    REST.on('goon', function(){
    	REST.goon();
    });

    // use default settings
    REST.set(defaults);

    return REST;

    /**
     * Wrap success and error handler
     * @method wrapHandler
     * @private
     * @static
     * @param REST
     * @param {Object} options Sync options
     */
    function wrapHandler(REST, options){
        var successCallbck = options.success,
            errorCallback = options.error,
			completeCallback = options.complete,
			promise = options.promise;

        options.success = function(res){
            successCallbck && successCallbck.apply(this, arguments);
			
			promise.resolve(res);
			
            /**
             * Event triggered when a sync succeeds
             * @event sync
             * @param {Object} res Response data
             * @param {Object} options Sync options
             */
            REST.trigger('sync', res, options);
        };

        options.error = function(xhr, textStatus, httpError){
        	var err = wrapError( xhr, httpError );
        	
        	/**
             * Event triggered when a sync fails
             * @event error
             * @param {Object} err Error object
             * @param {Number} err.code Error code, default to be -1 if not assign
             * @param {XMLHttpRequest} xhr XMLHttpRequest instance created by $.ajax
             * @param {String} textStatus Text status of error
             * @param {String} httpError Http status error
             */
            REST.trigger('error', err, xhr, textStatus, httpError);
            
        	//系统错误发生时，业务错误不再触发
        	if(REST.isDefaultPrevented()) {
        		globalErrorOcurred = false;
        		return;
        	}
        	
            /**
             * @param {Object} err Error object
             * @param {Number} err.code Error code, default to be -1 if not assign
             * @param {XMLHttpRequest} xhr XMLHttpRequest instance created by $.ajax
             * @param {String} textStatus Text status of error
             * @param {String} httpError Http status error
             */
            errorCallback && errorCallback.call(this, err, xhr, textStatus, httpError);
			
			promise.reject(err, xhr, textStatus, httpError);
        };
		
		options.complete = function(xhr, textStatus){
            completeCallback && completeCallback.apply(this, arguments);

            /**
             * Event triggered when a sync succeeds
             * @event sync
             * @param {Object} res Response data
             * @param {Object} options Sync options
             */
            REST.trigger('complete', xhr, textStatus);
        };
    }

    /**
     * Wrap fail method of jqXHR to provide more friendly callback arguments
     * @method wrapXHR
     * @private
     * @param {Object} options Sync options
     */
    /*function wrapXHR( xhr ){
        var fail = xhr.fail ;

        xhr.fail = function( fn ){
            var wrappedFn = function(xhr, textStatus, httpError){
            	//系统错误发生时，业务错误不再触发
	        	if(REST.isDefaultPrevented()) {
	        		globalErrorOcurred = false;
	        		return;
	        	}
            	
                var err = wrapError( xhr, httpError );
                /**
                 * Call original fail method with transformed arguments 
                 * @param {Object} err Error object
                 * @param {Number} err.code Error code, default to be -1 if not assign
                 * @param {XMLHttpRequest} xhr XMLHttpRequest instance created by $.ajax
                 * @param {String} textStatus Text status of error
                 * @param {String} httpError Http status error
                 *
                fn.call(this, err, xhr, textStatus, httpError);
            };
            
            return fail.call( this, wrappedFn );
        };
    }*/

    /**
     * Wrap error from xhr response text, with fallback
     * @method wrapError
     * @private
     * @param {jqXHR} xhr
     * @param {String} httpError HTTP status error wording
     * @return {Error} Wrapped error object
     */
    function wrapError( xhr, httpError ){
        var err = new Error,
            res;

        try{
            // try decode error body as JSON
            res = JSON.parse(xhr.responseText);
        } catch(e){
            // when error occurs at decoding
            // wrap error string, and create common error object
            res = {
                code: xhr.status,
                message: xhr.responseText || httpError
            }
        }

        err.code = res.code;
        err.message = res.message;
        // copy http status
        err.status = xhr.status;
        
        //backsend data
        res.data && (err.data = res.data);

        return err;
    }

    function urlError(){
        throw new Error('url must be specified');
    }
});