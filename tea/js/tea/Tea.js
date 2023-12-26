/*! Tea 0.4.0 2017-01-17 */
(function(global, undefined) {

// Avoid conflicting when `LBF.js` is loaded multiple times
if (global.LBF) {
    var lastVersion = global.LBF;    
}

var exports = global.LBF = {
  // The current version of Sea.js being used
  version: "0.4.0"
}

var data = exports.data = {}

exports.noConflict = function(){
	lastVersion && (global.LBF = lastVersion);
}
function isType(type) {
  return function(obj) {
    return {}.toString.call(obj) == "[object " + type + "]"
  }
}

function inArray(elem, arr, i){
	return arr == null ? -1 : [].indexOf.call( arr, elem, i );
}

var isObject = isType("Object")
var isString = isType("String")
var isArray = Array.isArray || isType("Array")
var isFunction = isType("Function")
var isNumber = isType("Number")
var isRegExp = isType("RegExp")

var _cid = 0
function cid() {
  return _cid++
}

function forEach(arr, cb, context){
    context = context || this;

    for(var i= 0, len= arr.length; i< len; i++){
        if(typeof arr[i] !== 'undefined'){
            cb.call(context, arr[i], i, arr);
        }
    }
}

var events = data.events = {}

// Bind event
exports.on = function(name, callback) {
  var list = events[name] || (events[name] = [])
  list.push(callback)
  return exports
}

// Remove event. If `callback` is undefined, remove all callbacks for the
// event. If `event` and `callback` are both undefined, remove all callbacks
// for all events
exports.off = function(name, callback) {
  // Remove *all* events
  if (!(name || callback)) {
    events = data.events = {}
    return exports
  }

  var list = events[name]
  if (list) {
    if (callback) {
      for (var i = list.length - 1; i >= 0; i--) {
        if (list[i] === callback) {
          list.splice(i, 1)
        }
      }
    }
    else {
      delete events[name]
    }
  }

  return exports
}

// Emit event, firing all bound callbacks. Callbacks receive the same
// arguments as `emit` does, apart from the event name
var emit = exports.emit = function(name, data) {
  var list = events[name], fn

  if (list) {
    // Copy callback lists to prevent modification
    list = list.slice()

    // Execute event callbacks, use index because it's the faster.
    for(var i = 0, len = list.length; i < len; i++) {
      list[i](data)
    }
  }

  return exports
}


var DIRNAME_RE = /[^?#]*\//

var DOT_RE = /\/\.\//g
var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//
var MULTI_SLASH_RE = /([^:/])\/+\//g
var EXT = /(?:js|css|less|php)$/

// Extract the directory portion of a path
// dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
// ref: http://jsperf.com/regex-vs-split/2
function dirname(path) {
  return path.match(DIRNAME_RE)[0]
}

// Canonicalize a path
// realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
function realpath(path) {
  // /a/b/./c/./d ==> /a/b/c/d
  path = path.replace(DOT_RE, "/")

  /*
    @author wh1100717
    a//b/c ==> a/b/c
    a///b/////c ==> a/b/c
    DOUBLE_DOT_RE matches a/b/c//../d path correctly only if replace // with / first
  */
  path = path.replace(MULTI_SLASH_RE, "$1/")

  // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, "/")
  }

  return path
}

//'a/b.js' => 'a/b'
function cleanId(id){
	if(id.substr(-3) === ".js" && id.indexOf('/') > -1) {
	  id = id.replace(/\.js$/, '');
	}
	return id;
}

// Normalize an id
// normalize("path/to/a") ==> "path/to/a.js"
// NOTICE: substring is faster than negative slice and RegExp
function normalize(path, id) {
  var last = path.length - 1,
  	  lastC = path.charAt(last),
  	  
  	  slashReg = /\//g,
      dotReg = /\./g,
  	  suffix,
  	  addSuffix,
  	  
      isOffline = data._isOffline;
      
  if(data.suffixes) {
  	//'a/b.js' => 'a/b'
	id = cleanId(id);
	
  	suffix = data.suffixes[id];
  	!suffix && (suffix = slashReg.test(id) ? data.suffixes[id.replace(slashReg, '.')] : data.suffixes[id.replace(dotReg, '/')]);
  }
  
  addSuffix = !isOffline && suffix;

  // If the uri ends with `#`, just return it without '#'
  if (lastC === "#") {
    return path.substring(0, last)
  }

  // ignore file with css ext
  if(path.substring(last - 3) === '.css'){
    return path;
  }

  // add js file ext
  return (path.substring(last - 2) === ".js" ||
      path.indexOf("?") > 0 ||
      lastC === "/") ? (addSuffix ? path.replace('.js', '-' + suffix + '.js') : path) : path + (addSuffix ? '-' + suffix : '') + ".js"
}


var PATHS_RE = /^([^/:]+)(\/.+)$/
var VARS_RE = /{([^{]+)}/g
var NAMESPACE_RE = /^[\w-_]*(?:\.[\w-_]+)*(\?[\w-_&=]*)?$/


function parseAlias(id) {
  var alias = data.alias
  return alias && isString(alias[id]) ? alias[id] : id
}

// a.b.c -> a/b/c.js
function parseNamespace(id) {
    var match;
    // no dot or uri with static file extension
    // eg. require('jQuery') // alias for 'lib.jQuery'
    // eg. ./mod.js // relative path
    if(id.indexOf('.') > -1 && (match = NAMESPACE_RE.exec(id))){
        var ext;

        // id = 'a.b.c?v=123&t=1'
        // ->
        // ext = '?v=123&t=1'
        if(ext = match[1]){
            // remove ext from id
            id = id.substring(0, id.lastIndexOf(ext));
        }

        ext = '.js' + (ext || '');

        // replace all '.' to '/'
        id = id.split('.').join('/') + ext;
    }

    return id
}

function parsePaths(id) {
  var paths = data.paths
  var m

  if (paths && (m = id.match(PATHS_RE)) && isString(paths[m[1]])) {
    id = paths[m[1]] + m[2]
  }

  return id
}

function parseVars(id) {
  var vars = data.vars

  if (vars && id.indexOf("{") > -1) {
    id = id.replace(VARS_RE, function(m, key) {
      return isString(vars[key]) ? vars[key] : m
    })
  }

  return id
}

function parseMap(uri) {
  var map = data.map
  var ret = uri

  if (map) {
    for (var i = 0, len = map.length; i < len; i++) {
      var rule = map[i]

      ret = isFunction(rule) ?
          (rule(uri) || uri) :
          uri.replace(rule[0], rule[1])

      // Only apply the first matched rule
      if (ret !== uri) break
    }
  }

  return ret
}


var ABSOLUTE_RE = /^\/\/.|:\//
var ROOT_DIR_RE = /^.*?\/\/.*?\//

function addBase(id, refUri) {
  var ret
  var first = id.charAt(0)

  // Absolute
  if (ABSOLUTE_RE.test(id)) {
    ret = id
  }
  // Relative
  else if (first === ".") {
    ret = realpath((refUri ? dirname(refUri) : data.cwd) + id)
  }
  // Root
  else if (first === "/") {
    var m = data.cwd.match(ROOT_DIR_RE)
    ret = m ? m[0] + id.substring(1) : id
  }
  // Top-level
  else {
    ret = data.base + id
  }

  // Add default protocol when uri begins with "//"
  if (ret.indexOf("//") === 0) {
    ret = location.protocol + ret
  }

  return ret
}

function id2Uri(id, refUri) {
  if (!id) return ""
  
  var temp = id;

  id = parseAlias(id)
  id = parseNamespace(id)
  id = parseAlias(id)
  id = parsePaths(id)
  id = parseVars(id)
  id = normalize(id, temp)

  var uri = addBase(id, refUri)
  
  //内置模块不走map逻辑，不然无法使用缓存
  uri = isBuiltInMod(temp) ? uri : parseMap(uri)

  return uri
}


var doc = document
var cwd = (!location.href || location.href.indexOf('about:') === 0) ? '' : dirname(location.href)
var scripts = doc.scripts

// Recommend to add `LBFnode` id for the `LBF.js` script element
var loaderScript = doc.getElementById("LBFnode") ||
    scripts[scripts.length - 1]

// When `LBF.js` is inline, set loaderDir to current working directory
var loaderDir = dirname(getScriptAbsoluteSrc(loaderScript) || cwd)

function getScriptAbsoluteSrc(node) {
  return node.hasAttribute ? // non-IE6/7
      node.src :
    // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
      node.getAttribute("src", 4)
}


// For Developers
exports.resolve = id2Uri


var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement
var baseElement = head.getElementsByTagName("base")[0]

var IS_CSS_RE = /\.css(?:\?|$)/i
var currentlyAddingScript
var interactiveScript

// `onload` event is not supported in WebKit < 535.23 and Firefox < 9.0
// ref:
//  - https://bugs.webkit.org/show_activity.cgi?id=38995
//  - https://bugzilla.mozilla.org/show_bug.cgi?id=185236
//  - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
var isOldWebKit = +navigator.userAgent
  .replace(/.*(?:AppleWebKit|AndroidWebKit)\/(\d+).*/, "$1") < 536


function request(url, callback, charset) {
  var isCSS = IS_CSS_RE.test(url)
  var node = doc.createElement(isCSS ? "link" : "script")

  if (charset) {
    var cs = isFunction(charset) ? charset(url) : charset
    if (cs) {
      node.charset = cs
    }
  }

  addOnload(node, callback, isCSS, url)

  if (isCSS) {
    node.rel = "stylesheet"
    node.href = url
  }
  else {
    node.async = true
    node.src = url
  }

  // For some cache cases in IE 6-8, the script executes IMMEDIATELY after
  // the end of the insert execution, so use `currentlyAddingScript` to
  // hold current node, for deriving url in `define` call
  currentlyAddingScript = node

  // ref: #185 & http://dev.jquery.com/ticket/2709
  baseElement ?
    head.insertBefore(node, baseElement) :
    head.appendChild(node)

  currentlyAddingScript = null

  return node

}

function addOnload(node, callback, isCSS, url) {
  var supportOnload = "onload" in node

  // for Old WebKit and Old Firefox
  if (isCSS && (isOldWebKit || !supportOnload)) {
    setTimeout(function() {
      pollCss(node, callback)
    }, 1) // Begin after node insertion
    return
  }

  if (supportOnload) {
    node.onload = onload
    node.onerror = function() {
      emit("error", { uri: url, node: node })
      onload()
    }
  }
  else {
    node.onreadystatechange = function() {
      if (/loaded|complete/.test(node.readyState)) {
        onload()
      }
    }
  }

  function onload() {
    // Ensure only run once and handle memory leak in IE
    node.onload = node.onerror = node.onreadystatechange = null

    // Remove the script to reduce memory leak
    if (!isCSS && !data.debug) {
      head.removeChild(node)
    }

    // Dereference the node
    node = null

    callback()
  }
}

function pollCss(node, callback) {
  var sheet = node.sheet
  var isLoaded

  // for WebKit < 536
  if (isOldWebKit) {
    if (sheet) {
      isLoaded = true
    }
  }
  // for Firefox < 9.0
  else if (sheet) {
    try {
      if (sheet.cssRules) {
        isLoaded = true
      }
    } catch (ex) {
      // The value of `ex.name` is changed from "NS_ERROR_DOM_SECURITY_ERR"
      // to "SecurityError" since Firefox 13.0. But Firefox is less than 9.0
      // in here, So it is ok to just rely on "NS_ERROR_DOM_SECURITY_ERR"
      if (ex.name === "NS_ERROR_DOM_SECURITY_ERR") {
        isLoaded = true
      }
    }
  }

  setTimeout(function() {
    if (isLoaded) {
      // Place callback here to give time for style rendering
      callback()
    }
    else {
      pollCss(node, callback)
    }
  }, 20)
}

function getCurrentScript() {
  if (currentlyAddingScript) {
    return currentlyAddingScript
  }

  // For IE6-9 browsers, the script onload event may not fire right
  // after the script is evaluated. Kris Zyp found that it
  // could query the script nodes and the one that is in "interactive"
  // mode indicates the current script
  // ref: http://goo.gl/JHfFW
  if (interactiveScript && interactiveScript.readyState === "interactive") {
    return interactiveScript
  }

  var scripts = head.getElementsByTagName("script")

  for (var i = scripts.length - 1; i >= 0; i--) {
    var script = scripts[i]
    if (script.readyState === "interactive") {
      interactiveScript = script
      return interactiveScript
    }
  }
}


// For Developers
exports.request = request

var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g,
    SLASH_RE = /\\\\/g,
    REQUIRE_NAME_RE = /^function[\s]*\([\s]*([^\s,\)]+)/;

function parseDependencies(code) {
    // get require function name
    // in compress code, require function name is no longer 'require'
    var requireName = REQUIRE_NAME_RE.exec(code),
        RE = REQUIRE_RE;

    // no dependencies
    if( !requireName ){
        return [];
    }

    if((requireName = requireName[1]) !== 'require'){
        // reconstruct require regexp
        RE = RE
                .toString()
                // for compressed code
                // replace arg 'require' with actual name
                .replace(/require/g, requireName);

        // remove head & tail
        // '/xxxxx/g' -> 'xxxxx'
        RE = RE.slice(1, RE.length - 2);

        RE = new RegExp(RE, 'g');
    }

    // grep deps by using regexp match
    var ret = [];

    code.replace(SLASH_RE, '')
        .replace(RE, function(m, m1, m2) {
            m2 && ret.push(m2);
        });

    return ret;
}

var cachedMods = exports.cache = {}
var anonymousMeta

var fetchingList = {}
var fetchedList = {}
var callbackList = {}

var STATUS = Module.STATUS = {
  // 1 - The `module.uri` is being fetched
  FETCHING: 1,
  // 2 - The meta data has been saved to cachedMods
  SAVED: 2,
  // 3 - The `module.dependencies` are being loaded
  LOADING: 3,
  // 4 - The module are ready to execute
  LOADED: 4,
  // 5 - The module is being executed
  EXECUTING: 5,
  // 6 - The `module.exports` is available
  EXECUTED: 6
}

function Module(uri, deps) {
  this.uri = uri
  this.dependencies = deps || []
  this.exports = null
  this.status = 0

  // Who depends on me
  this._waitings = {}

  // The number of unloaded dependencies
  this._remain = 0
}

// Resolve module.dependencies
Module.prototype.resolve = function() {
  var mod = this
  var ids = mod.dependencies
  var uris = []
  var ignoreCss = data.ignoreCss

  for (var i = 0, len = ids.length; i < len; i++) {
  	//for Tea:增加取消载入模块所依赖css的功能
  	//ignoreCss可以是Boolean或数组
  	//debug工具的样式不能被过滤
  	if(ignoreCss && ids[i].indexOf('.css') !== -1) {
  		if(ignoreCss === true && !/TeaUI\/debug\/debug\.css$/.test(ids[i]) || isArray(ignoreCss) && inArray(mod.id, ignoreCss) !== -1) {
  			continue;
  		}
  	}
  	
    uris.push(Module.resolve(ids[i], mod.uri))
  }
  return uris
}

// Load module.dependencies and fire onload when all done
Module.prototype.load = function() {
  var mod = this

  // If the module is being loaded, just wait it onload call
  if (mod.status >= STATUS.LOADING) {
    return
  }

  mod.status = STATUS.LOADING

  // Emit `load` event for plugins such as combo plugin
  var uris = mod.resolve()

  emit("beforeload", uris);

  emit("load", uris)

  var len = mod._remain = uris.length
  var m

  // Initialize modules and register waitings
  for (var i = 0; i < len; i++) {
    m = Module.get(uris[i])

    if (m.status < STATUS.LOADED) {
      // Maybe duplicate: When module has dupliate dependency, it should be it's count, not 1
      m._waitings[mod.uri] = (m._waitings[mod.uri] || 0) + 1
    }
    else {
      mod._remain--
    }
  }

  if (mod._remain === 0) {
    mod.onload()
    return
  }

  // Begin parallel loading
  var requestCache = {}

  for (i = 0; i < len; i++) {
    m = cachedMods[uris[i]]

    if (m.status < STATUS.FETCHING) {
      m.fetch(requestCache)
    }
    else if (m.status === STATUS.SAVED) {
      m.load()
    }
  }

  // Send all requests at last to avoid cache bug in IE6-9. Issues#808
  for (var requestUri in requestCache) {
    if (requestCache.hasOwnProperty(requestUri)) {
      requestCache[requestUri]()
    }
  }
}

// Call this method when module is loaded
Module.prototype.onload = function() {
  var mod = this
  mod.status = STATUS.LOADED

  if (mod.callback) {
    mod.callback()
  }

  // Notify waiting modules to fire onload
  var waitings = mod._waitings
  var uri, m

  for (uri in waitings) {
    if (waitings.hasOwnProperty(uri)) {
      m = cachedMods[uri]
      m._remain -= waitings[uri]
      if (m._remain === 0) {
        m.onload()
      }
    }
  }

  // Reduce memory taken
  delete mod._waitings
  delete mod._remain
}

// Fetch a module
Module.prototype.fetch = function(requestCache) {
  var mod = this
  var uri = mod.uri

  mod.status = STATUS.FETCHING

  // Emit `fetch` event for plugins such as combo plugin
  var emitData = { uri: uri }
  emit("fetch", emitData)
  var requestUri = emitData.requestUri || uri

  // Empty uri or a non-CMD module
  if (!requestUri || fetchedList[requestUri]) {
    mod.load()
    return
  }

  if (fetchingList[requestUri]) {
    callbackList[requestUri].push(mod)
    return
  }

  fetchingList[requestUri] = true
  callbackList[requestUri] = [mod]

  // Emit `request` event for plugins such as text plugin
  emit("request", emitData = {
    uri: uri,
    requestUri: requestUri,
    onRequest: onRequest,
    charset: data.charset
  })

  if (!emitData.requested) {
    requestCache ?
        requestCache[emitData.requestUri] = sendRequest :
        sendRequest()
  }

  function sendRequest() {
    exports.request(emitData.requestUri, emitData.onRequest, emitData.charset)
  }

  function onRequest() {
    delete fetchingList[requestUri]
    fetchedList[requestUri] = true

    // Save meta data of anonymous module
    if (anonymousMeta) {
      Module.save(uri, anonymousMeta)
      anonymousMeta = null
    }

    // Call callbacks
    var m, mods = callbackList[requestUri]
    delete callbackList[requestUri]
    while ((m = mods.shift())) m.load()
  }
}

function furtherDependence(ids) {
    // use config.deps to search indirect deps
    var ids = isArray(ids) ? ids : [ids]

    // get all the indirect deps according to the config.deps
    var depsHash = {}
    var retIds = []
    var i = 0
    var configDeps = data.deps,
    	id;

    for(i = 0; i < ids.length; i++) {
      //'a/b.js' => 'a/b'
      id = cleanId(ids[i]);
      
      if(!depsHash[id]) {
        depsHash[id] = true
        retIds.push(id);

        // push the direct dependency of ids[i]
        var idsDeps = configDeps[id] || []
        var j = 0
        
        //deps里没有找到时看下是不是模块名字分隔符不一样
        if(idsDeps.length === 0){
        	var slashReg = /\//g,
        		dotReg = /\./g;
    			
    		idsDeps = slashReg.test(id) ? configDeps[id.replace(slashReg, '.')] : configDeps[id.replace(dotReg, '/')];
      		idsDeps = idsDeps || [];
        }

        for(; j < idsDeps.length; j++) {
          ids.push(idsDeps[j])
        }
      }
    }

    return retIds
}

// Execute a module
Module.prototype.exec = function () {
  var mod = this

  // When module is executed, DO NOT execute it again. When module
  // is being executed, just return `module.exports` too, for avoiding
  // circularly calling
  if (mod.status >= STATUS.EXECUTING) {
    return mod.exports
  }

  mod.status = STATUS.EXECUTING

  // Create require
  var uri = mod.uri

  function require(id) {
    return Module.get(require.resolve(id)).exec()
  }

  require.resolve = function(id) {
    return Module.resolve(id, uri)
  }

  require.async = function(ids, callback) {
    Module.use(ids, callback, uri + "_async_" + cid())
    return require
  }
  
  function Need(id){
  	this.id = id
  	isArray(id) && (this._instance = [])
  }
  
  Need.prototype.done = function(callback){
  	Module.use(this.id, callback, uri + "_async_" + cid())
  	return this
  }
  
  //预加载，不执行
  //get(index1, index2, ...)
  Need.prototype.get = function(index){
  	var uri = data.cwd + "_preload_" + cid(),
  		deps,
  		ids
  	
  	//不传参数默认取所有依赖模块
  	if(arguments.length === 0){
  		ids = furtherDependence(this.id)
  	
  	//如果是传入了一个数字
  	} else if(arguments.length === 1) {
  		if(isNumber(index)) {
			deps = isArray(this.id) ? this.id[index] : (index === 0 && this.id)
			deps && (ids = furtherDependence(deps))
		}
  		
  	//如果指定了预加载多个模块
  	} else if(isArray(this.id)) {
  		var id
  		deps = []
  		for(var i in arguments) {
  			id = this.id[arguments[i]]
  			id && deps.push(id)
  		}
  		
  		ids = furtherDependence(deps)
  		
  	//指定了多个预加载模块，但当前实例又不依赖多个id
  	} else {
  		for(var i in arguments) {
  			arguments[i] === 0 && (deps = this.id)
  		}
  		
  		deps && (ids = furtherDependence(deps))
  	}
  	
  	ids && Module.get(uri, isArray(ids) ? ids : [ids]).load()
  	return this
  }
  
  Need.prototype.eq = function(index){
  	if(!isNumber(index)) {
  		return null
  	}
  	
  	//依赖多模块时存在该模块
  	if(isArray(this.id) && this.id[index]) {
  		return this._instance[index] || (this._instance[index] = new Need(this.id[index]));
  		
  	//实例本来就只依赖单模块
  	} else if(index === 0) {
  		return this
  	}
  	
  }
  
  var need = function(id){
  	return new Need(id)
  }

  // Exec factory
  var factory = mod.factory

  var exports = isFunction(factory) ?
      factory(require, mod.exports = {}, mod, need) :
      factory

  if (exports === undefined) {
    exports = mod.exports
  }

  // Reduce memory leak
  delete mod.factory

  mod.exports = exports
  mod.status = STATUS.EXECUTED

  // Emit `exec` event
  emit("exec", mod)

  return exports
}

// Resolve id to uri
Module.resolve = function(id, refUri) {
  // Emit `resolve` event for plugins such as text plugin
  var emitData = { id: id, refUri: refUri }
  emit("resolve", emitData)

  return emitData.uri || exports.resolve(emitData.id, refUri)
}

// Define a module
Module.define = function (id, deps, factory) {
  var argsLen = arguments.length;

  // define(factory)
  if (argsLen === 1) {
    factory = id
    id = undefined
  }
  else if (argsLen === 2) {
    factory = deps

    // define(deps, factory)
    if (isArray(id)) {
      deps = id
      id = undefined
    }
    // define(id, factory)
    else {
      deps = undefined
    }
  }

  // Parse dependencies according to the module factory code
  if (!isArray(deps) && isFunction(factory)) {
  	deps = data.deps[id];
  	
  	if(!deps) {
  		deps = data.depsConfiged || isTeaMod(id) ? [] : parseDependencies(factory.toString());
  	}
  	
  }

  var meta = {
    id: id,
    uri: Module.resolve(id),
    deps: deps,
    factory: factory
  }

  // Try to derive uri in IE6-9 for anonymous modules
  if (!meta.uri && doc.attachEvent) {
    var script = getCurrentScript()

    if (script) {
      meta.uri = script.src
    }

    // NOTE: If the id-deriving methods above is failed, then falls back
    // to use onload event to get the uri
  }

  // Emit `define` event, used in nocache plugin, exports node version etc
  emit("define", meta)

  meta.uri ? Module.save(meta.uri, meta) :
      // Save information for "saving" work in the script onload event
      anonymousMeta = meta
}

// Save meta data to cachedMods
Module.save = function(uri, meta) {
  var mod = Module.get(uri)

  // Do NOT override already saved modules
  if (mod.status < STATUS.SAVED) {
    mod.id = meta.id || uri
    mod.dependencies = meta.deps || []
    mod.factory = meta.factory
    mod.status = STATUS.SAVED

    emit("save", mod)
  }
}

// Get an existed module or create a new one
Module.get = function(uri, deps) {
  return cachedMods[uri] || (cachedMods[uri] = new Module(uri, deps))
}

// Use function is equal to load a anonymous module
Module.use = function (ids, callback, uri) {

  var ids = furtherDependence(ids);
  var mod = Module.get(uri, isArray(ids) ? ids : [ids])

  mod.callback = function() {
    var exports = []
    var uris = mod.resolve()

    for (var i = 0, len = uris.length; i < len; i++) {
      exports[i] = cachedMods[uris[i]].exec()
    }

    if (callback) {
      callback.apply(global, exports)
    }

    delete mod.callback
  }

  mod.load()

}
// Load preload modules before all other modules
Module.preload = function (callback) {
  var preloadMods = data.preload
  var len = preloadMods.length

  if (len) {
    Module.use(preloadMods, function () {
      // Remove the loaded preload modules
      //preloadMods.splice(0, len)

      // Allow preload modules to add new preload modules
      //Module.preload(callback)
      
      callback();
    }, data.cwd + "_preload_" + cid())
  }
  else {
    callback()
  }
}

// Public API

exports.use = function(ids, callback) {
  Module.preload(function() {
      Module.use(ids, callback, data.cwd + "_use_" + cid())
  })
  return exports
}

Module.define.cmd = {}
global.define = exports.define = Module.define

// For Developers

exports.Module = Module
data.fetchedList = fetchedList
data.cid = cid

exports.require = function(id) {
  var mod = Module.get(Module.resolve(id))
  if (mod.status < STATUS.EXECUTING) {
    mod.onload()
    mod.exec()
  }
  return mod.exports
}

// The root path to use for id2uri parsing
data.base = loaderDir

// The loader directory
data.dir = loaderDir

// The current working directory
data.cwd = cwd

// The charset for requesting files
data.charset = "utf-8"

// set to empty array in default
data.preload = []

// set to empty object in default
data.deps = {}

// data.alias - An object containing shorthands of module id
// data.paths - An object containing path shorthands in module id
// data.vars - The {xxx} variables in module id
// data.map - An array containing rules to map module uri
// data.debug - Debug mode. The default value is false

exports.config = function(configData) {

  for (var key in configData) {
    var curr = configData[key]
    var prev = data[key]

    // Merge object config such as alias, vars
    if (prev && isObject(prev)) {
      for (var k in curr) {
        prev[k] = curr[k]
      }
    }
    else {
      // Concat array config such as map, preload
      if (isArray(prev)) {
        curr = prev.concat(curr)
      }
      // Make sure that `data.base` is an absolute path
      else if (key === "base") {
        // Make sure end with "/"
        if (curr.slice(-1) !== "/") {
          curr += "/"
        }
        curr = addBase(curr)
      }

      // Set config
      data[key] = curr
    }
  }

  emit("config", configData)
  return exports
}

/**
 * The Sea.js plugin for concatenating HTTP requests
 */
var Module = LBF.Module
var FETCHING = Module.STATUS.FETCHING

var data = LBF.data
var comboHash = data.comboHash = {}

var comboSyntax = ["c/=/", ",/"]
var comboMaxLength = 1000
var comboExcludes
var comboSuffix


LBF.on("load", setComboHash)
LBF.on("fetch", setRequestUri)

function ignoreComboUri(uri){
	var combo = data.combo;
	
	switch(typeof combo) {
		/*case 'boolean':
			return false;*/
		case 'string':
			return uri.indexOf(combo) === -1 ? true : false;
		default:
			return false;
			/*var flag = true;
			
			for(var i in combo) {
				if(uri.indexOf(combo[i]) !== -1) {
					flag = false; 
					break;
				}
			}
			
			return flag;*/
	}
}

function setComboHash(uris) {
    var len = uris.length
    if (len < 2 || !data.combo) {
        return
    }

    data.comboSyntax && (comboSyntax = data.comboSyntax)
    data.comboMaxLength && (comboMaxLength = data.comboMaxLength)
    data.comboSuffix && (comboSuffix = data.comboSuffix)

    comboExcludes = data.comboExcludes
    var needComboUris = []

    for (var i = 0; i < len; i++) {
        var uri = uris[i]

        if (comboHash[uri] || ignoreComboUri(uri)) {
            continue
        }

        var mod = Module.get(uri)

        // Remove fetching and fetched uris, excluded uris, combo uris
        if (mod.status < FETCHING && !isCss(uri) && !isExcluded(uri) && !isComboUri(uri)) {
            needComboUris.push(uri)
        }
    }

    if (needComboUris.length > 1) {
        uris2paths(needComboUris)
    }
}

function setRequestUri(fetchData) {
    if(!data.combo){
        return;
    }

    fetchData.requestUri = comboHash[fetchData.uri] || fetchData.uri
}


// Helpers
var COMBO_ROOT_RE = /^(\S+:\/{2,3}[^\/]+\/)/;

function uris2paths(uris) {
    var paths = [],
        root = COMBO_ROOT_RE.exec(uris[0])[1],
        rootLen = root.length;

    forEach(uris, function(uri){
        paths.push(uri.substr(rootLen));
    });

    setHash(root, paths);
}

function setHash(root, files) {
    var copy = []
    for (var i = 0, len = files.length; i < len; i++) {
        copy[i] = files[i].replace(/\?.*$/, '')
    }
    var comboPath = root + comboSyntax[0] + copy.join(comboSyntax[1])
    if(comboSuffix) {
        comboPath += comboSuffix
    }
    var exceedMax = comboPath.length > comboMaxLength

    // http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url
    if (files.length > 1 && exceedMax) {
        var parts = splitFiles(files,
            comboMaxLength - (root + comboSyntax[0] + (comboSuffix || '')).length)

        setHash(root, parts[0])
        setHash(root, parts[1])
    } else {
        if (exceedMax) {
            throw new Error("The combo url is too long: " + comboPath)
        }

        for (var i = 0, len = files.length; i < len; i++) {
            comboHash[root + files[i]] = comboPath
        }
    }
}

function splitFiles(files, filesMaxLength) {
    var sep = comboSyntax[1]
    var s = files[0]

    for (var i = 1, len = files.length; i < len; i++) {
        s += sep + files[i]
        if (s.length > filesMaxLength) {
            return [files.splice(0, i), files]
        }
    }
}

var CSS_EXT_RET = /\.css(?:\?.*)?$/;
function isCss(uri){
    return CSS_EXT_RET.test(uri);
}

function isExcluded(uri) {
    if (comboExcludes) {
        return comboExcludes.test ?
            comboExcludes.test(uri) :
            comboExcludes(uri)
    }
}

function isComboUri(uri) {
    var syntax = data.comboSyntax || comboSyntax
    var s1 = syntax[0]
    var s2 = syntax[1]

    return s1 && uri.indexOf(s1) > 0 || s2 && uri.indexOf(s2) > 0
}


// For test
if (data.test) {
    var test = LBF.test || (LBF.test = {})
    test.uris2paths = uris2paths
    test.paths2hash = paths2hash
}

//added for Tea;
global.Tea = exports;

var config = exports.config;
Tea.config = function(configData){
	var bizBid = configData.bizBid;
	
	configData.preload = configData.preload || [];
	
	if(configData.debug) {
		configData.preload.push('util/debug');
	}
	
	if(configData.localStorage) {
		useLocalStorage();
	}
	
	if(configData.logger) {
		configData.preload.push('biz/monitor/logger/logger');
	}
	
	if(configData.offline) {
		data.map = data.map || [];
		data.map.push(function(uri){
			if(uri.indexOf(loaderDir) !== -1){
				uri = uri.replace('.js', '.js?_bid=2399');
			} else if(bizBid) {
				uri = uri.replace('.js', '.js?_bid=' + bizBid);
			}
			
			return uri;
		});
		
		//预加载qqapi
		Module.get(data.cwd + "_preload_" + cid(), ['biz/qqapi']).load();
		
		exports.use = function(ids, callback) {
			Module.use(['biz/qqapi'], function(mqq){
				function cb(localVersion){
					if(localVersion && !(localVersion == -1 || localVersion == 4294967295)) {
						//业务侧代码也需要走离线包的情况，默认只排除Tea框架内的脚本
						data.comboExcludes = configData.comboExcludes || function(uri){
							return bizBid ? true : uri.indexOf(loaderDir) !== -1;
						};
						
						data._isOffline = true;
					}
					
					Module.preload(function() {
					    Module.use(ids, callback, data.cwd + "_use_" + cid())
					})
				}
				
				mqq.clientVersion == 0 ? cb() : mqq.offline.isCached({bid: 2399}, cb);
				
			}, data.cwd + "_use_" + cid())
			
			return exports
		}
		
	}
	
	return config(configData);
};

Tea.config({
	alias: {
		data: loaderDir + "data"
	},
	vars: {
		theme: loaderDir + "ui/themes/default"
	},
	paths:{
		biz: loaderDir + 'biz',
		core: loaderDir + 'core',
		lib: loaderDir + 'lib',
		ui: loaderDir + 'ui',
		util: loaderDir + 'util'
	}
});

//判断是否内置模块;
function isBuiltInMod(id){
	var inlayReg = /^util\/(forEach|isType|isObject|isString|isArray|inArray|isFunction|isNumber|isRegExp|request|isTeaMod|isBuiltInMod)|^data$/
  	return inlayReg.test(id)
}

//判断是否框架内模块;
function isTeaMod(id){	
  	var inlayReg = /^(core|util|biz|lib|ui)\/|^data$/
  	return inlayReg.test(id)
}

var builtInMods = [
	['data', exports.data], 
	['util/forEach', forEach],
	['util/isType', isType], 
	['util/isObject', isObject],
	['util/isString', isString],
	['util/isArray', isArray],
	['util/inArray', inArray],
	['util/isFunction', isFunction],
	['util/isNumber', isNumber],
	['util/isRegExp', isRegExp],
	['util/request', request],
	['util/isTeaMod', isTeaMod],
	['util/isBuiltInMod', isBuiltInMod]
];

forEach(builtInMods, function(each){
    exports.define(each[0], function(require, exports, module){
        module.exports = each[1];
    });
});

function localStorageSupported() {
  try {
    window.localStorage.setItem("tea", "tea");
    window.localStorage.removeItem("tea");
    return true;
  } catch(e){
    return false;
  }
}

function useLocalStorage(){
    if (data._isOffline || data._useLocalStorage || !localStorageSupported()) {
        return;
    }
    
    data._useLocalStorage = true;

    /**
     * this is the namespace in localstorage
     * @final
     * @static
     * @type {string}
     */
    var META_VERSION_REGEXP_JS = /\/\w+-?([0-9a-zA-Z]*)\.js/,
        REGEX_GET_FUNCTION_MAIN_BODY = /^\s*?function[\s\S]*?\([\s\S]*?\)[\s\S]*?\{([\s\S]*)\}$/,

        helper = {
            /**
             * check whether the uri is stored in the localStorage
             * @method existsInLocal
             * @param uri
             * @returns {boolean}
             */
            existsInLocal: function(uri, version) {
            	var mod = window.localStorage.getItem(uri);
            		
            	if (mod) {
            		return JSON.parse(mod).version == version;
            	} else {
            		return false;
            	}
            },


            /**
             * get the stored uri static file
             * @method getByUri
             * @param uri
             * @returns {*}
             */
            getByUri: function(uri) {
                return this.getItem(uri);
            },


            /**
             * set the item of meta to the localstorage
             * @method setItem
             * @param index
             * @param meta
             */
            setItem: function(meta) {
            	var uri = meta.uri,
            		version = meta.version,
            		factoryString;
            		
            	if(isFunction(meta.factory)) {
            		factoryString = meta.factory.toString();
            		meta.type = 'function';
            	} else if(isObject(meta.factory)) {
            		factoryString = JSON.stringify(meta.factory);
            		meta.type = 'object';
            	} else {
            		factoryString = meta.factory;
            		meta.type = 'string';
            	}
            	
            	meta._factoryString = factoryString;
            		
            	uri = uri.replace('-' + version, '').replace(/\?.*$/, '');
            	
            	try{
            		window.localStorage.setItem(uri, JSON.stringify(meta));
            	}catch(e){}
                
            },


            /**
             * the the item in the index of localstorage
             * @method getItem
             * @param index
             * @returns {*}
             */
            getItem: function(uri) {
                var meta = JSON.parse(window.localStorage.getItem(uri));
                meta.factory = new Function('require', 'exports', 'module', REGEX_GET_FUNCTION_MAIN_BODY.exec(meta._factoryString)[1]);
                return meta;
            }
        };


    /**
     * Tea listens to the define events
     * @event define
     * @param meta
     * the meta format
     * {
     *     id: id, // id of the listened module
     *     uri: the absolute uri of this module
     *     deps: the dependencies of this module
     *     factory: the callback of this module
     * }
     */
    exports.on('define', function(meta) {
    	//内置模块不需要存储
    	//业务侧代码没有使用版本管理时，默认不存储
    	if(isBuiltInMod(meta.id) || !exports.data.storeBizMods && !isTeaMod(meta.id)) {
    		return;
    	}
    	
        var version = (meta.uri.match(META_VERSION_REGEXP_JS) || [])[1];
        meta.version = version;
        helper.setItem(meta);
    });

    /**
     * when the beforeload event is triggered, we deal with the uris to remove js that has been in the localstorage
     * @event beforeload
     * uris is an array
     * @example
     *     ['https://combo.b.qq.com/a.js', 'https://combo.b.qq.com/b.js']
     */
    exports.on('beforeload', function(uris) {
    	var uri, version, temp;
        for(var i = uris.length - 1; i >= 0; i--) {
        	uri = uris[i];
        	temp = uri;
        	version = (uri.match(META_VERSION_REGEXP_JS) || [])[1];
            uri = uri.replace('-' + version, '').replace(/\?.*$/, '');
        	
            if(helper.existsInLocal(uri, version)) {
                var Module = exports.Module,
                    meta = helper.getByUri(uri);
                    
                //如果没有开启业务模块的本地存储，那么不从本地加载
                if(!exports.data.storeBizMods && !isTeaMod(meta.id)) {
                	continue;
                }
                    
                // if the uris exists in the localstorage
                // remove it from uris array
                // because we will load it from the localstorage
                uris.splice(i, 1);

                // directly load from localstorage
                Module.save(temp, meta);
            }
        }
    });
};

Tea.config({
    "deps": {
        "biz/monitor/logger/logger": ["biz/monitor/logger/tryJs", "data", "core/Extend", "util/isObject"],
        "biz/monitor/logger/tryJs": ["biz/monitor/logger/report"],
        "biz/monitor/speed/speedReport": ["util/report", "core/Class", "util/serialize", "core/Attributes"],
        "core/Attributes": ["core/Extend"],
        "core/Class": ["core/Extend"],
        "core/Controller": ["core/Class", "core/Attributes", "lib/zepto", "util/proxy", "util/isFunction"],
        "lib/iscroll": ["lib/zepto"],
        "ui/widget/Calendar/Calendar": ["core/Controller", "lib/zepto", "{theme}/TeaUI/Calendar/calendar.css"],
        "ui/widget/Calendar/CalendarPicker": ["core/Controller", "ui/widget/Calendar/Calendar", "lib/zepto"],
        "ui/widget/Dialog": ["core/Controller", "util/template", "util/inArray", "util/isNumber", "util/isArray", "{theme}/TeaUI/Dialog/dialog.css"],
        "ui/widget/FullPage": ["util/isNumber", "lib/zepto", "{theme}/TeaUI/FullPage/fullpage.css"],
        "ui/widget/Loading": ["core/Controller", "util/template", "{theme}/TeaUI/Loading/loading.css"],
        "ui/widget/MobilePage": ["core/Controller", "util/bindCssEvent", "util/isFunction", "{theme}/TeaUI/MobilePage/MobilePage.css"],
        "ui/widget/Pagination": ["util/isNumber", "core/Extend", "util/template", "core/Controller", "{theme}/TeaUI/Pagination/Pagination.css"],
        "ui/widget/Panel": ["core/Controller", "lib/zepto", "util/rateControl", "{theme}/TeaUI/Panel/panel.css"],
        "ui/widget/Refresh": ["core/Controller", "lib/zepto", "lib/iscroll", "{theme}/TeaUI/Refresh/refresh.css"],
        "ui/widget/ScrollSpy": ["core/Controller", "lib.zepto", "util/isFunction"],
        "ui/widget/Tips": ["core/Controller", "util/template", "{theme}/TeaUI/Tips/tips.css"],
        "util/animate": ["util/isArray"],
        "util/Callbacks": ["core/Class", "lib/zepto"],
        "util/debug": ["lib/zepto", "util/isFunction", "util/isObject", "util/dateTool", "{theme}/TeaUI/debug/debug.css"],
        "util/moduleMemory": ["util/REST", "util/Tasks", "util/template", "util/Promise", "util/GUID", "data"],
        "util/Promise": ["core/Class", "lib/zepto", "util/Callbacks"],
        "util/rateControl": ["util/proxy"],
        "util/REST": ["lib/zepto", "core/Attributes", "core/Event", "util/Promise"],
        "util/RESTPlugins/CSRFPatch": ["util/Cookie"],
        "util/RESTPlugins/speedReport": ["core/Extend", "biz/monitor/speed/speedReport"],
        "util/screenRotate": ["core/Class", "core/Event"],
        "util/Tasks": ["util/proxy"]
    }
});
})(this);
Tea.config({suffixes:{
    "biz/monitor/logger/logger": "bb59abb",
    "biz/monitor/logger/report": "8f913ee",
    "biz/monitor/logger/tryJs": "5559035",
    "biz/monitor/speed/speedReport": "e46055c",
    "biz/qqapi": "e9d8583",
    "core/Attributes": "d16de55",
    "core/Class": "227516e",
    "core/Controller": "a4b4ba6",
    "core/Event": "9c425bb",
    "core/Extend": "c5b8ea0",
    "lib/eruda": "b09866d",
    "lib/Highcharts": "8eaa932",
    "lib/iscroll": "f1e6e64",
    "lib/iscroll5": "e52f625",
    "lib/socketio": "d038e97",
    "lib/socketio137": "3c8f478",
    "lib/zepto": "b917bc3",
    "ui/widget/Calendar/Calendar": "9349f95",
    "ui/widget/Calendar/CalendarPicker": "26a0d19",
    "ui/widget/Dialog": "7d4ae26",
    "ui/widget/FullPage": "3a66e85",
    "ui/widget/Loading": "58e4759",
    "ui/widget/MobilePage": "1e25356",
    "ui/widget/Pagination": "913efa9",
    "ui/widget/Panel": "56d40bf",
    "ui/widget/Refresh": "270aac4",
    "ui/widget/ScrollSpy": "2adbbae",
    "ui/widget/Tips": "7439150",
    "util/animate": "e9e0477",
    "util/bindCssEvent": "d593c28",
    "util/Callbacks": "7ab947f",
    "util/Cookie": "5f96e75",
    "util/dateTool": "47af96e",
    "util/debug": "85b1b8a",
    "util/detect": "2cbb437",
    "util.emoji": "d71fdb8",
    "util/GUID": "adf290c",
    "util/imageLoader": "1eb3e35",
    "util/mapQuery": "6081a4b",
    "util/md5": "43e726c",
    "util/moduleMemory": "74c309e",
    "util/Promise": "1133b37",
    "util/proxy": "553bfbf",
    "util/rateControl": "a8aeed7",
    "util/report": "dc510b3",
    "util/REST": "7323ce1",
    "util/RESTPlugins/CSRFPatch": "99222a5",
    "util/RESTPlugins/speedReport": "edd5be5",
    "util/screenRotate": "b9f1a70",
    "util/serialize": "0eff6c9",
    "util/Tasks": "dc0c31c",
    "util/template": "6d33992",
    "util/xssFilter": "85376d8"
}})