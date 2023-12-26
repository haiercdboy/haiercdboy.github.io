/**
 * @widget MobilePage 页面管理
 * 
 * @param {Object} params
 * @param {String|dom|$} [params.el] 指定页面的父容器
 * @param {String|dom|$} [params.pages] 页面selector，默认查找el的子级元素
 * @param {String|dom|$} [params.homePage] 指定首页，默认currentPage
 * @param {String|dom|$} [params.currentPage] 指定第一个显示的页面，默认pages的第一个
 * 
 * @param {String} [params.pageClass = 'tea-page'] //页面类名
 * @param {String} [params.nextClass = 'tea-page-next'] //下一页类名
 * @param {String} [params.prevClass = 'tea-page-prev'] //上一页类名
 * @param {String} [params.pageInClass = 'tea-page-in'] //当前要显示页面的类名
 * @param {String} [params.transitionClass = 'tea-transition'] //过渡动画总控开关类名
 * @param {String} [params.touchEndClass = 'tea-touch-end'] //touch翻页时，当touchend触发时加上的类名

 * @param {Boolean} [params.touchBack] 是否启用滑动上翻，回到上一页
 * @param {Boolean} [params.touchNext] 是否启用滑动下翻，打开下一页
 * @param {Number} [params.touchableRate] touch翻页的响应区域，用小数表示，.1表示仅在页面左侧10%范围内开始触摸时才响应滑动翻页动画，最大值为1，表示整个页面touch时都可以响应翻页动作
 * @param {Number} [params.touchableAtan] 响应touch翻页时水平滑动时的角度，用数值表示，1表示45度∠，小于1则小于45度，大于1则大于45度
 * @param {Number} [params.touchBackRate] 要滑动多少距离才回退到上一页，用小数表示，如.1表示滑动页面的10%就会回到上一页，最大值为1
 * @param {String} [params.transition = 'X'] 横向滑动还是竖向滑动(Y)
 * @param {Boolean} [params.effect = true] 是否需要过场动效
 * @param {Boolean} [params.adjustDom = false] 是否需要动态调整Dom位置
 * @param {Boolean} [params.delPageOut = false] 是否需移除切出页面
 * @param {Boolean} [params.continuous = false] 是否可循环滑动
 * 
 * @Dom Binded Attrs
 * data-frozen 可用值有 '' | 'back' | 'next'，分别表示当前页面禁用滑动翻页、禁用上翻、禁用下翻
 * data-touchback 绑定即表示当前页允许上翻
 * data-touchnext 绑定即表示当前页允许下翻
 * 
 * @Attributes
 * homePage 首页id
 * page 当前页id
 * pageOut 上一页id
 * 
 * @Methods
 * back 返回上一页
 * backHome 返回首页
 * page(id, content, dir) 打开指定页面，并可以设置打开页面的内容和滑入方向
 * enableTouch(type, selector) 启用滑动翻页，可以指定某一页面启用
 * disableTouch(type, selector) 禁止滑动翻页，可以指定某一页面禁用
 * enableEffect 启用过场动效
 * disableEffect 禁用过场动效
 * 
 * @Events
 * beforePageShow(e, idIn, idOut) 监听页面显示，有页面切换动作时立即触发
 * beforePageOut(e, idOut, idIn) 监听页面退出，有页面切换动作时立即触发
 * pageShow(e, idIn, idOut) 监听页面显示，仅当动画完成时触发
 * pageShow:pageId(e, idOut) 监听某一页面显示，仅当动画完成时触发
 * pageOut(e, idOut, idIn) 监听页面退出，仅当动画完成时触发
 * pageOut:pageId(e, idIn) 监听某一页面退出，仅当动画完成时触发
 * swiping(e, $pageOut, $pageIn, rate, move, offset) 监听页面滑动事件 $pageOut：要移出的页面,  $pageIn：要移入的页面,  rate：滑动距离的百分比,  move：滑动距离,  offset：移入页面需要移动的距离
 */

