define(function(require, exports, module) {
    var $ = require('lib/zepto');
    
	return function(){
		var List = function() {};
	    List.prototype = {
	        bindEvent: function(that) {
	            $(that).find(".tea-list-flex-item").on("click", function() {
	                var thisDiv = $(this).next("div");
	                $(that).find("i").html("&#xe6a3;");
	                if ($(thisDiv).css("display") == "none") {
	                    $(thisDiv).show();
	                    $(this).find("i").html("&#xe661;");
	                } else {
	                    $(thisDiv).hide();
	                    $(this).find("i").html("&#xe6a3;");
	                };
	                $(that).find("div").not(thisDiv).hide();
	            })
	        }
	    };
	    function Plugin() {
	        var list = new List();
	        list.bindEvent(this);
	    };
	    $.fn.list = Plugin;
	    
	    $(".tea-list-flex").list();
		
	}
	
});