define('util/debug', function (require) {
  var $ = require('lib/zepto'),
    isFunction = require('util/isFunction'),
    isObject = require('util/isObject'),
    dateTool = require('util/dateTool');

  require('{theme}/TeaUI/debug/debug.css');

  var util = {
    addIntent: function (num, str) {
      var result = '';
      for(var i = 0; i < num; i++) {
        result += '  ';
      }
      return result + str;
    },
    formatJSON: function (obj, intent) {
      var self = this, i, html = '', type = Object.prototype.toString.call(obj);

      if (type === '[object Array]') {
        if (obj.length === 0) {
          html += self.addIntent(intent, '[]');
        } else {
          html += '[' + '\r\n';
          for (i = 0; i < obj.length; i++) {
            html += self.addIntent(intent + 1, self.formatJSON(obj[i], intent + 1) + (i == obj.length - 1 ? '' : ',') + '\r\n'); //递归调用
          }
          html += self.addIntent(intent, ']');
        }
      } else if (type === '[object Object]') {
        try {
          JSON.stringify(obj);
        } catch (e) {
          throw e.message;
        }

        var count = 0;
        var key;

        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            count++;
          }
        }
        if (count === 0) {
          html += self.addIntent(intent, '{}');
        } else {
          i = 0;

          html += '{<span class=\'tree-node off\'></span><span class=\'wrapper hidden\'>' + '\r\n';

          for (key in obj) {
            if (obj.hasOwnProperty(key)) {
              i++;
              html += self.addIntent(intent + 1, '<span class=\'key\'>"' + key + '"</span>' + ':' + self.formatJSON(obj[key], intent + 1) + (i === count ? '' : ',') + '\r\n'); //递归调用
            }
          }

          html += self.addIntent(intent, '</span>}');
        }
      } else if (type === '[object Number]') {
        html += '<span class=\'number\'>' + obj + '</span>';
      } else if (type === '[object Boolean]') {
        html += '<span class=\'boolean\'>' + obj + '</span>';
      } else if (type === '[object Undefined]') {
        html += '"undefined"';
      } else if (type === '[object Null]') {
        html += '<span class=\'null\'>' + obj + '</span>';
      } else if (type === '[object String]') {
        html += '<span class=\'string\'>"' + obj.replace('\r\n', '').split("<").join("&lt;").split(">").join("&gt;") + '"</span>'; //xss
      } else if (type.match(/^\[object HTML([a-zA-Z]+)Element\]$/)) {
        var attributes = obj.attributes;
        var str = '';
        var isChild;
        for (i = 0; i < attributes.length; i++) {
          if(attributes[i].nodeValue) {
            str += '<span class=\'attr-name\'>' + attributes[i].nodeName + '</span><span class=\'tag-name\'>="</span><span class=\'attr-value\'>' + attributes[i].nodeValue + '</span><span class=\'tag-name\'>"</span> ';
          } else {
            str += '<span class=\'attr-name\'>' + attributes[i].nodeName + '</span> ';
          }
        }
        str = $.trim(str);
        isChild = obj.childElementCount || (obj.nodeName.toLowerCase() === 'script' && !obj.src) || (obj.nodeName.toLowerCase() === 'style');
        html += isChild ? '<span class=\'html-node\'></span>' : '';
        html += '<span class=\'tag-name\'>&lt;' + obj.nodeName.toLowerCase() + '</span>' + (str ? (' ' + str) : '') + '<span class=\'tag-name\'>&gt;</span>';
        html += isChild ? '<span class=\'quot\'>...</span><span class=\'wrapper hidden\'>' : '';
        var children = obj.children;
        for (var j = 0; j < children.length; j++) {
          html += (isChild ? '\r\n' : '');
          html += util.addIntent(intent + 1, self.formatJSON(children[j], intent + 1)); //递归调用
        }
        html += obj.childElementCount ? '' : obj.textContent;
        html += (isChild ? '\r\n' : '');
        html += isChild ? util.addIntent(intent, '</span><span class=\'tag-name\'>&lt;\/' + obj.nodeName.toLowerCase() + '&gt;</span>') : '<span class=\'tag-name\'>&lt;\/' + obj.nodeName.toLowerCase() + '&gt;</span>';
      } else {
        html += '<span class=\'string\'>' + type + '</span>';
      }

      return html;
    },
    nextAll: function (dom, s) {
      var els = [],
          el = dom.nextElementSibling;
      while (el) {
        if (el.classList.contains(s)) els.push(el);
        el = el.nextElementSibling;
      }
      return els;
    }
  };

  var inject = function (mod) {
    var exports = mod.exports;
    var methodHash = exports ? isFunction(exports) ? exports.prototype : exports : mod.fn;

    var getInfo = function (item) {
      if (isObject(item)) {
        if(item.originalEvent && (item.originalEvent instanceof Event)) {
          return 'Event';
        } else {
          var ret = "Object";
          try {
            ret = JSON.stringify(item);
          } catch (e) {
            //TODO: 无法通过JSON.stringify转换item
          }
          return ret;
        }
      } else if (isFunction(item)) {
        return item.toString();
      } else if (item instanceof HTMLElement) {
        return item.outerHTML;
      } else {
        return item;
      }
    };

    for (var name in methodHash) {
      // Don't inject $ function
      if (name === '$') return;

      if (methodHash.hasOwnProperty(name) && isFunction(methodHash[name])) {
        (function (name) {
          var method = methodHash[name];
          methodHash[name] = function () {
            var retStr = '',
              argObj = {};

            for(var arg in arguments) {
              argObj[arg] = getInfo(arguments[arg]);
            }

            try {
              var ret = method.apply(this, arguments);

              retStr = getInfo(ret);

              console.stack.info({
                mod: mod.id,
                func: name,
                args: JSON.stringify(argObj),
                ret: retStr
              });

              return ret;
            } catch (e) {

              console.stack.error({
                mod: mod.id,
                func: name,
                args: JSON.stringify(argObj),
                exp: e
              });
              console.error(e);

            }
          };
        })(name);
      }
    }
  };

  Tea.on('exec', function (mod) {
    if (isFunction(mod.exports) || isObject(mod.exports)) {
      // 过滤掉不需要注入的module
      if(mod.id) {
        if(!/(^core|^ui|^util|^lib|^biz)\//.test(mod.id)) {
          inject(mod);
        }
      }
    }
  });

  var mconsole = {

    // 日志输出条目计数
  	logLen: 0,

    // 调用栈输出条目计数
    stackLen: 0,

    init: function () {
      var self = this;

      if ($('.jmconsole-panel').length == 0) {
        $('body').append(self.getPanel());
        self.layout();

        // bind window resize event
        $(window).resize(function () {
          self.layout();
        });

        // bind mconsole footer tab click event
        $('.jmconsole-footer-tab').click(function (event) {
          var footerTabs = $('.jmconsole-footer-tab');
          var index = footerTabs.indexOf(event.target);
          footerTabs.removeClass('active');
          $(footerTabs[index]).addClass('active');

          var tabs = $('.jmconsole-tab');
          tabs.removeClass('active');
          $(tabs[index]).addClass('active');
        });

        // bind mconsole close click event
        $('.jmconsole-close').click(function () {
          $('.jmconsole-panel').attr('data-show', false);
          self.layout();
        });

        // bind mconsole small click and drag event
        $('.jmconsole-small').click(function () {
          $('.jmconsole-panel').attr('data-show', true);
          self.layout();
        }).on("touchmove MSPointerMove pointermove", function (event) {
          event.stopPropagation();
          event.preventDefault();
          $('.jmconsole-small').css({
            top: event.touches[0].pageY - 25,
            left: event.touches[0].pageX - 25
          })
        });

        // bind mconsole clear button click event
        $('.jmconsole-log-clear').click(function () {
          $('#jmconsole-log-content').empty();
          self.logLen = 0;
        });
        $('.jmconsole-stack-clear').click(function () {
          $('#jmconsole-stack-content').empty();
          self.stackLen = 0;
        });
        $('.jmconsole-run-clear').click(function () {
          $('.jmconsole-run-input').val('');
        });

        // bind mconsole run button click event
        $('.jmconsole-run-start').click(function () {
          var script = $('.jmconsole-run-input').val();
          eval(script);
        });

        // bind mconsole main double tap event
        $('.jmconsole-main').on('doubleTap', function (event) {
          event.stopPropagation();
          event.preventDefault();

          var $panel = $('.jmconsole-panel');
          $panel.attr('data-more') === 'true' ? $panel.attr('data-more', false) : $panel.attr('data-more', true);
          self.layout();
        });
      }

      self.rewriteConsole();
      self.showEnvironment();
      self.showHTMLStructure();

      // Don't inject zepto
      // self.injectZepto();
    },
    layout: function () {
      var height = $(window).height();
      var width = $(window).width();

      var $panel = $('.jmconsole-panel').show();
      var $close = $('.jmconsole-close').show();
      var $small = $('.jmconsole-small').show();

      $panel.attr('data-more') === 'true' ? $panel.addClass('more') : $panel.removeClass('more');

      $panel.css({
        top: height - ($panel.attr('data-more') === 'true' ? 450 : 200) + 'px'
      });

      $small.css({
        top: ([undefined, 'auto', '0px'].indexOf($small.css('top')) != -1) ? (height - 100 + "px") : $small.css('top'),
        left:([undefined, 'auto', '0px'].indexOf($small.css('left')) != -1) ? (width - $small.width() - 20 + "px") : $small.css('left')
      });

      $close.css({
        left: width - $close.width() + "px"
      });

      $('.jmconsole-log-clear, .jmconsole-stack-clear').css({
        bottom: 45,
        right: 10
      });

      $('.jmconsole-run-clear').css({
        top: height - 110 + "px",
        left: width - 70 + "px"
      });

      $('.jmconsole-run-start').css({
        top: height - 150 + "px",
        left: width - 70 + "px"
      });

      $('.jmconsole-panel').attr('data-show') === 'true' ? $small.hide() : ($panel.hide() && $close.hide());
    },
    getPanel: function () {
      var html =
        '<div class=\"mconsole-panel mconsole-big jmconsole-panel jmconsole-big\" data-more=\"false\" data-show=\"false\">' +
        '  <div class=\"jmconsole-main\">' +
        '    <div class=\"mconsole-close mconsole-button jmconsole-close\">-</div>' +
        '    <div class=\"mconsole-content\">' +
        '      <div class=\"mconsole-tab jmconsole-tab active\">' +
        '        <div id=\"jmconsole-log-panel\" class=\"mconsole-log\">' +
        '          <div id=\"jmconsole-log-content\" class=\"mconsole-log-content\">' +
        '          </div>' +
        '          <div class=\"jmconsole-log-clear mconsole-clear mconsole-button\">\u6e05\u9664</div>' +
        '        </div>' +
        '      </div>' +
        '      <div class=\"mconsole-tab jmconsole-tab\">' +
        '        <div class=\"mconsole-log\">' +
        '          <div id=\"jmconsole-stack-content\" class=\"mconsole-stack-content\">' +
        '          </div>' +
        '          <div id=\"jmconsole-stack-clear\" class=\"jmconsole-stack-clear mconsole-clear mconsole-button\">\u6e05\u9664</div>' +
        '        </div>' +
        '      </div>' +
        '      <div class=\"mconsole-tab jmconsole-tab\">' +
        '        <div class=\"mconsole-run\">' +
        '          <textarea class=\"jmconsole-run-input mconsole-run-input\"></textarea>' +
        '          <div class=\"jmconsole-run-start mconsole-start mconsole-button\">\u8fd0\u884c</div>' +
        '          <div class=\"jmconsole-run-clear mconsole-clear mconsole-button\">\u6e05\u9664</div>' +
        '       </div>' +
        '      </div>' +
        '      <div class=\"mconsole-tab jmconsole-tab\">' +
        '        <div class=\"mconsole-log\">' +
        '          <div id=\"jmconsole-env-content\" class=\"mconsole-env-content\">' +
        '          </div>' +
        '        </div>' +
        '      </div>' +
        '      <div class=\"mconsole-tab jmconsole-tab\">' +
        '        <div class=\"mconsole-html\">' +
        '          <div id=\"jmconsole-html-content\" class=\"mconsole-html-content\">' +
        '          </div>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '    <div class=\"mconsole-footer\">' +
        '      <div class=\"jmconsole-footer-tab mconsole-footer-tab active\">\u65e5\u5fd7</div>' +
        '      <div class=\"jmconsole-footer-tab mconsole-footer-tab\">\u63A5\u53E3\u961F\u5217</div>' +
        '      <div class=\"jmconsole-footer-tab mconsole-footer-tab\">\u8fd0\u884c</div>' +
        '      <div class=\"jmconsole-footer-tab mconsole-footer-tab\">\u73af\u5883</div>' +
        '      <div class=\"jmconsole-footer-tab mconsole-footer-tab\">HTML</div>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<div class=\"mconsole-small mconsole-button jmconsole-small\">MC</div>';

      return html;
    },
    rewriteConsole: function () {
      var self = this;
      console.log = function (msg) {
        self.log(msg, 'log');
      };
      console.info = function (msg) {
        self.log(msg, 'info');
      };
      console.warn = function (msg) {
        self.log(msg, 'warn');
      };
      console.error = function (msg) {
        self.log(msg, 'error');
      };
      console.stack = {
        info: function (item) {
          self.stack(item, 'info');
        },
        error: function (item) {
          self.stack(item, 'error');
        }
      };

      window.onerror = function(msg, url, line) {
        self.log('错误: ' + msg + ', 文件: ' + url + ', 行: ' + line, 'error');
      };

      var open = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url, async, user, psd) {
        self.log('AJAX请求方法: ' + method.toUpperCase() + ', 请求地址: ' + url, 'info');
        open.call(this, method, url, async, user, psd);
      };

      var send = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function (data) {
        if (data) {
          self.log('AJAX请求参数: ' + (isObject(data) ? JSON.stringify(data) : decodeURIComponent(data)), 'info');
        }
        send.call(this, data);
      };
    },
    log: function (msg, type) {
      var self = this;

      var $panel = $('#jmconsole-log-panel');
      var $content = $('#jmconsole-log-content');

      $content.prepend('<div class=\"mconsole-log-msg ' + type + '\"><span class=\"time\">' + self.getNow() + '</span><span>' + msg + '</span></div>');
      self.logLen++;
			
      // 考虑显示性能问题，判断子元素个数，只保留最近的50个子元素
      if(self.logLen > 50) {
        $content.children(':last-child').remove();
        self.logLen--;
      }
    },
    stack: function (item, type) {
      var self = this;

      var stackContent = $('#jmconsole-stack-content');
      var stackItem = $('<div></div>').addClass('jmconsole-stack-msg mconsole-stack-msg ' + type);

      stackItem.append('<span class=\"time\"><span class=\"icon\">[ + ]</span>&nbsp;' + self.getNow() + '</span>');
      stackItem.append('【' + item.func + '】' + item.mod);

      var extendMsgDiv = $('<div></div>').addClass('extend');
      extendMsgDiv.append(
        '<span class=\"name\">Params: </span><span class=\"value\">' + item.args + '</span><br>');
      type == 'info' ? extendMsgDiv.append('<span class=\"name\">Result: </span><span class=\"value\">' + item.ret + '</span>') : extendMsgDiv.append('<span class=\"name\">ErrorMsg: </span><span class=\"value\">[' + item.exp + ']</span>');

      stackItem.append(extendMsgDiv);
      stackItem.on('click', function () {
        var extend = $(this).find('.extend');
        var icon = extend.prev().find('.icon');
        extend.hasClass('active') ? extend.removeClass('active') : ($('.mconsole-stack-msg .extend').removeClass('active') && extend.addClass('active'));
        extend.hasClass('active') ? icon.text('[ - ]') : icon.text('[ + ]');
      });

      stackContent.prepend(stackItem);
      self.stackLen++;

      // 考虑显示性能问题，判断stackContent子元素个数，只保留最近的50个子元素
      if(self.stackLen > 50) {
        stackContent.children(':last-child').remove();
        self.stackLen--;
      }
    },
    injectZepto: function () {
      $.id = 'lib/zepto';
      inject($);
    },
    showEnvironment: function () {
      var $content = $('#jmconsole-env-content');

      var addItem = function (name, info) {
        $content.append('<div class=\"mconsole-env-msg\"><span class=\"name\">' + name + ':&nbsp;</span><span class=\"info\">' + info + '</span></div>');
      };

      addItem("URL", document.location.href);
      addItem("Window", $(window).width() + " x " + $(window).height());
      addItem("Agent", navigator.userAgent);

      var cookieArr = document.cookie.split(';');
      var cookieStr = '';
      for (var i = cookieArr.length - 1; i >= 0; i--) {
        var cookie = cookieArr[i];
        var eq = cookie.indexOf('=');
        if (eq != -1) {
          var name = cookie.substr(0, eq);
          var value = cookie.substr(eq + 1, cookie.length - eq);
          cookieStr += '<br><span class=\"name\">' + name + '</span>&nbsp;=&nbsp;' + '<span class=\"value\">' + value + '</span>';
        }
      }
      addItem('Cookie', cookieStr);

    },
    showHTMLStructure: function () {
      var $content = $('#jmconsole-html-content'),
          html = util.formatJSON(document.getElementsByTagName('html')[0], 0);
      $content.append('<div class="html-info"><pre style="word-wrap: break-word;">' + html + '</pre></div>');

      $content.on('touchstart', function (e) {
        e.stopPropagation();

        var target = e.touches[0].target;
        if (target.classList.contains('html-node')) {
          var isOn = target.classList.contains('on');

          isOn ? target.classList.remove('on') : target.classList.add('on');

          var nextQ = util.nextAll(target, 'quot'), nextW = util.nextAll(target, 'wrapper');
          if(nextQ.length > 0) {
            isOn ? nextQ[0].classList.remove('hidden') : nextQ[0].classList.add('hidden');
          }
          if(nextW.length > 0) {
            isOn ? nextW[0].classList.add('hidden') : nextW[0].classList.remove('hidden');
          }
        }
      });
    },
    getNow: function () {
      return dateTool.format('H:i:s');
    }
  };

  mconsole.init();
});
