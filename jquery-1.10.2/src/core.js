var
	// The deferred used on DOM ready
	// DOM ready 事件列表
	readyList,

	// A central reference to the root jQuery(document)
	// jQuery(document) 的映射
	rootjQuery,

	// Support: IE<10
	// For `typeof xmlNode.method` instead of `xmlNode.method !== undefined`
	// xml中直接判断一个变量是不是等于undefined，在ie9-版本中会判断不到，需用typeof判断。所以存储了字符串形式的undefined。
	core_strundefined = typeof undefined,

	// Use the correct document accordingly with window argument (sandbox)
	// 沙箱方法，获取正确的window对象，并减少查询次数提高效率
	location = window.location,
	document = window.document,
	docElem = document.documentElement,

	// Map over jQuery in case of overwrite
	// 保存已有的 jQuery 属性，避免冲突，后面有用到
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	// 保存已有的 $ 属性，避免冲突，后面有用到
	_$ = window.$,

	// [[Class]] -> type pairs
	// 空对象，用于提供类型检测方法，如：toString
	class2type = {},

	// List of deleted data cache ids, so we can reuse them
	// 1.空数组，用于提供数组方法，如：push
	// 2.用于存储被删除的缓存ids，方便重用。
	core_deletedIds = [],

	core_version = "@VERSION",

	// Save a reference to some core methods
	// 一些核心方法的映射
	core_concat = core_deletedIds.concat,
	core_push = core_deletedIds.push,
	core_slice = core_deletedIds.slice,
	core_indexOf = core_deletedIds.indexOf,
	core_toString = class2type.toString,
	core_hasOwn = class2type.hasOwnProperty,
	core_trim = core_version.trim,

	// Define a local copy of jQuery
	// 定义本地jQuery方法
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		// jQuery 方法其实是 jQuery.fn.init 构造器的强化
		return new jQuery.fn.init( selector, context, rootjQuery );
	},

	// Used for matching numbers
	// 用于匹配数字，包括科学计数法，如：-123.34e-23
	core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

	// Used for splitting on whitespace
	// 按空白把字符串分割开
	core_rnotwhite = /\S+/g,

	// Make sure we trim BOM and NBSP (here's looking at you, Safari 5.0 and IE)
	// 正则，用于去掉字符串的前后空白。包括BOM的unicode编码、十六进制编码
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	// 用于检测是否为HTML标签或ID
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	// Match a standalone tag
	// 匹配标签，如：<div>、<div></div>、<input />
	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

	// JSON RegExp
	// JSON 相关正则
	rvalidchars = /^[\],:{}\s]*$/,
	rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
	rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
	rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	// 用于方法jQuery.camelCase的替换方法
	// 即正则替换："a-bc"=>"aBc"
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	},

	// The ready event handler
	// ready 事件句柄，dom ready后执行的函数
	completed = function( event ) {

		// readyState === "complete" is good enough for us to call the dom ready in oldIE
		// readyState === "complete" 这个足够我们用来判断老ie的dom ready。（ie这个不需要判断document.readyState === "loaded"吗？）
		// (标准浏览器执行到这个函数证明dom ready)
		// (event.type === 'load'证明是经过window.onload事件过来的dom ready)
		if ( document.addEventListener || event.type === "load" || document.readyState === "complete" ) {
			detach();
			jQuery.ready();
		}
	},
	// Clean-up method for dom ready events
	// 清除 dom ready 事件 'completed' 方法（即文档DOM加载完之后卸载doc、win上事件）
	detach = function() {
		// 标准浏览器
		if ( document.addEventListener ) {
			document.removeEventListener( "DOMContentLoaded", completed, false );
			window.removeEventListener( "load", completed, false );

		// ie
		} else {
			document.detachEvent( "onreadystatechange", completed );
			window.detachEvent( "onload", completed );
		}
	};

