/**
 * @widget CalendarPicker 日期组件，浮出日期选择控件
 * 
 * @param {Object} params
 * @param {dom|selector|$} params.el 弹出日期浮层的trigger
 * @param {String} params.className 内置ios7风格 可以传入 'ios7'
 * @param {Boolean} params.swipeable 左右滑动是否可以切换月份
 * @param {Boolean} params.monthChangeable 是否可以下拉选择月份
 * @param {Boolean} params.yearChangeable 是否可以下拉选择年份
 * @param {Number} params.firstDay 每周的起始时间，0表示周日
 * @param {String} params.date 默认选择的日期 2015/08/20 | 2015-08-20
 * @param {String} params.minDate 最小可选日期 2015/08/10 | 2015-08-10
 * @param {String} params.maxDate 最大可选日期 2015/08/28 | 2015-08-28
 *
 * @Method
 * select(dateStr)
 * show()
 * hide()
 * maxDate, minDate, date, selectedDate 设置日历的各属性，设置好后需要执行refresh刷新界面
 * refresh
 * 
 * @Events
 * select [e, date, format]
 * show
 * hide
 *
 * @Source
 * GMU calendar
 */

define('ui/widget/Calendar/CalendarPicker', function(require){
    var Controller = require('core/Controller'),
    	Calendar = require('ui/widget/Calendar/Calendar'),
    	$ = require('lib/zepto'),
    	count = 0;
    
    var CalendarPicker = Controller.extend({
    	initialize: function(){
    		var me = this,
    			opts = this.attributes();

            //如果有初始值，则把此值赋值给calendar
            opts.date || (me.set('date', me[me.is('select, input') ? 'val' : 'text']()));

            $(window).on('ortchange', $.proxy(me._eventHandler, me));
            
            me.on('click', function(){
            	me.show();
            });
            
            me.on('select', function(e, date){
                var str = me.calendar.formatDate(date);
                me[me.is('select, input') ? 'val' : 'text'](str);
            });

            me.on('destroy', function(){
                //解绑ortchange事件
                $(window).off('ortchange', me._eventHandler);
                me._frame && me._frame.close();
            });
    	},
    	
    	_eventHandler: function(e){
            if(e.type === 'ortchange') {
                this._frame && this._frame.refresh();
            } else {
                this.origin( e );
            }
        },

        /**
         * 显示组件
         * @method show
         * @grammar show() ⇒ instance
         * @param {Function} [callback] 刷新之后的回调函数
         * @for Calendar
         * @uses Calendar.picker
         */
        show: function(){
            var me = this;

            if( this._visible ) {
                return this;
            }
            
            this._visible = true;
            this._frame = this._slideUp(function( confirm ){
                var date;
                if( confirm) {
                    date = me.calendar._option('selectedDate');
                    me.trigger('select', [date, me.calendar.formatDate(date), me]);
                    me.calendar._option('date', date);
                } else {
                    me.calendar._option('selectedDate', me.calendar._option('date'));
                }
                me.hide();
                return false;
            });
            return this.trigger('show', [this]);
        },

        /**
         * 隐藏组件
         * @method hide
         * @grammar hide() ⇒ instance
         * @param {Function} [callback] 刷新之后的回调函数
         * @for Calendar
         * @uses Calendar.picker
         */
        hide: function(){
            var me = this;

            if (!this._visible) {
                return this;
            }

            /*this.trigger('beforehide', [this]);

            //如果外部阻止了此事件，则停止往下执行
            if(this.event.isDefaultPrevented()){
                return this;
            }*/

            this._visible = false;

            this._frame.close(function(){
                me.trigger && me.trigger('hide');
            });

            this._frame = null;

            return this;
        },
        
        _slideUp: function(cb) {
	        var me = this,
	        	opts = this.attributes(),

				//用来记录div的原始位置的
	            holder = $('<span class="ui-holder"></span>'),
	
	            //dom
	            root = $('<div class="ui-slideup-wrap">' +
	                '   <div class="ui-slideup">' +
	                '       <div class="header">' +
	                '           <span class="ok-btn">确认</span>' +
	                '           <span class="no-btn">取消</span>' +
	                '       </div>' +
	                '       <div class="frame"></div>' +
	                '   </div>' +
	                '</div>'),
	            sDiv = $('.ui-slideup', root),
	            frame = $('.frame', sDiv),
	
	            //对外只公开refresh和close方法
	            obj = {
	
	                /**
	                 * 刷新日历显示，当屏幕旋转的时候时候需要外部调用
	                 */
	                refresh: function( callback ){
	                    root.css({
	                        top: window.pageYOffset + 'px',
	                        height: window.innerHeight + 'px'
	                    });
	
	                    sDiv.animate({
	                        translateY: '-' + sDiv.height() + 'px',
	                        translateZ: '0'
	                    }, 400, 'ease-out', function () {
	                        callback && callback.call(obj);
	                    });
	
	                },
	
	                //关闭日历
	                close: function( callback ){
	                    count = count - 1;
	
	                    root.off('click.slideup' + id);
	
	                    sDiv
	                        .animate({
	                            translateY: '0',
	                            translateZ: '0'
	                        }, 200, 'ease-out', function () {
	                            callback && callback();
	
	                            //还原div的位置
	                            //holder.replaceWith(div);
	
	                            //销毁
	                            me.calendar.off();
	                            me.calendar = null;
	                            root.remove();
	                            count === 0 && $(document).off('touchmove.slideup');
	                        });
	
	                    return obj;
	                }
	            },
	
	            //为了解绑事件用的
	            id = this._slideUp.id = ( this._slideUp.id >>> 0 ) + 1;
			
			opts.className && root.addClass(opts.className) && (delete opts.className);
			opts.el = frame;
            
            this.calendar = this.plug(Calendar, opts, ['maxDate', 'minDate', 'date', 'selectedDate', 'refresh', 'select']);
	        
	        frame.append( holder );
	
	        count = ( count >>> 0 ) + 1;
	
	        //弹出多个时，只会注册一次
	        count === 1 && $(document).on('touchmove.slideup', function (e) {
	            //禁用系统滚动
	            e.preventDefault();
	        });
	
	        root
	            .on('click.slideup' + id, '.ok-btn, .no-btn', function () {
	                cb.call(obj, $(this).is('.ok-btn')) !== false && obj.close();
	            })
	            .appendTo(document.body);
	
	        obj.refresh();
	
	        return obj;
	    }

    });
    
	return CalendarPicker;
});