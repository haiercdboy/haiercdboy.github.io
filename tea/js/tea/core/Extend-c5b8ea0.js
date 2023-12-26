define('core/Extend', function(require, exports, module){
    var isObject = isObject = function(obj) {
            return {}.toString.call(obj) == "[object Object]"
        },
        
        isWindow = function(obj){
            return obj && obj === obj.window;
        },
    
        isPlainObject = function( obj ) {
            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don't pass through, as well
            if ( !obj || !isObject(obj) || obj.nodeType || isWindow( obj ) ) {
                return false;
            }
    
            var hasOwn = Object.prototype.hasOwnProperty;
    
            try {
                // Not own constructor property must be Object
                if ( obj.constructor &&
                    !hasOwn.call(obj, 'constructor') &&
                    !hasOwn.call(obj.constructor.prototype, 'isPrototypeOf') ) {
                    return false;
                }
            } catch ( e ) {
                // IE8,9 Will throw exceptions on certain host objects #9897
                return false;
            }
    
            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.
    
            var key;
            for ( key in obj ) {}
    
            return key === undefined || hasOwn.call( obj, key );
        };

    /**
     * Extend(copy) attributes from an object to another
     * @param {Boolean} [isRecursive=false] Recursively extend the object
     * @param {Object} base Base object to be extended into
     * @param {Object} ext* Object to extend the base object
     * @example
     *      // plain extend
     *      // returns {a: 1, b:1}
     *      extend({a: 1}, {b: 1});
     *
     *      // recursive extend
     *      var b = { x: 1};
     *      var ret = extend(true, {}, { b: b});
     *      b.x = 2;
     *      // return true
     *      b.x !== ret.b.x;
     */
    module.exports = function(isRecursive, base, ext){
        var args = [].slice.apply(arguments),
            o = args.shift(),
            extFn = plain;

        if(typeof o === 'boolean'){
            o = args.shift();
            o && (extFn = recursive);
        }

        for(var i= 0, len= args.length; i< len; i++){
            args[i] && extFn(o, args[i]);
        }

        return o;

        function plain(o, ext){
            for(var attr in ext){
                if(ext.hasOwnProperty(attr)){
                    o[attr] = ext[attr];
                }
            }
        }

        function recursive(o, ext){
            for(var attr in ext){
                if(ext.hasOwnProperty(attr)){
                    if(isPlainObject(ext[attr])){
                        o[attr] = o[attr] || {};
                        recursive(o[attr], ext[attr]);
                    } else{
                        o[attr] = ext[attr];
                    }
                }
            }
        }
    };
});