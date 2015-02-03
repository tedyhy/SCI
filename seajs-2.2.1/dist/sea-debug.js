/**
 * Sea.js 2.2.1 | seajs.org/LICENSE.md
 */
(function(global, undefined) {

	// Avoid conflicting when `sea.js` is loaded multiple times
	// 当`sea.js`重复加载时避免冲突。
	if (global.seajs) {
		return
	}

	// 暴露全局变量 seajs => window.seajs = {}。
	var seajs = global.seajs = {
		// The current version of Sea.js being used
		// seajs当前版本
		version: "2.2.1"
	}

	// 缓存数据接口
	var data = seajs.data = {}


	/**
	 * util-lang.js - The minimal language enhancement
	 */
	// 语言增强工具集
	// 判断数据类型
	function isType(type) {
		return function(obj) {
			return {}.toString.call(obj) == "[object " + type + "]"
		}
	}

	var isObject = isType("Object") // 判断是否是"Object"类型
	var isString = isType("String") // 判断是否是"String"类型
	var isArray = Array.isArray || isType("Array") // 判断是否是"Array"类型
	var isFunction = isType("Function") // 判断是否是"Function"类型

	// 初始化cid
	var _cid = 0

	// 生成cid
	function cid() {
		return _cid++
	}


	/**
	 * util-events.js - The minimal events support
	 */
	// 事件系统工具集
	// 事件缓存接口
	var events = data.events = {}

	// Bind event
	// 绑定事件
	seajs.on = function(name, callback) {
		var list = events[name] || (events[name] = [])
		list.push(callback) // 回调入栈
		return seajs
	}

	// Remove event. If `callback` is undefined, remove all callbacks for the
	// event. If `event` and `callback` are both undefined, remove all callbacks
	// for all events
	// 移除绑定的事件，如下两种情况：
	// 1.`callback`未定义，则清空事件name相关所有回调。
	// 2.`event` && `callback` 都未定义，则清空事件缓存里所有回调。
	seajs.off = function(name, callback) {
		// Remove *all* events
		// 即：(!name && !callback)
		// 如果没有事件name和回调callback，则清空事件缓存里所有回调。
		if (!(name || callback)) {
			events = data.events = {}
			return seajs
		}

		// 取事件name相关回调
		var list = events[name]
		if (list) {
			if (callback) {
				// 如果有回调参数callback，则遍历回调集合查找回调参数callback，并将此回调参数callback从集合中移除。
				for (var i = list.length - 1; i >= 0; i--) {
					if (list[i] === callback) {
						list.splice(i, 1) // 移除动作
					}
				}
			} else {
				// 如果木有回调参数callback，则清空与事件name相关的回调集合。
				delete events[name]
			}
		}

		return seajs
	}

	// Emit event, firing all bound callbacks. Callbacks receive the same
	// arguments as `emit` does, apart from the event name
	// 触发事件。触发事件name相关的回调集合中的所有回调。
	var emit = seajs.emit = function(name, data) {
		var list = events[name],
			fn

		// 取事件name相关回调集合。
		if (list) {
			// Copy callback lists to prevent modification
			// clone一份事件回调集合，避免在原回调集合中直接修改。
			list = list.slice()

			// Execute event callbacks
			// 遍历执行事件回调。
			while ((fn = list.shift())) {
				fn(data)
			}
		}

		return seajs
	}


	/**
	 * util-path.js - The utilities for operating path such as id, uri
	 */
	// 文件路径（path）处理工具集

	// 一些正则
	// 目录名称，如："abc/"
	var DIRNAME_RE = /[^?#]*\//
	// 一个点点，如："/./"
	var DOT_RE = /\/\.\//g
	// 双点点，如："/abc/../"
	var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//
	// 双斜线，如："a//"
	var DOUBLE_SLASH_RE = /([^:/])\/\//g

	// Extract the directory portion of a path
	// dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
	// ref: http://jsperf.com/regex-vs-split/2
	// 根据路径（path）获取目录名，如：dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
	function dirname(path) {
		return path.match(DIRNAME_RE)[0]
	}

	// Canonicalize a path
	// realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
	// 规范化路径（path），结合绝对路径、相对路径，从而获取其真实路径。
	// 如：realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
	function realpath(path) {
		// 1. /a/b/./c/./d ==> /a/b/c/d
		path = path.replace(DOT_RE, "/")

		// 2. a/b/c/../../d  ==>  a/b/../d  ==>  a/d
		while (path.match(DOUBLE_DOT_RE)) {
			path = path.replace(DOUBLE_DOT_RE, "/")
		}

		// 3. a//b/c  ==>  a/b/c
		path = path.replace(DOUBLE_SLASH_RE, "$1/")

		return path
	}

	// Normalize an id
	// normalize("path/to/a") ==> "path/to/a.js"
	// NOTICE: substring is faster than negative slice and RegExp
	// 为id添加后缀名（通过id找到相应js或css文件路径）
	// 如：normalize("path/to/a") ==> "path/to/a.js"
	// 注意：substring 方法要比 slice和RegExp 效率要高。
	function normalize(path) {
		var last = path.length - 1 // 取id最后一个字符的索引
		var lastC = path.charAt(last) // 取id最后一个字符（path[last]在ie7有bug，因此使用charAt方法获取）。

		// If the uri ends with `#`, just return it without '#'
		// 如果最后一个字符为`#`，则去掉`#`字符。
		if (lastC === "#") {
			return path.substring(0, last)
		}

		// 如果是以下id则直接返回，否则默认为".js"结尾。
		/*
			1. "path/to/a.js"
			2. "path/to/a.js?"
			3. "path/to/a.css"
			4. "path/to/a/"
		*/
		return (path.substring(last - 2) === ".js" ||
			path.indexOf("?") > 0 ||
			path.substring(last - 3) === ".css" ||
			lastC === "/") ? path : path + ".js"
	}


	// 别名变量、路径变量、一般变量过滤分析
	// 路径（path）正则，如："(abc)(/de)"
	var PATHS_RE = /^([^/:]+)(\/.+)$/
	// 一般变量正则，如："{abc}"
	var VARS_RE = /{([^{]+)}/g

	// 分析过滤别名
	// 参考 http://www.cnblogs.com/ada-zheng/p/3284478.html
	/* 如：别名配置
		alias: {
			'es5-safe': 'gallery/es5-safe/0.9.3/es5-safe',
			'json': 'gallery/json/1.0.2/json',
			'jquery': 'jquery/jquery/1.10.1/jquery'
		}
	*/
	function parseAlias(id) {
		// 从 seajs.data 缓存中取别名缓存 data.alias。
		var alias = data.alias
		// 如果缓存 data.alias 中有参数id相关别名，并且别名为字符串，则返回别名，否则返回参数id。
		return alias && isString(alias[id]) ? alias[id] : id
	}

	// 分析过滤路径
	/* 如：路径配置
		paths: {
			'gallery': 'https://a.alipayobjects.com/gallery'
		}
	*/
	function parsePaths(id) {
		// 从 seajs.data 缓存中取路径缓存 data.paths。
		var paths = data.paths
		var m

		// 如果缓存 data.paths 中有路径别名则替换路径。
		// 如：id = "gallery/json/1.0.2/json" => ["gallery/json/1.0.2/json", "gallery", "/json/1.0.2/json"]
		if (paths && (m = id.match(PATHS_RE)) && isString(paths[m[1]])) {
			// 如：id = "https://a.alipayobjects.com/gallery/json/1.0.2/json"
			id = paths[m[1]] + m[2]
		}

		return id
	}

	// 分析过滤一般变量
	/* 如：变量配置
		vars: {
			'locale': 'zh-cn'
		}
	*/
	function parseVars(id) {
		// 从 seajs.data 缓存中取变量缓存 data.vars。
		var vars = data.vars

		// 如果有变量缓存，且参数id里有变量存在，则正则替换变量。
		if (vars && id.indexOf("{") > -1) {
			id = id.replace(VARS_RE, function(m, key) {
				return isString(vars[key]) ? vars[key] : m
			})
		}

		return id
	}

	// 分析过滤map映射
	/* 如：映射配置
		map: [
			['http://example.com/js/app/', 'http://localhost/js/app/']
		]
	*/
	function parseMap(uri) {
		// 从 seajs.data 缓存中取map缓存 data.map。
		var map = data.map
		var ret = uri

		// 如果有map缓存，则遍历处理（顺序为递增）。
		if (map) {
			for (var i = 0, len = map.length; i < len; i++) {
				var rule = map[i]

				// 如果rule是函数，则执行函数（如果无返回值，则默认还是参数uri）。
				// 如果rule不是函数，则用rule[1]替换rule[0]。
				ret = isFunction(rule) ?
					(rule(uri) || uri) :
					uri.replace(rule[0], rule[1])

				// Only apply the first matched rule
				// 如果替换后的ret与参数uri值不同，则跳出for循环。即：参数uri只应用map中的第一个匹配的且生效的规则。
				if (ret !== uri) break
			}
		}

		return ret
	}


	// 如："//e" 或 ":/"
	var ABSOLUTE_RE = /^\/\/.|:\//
	// 如："http://example.com/"、"//example.com/"、"file:///"等。
	var ROOT_DIR_RE = /^.*?\/\/.*?\//

	// 为id添加base地址。
	function addBase(id, refUri) {
		var ret
		var first = id.charAt(0) // 取第一个字符。

		// Absolute
		// 如果是绝对路径，如："//example.com/js/app/" 或者 "://example.com/js/app/"。
		// 如果是绝对路径，则直接赋值给ret。
		if (ABSOLUTE_RE.test(id)) {
			ret = id
		}
		// Relative
		// 如果是相对路径，如："./app/" 或者 "../app/"
		else if (first === ".") {
			// 如果有参数 "refUri"，则取其目录作为当前id所在的目录；
			// 如果木有参数 "refUri"，则取当前页面所在的目录作为当前id所在的目录。
			// 最后获取当前id的真实路径。
			ret = realpath((refUri ? dirname(refUri) : data.cwd) + id)
		}
		// Root
		// 如果是相对根目录，如："/a/b"
		else if (first === "/") {
			// "http://example.com/a/b" => ["http://example.com/"]
			var m = data.cwd.match(ROOT_DIR_RE)
			// "http://example.com/" + "a/b"
			ret = m ? m[0] + id.substring(1) : id
		}
		// Top-level
		// 如果相对于基目录，如：data.base = "http://example.com/path/to/base/"。
		// 注意：基目录最后一定要带上斜线。
		else {
			ret = data.base + id
		}

		// Add default protocol when uri begins with "//"
		// 为ret添加默认协议。
		// 当 uri 以"//"开头，则增加默认协议。如："//example.com/js/app/"
		if (ret.indexOf("//") === 0) {
			ret = location.protocol + ret
		}

		return ret
	}

	// 将 id 转成 uri
	function id2Uri(id, refUri) {
		if (!id) return ""

		// 依次过滤分析id，别名 > 路径 > 变量，最后为id添加文件后缀（".js"或者".css"）。
		id = parseAlias(id) // 别名
		id = parsePaths(id) // 路径
		id = parseVars(id) // 变量
		id = normalize(id) // 为id添加后缀".js"或者".css"

		// 依据参数refUri为id添加base地址。
		var uri = addBase(id, refUri)
		// 最后分析过滤 data.map。
		uri = parseMap(uri)

		return uri
	}


	var doc = document
	// 从 document.URL 获取当前页面所在目录的名称。
	// 如："http://test.com/a/b/c.js?t=123#xx/zz" => "http://test.com/a/b/"。
	// 变量 cwd 为当前页面所在目录。
	var cwd = dirname(doc.URL)
	// 获取当前页面里所有script脚本节点。
	var scripts = doc.scripts

	// Recommend to add `seajsnode` id for the `sea.js` script element
	// 推荐为`sea.js`脚本元素添加属性 id = `seajsnode`。
	// 如果木有 id = `seajsnode` 的脚本节点，则从 scripts 集合中取最后一个脚本元素，
	// 这个元素就是加载器seajs脚本。
	var loaderScript = doc.getElementById("seajsnode") ||
		scripts[scripts.length - 1]

	// When `sea.js` is inline, set loaderDir to current working directory
	// 获取加载器所在目录，如果木有，则默认为当前页面所在目录 cwd。
	var loaderDir = dirname(getScriptAbsoluteSrc(loaderScript) || cwd)

	// 获取节点的绝对路径。
	function getScriptAbsoluteSrc(node) {
		return node.hasAttribute ? // non-IE6/7 非ie6/7下。
			node.src :
			// see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
			// 参考 http://blog.csdn.net/fudesign2008/article/details/7620985
			// 参考 http://www.jb51.net/article/28114.htm
			// object.getAttribute(strAttributeName, lFlags)，lFlags = 4 为ie6/7下获取完整的url链接地址。
			// 如：<script type="text/javascript" src="/a/b/c"></script>，"/a/b/c" => "http://example.com/a/b/c/"。
			node.getAttribute("src", 4)
	}


	// For Developers
	// 将 id2Uri 方法暴露粗来给开发者。
	seajs.resolve = id2Uri


	/**
	 * util-request.js - The utilities for requesting script and style files
	 * ref: tests/research/load-js-css/test.html
	 */
	// 请求js/css文件工具集。

	// document.head
	var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement
	// 获取 document.head 里的 base 元素。
	var baseElement = head.getElementsByTagName("base")[0]
	// 判断是否是 css 文件。
	var IS_CSS_RE = /\.css(?:\?|$)/i
	// 当前正在插入到文档的 script 脚本元素。
	var currentlyAddingScript
	var interactiveScript

	// `onload` event is not supported in WebKit < 535.23 and Firefox < 9.0
	// ref:
	//  - https://bugs.webkit.org/show_activity.cgi?id=38995
	//  - https://bugzilla.mozilla.org/show_bug.cgi?id=185236
	//  - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
	// `onload` 事件在 WebKit < 535.23 and Firefox < 9.0 下不被支持。
	// 如果 WebKit 版本低于536，则被认为是老版本的WebKit。
	var isOldWebKit = +navigator.userAgent
		.replace(/.*(?:AppleWebKit|AndroidWebKit)\/(\d+).*/, "$1") < 536

	// 根据url连接请求js/css文件。
	// 参数包括：url、回调、字符集。
	function request(url, callback, charset) {
		var isCSS = IS_CSS_RE.test(url) // 判断是否加载的是css文件。
		var node = doc.createElement(isCSS ? "link" : "script") // 创建"link"或"script"节点元素。

		if (charset) {
			// 如果参数 charset 是函数，则执行函数。
			var cs = isFunction(charset) ? charset(url) : charset
			if (cs) {
				// 有字符集，则为节点元素设置charset属性。
				node.charset = cs
			}
		}

		// 为node绑定`onload`事件，监听文件加载进度，并且在文件加载完毕后执行 callback 回调。
		addOnload(node, callback, isCSS, url)

		// 为 js、css 文件添加属性。
		if (isCSS) {
			node.rel = "stylesheet"
			node.href = url
		} else {
			node.async = true
			node.src = url
		}

		// For some cache cases in IE 6-8, the script executes IMMEDIATELY after
		// the end of the insert execution, so use `currentlyAddingScript` to
		// hold current node, for deriving url in `define` call
		// IE6-8 下，当 script 脚本插入文档的动作结束之后，script 脚本将立即执行。
		// 所以用`currentlyAddingScript`去保存当前节点元素。
		currentlyAddingScript = node

		// ref: #185 & http://dev.jquery.com/ticket/2709
		// 如果有base元素，则将node节点插入到base元素之前。
		// 如果木有base元素，则将node节点追加到head元素内部之后。
		baseElement ?
			head.insertBefore(node, baseElement) :
			head.appendChild(node)

		// 当 script 节点元素插入文档后，立即将变量引用置空。
		currentlyAddingScript = null
	}

	// 为node绑定`onload`事件。
	function addOnload(node, callback, isCSS, url) {
		// 判断是否支持`onload`事件。
		var supportOnload = "onload" in node

		// for Old WebKit and Old Firefox
		// 加载css文件（老版本的 WebKit && Firefox 或者 不支持`onload`事件）。
		if (isCSS && (isOldWebKit || !supportOnload)) {
			// 采用定时拉取 css 文件。
			setTimeout(function() {
				// pollCss 方法测试 css 文件是否加载完毕，如果没有加载完毕，则递归调用此方法直到加载完毕。
				pollCss(node, callback)
			}, 1) // Begin after node insertion
			return
		}

		// 加载文件（js/css文件）时，如果支持`onload`事件。
		if (supportOnload) {
			node.onload = onload
			node.onerror = function() {
				// 文件加载失败，触发`error`事件。
				emit("error", {
					uri: url,
					node: node
				})
				onload()
			}
			// IE 节点元素不支持`onload`事件。
		} else {
			// IE支持 onreadystatechange 事件。
			node.onreadystatechange = function() {
				// 监听文件加载状态。
				if (/loaded|complete/.test(node.readyState)) {
					onload()
				}
			}
		}

		// `onload`事件回调。先清理变量减少内存，后执行回调。
		function onload() {
			// Ensure only run once and handle memory leak in IE
			// 确保此回调只运行一次，运行后将回调置空避免IE下内存泄露。
			node.onload = node.onerror = node.onreadystatechange = null

			// Remove the script to reduce memory leak
			// 如果是js文件，且当前处于非debug状态。
			if (!isCSS && !data.debug) {
				// 从文档中移除node节点元素，减小内存消耗。
				head.removeChild(node)
			}

			// Dereference the node
			// 删除node变量引用，避免内存泄露。
			node = null

			// 执行回调。
			callback()
		}
	}

	// 拉取 css 文件方法。
	function pollCss(node, callback) {
		// 获取link节点元素的sheet属性。
		var sheet = node.sheet
		var isLoaded

		// for WebKit < 536
		// 对于老版本的 WebKit，只要link元素的sheet属性有值，说明css文件加载完毕。
		if (isOldWebKit) {
			if (sheet) {
				isLoaded = true
			}
		}
		// for Firefox < 9.0
		// 对于老版本的 Firefox 来讲，如果link元素的sheet属性有值，还需要进一步判断。
		else if (sheet) {
			try {
				// 如果 sheet.cssRules 有值，则说明css文件加载完毕。
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
				// css 加载完毕后，需要给点时间去渲染样式，随后执行回调函数。
				callback()
			} else {
				// 如果还是没有加载完毕，则递归调用 pollCss 方法继续监听css文件的加载进度。
				pollCss(node, callback)
			}
		}, 20)
	}

	// 获取当前正在处理的脚本。
	function getCurrentScript() {
		// 如果当前时刻，有 script 脚本正在插入文档，则返回此脚本节点元素。
		if (currentlyAddingScript) {
			return currentlyAddingScript
		}

		// For IE6-9 browsers, the script onload event may not fire right
		// after the script is evaluated. Kris Zyp found that it
		// could query the script nodes and the one that is in "interactive"
		// mode indicates the current script
		// ref: http://goo.gl/JHfFW
		// IE6-9下，script 节点元素的 `onload` 事件可能不会正确触发，
		// 但是可以通过查找那个节点（一个当前状态为"interactive"的节点）
		// 来确定当前正在处理的 script 脚本。
		// 将 "interactive"（互动） 状态的脚本也加入到正在处理的脚本中。
		if (interactiveScript && interactiveScript.readyState === "interactive") {
			return interactiveScript
		}

		var scripts = head.getElementsByTagName("script")

		// 遍历 script 脚本，找出当前状态为 "interactive" 的脚本。
		for (var i = scripts.length - 1; i >= 0; i--) {
			var script = scripts[i]
			if (script.readyState === "interactive") {
				interactiveScript = script
				return interactiveScript
			}
		}
	}


	// For Developers
	// 将 request 方法暴露粗来给开发者。
	seajs.request = request


	/**
	 * util-deps.js - The parser for dependencies
	 * ref: tests/research/parse-dependencies/test.html
	 */
	// 分析模块依赖工具集。
	// 分析依赖正则
	var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g
	// windows下斜线分割符正则。
	var SLASH_RE = /\\\\/g
	// 分析模块依赖方法。
	function parseDependencies(code) {
		var ret = []

		// 将code中斜线删除掉
		code.replace(SLASH_RE, "")
			// 分析code，从中找出依赖的模块id。
			.replace(REQUIRE_RE, function(m, m1, m2) {
				if (m2) {
					ret.push(m2)
				}
			})

		return ret
	}


	/**
	 * module.js - The core of module loader
	 */
	// 模块加载器核心
	// 模块缓存器
	var cachedMods = seajs.cache = {}
	// 匿名元数据
	var anonymousMeta

	var fetchingList = {}
	var fetchedList = {}
	var callbackList = {}

	// 模块状态
	var STATUS = Module.STATUS = {
		// 1 - The `module.uri` is being fetched
		// 1 - 模块正在被拉取中（根据`module.uri`加载模块）。
		FETCHING: 1,
		// 2 - The meta data has been saved to cachedMods
		// 2 - 模块元数据已经被保存到缓存器中
		SAVED: 2,
		// 3 - The `module.dependencies` are being loaded
		// 3 - 模块依赖正在被加载
		LOADING: 3,
		// 4 - The module are ready to execute
		// 4 - 模块准备好即将执行
		LOADED: 4,
		// 5 - The module is being executed
		// 5 - 模块正在被执行
		EXECUTING: 5,
		// 6 - The `module.exports` is available
		// 6 - `module.exports` 可用
		EXECUTED: 6
	}


	// 模块构造器
	function Module(uri, deps) {
		// 模块参考uri
		this.uri = uri
		// 模块依赖
		this.dependencies = deps || []
		// 模块接口
		this.exports = null
		// 模块状态，默认为0
		this.status = 0

		// Who depends on me
		// 哪些模块依赖当前模块
		this._waitings = {}

		// The number of unloaded dependencies
		// 当前模块所依赖的模块，还有多少尚未加载完毕。
		this._remain = 0
	}

	// Resolve module.dependencies
	// 解决模块依赖，获取当前模块所依赖的模块uri集合。
	Module.prototype.resolve = function() {
		var mod = this // 当前模块引用
		var ids = mod.dependencies // 当前模块依赖
		var uris = [] // 依赖的模块的uri集合

		// 遍历当前模块所依赖模块集合
		for (var i = 0, len = ids.length; i < len; i++) {
			// 将 id 转换成 uri 后入栈
			uris[i] = Module.resolve(ids[i], mod.uri)
		}
		return uris
	}

	// Load module.dependencies and fire onload when all done
	// 加载模块依赖，当所有依赖都加载完则触发 `onload` 事件。
	Module.prototype.load = function() {
		var mod = this

		// If the module is being loaded, just wait it onload call
		// 如果当前模块状态为大于等于“正在被加载”，则返回。
		if (mod.status >= STATUS.LOADING) {
			return
		}

		// 当前模块状态标记为“依赖模块正在被加载”
		mod.status = STATUS.LOADING

		// Emit `load` event for plugins such as combo plugin
		// 触发 `load` 事件，主要是配合插件使用，如："combo" 插件。
		// 获取当前模块所依赖的模块 uris。
		var uris = mod.resolve()
		emit("load", uris)

		// 重置当前模块依赖计数 mod._remain。
		var len = mod._remain = uris.length
		var m

		// Initialize modules and register waitings
		for (var i = 0; i < len; i++) {
			// 从模块缓存器中取m模块信息，如果木有，则创建m模块信息缓存。
			m = Module.get(uris[i])

			// 如果m模块状态为：“正在被加载中”，则处理当前模块与所依赖m模块间关系。
			if (m.status < STATUS.LOADED) {
				// Maybe duplicate: When module has dupliate dependency, it should be it's count, not 1
				// 可能有重复依赖。所以m模块与当前模块有重复依赖关系，应该累加计数，而不是仅仅置为1。
				m._waitings[mod.uri] = (m._waitings[mod.uri] || 0) + 1
			} else {
				// 如果m模块状态为：“加载完毕”，则处理当前模块计数 mod._remain。
				mod._remain--
			}
		}

		// 如果当前模块计数 mod._remain === 0，则触发当前模块 `onload` 事件。
		if (mod._remain === 0) {
			mod.onload()
			return
		}

		// Begin parallel loading
		// 开始并行加载模块。
		// 设置请求模块缓存器。
		var requestCache = {}

		// 遍历当前模块所依赖的模块集合。
		for (i = 0; i < len; i++) {
			// 获取m模块缓存信息。
			m = cachedMods[uris[i]]

			// 如果m模块状态为：小于“正在被拉取中”，则调用模块fetch方法去拉取模块。
			if (m.status < STATUS.FETCHING) {
				m.fetch(requestCache)
			// 如果m模块状态为：“模块已加载完毕，准备好执行”，则调用m模块load方法迭代加载其依赖的模块。
			} else if (m.status === STATUS.SAVED) {
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
	// 当前模块所依赖的模块都加载完毕后将调用此方法。
	Module.prototype.onload = function() {
		var mod = this
		// 将当前模块的状态置为“已加载完毕，等待执行”。
		mod.status = STATUS.LOADED

		// 如果当前模块有属性callback，则执行回调callback。
		if (mod.callback) {
			mod.callback()
		}

		// Notify waiting modules to fire onload
		// 通知等待模块（当前模块所依赖的所有模块）去触发 `onload` 方法。
		var waitings = mod._waitings
		var uri, m

		// 遍历依赖模块。
		for (uri in waitings) {
			if (waitings.hasOwnProperty(uri)) {
				// 获取m模块的缓存信息。
				m = cachedMods[uri]
				m._remain -= waitings[uri]
				if (m._remain === 0) {
					m.onload()
				}
			}
		}

		// Reduce memory taken
		// 删除引用，减少内存消耗。
		delete mod._waitings
		delete mod._remain
	}

	// Fetch a module
	// 拉取模块
	// 参数 requestCache 为请求模块缓存器。
	Module.prototype.fetch = function(requestCache) {
		var mod = this
		var uri = mod.uri

		// 标记当前模块状态为“正在拉取”
		mod.status = STATUS.FETCHING

		// Emit `fetch` event for plugins such as combo plugin
		// 触发 `fetch` 事件。
		var emitData = {
			uri: uri
		}
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
		// 触发 `request` 事件
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
			seajs.request(emitData.requestUri, emitData.onRequest, emitData.charset)
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

	// Execute a module
	// 执行模块
	Module.prototype.exec = function() {
		var mod = this

		// When module is executed, DO NOT execute it again. When module
		// is being executed, just return `module.exports` too, for avoiding
		// circularly calling
		// 如果当前模块已经被执行过，则不要重复执行，仅仅返回接口 `module.exports` 即可，避免重复循环执行。
		if (mod.status >= STATUS.EXECUTING) {
			return mod.exports
		}

		// 标记当前模块状态为“正在被执行”。
		mod.status = STATUS.EXECUTING

		// Create require
		// 创建接口，包括：require、exports、module。
		var uri = mod.uri

		// 如：var $ = require("lib/jquery");
		function require(id) {
			// 返回依赖模块接口（加载依赖模块并执行）。
			return Module.get(require.resolve(id)).exec()
		}

		// id2uri接口
		require.resolve = function(id) {
			return Module.resolve(id, uri)
		}

		// 异步加载依赖模块，代码执行到这个地方才会去加载依赖模块并执行。
		require.async = function(ids, callback) {
			Module.use(ids, callback, uri + "_async_" + cid())
			return require
		}

		// Exec factory
		var factory = mod.factory

		// 执行当前模块函数体返回当前模块提供的接口exports。
		var exports = isFunction(factory) ?
			factory(require, mod.exports = {}, mod) :
			factory

		if (exports === undefined) {
			exports = mod.exports
		}

		// Reduce memory leak
		// 删除函数引用，减少内存消耗
		delete mod.factory

		mod.exports = exports
		mod.status = STATUS.EXECUTED // 标记模块状态为“已执行完毕”

		// Emit `exec` event
		// 触发 `exec` 事件
		emit("exec", mod)

		return exports
	}

	// Resolve id to uri
	// 将 id 转换成 uri
	Module.resolve = function(id, refUri) {
		// Emit `resolve` event for plugins such as text plugin
		// 元数据
		var emitData = {
			id: id,
			refUri: refUri
		}
		// 触发 "resolve" 事件
		emit("resolve", emitData)

		// seajs.resolve = id2Uri
		return emitData.uri || seajs.resolve(emitData.id, refUri)
	}

	// Define a module
	// 定义模块
	Module.define = function(id, deps, factory) {
		// 根据参数长度来判断
		var argsLen = arguments.length

		// define(factory)
		// 如果此方法只有一个参数，即：define(id) => define(function(){...})。
		if (argsLen === 1) {
			// 参数转换
			factory = id
			id = undefined

		// 两个参数，即：define(id, deps) => define(id, function(){...})。
		} else if (argsLen === 2) {
			factory = deps

			// define(deps, factory)
			// 如果参数id为数组，则：define(id, deps) => define(deps, function(){...})。
			if (isArray(id)) {
				deps = id
				id = undefined
			}
			// define(id, factory)
			// 如果参数id不是数组，则：define(id, deps) => define(id, function(){...})。
			else {
				deps = undefined
			}
		}

		// Parse dependencies according to the module factory code
		// 取define方法的 factory 参数的代码内容，利用正则表达式分析出来当前模块所依赖的其他模块id。
		// 如果有参数 deps，且 deps 有值（一个数组），则不会再去分析 factory 参数的代码内容。
		if (!isArray(deps) && isFunction(factory)) {
			deps = parseDependencies(factory.toString())
		}

		// 组装元数据meta
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

		// Emit `define` event, used in nocache plugin, seajs node version etc
		// 触发 `define` 事件。
		emit("define", meta)

		// 如果有meta.uri，则保存模块元数据meta到模块缓存器中。
		meta.uri ? Module.save(meta.uri, meta) :
		// Save information for "saving" work in the script onload event
		anonymousMeta = meta
	}

	// Save meta data to cachedMods
	// 保存模块元数据meta到模块缓存器中。
	Module.save = function(uri, meta) {
		// 根据 uri 从模块缓存器中取一个存在的模块，或者创建一个新的模块。
		var mod = Module.get(uri)

		// Do NOT override already saved modules
		// 如果模块状态小于 STATUS.SAVED ，即处于正在被拉取的状态，则将此模块缓存到模块缓存器中。
		// 否则不要覆盖已经缓存过的模块信息。
		if (mod.status < STATUS.SAVED) {
			mod.id = meta.id || uri
			mod.dependencies = meta.deps || []
			mod.factory = meta.factory
			mod.status = STATUS.SAVED
		}
	}

	// Get an existed module or create a new one
	// 根据 uri 从模块缓存器中取一个存在的模块（如果木有则创建一个新的模块）。
	// 参数 deps 为模块依赖。
	Module.get = function(uri, deps) {
		return cachedMods[uri] || (cachedMods[uri] = new Module(uri, deps))
	}

	// Use function is equal to load a anonymous module
	// Module.use 方法相当于加载了一个匿名模块。
	// 如：Module.use(ids, callback, data.cwd + "_use_" + cid())
	Module.use = function(ids, callback, uri) {
		// 调用 Module.get 方法获取 uri 相关模块缓存信息（并根据参数 ids 生成模块依赖）。
		var mod = Module.get(uri, isArray(ids) ? ids : [ids])

		// 为当前模块添加回调属性（当模块加载完毕后执行）。
		mod.callback = function() {
			var exports = []
			var uris = mod.resolve() // 获取当前模块所依赖的模块集合（作为参数传给回调）。

			// 遍历 uris 集合（遍历执行当前模块所依赖的所有模块，将执行结果组成参数集合exports）
			for (var i = 0, len = uris.length; i < len; i++) {
				exports[i] = cachedMods[uris[i]].exec() // 执行模块
			}

			// 如果有回调，则执行回调。作用域为window，
			// 参数为集合exports（当前模块所依赖的所有模块集合中每个模块的执行结果）。
			/* 例如：
				seajs.use(["jquery", "underscore"], function($, _){
					// 此处作用域为window，即this指向window。
					console.log($, _);
				});
			 */
			
			 */
			if (callback) {
				callback.apply(global, exports)
			}

			// 执行完当前模块的回调属性后，删除其回调属性的引用。
			delete mod.callback
		}

		// 调用当前模块原型方法load加载当前模块所依赖的所有模块。
		mod.load()
	}

	// Load preload modules before all other modules
	// 在其他模块之前预先加载模块
	Module.preload = function(callback) {
		// 取配置项中需要预先加载的模块集合
		var preloadMods = data.preload
		var len = preloadMods.length
		
		if (len) {
			// 如果有预先加载的模块，则加载这些模块。
			Module.use(preloadMods, function() {
				// Remove the loaded preload modules
				// 从 data.preload 中移除已经被加载过的预加载模块。
				preloadMods.splice(0, len)

				// Allow preload modules to add new preload modules
				// 允许向 data.preload 中增加新的预加载模块。
				Module.preload(callback)
			}, data.cwd + "_preload_" + cid())
		} else {
			// 如果配置中没有预先加载的模块，则只需执行回调callback。
			callback()
		}
	}


	// Public API
	// 公共接口方法 use，seajs.use 用于调用执行模块。
	seajs.use = function(ids, callback) {
		// 调用 Module.preload 方法预加载依赖模块。
		Module.preload(function() {
			Module.use(ids, callback, data.cwd + "_use_" + cid())
		})
		return seajs
	}

	Module.define.cmd = {}
	// 公共接口方法 define，window.define = Module.define。
	// define 用于定义一个模块。
	global.define = Module.define


	// For Developers
	// 暴露给开发者。
	seajs.Module = Module
	data.fetchedList = fetchedList
	data.cid = cid

	seajs.require = function(id) {
		// 根据id获取模块数据
		var mod = Module.get(Module.resolve(id))
		// 如果模块状态为“当前模块所依赖的所有模块都加载完毕”时。
		if (mod.status < STATUS.EXECUTING) {
			mod.onload() // 执行当前模块相关回调。
			mod.exec() // 执行当前模块并生成当前模块提供的接口。
		}
		return mod.exports
	}


	/**
	 * config.js - The configuration for the loader
	 */
	// 初始化配置信息。

	var BASE_RE = /^(.+?\/)(\?\?)?(seajs\/)+/

	// The root path to use for id2uri parsing
	// If loaderUri is `http://test.com/libs/seajs/[??][seajs/1.2.3/]sea.js`, the
	// baseUri should be `http://test.com/libs/`
	// 从seajs加载路径获取base路径。
	// 如果seajs加载路径如以下路径：
	/* 
		`http://test.com/libs/seajs/sea.js`
		`http://test.com/libs/seajs/1.2.3/sea.js`
		`http://test.com/libs/seajs/seajs/1.2.3/sea.js`
		`http://test.com/libs/??seajs/sea.js`
		`http://test.com/libs/??seajs/1.2.3/sea.js`
		`http://test.com/libs/??seajs/seajs/1.2.3/sea.js`
		`/libs/seajs/sea.js`
		...
	*/
	data.base = (loaderDir.match(BASE_RE) || ["", loaderDir])[1]

	// The loader directory
	// 当前seajs加载目录。
	data.dir = loaderDir

	// The current working directory
	// 当前工作目录（当前页面所在的目录）。
	data.cwd = cwd

	// The charset for requesting files
	// 默认字符集为 "utf-8"。
	data.charset = "utf-8"

	// Modules that are needed to load before all other modules
	// 预加载模块，需要在其他所有模块加载之前预先加载的模块。
	// 这里是默认加载的模块，如：`seajs-xxx`。
	data.preload = (function() {
		var plugins = []

		// Convert `seajs-xxx` to `seajs-xxx=1`
		// NOTE: use `seajs-xxx=1` flag in uri or cookie to preload `seajs-xxx`
		// 将uri中的 `seajs-xxx` 转换成 `seajs-xxx=1`，从而利用uri和cookie中的配置信息预加载模块。
		var str = location.search.replace(/(seajs-\w+)(&|$)/g, "$1=1$2")

		// Add cookie string
		// 加上cookie信息
		str += " " + doc.cookie

		// Exclude seajs-xxx=0
		// 排除 `seajs-xxx=0` 的情况
		str.replace(/(seajs-\w+)=1/g, function(m, name) {
			plugins.push(name)
		})

		return plugins
	})()

	// data.alias - An object containing shorthands of module id
	// data.paths - An object containing path shorthands in module id
	// data.vars - The {xxx} variables in module id
	// data.map - An array containing rules to map module uri
	// data.debug - Debug mode. The default value is false
	// 设置一些配置信息，如：data.alias、data.paths、data.vars、data.map、data.preload、data.debug等。
	seajs.config = function(configData) {

		// 遍历配置信息
		for (var key in configData) {
			var curr = configData[key] // 当前配置信息
			var prev = data[key] // 默认配置信息

			// Merge object config such as alias, vars
			// 合并“对象”配置，如：alias、paths、vars
			if (prev && isObject(prev)) {
				for (var k in curr) {
					prev[k] = curr[k] // 覆盖之前默认配置信息
				}
			} else {
				// Concat array config such as map, preload
				// 如果是数组，则联合数组配置信息，如：map、preload。
				if (isArray(prev)) {
					curr = prev.concat(curr)
				}
				// Make sure that `data.base` is an absolute path
				// 确保 `data.base` 是一个绝对路径。
				else if (key === "base") {
					// Make sure end with "/"
					// 确保路径以 "/" 结尾。
					if (curr.slice(-1) !== "/") {
						curr += "/"
					}
					// 把当前路径解析成绝对路径。
					curr = addBase(curr)
				}

				// Set config
				// 覆盖之前配置信息
				data[key] = curr
			}
		}

		// 触发 "config" 事件。
		emit("config", configData)
		return seajs
	}

})(this);


/**
 * Sea.js 2.2.1 结构图
 */
/*
window.seajs
	|-version: "2.2.1"
	|-data
		|-events
			|-event1: [fn1, fn2, ...],
			|-event2: [fn1, fn2, ...],
			|-...
		|-alias: {'jquery': 'jquery/jquery/1.10.1/jquery'}
		|-paths: {'gallery': 'https://a.alipayobjects.com/gallery'}
		|-vars: {'locale': 'zh-cn'}
		|-map: [ ['http://example.com/js/app/', 'http://localhost/js/app/'] ]
		|-preload: []
		|-base: ""
		|-dir: ""
		|-cwd: ""
		|-charset: "utf-8"
		|-fetchedList
		|-cid
		|-debug
	|-on
	|-off
	|-emit
	|-resolve: id2Uri
	|-request
	|-cache
	|-use
	|-Module: Module

Module
	|-STATUS
		|-FETCHING: 1,
		|-SAVED: 2,
		|-LOADING: 3,
		|-LOADED: 4,
		|-EXECUTING: 5,
		|-EXECUTED: 6
	|-prototype
		|-resolve
		|-load
		|-onload
		|-fetch
		|-exec
	|-resolve
	|-define
	|-save
	|-get
	|-use
	|-preload
*/