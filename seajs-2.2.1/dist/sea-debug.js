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
		// 当前版本
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
	// 移除绑定的事件。
	// 1.`callback`未定义，则移除此事件所有回调。
	// 2.`event` && `callback` 都未定义，则移除事件缓存里所有回调。
	seajs.off = function(name, callback) {
		// Remove *all* events
		// 即：(!name && !callback)
		if (!(name || callback)) {
			events = data.events = {} // 清空事件缓存里所有回调
			return seajs
		}

		// 取事件name相关回调
		var list = events[name]
		if (list) {
			if (callback) {
				// 如果有回调参数，则遍历回调集合查找回调参数，并将此回调参数从集合中移除。
				for (var i = list.length - 1; i >= 0; i--) {
					if (list[i] === callback) {
						list.splice(i, 1)
					}
				}
			} else {
				// 如果木有回调参数，则删除与事件name相关的回调集合。
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
	// 通过id找到相应js或css文件路径（path）
	// 如：normalize("path/to/a") ==> "path/to/a.js"
	// 注意：substring 方法要比 slice和RegExp 效率要高。
	function normalize(path) {
		var last = path.length - 1 // 取id最后一个字符的索引
		var lastC = path.charAt(last) // 取id最后一个字符，（path[last]在ie7有bug）因此使用charAt方法获取。

		// If the uri ends with `#`, just return it without '#'
		// 如果最后一个字符为`#`，则去掉`#`字符，返回id。
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

		// 如果有map缓存，则遍历处理。
		if (map) {
			for (var i = 0, len = map.length; i < len; i++) {
				var rule = map[i]

				// 如果rule是函数，则执行函数（如果无返回值，则默认还是参数uri）。
				// 如果rule不是函数，则用rule[1]替换rule[0]。
				ret = isFunction(rule) ?
					(rule(uri) || uri) :
					uri.replace(rule[0], rule[1])

				// Only apply the first matched rule
				// 如果替换后的ret与参数uri值不同，则跳出for循环。即：参数uri只应用map中的第一个匹配的规则。
				if (ret !== uri) break
			}
		}

		return ret
	}


	// 如："//e" 或 ":/"
	var ABSOLUTE_RE = /^\/\/.|:\//
	// 如："http://example.com/"
	var ROOT_DIR_RE = /^.*?\/\/.*?\//

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
			ret = realpath((refUri ? dirname(refUri) : data.cwd) + id)
		}
		// Root
		// 如果是根目录，如："/a/b"
		else if (first === "/") {
			// "http://example.com/a/b" => ["http://example.com/"]
			var m = data.cwd.match(ROOT_DIR_RE)
			// "http://example.com/" + "a/b"
			ret = m ? m[0] + id.substring(1) : id
		}
		// Top-level
		else {
			ret = data.base + id
		}

		// Add default protocol when uri begins with "//"
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
		id = parseAlias(id)
		id = parsePaths(id)
		id = parseVars(id)
		id = normalize(id) // （".js"或者".css"）

		// 依据参数refUri为id添加base地址。
		var uri = addBase(id, refUri)
		// 最后分析过滤 data.map。
		uri = parseMap(uri)

		return uri
	}


	var doc = document
	// 从document.URL里获取目录名称。
	// 如："http://test.com/a/b/c.js?t=123#xx/zz" => "http://test.com/a/b/"。
	// 变量 cwd 即为当前页面工作目录。
	var cwd = dirname(doc.URL)
	// 获取当前页面里所有script脚本节点。
	var scripts = doc.scripts

	// Recommend to add `seajsnode` id for the `sea.js` script element
	// 推荐为`sea.js`脚本元素添加属性 id = `seajsnode`。
	// 如果木有 id = `seajsnode` 的脚本节点，则从 scripts 集合中取最后一个脚本元素，
	// 这个元素就是加载器脚本。
	var loaderScript = doc.getElementById("seajsnode") ||
		scripts[scripts.length - 1]

	// When `sea.js` is inline, set loaderDir to current working directory
	// 获取加载器所在目录，如果木有，则默认为当前页面工作目录 cwd。
	var loaderDir = dirname(getScriptAbsoluteSrc(loaderScript) || cwd)

	// 获取节点的绝对路径。
	function getScriptAbsoluteSrc(node) {
		return node.hasAttribute ? // non-IE6/7 非ie6/7下。
			node.src :
			// see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
			// 参考 http://blog.csdn.net/fudesign2008/article/details/7620985
			// 参考 http://www.jb51.net/article/28114.htm
			// object.getAttribute(strAttributeName, lFlags)，lFlags = 4 为ie6/7下获取完整的url链接地址。
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
	// 解决模块依赖
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
	Module.prototype.load = function() {
		var mod = this

		// If the module is being loaded, just wait it onload call
		if (mod.status >= STATUS.LOADING) {
			return
		}

		mod.status = STATUS.LOADING

		// Emit `load` event for plugins such as combo plugin
		var uris = mod.resolve()
		emit("load", uris)

		var len = mod._remain = uris.length
		var m

		// Initialize modules and register waitings
		for (var i = 0; i < len; i++) {
			m = Module.get(uris[i])

			if (m.status < STATUS.LOADED) {
				// Maybe duplicate: When module has dupliate dependency, it should be it's count, not 1
				m._waitings[mod.uri] = (m._waitings[mod.uri] || 0) + 1
			} else {
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
	Module.prototype.exec = function() {
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

		// Exec factory
		var factory = mod.factory

		var exports = isFunction(factory) ?
			factory(require, mod.exports = {}, mod) :
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

		return emitData.uri || seajs.resolve(emitData.id, refUri)
	}

	// Define a module
	Module.define = function(id, deps, factory) {
		var argsLen = arguments.length

		// define(factory)
		if (argsLen === 1) {
			factory = id
			id = undefined
		} else if (argsLen === 2) {
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
			deps = parseDependencies(factory.toString())
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

		// Emit `define` event, used in nocache plugin, seajs node version etc
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
		}
	}

	// Get an existed module or create a new one
	Module.get = function(uri, deps) {
		return cachedMods[uri] || (cachedMods[uri] = new Module(uri, deps))
	}

	// Use function is equal to load a anonymous module
	Module.use = function(ids, callback, uri) {
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
	Module.preload = function(callback) {
		var preloadMods = data.preload
		var len = preloadMods.length

		if (len) {
			Module.use(preloadMods, function() {
				// Remove the loaded preload modules
				preloadMods.splice(0, len)

				// Allow preload modules to add new preload modules
				Module.preload(callback)
			}, data.cwd + "_preload_" + cid())
		} else {
			callback()
		}
	}


	// Public API

	seajs.use = function(ids, callback) {
		Module.preload(function() {
			Module.use(ids, callback, data.cwd + "_use_" + cid())
		})
		return seajs
	}

	Module.define.cmd = {}
	global.define = Module.define


	// For Developers

	seajs.Module = Module
	data.fetchedList = fetchedList
	data.cid = cid

	seajs.require = function(id) {
		var mod = Module.get(Module.resolve(id))
		if (mod.status < STATUS.EXECUTING) {
			mod.onload()
			mod.exec()
		}
		return mod.exports
	}


	/**
	 * config.js - The configuration for the loader
	 */

	var BASE_RE = /^(.+?\/)(\?\?)?(seajs\/)+/

	// The root path to use for id2uri parsing
	// If loaderUri is `http://test.com/libs/seajs/[??][seajs/1.2.3/]sea.js`, the
	// baseUri should be `http://test.com/libs/`
	data.base = (loaderDir.match(BASE_RE) || ["", loaderDir])[1]

	// The loader directory
	data.dir = loaderDir

	// The current working directory
	data.cwd = cwd

	// The charset for requesting files
	data.charset = "utf-8"

	// Modules that are needed to load before all other modules
	data.preload = (function() {
		var plugins = []

		// Convert `seajs-xxx` to `seajs-xxx=1`
		// NOTE: use `seajs-xxx=1` flag in uri or cookie to preload `seajs-xxx`
		var str = location.search.replace(/(seajs-\w+)(&|$)/g, "$1=1$2")

		// Add cookie string
		str += " " + doc.cookie

		// Exclude seajs-xxx=0
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

	seajs.config = function(configData) {

		for (var key in configData) {
			var curr = configData[key]
			var prev = data[key]

			// Merge object config such as alias, vars
			if (prev && isObject(prev)) {
				for (var k in curr) {
					prev[k] = curr[k]
				}
			} else {
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
			|-event1: [],
			|-event2: []
		|-alias: {}
		|-paths: {}
		|-vars: {}
		|-map: []
		|-base: ""
		|-dir: ""
		|-cwd: ""
		|-charset: "utf-8"
		|-preload: []
		|-fetchedList
		|-cid
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