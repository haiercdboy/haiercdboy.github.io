/**
 * @widget Refresh 上下拉加载内容
 * 
 * @example
 * new Refresh({
 *		el: this.el,
 * 		upTip: '',
 * 		downTip: '',
 * 		changeLoadingTip: true,
 *		ready: function (dir) {
 *			//this.afterDataLoading(dir);
 *			//this.disable(dir, true);
 *		 }
 * })
 * 
 * @Source
 * GMU 
 */

define('ui/widget/Refresh', function(require, exports, module){
	var Controller = require('core/Controller'),
		$ = require('lib/zepto'),
		iScroll = require('lib/iscroll');
		
	require('{theme}/TeaUI/Refresh/refresh.css');
	
	module.exports = Controller.extend({
		defaults: {
			changeToloadTip: true,
			changeToloadIcon: true,
			toloadTip: '松开立即加载',
			endTip: '没有更多内容了',
			changeLoadingTip: true,
			kickBack: true,//回弹
			data: {
				ready: null,
				statechange: null
			}
        },

        _setup: function () {
            var me = this,
                data = me.get('data'),
                $el = me.$el;

            data.$upElem = $el.find('.ui-refresh-up');
            data.$downElem = $el.find('.ui-refresh-down');
            $el.addClass('ui-refresh');
            return me;
        },

        _initOrg: function() {
            var me = this,
                data = me.get('data');
            $.each(['up', 'down'], function (i, dir) {
                var $elem = data['$' + dir + 'Elem'],
                    elem = $elem.get(0);
                if ($elem.length) {
                    me._status(dir, true);    //初始设置加载状态为可用
                    data['_' + dir + 'Enable'] = true;
					
					me._createBtn(dir);
					data.refreshInfo || (data.refreshInfo = {});
					data.refreshInfo[dir] = {
						$icon: $elem.find('.ui-refresh-icon'),
						$label: $elem.find('.ui-refresh-label'),
						text: $elem.find('.ui-refresh-label').html()
					}

                    $elem.on('click', function () {
                        if (!me._status(dir) || data._actDir || !data['_' + dir + 'Enable']) return;         //检查是否处于可用状态，同一方向上的仍在加载中，或者不同方向的还未加载完成 traceID:FEBASE-569
                        me._setStyle(dir, 'loading');
                        me._loadingAction(dir, 'click');
                    });
                }
            });
			
            return me;
        },

        _createBtn: function (dir) {
        	var tip = dir == 'up' ? this.get('upTip') : this.get('downTip');
        	tip = tip || '加载更多';
        	
            this.get('data')['$' + dir + 'Elem'].html('<span class="ui-refresh-icon"></span><span class="ui-refresh-label">' + tip + '</span>');
            return this;
        },

        _setStyle: function (dir, state) {
            var me = this,
                stateChange = $.Event('statechange');

            me.trigger(stateChange, [me.get('data')['$' + dir + 'Elem'], state, dir]);
            if (stateChange.defaultPrevented) return me;

            return me._changeStyle(dir, state);
        },

        _changeStyleOrg: function (dir, state) {
			var data = this.get('data'),
                refreshInfo = data.refreshInfo[dir];

            switch (state) {
                case 'loaded':
                    refreshInfo['$label'].html(refreshInfo['text']);
                    refreshInfo['$icon'].removeClass();
                    data._actDir = '';
                    break;
                case 'loading':
                	if(this.get('changeLoadingTip')) {
                    	refreshInfo['$label'].html('加载中...');
                    	refreshInfo['$icon'].addClass('ui-loading');
                    }
                	
                    data._actDir = dir;
                    break;
                case 'disable':
                    refreshInfo['$label'].html(this.get('endTip'));
                    break;
            }
			
            return this;
        },

        _loadingAction: function (dir, type) {
            var me = this,
                data = me.get('data'),
                readyFn = data.ready;

            $.isFunction(readyFn) && readyFn.call(me, dir, type);
            me._status(dir, false);
            return me;
        },

        /**
         * @name afterDataLoading
         * @grammar afterDataLoading(dir)  ⇒ instance
         * @desc - ''dir'' \'up\' 或者 \'down\'
         *
         * 当组件调用ready，在ready中通过ajax请求内容回来后，需要调用此方法，来改变refresh状态。
         */
        afterDataLoadingOrg: function (dir) {
			var me = this,
                dir = dir || me.get('data')._actDir;
            me._setStyle(dir, 'loaded');
            me._status(dir, true);
			
            return me;
        },

        /**
         * @name status
         * @grammar status(dir， status)  ⇒ instance
         * @desc 用来设置加载是否可用，分方向的。
         * - ''dir'' \'up\' 或者 \'down\'
         * - ''status'' ''true'' 或者 ''false''。
         *
         * 当组件调用reday，在ready中通过ajax请求内容回来后，需要调用此方法，来改变refresh状态。
         */
        _status: function(dir, status) {
            var data = this.get('data');
            return status === undefined ? data['_' + dir + 'Open'] : data['_' + dir + 'Open'] = !!status;
        },

        _setable: function (able, dir, hide) {
            var me = this,
                data = me.get('data'),
                dirArr = dir ? [dir] : ['up', 'down'],
                tip = dir == 'up' ? this.get('upTip') : this.get('downTip');
        	
        	tip = tip || '加载更多';

            $.each(dirArr, function (i, dir) {
                var $elem = data['$' + dir + 'Elem'];
                if (!$elem.length) return;
                //若是enable操作，直接显示，disable则根据text是否是true来确定是否隐藏
                able ? $elem.css('visibility', 'visible').find('.ui-refresh-label').text(tip) : (hide ?  $elem.css('visibility', 'hidden') : me._setStyle(dir, 'disable'));
                data['_' + dir + 'Enable'] = able;
                me._status(dir, able);
            });
            return me;
        },

        /**
         * @name disable
         * @grammar disable(dir)  ⇒ instance
         * @desc 如果已无类容可加载时，可以调用此方法来，禁用Refresh。
         * - ''dir'' \'up\' 或者 \'down\'
         * - ''hide'' {Boolean} 是否隐藏按钮。如果此属性为false，将只有文字变化。
         */
        disable: function (dir, hide) {
            return this._setable(false, dir, hide);
        },

        /**
         * @name enable
         * @grammar enable(dir)  ⇒ instance
         * @desc 用来启用组件。
         * - ''dir'' \'up\' 或者 \'down\'
         */
        enable: function (dir) {
            return this._setable(true, dir);
        },

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         *
         * ^ 名称 ^ 处理函数参数 ^ 描述 ^
         * | init | event | 组件初始化的时候触发，不管是render模式还是setup模式都会触发 |
         * | statechange | event, elem, state, dir | 组件发生状态变化时会触发 |
         * | destroy | event | 组件在销毁的时候触发 |
         *
         * **组件状态说明**
         * - ''loaded'' 默认状态
         * - ''loading'' 加载中状态。
         * - ''disabled'' 禁用状态，表示无内容加载了！
         * - ''beforeload'' 在手没有松开前满足加载的条件状态。 需要引入插件才有此状态，lite，iscroll，或者iOS5。
         *
         * statechnage事件可以用来DIY按钮样式，包括各种状态。组件内部通过了一套，如果statechange事件被阻止了，组件内部的将不会执行。
         * 如:
         * <codepreview href="./_examples/widget/refresh/refresh_iscroll_custom.html">
         * ./_examples/widget/refresh/refresh_iscroll_custom.html
         * </codepreview>
         */
		
		
		initialize: function (opts) {
			this._setup();
			
			var me = this,
				$ = this.$,
				data = me.get('data'),
				$el = me.$el,
				wrapperH = $el.height();
				
			me._initOrg();
			$.extend(data, {
				ready: opts.ready,
				useTransition: true,
				speedScale: 1,
				topOffset: data['$upElem'] ? data['$upElem'].height() : 0
			});
			data.threshold = data.threshold || 5;

			$el.wrapAll($('<div class="ui-refresh-wrapper"></div>').height(wrapperH)).css('height', 'auto');
			me._loadIscroll();
		},
		_changeStyle: function (dir, state) {
			var me = this,
				data = me.get('data'),
				refreshInfo = data.refreshInfo[dir];

			me._changeStyleOrg(dir, state);
			switch (state) {
				case 'loaded':
					refreshInfo['$icon'].addClass('ui-refresh-icon');
					break;
				case 'beforeload':
					me.get('changeToloadTip') && refreshInfo['$label'].html(me.get('toloadTip'));
					refreshInfo['$icon'].addClass('ui-refresh-flip');
					break;
				case 'loading':
					me.get('changeToloadIcon') && refreshInfo['$icon'].removeClass().addClass('ui-loading');
					break;
			}
			return me;
		},
		_loadIscroll: function () {
			var me = this,
				data = me.get('data'),
				threshold = data.threshold,
				kickBack = me.get('kickBack');

			data.iScroll = new iScroll(me.$el.parent().get(0), data.iScrollOpts = $.extend({
				useTransition: data.useTransition,
				speedScale: data.speedScale,
				topOffset: data.topOffset
			}, data.iScrollOpts, {
				onScrollStart: function (e) {
					me.trigger('scrollstart', e);
				},
				onScrollMove: (function () {
					var up = data.$upElem && data.$upElem.length ,
						down = data.$downElem && data.$downElem.length;

					return function (e) {
						var upRefreshed = data['_upRefreshed'],
							downRefreshed = data['_downRefreshed'],
							upStatus = me._status('up'),
							downStatus = me._status('down');
							upEnable = data['_upEnable'],
							downEnable = data['_downEnable'],
							downOffset = this.wrapperH - this.scrollerH - data.topOffset - threshold;

						if (up && !upStatus && !!upEnable || down && !downStatus && !!downEnable || this.maxScrollY >= 0) return;    //上下不能同时加载 trace:FEBASE-775，当wrapper > scroller时，不进行加载 trace:FEBASE-774
						if (downStatus && down && !downRefreshed && this.y < downOffset) {    //下边按钮，上拉加载
							me._setMoveState('down', 'beforeload', 'pull');
							this.maxScrollY = kickBack ? this.wrapperH - this.scrollerH - data.topOffset : -this.scrollerH;
						} else if (upStatus && up && !upRefreshed && this.y > threshold) {     //上边按钮，下拉加载
							me._setMoveState('up', 'beforeload', 'pull');
							this.minScrollY = kickBack ? 0 : this.scrollerH;
						} else if (downStatus && downRefreshed && this.y > downOffset) {      //下边按钮，上拉恢复
							me._setMoveState('down', 'loaded', 'restore');
							this.maxScrollY = this.wrapperH - this.scrollerH;
						} else if (upStatus && upRefreshed && this.y < threshold) {      //上边按钮，下拉恢复
							me._setMoveState('up', 'loaded', 'restore');
							this.minScrollY = -data.topOffset;
						}
						me.trigger('scrollmove', e);
					};
				})(),
				onScrollEnd: function (e) {
					var actDir = data._actDir;
					if (actDir && me._status(actDir)) {   //trace FEBASE-716
						me._setStyle(actDir, 'loading');
						me._loadingAction(actDir, 'pull');
					}
					me.trigger('scrollend', e);
				}
			}));
			
			//移出窗口时触发scrollEnd动作;
			var isMobile = /Mobile/.test(navigator.userAgent);
			isMobile && $(window).on('touchmove', function(e){
				if(e.targetTouches[0].pageY <= 0) {
					data.iScroll.refresh();
				}
			});
		},
		_setMoveState: function (dir, state, actType) {
			var me = this,
				data = me.get('data');

			me._setStyle(dir, state);
			data['_' + dir + 'Refreshed'] = actType == 'pull';
			data['_actDir'] = actType == 'pull' ? dir : '';

			return me;
		},
		afterDataLoading: function (dir) {
			var me = this,
				data = me.get('data'),
				dir = dir || data._actDir;

			data.iScroll.refresh();
			data['_' + dir + 'Refreshed'] = false;
			return me.afterDataLoadingOrg(dir);
		},
		
		refresh: function(){
			this.get('data').iScroll.refresh();
		},
		
		scrollTo: function(x, y, time, relative){
			this.get('data').iScroll && this.get('data').iScroll.scrollTo(x, y, time, relative);
		}
	
	});
});