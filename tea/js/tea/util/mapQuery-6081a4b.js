/**
 * Created by seanxphuang on 14-8-18.
 */
define('util/mapQuery', function(require, exports, module){
    /**
     * get queryString to object
     */
    module.exports = function (uri) {
        var i,
            key,
            value,
            index = uri.indexOf("?"),
            pieces = uri.substring(index + 1).split("&"),
            params = {};
			
        for (i = 0; i < pieces.length; i++) {
            index = pieces[i].indexOf("=");
            key = pieces[i].substring(0, index);
            value = pieces[i].substring(index + 1);
            params[key] = decodeURIComponent(value);
        }
		
        return params;
    };
});