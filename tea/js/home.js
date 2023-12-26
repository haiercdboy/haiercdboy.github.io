define(function(require, exports, module, need) {
    var Controller = require('core/Controller'),
    	Refresh = require('ui/widget/Refresh'),
    	mods = need([
    		'ui/widget/Loading', //0
    		'ui/widget/MobilePage', //1
    		'mobilePage', //2
    		'fullpage', //3
    		'dialog', //4
    		
    		'refresh', //5
    		'panel', //6
    		
    		'list', //7
    	]);
    
	module.exports = Controller.extend({
		el: 'body',
		
		events: {
			'click #home .tea-list-link-item a': 'viewDemo',
			'click .tea-header-left': 'backHome',
			'disableTouch': 'disableTouch',
			'enableTouch': 'enableTouch',
			'pageOut:demo': 'pageOut',
			'pageShow:demo': 'pageIn',
			'pageShow': 'pageShow',
			
			'backHome': 'backHome'
		},
		
		initialize: function(){
			var me = this,
				$section = this.find('#home section'),
				height = this.$(window).height(),
				refresh;
				
			$section.css('height', height);
			
			refresh = new Refresh({
				el: $section
			});
			
			window.onresize = function (){
				if(view.get('page') !== 'home'){
					return;
				}
				
				me.$('#home .ui-refresh-wrapper').css('height', me.$(window).height());
				refresh.refresh();
			}
			
			mods.eq(1).done(function(MobilePage){
				window.view = new MobilePage({
					pages: '#home',
					//touchBack: false,
					touchBackRate: .3,
					touchableAtan: .5,
					touchableRate: 1,
					//transition: 'Y'
				});
				
				me.set('view', view);
			});
			
			//预加载Loading
			mods.get(0);
		},
		
		disableTouch: function(){
			var view = this.get('view');
			
			view.disableTouch();
		},
		
		enableTouch: function(){
			var view = this.get('view');
			
			view.enableTouch('back');
		},
		
		showLoading: function(){
			mods.eq(0).done(function(Loading){
				new Loading({
					el: '#demo',
					content: '',
					type: 'inline'
				});
			});
		},
		
		viewDemo: function(e){
			var me = this,
				view = this.get('view'),
				$a = this.$(e.currentTarget),
				href = $a.prop('href'),
				index = $a.data('require');
			
			view && view.page('demo', '');
			this.showLoading();
			this.set({
				href: href,
				modIndex: index
			});
			
			return false;
		},
		
		pageIn: function(){
			var me = this,
				href = this.get('href'),
				index = this.get('modIndex'),
				$ = this.$;
			
			$('#demo').load(href, function(){
				index && mods.eq(index).done(function(Mod){
					Mod && (me.mod = new Mod());
				});
			});
		},
		
		pageOut: function(e){
			this.mod && this.mod.remove && this.mod.remove();
		},
		
		pageShow: function(e, pageIn, pageOut){
			console.log('pageIn:' + pageIn + '  ###  pageOut:' + pageOut);
		},
		
		backHome: function(){
			var view = this.get('view');
			view.backHome();
			
			return false;
		}
	});
});