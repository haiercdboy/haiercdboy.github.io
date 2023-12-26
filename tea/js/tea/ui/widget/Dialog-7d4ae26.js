/**
 * @widget Dialog 弹框
 * 
 * @param {Object} params
 * @param {dom|selector|$} params.el 传入已有dom创建Dialog
 * @param {String} params.type 弹框类型，block是全屏弹框, slide是底部滑出的弹框
 * @param {String} params.title 弹框标题，为空时不显示标题
 * @param {String} params.content 弹框内容
 * @param {Boolean} params.single 是否单例模式，hide时不会移除dom
 * @param {Array} params.button 显示的按钮文字
 * @param {dom|selector|$} params.buttonSelector 如果是自定义template（如页面已有dom创建dialog），可以通过buttonSelector参数让组件找到你的按钮
 * @param {dom|selector|$} params.titleSelector 同上，指定title选择器
 * @param {dom|selector|$} params.contentSelector 同上，指定content选择器
 * @param {dom|selector|$} params.dialogSelector 同上，指定dialog框的选择器
 * @param {Boolean} params.allowScroll 显示后是否允许后面的内容滑动
 * @param {Boolean} params.visible 创建时是否显示
 * @param {Boolean} params.hideOnClickBg 点击背景层时是否关闭弹框 默认true
 * @param {Array|Number|Bollean} params.cancelDefaultAction 取消默认绑定的按钮点击事件，如0表示取消第1个按钮点击时的关闭操作，[0, 1] 表示第1、2个按钮，为true时是所有按钮
 * 
 * @Methods
 * toggle()
 * show(title, content)
 * hide(index)
 * setTitle(title)
 * setContent(content)
 * 
 * @Events
 * action(e, index)
 * show
 * hide(e, index)
 *
 * @Source
 * Frozenui jeakeyliang@tips.js
 */

define('ui/widget/Dialog', function(require){
    var Controller = require('core/Controller'),
    	template = require('util/template'),
    	inArray = require('util/inArray'),
    	isNumber = require('util/isNumber'),
    	isArray = require('util/isArray');
    
    require('{theme}/TeaUI/Dialog/dialog.css');

    var Dialog = Controller.extend({
    	defaults: {
    		type: '',
    		title: '',
			content: '',
			single: false,
			button: ['确认'],
			buttonSelector: '',
			titleSelector: '',
			contentSelector: '',
			dialogSelector: '',
			allowScroll: false,
			visible: true,
			hideOnClickBg: true,
    		template: [
    			'<dialog class="ui-dialog <%=type== "block" ? "ui-dialog-block" : (type == "slide" ? "ui-dialog-slide" : "")%>">',
    				'<div class="ui-dialog-inner">',
				        '<div class="ui-dialog-cnt">',
				            '<div class="ui-dialog-bd <%=title ? "" : "ui-dialog-notit"%>">',
				            	'<%if(title){%>',
				                '<h4 class="ui-dialog-tit"><%=title%></h4>',
				                '<%}%>',
				                '<div class="ui-dialog-info"><%=content%></div>',
				            '</div>',
				            '<%if(button){%>',
				            '<div class="ui-dialog-ft ui-btn-group">',
			            	'<% for (var i = 0; i < button.length; i++) { %>',
								'<button type="button" class="dialog-btn<%=i%>"><%=button[i]%></button>',
							'<% } %>',
							'</div>',
							'<%}%>',
				        '</div>',
			        '</div>',
			    '</dialog>'
		 	].join('')
    	},
    	
    	events: {
    		'tap button': 'onButtonTapped',
    		'tap .ui-dialog-cnt': '_returnFalse'
    	},
    	
    	initialize: function(){
    		var me = this,
    			isOriginalEl = this.isOriginalEl(),
    			type = this.get('type'),
    			title = this.get('title'),
    			content = this.get('content'),
    			html = '';
    		
    		//如果传入的是页面已有dom
    		if(!isOriginalEl) {
    			html = this.el;
    			
    			this.addClass('ui-dialog');
	    		if(type === 'slide') {
	    			this.addClass('ui-dialog-slide');
	    		} else if(type === 'block'){
	    			this.addClass('ui-dialog-block');
	    		}
	    		
    		} else {
	    		var	render = template(this.get('template')),
	    			data = this.attributes();
    		
    			html = render(data);
	    		this._setElement(html);
	    		this.$('body').append(this.el);
			}
    		
			this.$buttons = this.find(this.get('buttonSelector') || 'button');
			this.$title = this.find(this.get('titleSelector') || '.ui-dialog-tit');
			this.$content = this.find(this.get('contentSelector') || '.ui-dialog-info');
			this.$dialog = this.find(this.get('dialogSelector') || '.ui-dialog-inner');
			
			if(!isOriginalEl) {
				this.$dialog.addClass('ui-dialog-inner');
				!this.$buttons.is('button') && this.$buttons.bind('tap', this.proxy(this.onButtonTapped, this));
			}
			
			title && this.setTitle(title);
			content && this.setContent(content);
			
			this.get('visible') && this.show();
			
			//点击背景关闭浮层
			this.get('hideOnClickBg') && this.bind('tap', function(){
				me.hide();
			});
    	},
    	
    	onButtonTapped: function(e){
    		var $button = this.$(e.currentTarget),
    			index = this.$buttons.index($button);
				
			this.trigger('action', [index]);
			!this._isCancelAction(index) && this.hide(index);
			
			e.stopImmediatePropagation();
    	},
    	
    	_isCancelAction: function(index){
    		var cancel = this.get('cancelDefaultAction');
    		
    		if(cancel === true) {
    			return true;
    		} else if(isNumber(cancel)) {
    			return index === cancel;
    		} else if(isArray(cancel)) {
    			return inArray(index, cancel) !== -1;
    		}
    		
    		return false;
    	},
    	
		toggle: function(){
			this[this.css('display') == 'none' ? 'show' : 'hide']();
		},
		
		show: function(title, content){
			this.trigger('show');
			
			title && this.setTitle(title);
			content && this.setContent(content);
			this.$dialog.addClass('ui-animate');
			this.$el.show();
			this.get('allowScroll') && this.on("touchmove", this._returnFalse);
		},
		
		hide: function (index) {
			var me = this;
			
			me.addClass('ui-dialog-hide');
			
			//延迟执行hide，slide类型有动画效果
			me.delay(function(){
				me.trigger('hide', [index]);
				me.$el.hide();
				me.$dialog.removeClass('ui-animate');
				me.removeClass('ui-dialog-hide');
				me.off("touchmove", this._returnFalse);
				!me.get('single') && me.remove();
			}, me.get('type') == 'slide' ? 100 : 1);
		},
		
		setTitle: function(title){
			title ? 
				this.$title.show().text(title).parent().removeClass('ui-dialog-notit') : 
				this.$title.hide() && this.$title.parent().addClass('ui-dialog-notit');
		},
		
		setContent: function(content){
			this.$content.html(content);
		},
		
		_returnFalse: function(e){
			e.stopImmediatePropagation();
			return false;
		}
    });
    
	return Dialog;
});