// 原型对象扩展
jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: core_version,

	constructor: jQuery,

	// jquery对象构造器，入口
	init: function( selector, context, rootjQuery ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;

					// scripts is true for back-compat
					jQuery.merge( this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[2] ) {
							return rootjQuery.find( selector );
						}

						// Otherwise, we inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return rootjQuery.ready( selector );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	},

	// Start with an empty selector
	selector: "",

	// The default length of a jQuery object is 0
	length: 0,

	// 转换成数组
	toArray: function() {
		return core_slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	// 从集合中获取某个DOM元素或者所有匹配的DOM元素，支持正负数字：3， -2。返回的是dom元素。
	get: function( num ) {
		return num == null ?

			// Return a 'clean' array
			// 这里this是选择器匹配的所有元素的集合（数组）
			this.toArray() :

			// Return just the object
			( num < 0 ? this[ this.length + num ] : this[ num ] );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	// 把一个数组元素压入栈，返回新的匹配元素集，内部方法，用于生成新的jquery对象。
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		// 创建一个新的jquery匹配元素集
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		// 为新的元素集添加一个指针 prevObject，指向老的匹配元素集this。
		// 并把老的元素集的作用域赋给新的元素集。
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	// 为每个匹配的元素执行回调。你可以传一个数组参数args，但是这是在内部使用的。
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	ready: function( fn ) {
		// Add the callback
		// jQuery原型上添加dom ready事件回调函数到队列（注册在Deferred对象上）
		jQuery.ready.promise().done( fn );

		return this;
	},

	// 实现类似原生数组 slice 方法
	slice: function() {
		return this.pushStack( core_slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	// 获取匹配的某个jquery对象，返回的时jquery对象。
	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	// 返回上一个jquery对象（从当前jquery对象的prevObject属性取），如果没有就返回空jquery对象
	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	// 原型上的数组方法，处理匹配的jquery对象。
	/* ex:
	 * var a = {length: 0, push: [].push}
	 * a.push(1)
	 * console.log(a) // Object {0: 1, length: 1, push: function}
	 */
	push: core_push,
	sort: [].sort,
	splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

// jQuery 和 jQuery原型上共有的方法，用于扩展对象属性。
// 参考 http://www.cnblogs.com/RascallySnake/archive/2010/05/07/1729563.html
/* 如:
 * deep == true 是深copy，
 * jQuery.extend({})、jQuery.extend(true) 扩展到jQuery对象上
 * jQuery.extend(true, {}, {}) 后面的对象扩展到第一个对象上
 */
jQuery.extend = jQuery.fn.extend = function() {
	var src, copyIsArray, copy, name, options, clone,
		target = arguments[0] || {}, // 取第一个参数
		i = 1, // 遍历循环参数长度的起始值。
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	// 如果第一个参数为布尔型，如: jQuery.extend(true, {a: 1})。则判断是否是深copy。
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		// 跳过第一个参数和第一个对象target，即：遍历参数时从第二个开始。
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	// 如果target参数不是对象或函数，则默认为空对象。
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	// 如果参数只有一个对象，那就默认把对象扩展到this对象上。如：jQuery.extend({a: 1})、jQuery.extend(true, {a: 1})。
	if ( length === i ) {
		target = this;
		--i; // 从target开始算起
	}

	// 遍历参数
	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		// 如果参数为空对象，则不处理。
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			// 遍历参数对象的属性。
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				// 如果值全等，则继续下一循环。
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				// 如果是深copy，且 options[ name ] 是普通对象或数组，则递归merge。
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					// 如果 options[ name ] 是数组。
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					// 如果 options[ name ] 是普通对象。
					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					// 不处理原始对象，只clone它们。
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				// 如果值为未定义的，不会赋值。
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	// 返回修改后的对象
	return target;
};

jQuery.extend({
	// Unique for each copy of jQuery on the page
	// Non-digits removed to match rinlinejQuery
	// 当前页面 jQuery 版本唯一标识，可能存在多个版本 jQuery（如，使用$.noConflict()）
	expando: "jQuery" + ( core_version + Math.random() ).replace( /\D/g, "" ),

	// 解决冲突
	noConflict: function( deep ) {
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}

		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	},

	// Is the DOM ready to be used? Set to true once it occurs.
	// 用于标记dom是否ready
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	// 一个计数器，用于记录dom ready后还有多少事件尚未触发
	readyWait: 1,

	// Hold (or release) the ready event
	// 保持或者释放 dom ready 事件
	// 貌似木有用到 ???
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	// dom ready 后执行的函数
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
		// 确保 body 元素存在。
		if ( !document.body ) {
			return setTimeout( jQuery.ready );
		}

		// Remember that the DOM is ready
		// 标记jQuery.isReady为true
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		// 触发dom ready事件（注册在Deferred对象上的）
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		// 触发这样绑定的ready事件，如：jQuery( document ).bind('ready', fn)
		if ( jQuery.fn.trigger ) {
			jQuery( document ).trigger("ready").off("ready");
		}
	},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).	???
	// 判断是函数
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	// 判读是数组
	isArray: Array.isArray || function( obj ) {
		return jQuery.type(obj) === "array";
	},

	// 是window对象
	isWindow: function( obj ) {
		/* jshint eqeqeq: false */
		return obj != null && obj == obj.window;
	},

	// 是数字，且是有限数字。
	isNumeric: function( obj ) {
		return !isNaN( parseFloat(obj) ) && isFinite( obj );
	},

	// 判断数据类型
	type: function( obj ) {
		if ( obj == null ) {
			return String( obj );
		}
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ core_toString.call(obj) ] || "object" :
			typeof obj;
	},

	// 判断是普通对象
	// ???
	isPlainObject: function( obj ) {
		var key;

		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		// 首先要是个对象。确保dom节点和window对象不能通过检查。
		if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		try {
			// Not own constructor property must be Object
			if ( obj.constructor &&
				!core_hasOwn.call(obj, "constructor") &&
				!core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
				return false;
			}
		} catch ( e ) {
			// IE8,9 Will throw exceptions on certain host objects #9897
			return false;
		}

		// Support: IE<9
		// Handle iteration over inherited properties before own properties.
		if ( jQuery.support.ownLast ) {
			for ( key in obj ) {
				return core_hasOwn.call( obj, key );
			}
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
		for ( key in obj ) {}

		return key === undefined || core_hasOwn.call( obj, key );
	},

	// 判断是否是空对象
	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	// 抛出错误信息
	error: function( msg ) {
		throw new Error( msg );
	},

	// data: string of html
	// context (optional): If specified, the fragment will be created in this context, defaults to document
	// keepScripts (optional): If true, will include scripts passed in the html string
	parseHTML: function( data, context, keepScripts ) {
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}
		context = context || document;

		var parsed = rsingleTag.exec( data ),
			scripts = !keepScripts && [];

		// Single tag
		// ex: ["<div></div>", "div"]
		if ( parsed ) {
			return [ context.createElement( parsed[1] ) ];
		}

		parsed = jQuery.buildFragment( [ data ], context, scripts );
		if ( scripts ) {
			jQuery( scripts ).remove();
		}
		return jQuery.merge( [], parsed.childNodes );
	},

	parseJSON: function( data ) {
		// Attempt to parse using the native JSON parser first
		if ( window.JSON && window.JSON.parse ) {
			return window.JSON.parse( data );
		}

		if ( data === null ) {
			return data;
		}

		if ( typeof data === "string" ) {

			// Make sure leading/trailing whitespace is removed (IE can't handle it)
			data = jQuery.trim( data );

			if ( data ) {
				// Make sure the incoming data is actual JSON
				// Logic borrowed from http://json.org/json2.js
				if ( rvalidchars.test( data.replace( rvalidescape, "@" )
					.replace( rvalidtokens, "]" )
					.replace( rvalidbraces, "")) ) {

					// ex: return eval("("+data+")")
					return ( new Function( "return " + data ) )();
				}
			}
		}

		jQuery.error( "Invalid JSON: " + data );
	},

	// Cross-browser xml parsing
	parseXML: function( data ) {
		var xml, tmp;
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		try {
			if ( window.DOMParser ) { // Standard
				tmp = new DOMParser();
				xml = tmp.parseFromString( data , "text/xml" );
			} else { // IE
				xml = new ActiveXObject( "Microsoft.XMLDOM" );
				xml.async = "false";
				xml.loadXML( data );
			}
		} catch( e ) {
			xml = undefined;
		}
		if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
			jQuery.error( "Invalid XML: " + data );
		}
		return xml;
	},

	noop: function() {},

	// Evaluates a script in a global context
	// Workarounds based on findings by Jim Driscoll
	// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
	// 全局eval方法。ie下使用window.execScript，标准浏览器使用window.eval
	globalEval: function( data ) {
		if ( data && jQuery.trim( data ) ) {
			// We use execScript on Internet Explorer
			// We use an anonymous function so that context is window
			// rather than jQuery in Firefox
			( window.execScript || function( data ) {
				window[ "eval" ].call( window, data );
			} )( data );
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	// camelCase函数的功能就是将形如background-color转化为驼峰表示法：backgroundColor
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	// 判断元素的节点名称是否等于给定的name。
	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// args is for internal usage only
	// 遍历对象或数组，args参数用于内部使用。
	each: function( obj, callback, args ) {
		var value,
			i = 0,
			length = obj.length,
			isArray = isArraylike( obj );

		// 如果有参数args，则执行回调时，回调的参数即为args。
		if ( args ) {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		// each函数特殊的、快速的、常用的用法。
		} else {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					// 如果执行回调后返回值为false，则退出for循环。
					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					// 如果执行回调后返回值为false，则退出for循环。
					if ( value === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

	// Use native String.trim function wherever possible
	// 尽可能使用本地的 String.trim 方法。
	// \uFEFF就是位序掩码（名为<BOM>）,就是空白字符的用途！\uFEFF:UTF-8 BOM。\xA0:HTML &nbsp;
	// https://www.imququ.com/post/bom-and-javascript-trim.html
	trim: core_trim && !core_trim.call("\uFEFF\xA0") ?
		function( text ) {
			return text == null ?
				"" :
				core_trim.call( text );
		} :

		// Otherwise use our own trimming functionality
		function( text ) {
			return text == null ?
				"" :
				( text + "" ).replace( rtrim, "" );
		},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				core_push.call( ret, arr );
			}
		}

		return ret;
	},

	// 判断元素是否在数组中，返回值是索引。i（数组索引）表示从第i个开始循环数组，判断元素是否在数组中i之后。
	inArray: function( elem, arr, i ) {
		var len;

		if ( arr ) {
			if ( core_indexOf ) {
				return core_indexOf.call( arr, elem, i );
			}

			len = arr.length;
			i = i ? (i < 0 ? Math.max( 0, len + i ) : i) : 0;

			for ( ; i < len; i++ ) {
				// Skip accessing in sparse arrays
				if ( i in arr && arr[ i ] === elem ) {
					return i;
				}
			}
		}

		return -1;
	},

	// merge
	merge: function( first, second ) {
		var l = second.length,
			i = first.length,
			j = 0;

		if ( typeof l === "number" ) {
			for ( ; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}
		} else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	// 遍历数组，有返回值，返回值是结果为inv的元素集（inv为期望返回值true/false）
	grep: function( elems, callback, inv ) {
		var retVal,
			ret = [],
			i = 0,
			length = elems.length;
		inv = !!inv;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			retVal = !!callback( elems[ i ], i );
			if ( inv !== retVal ) {
				ret.push( elems[ i ] );
			}
		}

		return ret;
	},

	// arg is for internal usage only
	// arg仅供内部使用。
	// 遍历数组，有返回值，返回值是遍历后的每个返回值成数组
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their
		// elems为jquery对象
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value; // 或者：ret.push(value)
				}
			}

		// Go through every key on the object,
		// elems为object
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}
		}

		// Flatten any nested arrays
		// 返回数组（由map循环时执行回调的结果组成）
		return core_concat.apply( [], ret );
	},

	// A global GUID counter for objects
	// 一个全局GUID计数器
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var args, proxy, tmp;

		// obj = {"test": fn};
		// jQuery.proxy( obj, "test" ) 
		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		// 取(fn, context)两个参数后的参数为新函数（代理函数）的参数
		args = core_slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( core_slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		// 为代理函数设置guid
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	// Multifunctional method to get and set values of a collection
	// The value/s can optionally be executed if it's a function
	// 参考 http://sunnylost.com/article/jquery.access.html
	/*
	   例如：$('div').height(100);
	   elems 就是匹配的元素节点集合，jQuery对象。
	   fn 是需要对节点进行操作的函数。
	   key 是属性名，例如 'height'。
	   value 是样式值或函数，例如 '+=100px'。
	   chainable 表示是否链式执行，对于 get 类方法，我们会获得一个返回值，例如字符串、数字等等，这时候是不需要链式执行的；
	   		而对于 set 类方法，通常需要如此，例如：$('#test').height(100).width(100).css('color', 'red');
	   emptyGet 用于节点集合中没有元素时返回的默认值。
	   raw 为 true，表明 value 不是个函数。
	*/
	access: function( elems, fn, key, value, chainable, emptyGet, raw ) {
		var i = 0,
			length = elems.length,
			bulk = key == null;

		// Sets many values
		// (1) 处理设置元素样式集合的情况。
		// 如果key是一个对象，则说明要链式调用key里的css方法设置样式。然后递归调用方法 jQuery.access。
		// 例如：$('div').css({height: '100px', width: '+=200px'});
		/*
			$( 'div' ).css({
			    width: function( index, value ) {
			    	return parseFloat( value ) * 1.2;
			    },
			    height: function( index, value ) {
			    	return parseFloat( value ) * 1.2;
			    }
			});
		*/
		if ( jQuery.type( key ) === "object" ) {
			chainable = true;
			for ( i in key ) {
				// 递归调用方法 jQuery.access。
				jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
			}

		// Sets one value
		// (2) 处理单个设置元素样式的情况。
		// value 存在，表明是 set 类方法，所以依然是允许链式调用。
		// 例如：$('div').css('width', '+=120px');
		} else if ( value !== undefined ) {
			chainable = true;

			// 如果参数 value 不是函数，则 raw = true。
			if ( !jQuery.isFunction( value ) ) {
				raw = true;
			}

			// key == null => bulk===true
			if ( bulk ) {
				// Bulk operations run against the entire set
				// 参数 value 不是函数。执行回调 fn。如：function( elem, name, value ) {...}。
				if ( raw ) {
					fn.call( elems, value );
					fn = null;

				// ...except when executing function values
				// 参数 value 是函数。
				// 例如：key = "width", value = function( index, value ) { return parseFloat( value ) * 1.2; };
				} else {
					bulk = fn;
					fn = function( elem, key, value ) {
						return bulk.call( jQuery( elem ), value );
					};
				}
			}

			if ( fn ) {
				for ( ; i < length; i++ ) {
					fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
				}
			}
		}

		return chainable ?
			// 如果是链式，则返回元素集合 elems（jQuery对象）。
			elems :

			// Gets
			// (3) 处理获取元素样式的情况。
			// key == null => bulk===true
			// bulk ? fn.call( elems ) : ( length ? fn( elems[0], key ) : emptyGet );
			bulk ?
				fn.call( elems ) :
				length ? fn( elems[0], key ) : emptyGet;
	},

	// 获取当前时间戳。
	now: function() {
		return ( new Date() ).getTime();
	},

	// A method for quickly swapping in/out CSS properties to get correct calculations.
	// Note: this method belongs to the css module but it's needed here for the support module.
	// If support gets modularized, this method should be moved back to the css module.
	// 一种快速交换CSS属性得到正确的计算方法。
	// 这个方法隶属于css模块，但是为兼容低版本浏览器，所以放在这里作为必须支持模块。
	// 如果支持模块化，这个方法可以放到css模块里。
	// ???
	swap: function( elem, options, callback, args ) {
		var ret, name,
			old = {};

		// Remember the old values, and insert the new ones
		for ( name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		ret = callback.apply( elem, args || [] );

		// Revert the old values
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}

		return ret;
	}
});

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready );

		// Standards-based browsers support DOMContentLoaded
		// 标准浏览器支持DOMContentLoaded事件
		} else if ( document.addEventListener ) {
			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed, false );

		// If IE event model is used
		// IE 浏览器下
		} else {
			// Ensure firing before onload, maybe late but safe also for iframes
			document.attachEvent( "onreadystatechange", completed );

			// A fallback to window.onload, that will always work
			window.attachEvent( "onload", completed );

			// If IE and not a frame
			// continually check to see if the document is ready
			/*ie6~8可以使用document.onreadystatechange事件监听document.readyState状态是否等于complete来判断DOM是否加载完毕，
			 *如果页面中嵌有iframe的话，ie6~8的document.readyState会等到iframe中的所有资源加载完才会变成complete，
			 *此时iframe变成了耗时大户。但是经过测试，即使页面中没有iframe，当readyState等于complete时，
			 *实际触发的是onload事件而不是DOMContentLoaded事件。
			 *还好，ie有个特有的doScroll方法。当页面DOM未加载完成时，调用doScroll方法时，就会报错，
			 *反过来，只要一直间隔调用doScroll直到不报错，那就表示页面DOM加载完毕了，
			 *不管图片和iframe中的内容是否加载完毕，此法都有效。
			 */
			var top = false;

			try {
				top = window.frameElement == null && document.documentElement;
			} catch(e) {}

			if ( top && top.doScroll ) {
				(function doScrollCheck() {
					if ( !jQuery.isReady ) {

						try {
							// Use the trick by Diego Perini
							// http://javascript.nwbox.com/IEContentLoaded/
							// http://www.111cn.net/wy/js-ajax/59517.htm
							top.doScroll("left");
						} catch(e) {
							return setTimeout( doScrollCheck, 50 );
						}

						// detach all dom ready events
						detach();

						// and execute any waiting functions
						jQuery.ready();
					}
				})();
			}
		}
	}
	return readyList.promise( obj );
};

