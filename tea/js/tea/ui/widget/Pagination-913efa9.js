/**
 * @fileOverview
 * @author amoschen, seanxphuang
 * Created: 15-7-13 下午16:14
 *
 * @widget Pagination 分页组件
 * 
 * @param {Object} params
 * @param {selector|jQuery|dom} params.el 显示分页的容器
 * @param {Number} [params.page] 当前页码
 * @param {Number} [params.total] 记录条数
 * @param {Number} [params.count] 每页显示数量
 * @param {Boolean} [params.isShowJump] 是否显示跳转输入框
 * @param {Boolean} [params.isShowFirst] 是否显示首页跳转
 * @param {Boolean} [params.isShowLast] 是否显示尾页跳转
 * @param {Number} [params.headDisplay] ...前半部分显示页码数
 * @param {Number} [params.tailDisplay] ...后半部分显示页码数
 * @param {Number} [params.maxDisplay=opts.total] 最多显示的页码数
 * @param {String} [params.ellipsis='...'] 隐藏页码时显示的文本
 * @param {String} [params.firstText] 首页跳转文本
 * @param {String} [params.prevText] 上一页跳转文本
 * @param {String} [params.nextText] 下一页跳转文本
 * @param {String} [params.lastText] 尾页跳转文本
 * @param {String} [params.template] 自定义模版
 *
 * @example
 *      new Pagination({
 *          el: 'someContainerSelector',
 *          page: 1,
 *          total: 20,
 *          isShowJump: false,
 *          isShowFirst: false,
 *          isShowLast: false,
 *          headDisplay: 1,
 *          tailDisplay: 1,
 *          ellipsis: '...',
 *          maxDisplay: 5,
 *          firstText: '首页',
 *          prevText: '&laquo;',
 *          nextText: '&raquo;',
 *          lastText: '尾页',
 * 			template: ''
 *      });
 * 
 * @Events
 * change:page
 * 
 */
