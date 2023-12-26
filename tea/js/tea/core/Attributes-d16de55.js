define('core/Attributes', function(require, exports, module){
    var extend = require('core/Extend');

    var ATTR = '_ATTRIBUTES',
        VALIDATES = '_VALIDATES';

    /**
     * [mixable] Common attributes handler. Can be extended to any object that wants event handler.
     * @class Attribute
     * @namespace util
     * @example
     *      // mix in instance example
     *      // assume classInstance is instance of lang.Class or its sub class
     *
     *      // use class's mix method
     *      classInstance.mix(Event);
     *
     *      // watch events
     *      classInstance.bind('someEvent', function(){
     *          // do sth
     *      });
     *
     * @example
     *      // extend a sub class example
     *
     *      // use class's extend method
     *      var SubClass = Class.extend(Event, {
     *          // some other methods
     *          method1: function(){
     *          },
     *
     *          method2: function(){
     *          }
     *      });
     *
     *      // initialize an instance
     *      classInstance = new SubClass;
     *
     *      // watch events
     *      classInstance.bind('someEvent', function(){
     *          // do sth
     *      });
     */


    /**
     * Set an attribute
     * @method set
     * @param {String} attr Attribute name
     * @param {*} value
     * @param {Object} options Other options for setter
     * @param {Boolean} [options.silent=false] Silently set attribute without fire change event
     * @chainable
     */
    exports.set = function(attr, val, options){
        var attrs = this[ATTR],
        	changed = {};

        if(!attrs){
            attrs = this[ATTR] = {};
        }

        if(typeof attr !== 'object'){
            var oAttr = attrs[attr];
            attrs[attr] = val;

            // validate
            if(!this.validate(attrs)){
                // restore value
                attrs[attr] = oAttr;
            } else {
                // trigger event only when value is changed and is not a silent setting
                if(val !== oAttr && (!options || !options.silent) && this.trigger){
                    /**
                     * Fire when an attribute changed
                     * Fire once for each change and trigger method is needed
                     * @event change:attr
                     * @param {Event} JQuery event
                     * @param {Object} Current attributes
                     */
                    this.trigger('change:' + attr, [attrs[attr], oAttr]);

                    /**
                     * Fire when attribute changed
                     * Fire once for each change and trigger method is needed
                     * @event change
                     * @param {Event} JQuery event
                     * @param {Object} Current attributes
                     */
                    changed[attr] = val;
                    this.trigger('change', [changed]);
                }
            }

            return this;
        }

        // set multiple attributes by passing in an object
        // the 2nd arg is options in this case
        options = val;

        // plain merge
        // so settings will only be merged plainly
        var obj = extend({}, attrs, attr);

        if(this.validate(obj)){
            this[ATTR] = obj;
            // change event
            if((!options || !options.silent) && this.trigger){
                var changedCount = 0;
                for(var i in attr){
                    // has property and property changed
                    if(attr.hasOwnProperty(i) && obj[i] !== attrs[i]){
                        changedCount++;
                        changed[i] = obj[i];
                        this.trigger('change:' + i, [obj[i], attrs[i]]);
                    }
                }

                // only any attribute is changed can trigger change event
                changedCount > 0 && this.trigger('change', [changed]);
            }
        }

        return this;
    };

    /**
     * Get attribute
     * @method get
     * @param {String} attr Attribute name
     * @return {*}
     */
    exports.get = function(attr){
        return !this[ATTR] ? null : this[ATTR][attr];
    };

    /**
     * Get all attributes.
     * @method attributes
     * @returns {Object} All attributes
     */
    exports.attributes = function(){
    	//不直接返回ATTR，不然容易被修改;
        return extend(true, {}, this[ATTR] || {});
    };
	
	//清除单个或所有属性
	exports.clear = function(attr){
		if(attr !== undefined){
			this[ATTR][attr] && delete this[ATTR][attr]
		} else {
			this[ATTR] = {};
		}
		
		return this;	
	}

    /**
     * Add validate for attributes
     * @method addValidate
     * @param {Function} validate Validate function, return false when failed validation
     * @chainable
     * @example
     *      instance.addValidate(function(event, attrs){
     *          if(attrs.someAttr !== 1){
     *              return false; // return false when failed validation
     *          }
     *      });
     */
    exports.addValidate = function(validate){
        var validates = this[VALIDATES];

        if(!validates){
            validates = this[VALIDATES] = [];
        }

        // validates for all attributes
        validates.push(validate);

        return this;
    };

    /**
     * Remove a validate function
     * @method removeValidate
     * @param {Function} validate Validate function
     * @chainable
     * @example
     *      instance.removeValidate(someExistValidate);
     */
    exports.removeValidate = function(validate){
        // remove all validates
        if(!validate){
            this[VALIDATES] = null;
            return this;
        }

        var valArr = this[VALIDATES];

        for(var i= 0, len= valArr.length; i< len; i++){
            if(valArr[i] === validate){
                valArr.splice(i, 1);
                --i;
                --len;
            }
        }

        return this;
    };

    /**
     * Validate all attributes
     * @method validate
     * @return {Boolean} Validation result, return false when failed validation
     */
    exports.validate = function(attrs){
        var valArr = this[VALIDATES];
        if(!valArr){
            return true;
        }

        attrs = attrs || this[ATTR];
        for(var i= 0, len= valArr.length; i< len; i++){
            if(valArr[i].call(this, attrs) === false){
                return false;
            }
        }

        return true;
    };
});