// Populate the class2type map
// 填充 class2type 对象，类型映射。
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

// 判断是否是类数组
/**
 * 若type==='array'直接返回true
 * 若type!=='array'的话，如果type!=='function'为true的话开始判断括号里的内容，否则整体返回false
 * 括号里的内容如果length===0为true则括号里整体为true，整体返回true
 * 若length===0为false，判断typeof length==='number'，如果为flase，整体返回false
 * 如果typeof length==='number'，如果为true,判断length>0，如果为false，整体返回false
 * 如果length>0为true，判断( length - 1 ) in obj，这话的意思就是如果是类数组的对象，
 * 其结构肯定是{0:'aaa',1:'bbb',length:2}这样的key值为数字的，所以如果是类数组对象，判断在obj里是否能找到length-1这样的key，如果找到，整体返回true，否则整体返回false
 * in就是判断一个key是否在一个obj里。比如var obj = {a:'111'}，'a' in obj为true，'b' in obj为false
 * ex:
 * var a = {length: 0, push: [].push}
 * a.push(1)
 * console.log(a) // Object {0: 1, length: 1, push: function}
 */
function isArraylike( obj ) {
	var length = obj.length,
		type = jQuery.type( obj );

	if ( jQuery.isWindow( obj ) ) {
		return false;
	}

	if ( obj.nodeType === 1 && length ) {
		return true;
	}

	return type === "array" || type !== "function" &&
		( length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj );
}

// All jQuery objects should point back to these
rootjQuery = jQuery(document);