define('ui/widget/Pagination', function(require){
    var isNumber = require('util/isNumber'),
        extend = require('core/Extend'),
        template = require('util/template'),
        Controller = require('core/Controller');
    
    require('{theme}/TeaUI/Pagination/Pagination.css');

    var Pagination = Controller.extend({
    	defaults: {
            //是否显示跳转模块
            isShowJump: false,

            //是否显示首页按钮
            isShowFirst: false,

            //是否显示尾页按钮
            isShowLast: false,

            //当前页码，默认从第一页开始展示
            page: 1,
            
            endPage: 1,
            
            //记录条数
            total: 0,
            
            //每页显示数量
            count: 10,

            //头部显示按钮数
            headDisplay: 1,

            //尾部显示按钮数
            tailDisplay: 1,

            //分页分隔符
            ellipsis: '...',

            //默认最大显示分页数，不包括“首页 上一页 下一页 尾页”按钮
            maxDisplay: 5,

            //首页按钮默认文案
            firstText: '首页',

            //上一页按钮默认文案
            prevText: '&laquo;',

            //下一页按钮默认文案
            nextText: '&raquo;',

            //尾页按钮默认文案
            lastText: '尾页',

            //默认结构模板
            template: [
                '<% var ahead = Math.min(Math.round((maxDisplay - 1) / 2), page - 1);%>',
                '<% var after = Math.min(maxDisplay - 1 - ahead, endPage - page);%>',
                '<% ahead = Math.max(ahead, maxDisplay - 1 - after)%>',
				'<ul class="pagination">',
					//is show first button
                    '<% if(isShowFirst) { %>',
                        '<li class="<%==page <= 1 ? "pagination-disabled" : ""%>"><a href="javascript:;" class="pagination-first"><%==firstText%></a></li>',
                    '<% } %>',

					//prev button
					'<li class="<%==page <= 1 ? "pagination-disabled" : ""%>"><a href="javascript:;" class="pagination-prev"><%==prevText%></a></li>',

					//headDisplay
					'<% for(var i=1; i<=headDisplay && i<=endPage; i++){ %>',
						'<li class="<%==i < 1 || i > endPage ? "pagination-disabled" : ""%> <%==i === page ? "pagination-active" : ""%>"><a data-page="<%==i%>" href="javascript:;" class="pagination-page"><%==i%></a></li>',
					'<% } %>',

					//prev ellipsis
					'<% if(page - ahead > i && maxDisplay > 0) { %>',
							'<li><span class="pagination-ellipsis"><%==ellipsis%></span></li>',
					'<% } %>',

					//all pages
					'<% for(i = Math.max(page - ahead, i); i < page + after + 1 && i <= endPage && maxDisplay > 0; i++){ %>',
						'<li class="<%==i < 1 || i > endPage ? "pagination-disabled" : ""%> <%==i === page ? "pagination-active" : ""%>"><a data-page="<%==i%>" href="javascript:;" class="pagination-page"><%==i%></a></li>',
					'<% } %>',

					//next ellipsis
					'<% if(page + after < endPage - tailDisplay && maxDisplay > 0) { %>',
						'<li><span class="pagination-ellipsis"><%==ellipsis%></span></li>',
					'<% } %>',

					//tailDisplay
					'<% for(i = Math.max(endPage - tailDisplay + 1, i); i<=endPage; i++){ %>',
						'<li class="<%==i < 1 || i > endPage ? "pagination-disabled" : ""%> <%==i === page ? "pagination-active" : ""%>"><a data-page="<%==i%>" href="javascript:;" class="pagination-page"><%==i%></a>',
					'<% } %>',

					//next button
					'<li class="<%==page >= endPage ? "pagination-disabled" : ""%>"><a href="javascript:;" class="pagination-next"><%==nextText%></a></li>',

					//is show last button
                    '<% if(isShowLast) { %>',
                        '<li class="<%==page >= endPage ? "pagination-disabled" : ""%>"><a href="javascript:;" class="pagination-last"><%==lastText%></a></li>',
                    '<% } %>',
                    
                    //isShowJump
	                '<% if(isShowJump) { %>',
	                    '<li class="pagination-jump"><input type="text" class="pagination-input" value="<%==page%>" /><a href="javascript:;" class="pagination-go">GO</a></li>',
	                '<% } %>',
                '</ul>'
            ].join('')
    	},
    	
        /**
         * Widget default UI events
         * @property events
         * @type Object
         * @protected
         */
        events: {
            'click .pagination-first': 'firstPage',
            'click .pagination-prev': 'prePage',
            'click .pagination-next': 'nextPage',
            'click .pagination-last': 'lastPage',
            'click .pagination-input': 'focusInput',
            'click .pagination-go': 'jump',
            'click .pagination-page': 'page'
        },

        initialize: function(opts){
        	var self = this;
        	
            //结尾页码
            var total = parseInt(self.get('total')),
            	endPage = Math.ceil(total / self.get('count'));
            self.set('endPage', endPage);
            
            if(total === 0) {
        		self.$el.addClass('pagination-disabled');
        	}

            self
                .bind('change:page', function(){
                    self.render();
                })
                .bind('change:total', function(event, value){
                	if(value === 0) {
                		self.$el.addClass('pagination-disabled');
                	}
                	
                	var endPage = Math.ceil(value / self.get('count'));
                    self.set('endPage', endPage);
                    
                    if(self.get('page') > endPage) {
                    	self.set({
                    		page: endPage
                    	}, {silence: true});
                    }
                    
                    self.render();
                });

            if(!self.get('maxDisplay') && self.get('maxDisplay') !== 0){
                self.set('maxDisplay', self.get('endPage'));
            }

            self.render();
            
            return self;
        },

        /**
         * Render pagination and append it to it's el
         * @method render
         * @chainable
         * @protected
         */
        render: function(){
            var html = template(this.get('template'))(extend({
                Math: Math
            }, this.attributes()));

            this.$el.html(html);

            return this;
        },

        /**
         * Page redirection
         * @method page
         * @param {Number} page Target page
         * @chainable
         */
        page: function(page){
            if(page && page.currentTarget){
                page = this.$(page.currentTarget).data('page');
            }

            this.set('page', page);

            return this;
        },

        jump: function(e){
            var $input = this.$el.find('.pagination-input'),
                page = parseInt($input.val(), 10);

            if(page === '' || isNaN(page) || !isNumber(page) || page < 1 || page > this.get('endPage')){
                $input.val('');
                $input.focus();
            }else{
                this.set('page', parseInt(page, 10));

                return this;
            }
        },

        /**
         * Select the input's value
         * @method focusInput
         * @chainable
         */
        focusInput: function(){
            this.$el.find('.pagination-input').select();
        },

        /**
         * Redirect to first page
         * @method prePage
         * @chainable
         */
        firstPage: function(){
            return this.page(1);
        },

        /**
         * Redirect to previous page
         * @method prePage
         * @chainable
         */
        prePage: function(){
            return this.page(Math.max(this.get('page') - 1, 1));
        },

        /**
         * Redirect to next page
         * @method nextPage
         * @chainable
         */
        nextPage: function(){
            return this.page(Math.min(this.get('page') + 1, this.get('endPage')));
        },

        /**
         * Redirect to last page
         * @method lastPage
         * @chainable
         */
        lastPage: function(){
            return this.page(this.get('endPage'));
        }
    });

    return Pagination;
});