define('ui/widget/MobilePage', function(require, exports, module){
	var Controller = require('core/Controller'),
		bindCssEvent = require('util/bindCssEvent'),
		isFunction = require('util/isFunction'),
		delta = 50; //切换class的css动画需要间隔
	
	require('{theme}/TeaUI/MobilePage/MobilePage.css');
	
	var setPageId = (function(){
		var id = 0;
		
		return function(){
			return 'tea-page-' + ++id;
		}
	})();
	
	var evInTriggered = true,
		evOutTriggered = true;
	
	module.exports = Controller.extend({
		el: 'body',
		
		className: 'tea-pages',
		
		defaults: {
			//首页
			homePage: '',
			
			//分别保存当前页、上一页的id
			page: '',
			pageOut: '',
			
			//默认class
			
			//页面类名
			pageClass: 'tea-page',
			
			//下一页类名
			nextClass: 'tea-page-next',
			
			//上一页类名
			prevClass: 'tea-page-prev',
			
			//当前要显示页面的类名
			pageInClass: 'tea-page-in',
			
			//过渡动画总控开关
			transitionClass: 'tea-transition',
			
			//touch翻页时，当touchend触发时加上的类名
			touchEndClass: 'tea-touch-end',
			
			touchableRate: 1,
			touchableAtan: .5,
			touchBackRate: .3,
			
			touchBack: true,
			touchNext: false,
			
			//默认水平滑动
			transition: 'X',
			effect: true,
			
			//末页在滑动时移动的比率
			rateOnEnd: .28,
			
			adjustDom: false,
			delPageOut: false
		},
		
		initialize: function(){
			if(this.$el.is('body')) {
				this.$('html').add(this.$el).css('height', '100%');
			} else if(this.$el.css('position') === 'static') {
				this.$el.css('position', 'relative');
			}
			
			this.set({
				width: this.$el.width(),
				height: this.$el.height()
			});
			
			//认识页面，理清结构
			this._identifyPages();
			
			this._listenPageChange();
			
			(this.get('touchBack') || this.get('touchNext')) && this._bindTouchEvents();
			
		},
		
		_identifyPages: function(){
			var $el = this.$el,
				pages = this.get('pages'),
				currentPage = this.get('currentPage'),
				homePage = this.get('homePage'),
				transitionClass = this.get('transitionClass'),
				pageClass = this.get('pageClass'),
				pageInClass = this.get('pageInClass'),
				nextClass = this.get('nextClass'),
				prevClass = this.get('prevClass'),
				$pages = pages ? this.children(pages) : this.children().filter('div, section'),
				$currentPage = currentPage ? this.children(currentPage) : $pages.eq(0),
				$homePage = homePage ? this.children(homePage) : $currentPage,
				homeIndex = $pages.index($homePage),
				effect = this.get('effect');
			
			$pages.addClass(pageClass).not($currentPage).not($homePage).addClass(nextClass);
			homeIndex != 0 && $homePage.insertBefore($pages[0]);
			
			$pages.each(function(){
				if(!this.id) {
					this.id = setPageId();
				}
			});
			
			$homePage[0].id != $currentPage[0].id && $homePage.after($currentPage).addClass(prevClass);
			
			effect && this.addClass(transitionClass);
			$currentPage.show().addClass(pageInClass);
			
			this.set({
				homePage: $homePage[0].id,
				page: $currentPage[0].id
			});
			
		},
		
		_listenPageChange: function(){
			var me = this;
			
			bindCssEvent.onTransitionEnd(this.el, function(e){
				eventHandle(e);
				e.stopPropagation();
			});
			
			bindCssEvent.onEnd(this.el, function(e){
				eventHandle(e);
			});
			
			function eventHandle(e){
				var $target = me.$(e.target),
					dir = me.get('dir'),
					id = $target[0].id,
					idIn = me.get('page'),
					idOut = me.get('pageOut'),
					move = me.get('move'),
					pageClass = me.get('pageClass'),
					$pageOut = idOut && me.children('#' + idOut),
					$pageIn = me.children('#' + idIn),
					touchEndClass = me.get('touchEndClass'),
					swiping = me.get('swiping'),
					delPageOut = me.get('delPageOut');
					
				//非页面触发的事件不处理
				if(!$target.is('.' + pageClass)) {
					return;
				}
				
				//如果是滑动翻页时放开
				if(evInTriggered && swiping && !me._isToMoveOnTouchEnd()) {
					me.removeClass(touchEndClass);
					$pageOut = me.lastPageIn && me.children('#' + me.lastPageIn).hide();
					//$pageOut = $pageIn[move >= 0 ? 'prev' : 'next']('.' + pageClass).hide();
					
					if($pageOut.length && !me.dblTriggered) {
						me.dblTriggered = true;
						return;
					}
					
					me.dblTriggered = false;
					me.set('swiping', false);
					
					return;
				}
				
				if(id == idIn) {
					me.trigger('pageShow', [idIn, idOut]);
					me.trigger('pageShow:' + idIn, [idOut]);
					evInTriggered = true;
					
				} else {
					me.trigger('pageOut', [idOut, idIn]);
					me.trigger('pageOut:' + idOut, [idIn]);
					evOutTriggered = true;
					
					me._handlePageOut($pageOut, dir, idIn);
					
				}
				
				if(evInTriggered && evOutTriggered){
					me.removeClass(touchEndClass);
					me.set('swiping', false);
				}
				
				$target.css('will-change', 'auto');
				
			}
		},
		
		//跳转页面之后，因为顺序关系，page-next和page-prev有可能会指示不正确
		_amendPageClass: function(){
			var me = this,
				$ = me.$,
				dir = me.get('dir'),
				idOut = me.get('pageOut'),
				$pages = me.children('.' + this.get('pageClass')),
				$pageIn = me.children('#' + this.get('page')),
				$pageOut = idOut && me.children('#' + idOut),
				curIndex = $pages.index($pageIn),
				outIndex = idOut && $pages.index($pageOut),
				prevClass = me.get('prevClass'),
				nextClass = me.get('nextClass');
				
			$pages.each(function(i, page){
				if(i === curIndex || i === outIndex) {
					return true;
				}
				
				if(i < curIndex && $(page).is('.' + nextClass)) {
					$(page).removeClass(nextClass).addClass(prevClass);
				} else if(i > curIndex && $(page).is('.' + prevClass)) {
					$(page).removeClass(prevClass).addClass(nextClass);
				}
			});
			
		},
		
		//创建新页面
		_newPage: function(id, content, dir){
			var me = this,
				id = id || setPageId(),
				pageClass = this.get('pageClass'),
				prevClass = this.get('prevClass'),
				nextClass = this.get('nextClass'),
				className = pageClass + ' ' + (dir == 'prev' ? prevClass : nextClass),
				$page = this.$('<div class="' + className + '">' + (content || '') + '</div>')[dir == 'prev' ? 'insertBefore' : 'insertAfter'](this.children('#' + this.get('page')));
			
			$page[0].id = id;
			
			me.page(id);
		},
		
		_bindTouchEvents: function(){
        	var me = this;
        	
        	if(me.el.touchEventsInited) {
        		return;
        	}
        	
        	me.el.touchEventsInited = true;
        	
			me.$el.on('touchstart', function(e){
				if(me._preventTouch()) {
					return true;
				}
				
				me.set({
					atan: 0,
					originX: e.touches[0].pageX,
					originY: e.touches[0].pageY
				});
				
			});
			
			me.$el.on('touchend', function(){
				if(me._preventTouch()) {
					return true;
				}
				
				me.get('effect') && me.addClass(me.get('transitionClass'));
				me.get('swiping') && me._onPageSwipeEnd();
				me.lastPageIn = '';
			});
			
			me.$el.on('touchmove', function(e){
				var x = e.touches[0].pageX, 
					y = e.touches[0].pageY;
					
				if(me._preventTouch() || !evInTriggered) {
					return true;
				}
				
	        	me._touchMove(x, y);
	        	
				//滑动后阻止默认动作
				return !me.get('swiping');
			});
        },
        
        _touchMove: function(x, y){
        	var transition = this.get('transition'),
        		originX = this.get('originX'),
        		originY = this.get('originY'),
        		origin = transition === 'Y' ? originY : originX,
        		touchableRate = this.get('touchableRate'),
        		touchableAtan = this.get('touchableAtan'),
        		move = transition === 'Y' ? (y - originY) : (x - originX),
        		atan = this.get('atan') || Math.abs((transition === 'Y' ? x - originX : y - originY)/move),
        		size = this.get(transition === 'Y' ? 'height' : 'width'),
        		swiping = this.get('swiping'),
        		pageClass = this.get('pageClass'),
        		min = 15,
        		$page = this.children('#' + this.get('page')),
        		touchBack = !this.get('touchBack') ? $page.data('touchback') !== undefined : true,
				touchNext = !this.get('touchNext') ? $page.data('touchnext') !== undefined : true;
        		
        	this.set({
				move: move,
				atan: atan
			});
			
			if(!swiping && (Math.abs(move) < min || atan > touchableAtan)) {
				return;
			}
			
			//move小于0表示翻下一页
			//翻上一页时不在触发区域内或被禁止
			if(move < 0 && (origin < size * (1 - touchableRate) || $page.data('frozen') === 'next' || !touchNext) || 
			    move > 0 && (origin > size * touchableRate || $page.data('frozen') === 'back') || !touchBack) {
				
				$page.add($page[move >= 0 ? 'next' : 'prev']('.' + pageClass)).css({
					transform: '',
					opacity: ''
				});
				
				this.set('swiping', false);
				return;
			}
			
			this.removeClass(this.get('transitionClass'));
			this._swipePage();
        },
        
        _swipePage: function(){
        	var transition = this.get('transition') || 'X',
        		move = this.get('move'),
        		size = this.get(transition === 'Y' ? 'height' : 'width'),
        		continuous = this.get('continuous'),
        		originOffset,
        		pageClass = this.get('pageClass'),
        		$pageOut = this.children('#' + this.get('page')),
        		$pageIn = $pageOut[move >= 0 ? 'prev' : 'next']('.' + pageClass).show(),
        		frozen = $pageIn.data('frozen'),
        		pageInOffset,
        		matrix,
        		len,
        		index,
        		rate,
        		offset,
        		$pages;
        		
        	if(continuous && !$pageIn.length) {
        		$pages = $pageOut.siblings('.' + this.get('pageClass'));
        		
        		if(move > 0) {
        			$pageIn = $pages.last().show();
        			$pageIn.addClass(this.get('prevClass')).removeClass(this.get('nextClass'));
        		} else {
        			$pageIn = $pages.first().show();
        			$pageIn.addClass(this.get('nextClass')).removeClass(this.get('prevClass'));
        		}
				
			}
        	
        	pageInOffset = $pageIn.data('pageInOffset');
        	
        	if(!pageInOffset && $pageIn.length) {
        		matrix = $pageIn.css('transform').replace(/^(matrix|matrix3d)\((.+)\)$/g, "$2").split(/,\s*/);
        		len = matrix.length;
        		index = transition === 'Y' ? (len === 6 ? 5 : 13) : (len === 6 ? 4 : 12);
        		pageInOffset = originOffset = +matrix[index];
        	}
        		
        	//如果在页面隐藏状态下就初始化，取不到宽高
        	if(!size) {
        		this.set({
					width: this.$el.width(),
					height: this.$el.height()
				});
				
				size = this.get(transition === 'Y' ? 'height' : 'width');
        	}
        		
        	rate = Math.abs(move) / size;
    		offset = Math.floor(pageInOffset * (1 -rate));
    		
    		if(move > 0 && (frozen === '' || frozen === 'back')) {
    			offset = Math.min(offset, 0);
    		} else if(move < 0 && (frozen === '' || frozen === 'next')) {
    			offset = Math.max(offset, 0);
    		}
    		
    		if($pageIn.length) {
				$pageIn.css({
		    		transform: 'translate'+ transition +'(' + offset + 'px)'
		    	});
    		} else {
    			move *= this.get('rateOnEnd');
    		}
    		
	    	$pageOut.css({
	    		transform: 'translate'+ transition +'(' + move + 'px)'
	    	});
    		
    		this.trigger('swiping', [$pageOut, $pageIn, rate, move, offset]);
    		
    		if(originOffset){
				$pageIn.data('pageInOffset', pageInOffset);
				
				//滑动过程中$pageIn变更过
				this.lastPageIn && $pageIn[0].id !== this.lastPageIn && this.children('#' + this.lastPageIn).data('pageInOffset', undefined).hide().css({
					transform: '',
					opacity: ''
				});
				
				this.lastPageIn = $pageIn[0].id;
    		}
    		
	    	this.set({
	    		swiping: true
	    	});
        },
        
        _onPageSwipeEnd: function(){
        	var move = this.get('move'),
        		pageClass = '.' + this.get('pageClass'),
        		$pageOut = this.children('#' + this.get('page')),
        		$pageIn = this.lastPageIn && this.children('#' + this.lastPageIn);
        		
        	this.addClass(this.get('touchEndClass'));
        	
        	if(this._isToMoveOnTouchEnd()){
        		move > 0 ? this.back() : this.next();
        		
        	} else {
        		$pageOut.add($pageIn).data('pageInOffset', undefined).css({
					transform: '',
					opacity: ''
				});
        	}
        	
        },
        
        _preventTouch: function(){
        	var $page = this.children('#' + this.get('page')),
				touchBack = !this.get('touchBack') ? $page.data('touchback') !== undefined : true,
				touchNext = !this.get('touchNext') ? $page.data('touchnext') !== undefined : true;
				
			return $page.data('frozen') === '' || (!touchBack && !touchNext);
        },
        
        _isToMoveOnTouchEnd: function(){
        	var transition = this.get('transition'),
        		move = this.get('move'),
        		size = this.get(transition === 'Y' ? 'height' : 'width'),
        		origin = this.get(transition === 'Y' ? 'originY' : 'originX'),
        		atan = this.get('atan'),
        		touchableRate = this.get('touchableRate'),
        		touchableAtan = this.get('touchableAtan'),
        		touchBackRate = this.get('touchBackRate'),
        		inTouchArea = move > 0 ? origin < size * touchableRate : origin > size * (1 - touchableRate),
        		continuous = this.get('continuous');
        		
        	//在触发区域内，且移动距离大于响应最小距离，滑动角度小于响应角度，如果不循环且下一页存在
        	return inTouchArea && Math.abs(move) > size * touchBackRate && atan < touchableAtan && (continuous ? this.children('.' + this.get('pageClass')).length > 1 : this.children('#' + this.get('page'))[move > 0 ? 'prev' : 'next']('.' + this.get('pageClass')).length);
        },
        
        //下一页
		next: function(){
			var $currentPage = this.children('#' + this.get('page')),
				pageClass = this.get('pageClass'),
				$nextPage = $currentPage.next('.' + pageClass),
				continuous = this.get('continuous'),
				id;
			
			if(!$nextPage.length && continuous) {
				$nextPage = $currentPage.siblings('.' + pageClass).first();
				$nextPage.addClass(this.get('nextClass')).removeClass(this.get('prevClass'));
			}
			
			id = $nextPage[0] && $nextPage[0].id;
			id && this.page(id);
			
			return this;
		},
       
        //后退
		back: function(){
			var $currentPage = this.children('#' + this.get('page')),
				pageClass = this.get('pageClass'),
				$prevPage = $currentPage.prev('.' + pageClass),
				continuous = this.get('continuous'),
				id;
			
			if(!$prevPage.length && continuous) {
				$prevPage = $currentPage.siblings('.' + pageClass).last();
				$prevPage.addClass(this.get('prevClass')).removeClass(this.get('nextClass'));
			}
			
			id = $prevPage[0] && $prevPage[0].id;
			id && this.page(id);
			
			return this;
		},
		
		//返回首页
		backHome: function(){
			var id = this.get('homePage');
			
			return this.page(id);
		},
		
		//打开指定的页面
		//可以指定页面切入方向
		page: function(id, content, todir){
			var me = this,
				prevClass = me.get('prevClass'),
				nextClass = this.get('nextClass'),
				page = me.get('page'),
				$pageIn,
				$pageOut,
				dir;
				
			//本来就在当前页面，或翻页动画还未结束
			if(id === page || !evInTriggered && !evOutTriggered) {
				return this;
			}
			
			id && ($pageIn = me.children('#' + id));
			
			//页面不存在时，创建新页面
			if(!$pageIn || !$pageIn.length) {
				me._newPage(id, content, todir);
				return;
			}
			
			$pageOut = this.children('#' + page);
			content != undefined && $pageIn.html(content);
			
			//默认next
			dir = $pageIn.is('.' + prevClass) ? 'prev' : 'next';
			
			if(todir && todir != dir){
				dir = todir;
				todir == 'prev' ? $pageIn.removeClass(nextClass).addClass(prevClass) : $pageIn.removeClass(prevClass).addClass(nextClass);
			}
			
			//原本是show时，执行show不会有任何动作，
			//如果这是内联样式display:none,但是css定义时用了important让它show了，这里要特意执行css动作
			$pageIn.width() ? $pageIn.css('display', 'block') : $pageIn.show();
			
			$pageIn.add($pageOut).css({
				willChange: 'transform'
			});
			
			me.delay(function(){
				me.set({
					dir: dir,
					page: id,
					pageOut: page
				});
				
				me._turnPage();
				
				me.trigger('beforePageShow', [id, page]);
				me.trigger('beforePageOut', [page, id]);
				
			}, delta, me);
			
			return this;
		},
		
		_turnPage: function(){
			var dir = this.get('dir'),
				idIn = this.get('page'),
				idOut = this.get('pageOut'),
				effect = this.get('effect'),
				$pageOut = this.children('#' + idOut),
				$pageIn = this.children('#' + idIn),
				pageInClass = this.get('pageInClass'),
				prevClass = this.get('prevClass'),
				nextClass = this.get('nextClass'),
				pageClass = this.get('pageClass'),
				className = dir == 'next' ? prevClass : nextClass,
				swiping = this.get('swiping'),
				delPageOut = this.get('delPageOut'),
				$siblings;
			
			evInTriggered = false,
			evOutTriggered = false
			
			$pageOut.removeClass(pageInClass).addClass(className);
			$pageIn.removeClass(dir == 'next' ? nextClass : prevClass).addClass(pageInClass);
			
			if(!effect && !swiping) {
				this.trigger('pageShow', [idIn, idOut]);
				this.trigger('pageShow:' + idIn, [idOut]);
				
				this.trigger('pageOut', [idOut, idIn]);
				this.trigger('pageOut:' + idOut, [idIn]);
				
				this._handlePageOut($pageOut, dir, idIn);
				
				evInTriggered = true,
				evOutTriggered = true
			}
			
			if(swiping){
				$pageOut.add($pageIn).data('pageInOffset', undefined).css({
					transform: '',
					opacity: ''
				});
				
				effect && this.set('swiping', false);
			} 
		},
		
		_handlePageOut: function($pageOut, dir, idIn){
			$pageIn = this.children('#' + idIn);
		
			if(this.get('delPageOut')) {
				$pageOut && $pageOut.remove();
				
			} else {
				$pageOut && $pageOut.hide();
				
				if(this.get('adjustDom')) {
					//保证新页面为当前页的next，back时才能返回
					if(dir == 'next' && !$pageOut.next('#' + idIn).length){
						$pageOut.after($pageIn);
						
					//保证新页面为当前页的prev，next时才能找到
					} else if(dir == 'prev' && !$pageOut.prev('#' + idIn).length) {
						$pageOut.before($pageIn);
					}
				}
				
				//修正class类名
				this._amendPageClass();
			}
		},
		
		/**
		 * 启用滑动翻页
		 * type：'back' | 'next'，不指定表示同时允许上翻 和下翻
		 * selector：页面选择器，不指定则允许所有页面具有对应滑动动作
		 */
		enableTouch: function(type, selector){
			var attr, $page, frozen;
			
			if(type || selector) {
				if(!selector) {
					attr = type === 'back' ? 'touchBack' : (type === 'next' ? 'touchNext' : '');
					attr && this.set(attr, true);
					
				} else {
					$page = this.children(selector);
					
					if(!$page.length) {
						return this;
					}
					
					frozen = $page.data('frozen');
					
					//如果原来同时禁用了上翻和下翻
					if(frozen === '') {
						$page.data('frozen', type === 'back' ? 'next' : (type === 'next' ? 'back' : undefined));
						
					//如果只禁用了上翻或下翻
					} else if(frozen !== undefined) {
						$page.data('frozen', undefined);
					
					//没有frozen却不能滑动？那就只让当前页面能滑动吧
					} else {
						$page.data('touch' + type, '');
					}
				}
				
			} else {
				this.set({
					touchBack: true,
					touchNext: true
				});
			}
			
			this._bindTouchEvents();
			
			return this;
		},
		
		/**
		 * 禁用滑动翻页
		 * type：'back' | 'next'，不指定表示同时禁止上翻 和下翻
		 * selector：页面选择器，不指定则禁止所有页面对应的滑动动作
		 */
		disableTouch: function(type, selector){
			var touchBack = this.get('touchBack'),
				touchNext = this.get('touchNext'),
				attr, $page, frozen;
			
			if(type || selector) {
				if(!selector) {
					attr = type === 'back' ? 'touchBack' : (type === 'next' ? 'touchNext' : '');
					attr && this.set(attr, true);
					
				} else {
					$page = this.children(selector);
					
					if(!$page.length) {
						return this;
					}
					
					frozen = $page.data('frozen');
					
					if(frozen === undefined) {
						//没有设置touchBack和touchNext还能上翻下翻？那肯定是绑定了data-touch.
						if(type === 'back' && !touchBack || type === 'next' && !touchNext) {
							$page.data('touch' + type, undefined);
						} else {
							$page.data('frozen', type);
						}
						
					} else {
						$page.data('frozen', type !== frozen ? '' : frozen);
					}
				}
			} else {
				this.set({
					touchBack: false,
					touchNext: false
				});
			}
			
			return this;
		},
		
		enableEffect: function(){
			this.set('effect', true);
			this.addClass(this.get('transitionClass'));
			
			return this;
		},
		
		disableEffect: function(){
			this.set('effect', false);
			this.removeClass(this.get('transitionClass'));
			
			return this;
		}
	});
});