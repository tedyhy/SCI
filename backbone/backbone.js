//     Backbone.js 1.1.2

//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org
// 		 AMD规范支持，这里的root指的是window
(function(root, factory) {

	// Set up Backbone appropriately for the environment. Start with AMD.
	// 遵循 AMD 规范平台，如：requireJS
	if (typeof define === 'function' && define.amd) {
		define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
			// Export global even in AMD case in case this script is loaded with
			// others that may still expect a global Backbone.
			root.Backbone = factory(root, exports, _, $);
		});

		// Next for Node.js or CommonJS. jQuery may not be needed as a module.
		// Node.js or CommonJS 平台
	} else if (typeof exports !== 'undefined') {
		var _ = require('underscore');
		factory(root, exports, _);

		// Finally, as a browser global.
		// 浏览器全局变量 window.Backbone
	} else {
		root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
	}

}(this, function(root, Backbone, _, $) {

	// Initial Setup
	// -------------

	// Save the previous value of the `Backbone` variable, so that it can be
	// restored later on, if `noConflict` is used.
	// //保存上一个版本的backbone，用于解决冲突，有可能页面引入了多次backbone,保存当前 window.Backbone 变量。
	var previousBackbone = root.Backbone;

	// Create local references to array methods we'll want to use later.
	// 创建本地数组方法
	// 用局部变量保存数组常用的方法，
	var array = [];
	var push = array.push;
  // slice 一般用于将伪数组转成真正的数组,比如arguments
	var slice = array.slice;
	var splice = array.splice;

	// Current version of the library. Keep in sync with `package.json`.
	Backbone.VERSION = '1.1.2';

	// For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
	// the `$` variable.
	// 将 jQuery 嵌入 Backbone
	Backbone.$ = $;

	// Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
	// to its previous owner. Returns a reference to this Backbone object.
	// 解决冲突,在 无冲突 模式下运行Backbone
	Backbone.noConflict = function() {
  	// 用一个引用指向先前 Backbone 的对象，
		root.Backbone = previousBackbone;
		// 返回变量 `Backbone`
		return this;
	};

	// Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
	// will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
	// set a `X-Http-Method-Override` header.
	// 开启 `emulateHTTP`（模拟HTTP） 以支持传统的 HTTP 服务.
  // 通过设置 '_method' 参数和设置 'X-Http-Method-Override' 头的这个参数可以伪造 'PUT'和'DELETE' 请求
  // 简单的说 就是 老的浏览器不支持REST/HTTP，开启emulateHTTP选项，Backbone将通过POST方法伪造PUT和DELETE方法
	Backbone.emulateHTTP = false;

	// Turn on `emulateJSON` to support legacy servers that can't deal with direct
	// `application/json` requests ... will encode the body as
	// `application/x-www-form-urlencoded` instead and will send the model in a
	// form param named `model`.
	// 开启 `emulateJSON`（模拟JSON） 以支持传统服务器无法直接处理的问题
  // `application/json` 请求 ... 将自身编码为application/x-www-form-urlencoded`发送模型， 而不是直接'model'的表单参数。
  // 老的浏览器不支持直接发送'application/json'编码的请求，开启emulateJSON选项
  // Backbone会将JSON模型数据序列化为modal参数，请求会按照application/x-www-form-urlencoded的内容发送
	Backbone.emulateJSON = false;

	// Backbone.Events
	// ---------------

	// A module that can be mixed in to *any object* in order to provide it with
	// custom events. You may bind with `on` or remove with `off` callback
	// functions to an event; `trigger`-ing an event fires all callbacks in
	// succession.
	//
	//     var object = {};
	//     _.extend(object, Backbone.Events);
	//     object.on('expand', function(){ alert('expanded'); });
	//     object.trigger('expand');
	//
	var Events = Backbone.Events = {

		// Bind an event to a `callback` function. Passing `"all"` will bind
		// the callback to all events fired.
		// 绑定事件，"all" 事件将触发所有绑定的事件。
		on: function(name, callback, context) {
			// API 检测?
			// 如果 (!name || !callback) 则返回 this。
			// 如果 (name === "click blur" || name === {click: fn1, blur: fn2}) 则递归调用on方法
			// 注册事件，最后返回 this。
			if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
			// this._events 一个对象，用于存储当前实例上（this）所有注册的事件。
			// 相当于 this._events = this._events || {} 下面语法更容易用来赋值 如下下句
      // 在绑定时间的对象中 建立事件池 来进行事件管理
			this._events || (this._events = {});
			// 当前实例的事件 name 下的所有回调。
			// name 事件在事件池中的形式（数组形式） 存放当前对象绑定在name的所有事件
			var events = this._events[name] || (this._events[name] = []);
			// 将当前需要绑定的事件 push到事件池中的具体事件名称中
			// 如：this._events['click'] = [{}, {}, ...]。
			// 每个回调都由 {callback: callback, context: context, ctx: context || this} 组成。
			events.push({
				callback: callback,
				context: context,
				ctx: context || this // context 的简写
			});
			// 链式调用
			return this;
		},

		// Bind an event to only be triggered a single time. After the first time
		// the callback is invoked, it will be removed.
		// 绑定事件，只触发一次，随后回调会被移除。借用了underscore的方法_.once()。
		once: function(name, callback, context) {
			// 如果 (!name || !callback) 则返回 this。
			// 如果 (name === "click blur" || name === {click: fn1, blur: fn2}) 则递归调用once注册事件。
			if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
			var self = this;
			// http://underscorejs.org/#once
			// 生成一次性函数（只能执行一次）。
			var once = _.once(function() {
				self.off(name, once);
				callback.apply(this, arguments);
			});
			// 一个属性，存储原始回调。
			once._callback = callback;
			return this.on(name, once, context);
		},

		// Remove one or many callbacks. If `context` is null, removes all
		// callbacks with that function. If `callback` is null, removes all
		// callbacks for the event. If `name` is null, removes all bound
		// callbacks for all events.
		// 移走一个或多个回调。
		// 如果参数 context 不为空，则移走当前实例的事件name下所有作用域为 context 的回调。
		// 如果参数 callback 为空，则移走当前实例的事件name下所有回调。
		// 如果参数 name 为空，则移走当前实例下所有事件的所有回调。
		off: function(name, callback, context) {
			var retain, ev, events, names, i, l, j, k;
			// 如果 (!this._events || 递归调用off方法)，则返回 this。
			if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
			// 如果没有参数 name、callback、context，则将对象 this._events 置为undefined，
			// 即：清空当前实例下的所有事件的所有回调。
			if (!name && !callback && !context) {
				this._events = void 0;
				return this;
			}
			// 事件 name 有值时，取当前实例下事件 name 下所有回调。
			// 事件 name 无值时，取当前实例下所有事件下所有回调。
			// 使用 underscore 的 keys 获取对象键值方法
			names = name ? [name] : _.keys(this._events);
			// 对每个包含回调函数的对象进行筛选，不符合指定参数条件的进行保留
			for (i = 0, l = names.length; i < l; i++) {
				// 事件name，如：click
				name = names[i];
				if (events = this._events[name]) {
					// retain 为剩下的回调集合，重新赋给对象 this._events[name]。
					this._events[name] = retain = [];
					// obj.off(name, callback, context) 或 obj.off(null, callback, context)
					if (callback || context) {
						for (j = 0, k = events.length; j < k; j++) {
							ev = events[j];
							// on/once 绑定的事件。
							if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
								(context && context !== ev.context)) {
								retain.push(ev);
							}
						}
					}
					if (!retain.length) delete this._events[name];
				}
			}

			return this;
		},

		// Trigger one or many events, firing all bound callbacks. Callbacks are
		// passed the same arguments as `trigger` is, apart from the event name
		// (unless you're listening on `"all"`, which will cause your callback to
		// receive the true name of the event as the first argument).
		// 触发一个或多个事件 name 下回调。会触发所有绑定的回调.
    // 除了事件名称，回调函数会被传递'trigger'相同的参数。
    // (如果你监听了 'all', 会让你的回调函数将事件名称作为第一个参数).
    // obj.trigger("change",function(){});
    // obj.trigger("all",function(eventName){ alert(eventName) });
		trigger: function(name) {
			if (!this._events) return this;
			// 参数列表，不包含name 即不包含第一个tigger的参数 name
			// 取参数 arg1, arg2, ...，如：obj.trigger('click', arg1, arg2, ...)
			var args = slice.call(arguments, 1);
			// 递归调用实例的trigger方法，如果事件 name 为空，则返回实例。
			// trigger方法中调用了两次triggerEvents
			if (!eventsApi(this, 'trigger', name, args)) return this;
			var events = this._events[name];
			var allEvents = this._events.all;
			// 通过参数传进来的事件触发
			if (events) triggerEvents(events, args);
			// 任何事件触发都会触发事件 all 上的回调。
			// http://backbonejs.org/#Events-on
			if (allEvents) triggerEvents(allEvents, arguments);
			return this;
		},

		// Tell this object to stop listening to either specific events ... or
		// to every object it's currently listening to.
		// 使这个对象或者所有监听特定事件的对象停止监听该特定的事件
		stopListening: function(obj, name, callback) {
			// 如果当前实例无监听对象列表 this._listeningTo，则返回当前实例。
			var listeningTo = this._listeningTo;
			if (!listeningTo) return this;
			// (!name && !callback) 情况将清除当前实例监听的所有对象。
			var remove = !name && !callback;
			// 事件 name === {click: fn1, blur: fn2}) 情况下，将作用域this覆盖参数callback，
			// 此时callback成为作用域context。
			if (!callback && typeof name === 'object') callback = this;
			// 如：listeningTo['l123'] = obj;
			if (obj)(listeningTo = {})[obj._listenId] = obj;
			for (var id in listeningTo) {
				obj = listeningTo[id];
				obj.off(name, callback, this);
				if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
			}
			return this;
		}

	};

	// Regular expression used to split event strings.
	// 正则表达式用于分割事件字符串，如：var name = "click focus blur"
	var eventSplitter = /\s+/;

	// Implement fancy features of the Events API such as multiple event
	// names `"change blur"` and jQuery-style event maps `{change: action}`
	// in terms of the existing API.
	/*
	 * 递归器，用来处理事件 name 类型为 "object"，值为 "click focus blur" 类型的。
	 * @this：当前要绑定事件的对象。
	 * @action：事件动作，如：'on/off/trigger'
	 * @name：事件类型名称。
	 * @rest：数组 [callback, context]
	 * @result：true/false
	 */
 	// 处理多个事件的绑定，比如"change blur"或者'{change: action}'
  // 该函数的主要作用：
  // 当指定事件名为object对象时，将object对象中key作为事件名
  // 将obejct中的value作为回调函数对象，然后递归调用on、off、trigger
  // 当指定的事件名为string，但包含空格时，将string按空格切割，再依次递归调用
	// on: function(name, callback, context) {
	// if (!eventsApi(this, 'on', name, [callback, context]) || !callback)
	var eventsApi = function(obj, action, name, rest) {
		if (!name) return true;

		// Handle event maps.
		/*
		如：
			var name = {
				click: handler1,
				focus: handler2,
				blur: handler3
			}
		*/
		// 当指定的事件名为object时
		if (typeof name === 'object') {
			for (var key in name) {
				// 参数为：(key, name[key] [, ......])，callback或context不存在。
				// 即：rest = [ context ]，此时木有callback，context替代了callback。
				// obj.on(name, context)
				obj[action].apply(obj, [key, name[key]].concat(rest));
			}
			return false;
		}

		// Handle space separated event names.
		// 当指定的事件名包含空格时
		/*
		如：
			var name = "click focus blur"
		*/
		if (eventSplitter.test(name)) {
			var names = name.split(eventSplitter);
			for (var i = 0, l = names.length; i < l; i++) {
				// 参数为：(names[i], callback, context)
				obj[action].apply(obj, [names[i]].concat(rest));
			}
			return false;
		}

		return true;
	};

	// A difficult-to-believe, but optimized internal dispatch function for
	// triggering events. Tries to keep the usual cases speedy (most internal
	// Backbone events have 3 arguments).
	// 内部使用的触发事件执行回调的方法，为了保证通常快速执行，Backbone的事件回调大多会有3个参数。
	// 调用事件回调函数的函数
  // 为了性能问题，才使用了switch，而不是直接使用default中的代码
  // 关于这个函数性能测试 可以查看下：http://jsperf.com/js-function-call-vs-function-apply
  // 实际上是call 与 apply的性能差异 http://stackoverflow.com/questions/14968387/backbone-triggerevents-variable
  // 中文：http://www.cnblogs.com/snandy/archive/2013/05/23/3091258.html
	var triggerEvents = function(events, args) {
		var ev, i = -1,
			l = events.length,
			a1 = args[0],
			a2 = args[1],
			a3 = args[2];
		switch (args.length) {
			case 0:
				while (++i < l)(ev = events[i]).callback.call(ev.ctx);
				return;
			case 1:
				while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1);
				return;
			case 2:
				while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2);
				return;
			case 3:
				while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
				return;
			default:
				while (++i < l)(ev = events[i]).callback.apply(ev.ctx, args);
				return;
		}
	};

	// 监听方法 listenTo、listenToOnce
	// 用于当前实例监听另一个对象的变化，当另一个对象的某个事件触发时，将会执行当前这个对象的回调函数
	var listenMethods = {
		listenTo: 'on',
		listenToOnce: 'once'
	};

	// Inversion-of-control versions of `on` and `once`. Tell *this* object to
	// listen to an event in another object ... keeping track of what it's
	// listening to.
	_.each(listenMethods, function(implementation, method) {
		// 例如：implementation === 'on'，method === 'listenTo'
		// 例子：view.listenTo(allfoods, 'change', view.render);
		Events[method] = function(obj, name, callback) {
			// 对象 this._listeningTo 用于存储当前实例监听的所有对象，如：obj。
			var listeningTo = this._listeningTo || (this._listeningTo = {});
			// 添加监听 id 到 obj 上，如：obj._listenId
			// http://underscorejs.org/#uniqueId
			var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
			listeningTo[id] = obj;
			// 事件 name === {click: fn1, blur: fn2}) 情况下，将作用域this覆盖参数callback，
			// 此时callback成为作用域context。
			if (!callback && typeof name === 'object') callback = this;
			// 等效于在 obj 上注册事件 name，回调为callback，context为当前实例对象。
			obj[implementation](name, callback, this);
			return this;
		};
	});

	// Aliases for backwards compatibility.
	// 事件别名，为了向后兼容,以前的版本用bind来绑定事件
	Events.bind = Events.on;
	Events.unbind = Events.off;

	// Allow the `Backbone` object to serve as a global event bus, for folks who
	// want global "pubsub" in a convenient place.
	// 为全局变量 Backbone 添加事件系统,将Events对象fix到Backbone对象
	_.extend(Backbone, Events);
	// 在Events中维护了一个_events对象，而_events对象中的属性名就代表了一个事件，属性值为一个数组，数组中的元素为包含了注册的回调函数的对象。
  // 所以当我们调用on('click', callback, ctx)时,实际上是做了这样的操作:this._events['click'].push({ callback: callback, context: ctx });

	// Backbone.Model
	// --------------

	// Backbone **Models** are the basic data object in the framework --
	// frequently representing a row in a table in a database on your server.
	// A discrete chunk of data and a bunch of useful, related methods for
	// performing computations and transformations on that data.

	// Create a new model with the specified attributes. A client id (`cid`)
	// is automatically generated and assigned for you.
	// Backbone Models 在框架中是基础的数据对象,通常代表你服务器数据库表中的一行.
 	// 一个离散的数据块，和一堆对这些数据进行计算转换的有用的相关的方法

 	// 使用指定的属性创建一个新的模型.
 	// 会自动生成并分配一个用户id (`cid`)
	// Backbone 的数据模块，Model模块里有个自动生成的，全局唯一的cid，用于区分数据实例。
	var Model = Backbone.Model = function(attributes, options) {
		// 设置model的默认参数，如果不传的话，默认都是空对象
		// attrs也相当于是model的实例属性，一般对应于数据库的字段
		var attrs = attributes || {};
		// 配置项
		options || (options = {});
		// 当前数据实例唯一id
		this.cid = _.uniqueId('c');
		// 用于存储当前数据实例的所有数据（属性或方法）。
		this.attributes = {};
		// ???
		if (options.collection) this.collection = options.collection;
		// 解析attrs，默认直接返回attrs
		if (options.parse) attrs = this.parse(attrs, options) || {};
		// http://underscorejs.org/#result
		// http://underscorejs.org/#defaults
		// 整理数据，即：构造器传入的参数 attributes 数据优先级高，其次是当前数据实例的。
		// defaults 为默认数据。
		attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
		// 为每个数据实例初始化默认数据。设置model相应的属性
		this.set(attrs, options);
		// 记录当前数据实例改变的数据。
		this.changed = {};
		// 执行当前实例的 initialize 方法，参数为传给构造器的参数。
		// var A = Backbone.Model.extend({});
		// new A({}, {});
		// 初始化事件，可以覆盖重写这个方法，this指向model
		this.initialize.apply(this, arguments);
	};

	// Attach all inheritable methods to the Model prototype.
	// 将 Events 事件系统添加到 Model 模块实例上。那么，每个数据实例将拥有完整的事件系统。
	// 给 prototype 添加 属性
  // 将所有可继承的方法添加到 模型 的原型中.
	_.extend(Model.prototype, Events, {

		// A hash of attributes whose current and previous value differ.
		// 存储数据（当前值与之前的值不同的数据）。
		// 这个用来存储，当连续改变实例数据的过程中数据的最新值。
		changed: null,// 记录当前数据对象下哪些属性改变了

		// The value returned during the last failed validation.
		// 用于存储验证数据失败信息。
		validationError: null,// 最后一次验证失败的返回值.

		// The default name for the JSON `id` attribute is `"id"`. MongoDB and
		// CouchDB users may want to set this to `"_id"`.
		// json数据中的id别名，如："id"、"_id"
		// 数据的id属性模式是什么,一般对应数据库的自增长id,如果和数据库上的id名称不一样，比如page表的id叫page_id,则通过这个属性进行修改
		idAttribute: 'id',

		// Initialize is an empty function by default. Override it with your own
		// initialization logic.
		// 初始化方法，默认为空函数，需要自己根据逻辑覆盖此方法，在创建实例的时候会执行。
		initialize: function() {},

		// Return a copy of the model's `attributes` object.
		// 返回当前实例数据的copy，json格式。使用了_.clone方法避免值引用带来的问题。
		toJSON: function(options) {
			return _.clone(this.attributes);
		},

		// Proxy `Backbone.sync` by default -- but override this if you need
		// custom syncing semantics for *this* particular model.
		// 调用Backbone.sync方法，一个映射。
		// 默认使用 `Backbone.sync` 代理
    // 如果需要可以自定义重写
    // 该方法用于向服务端同步数据（增、删、改）
    // 该方法默认调用的是Backbone.sync方法（ajax）
    // 可以通过替换Backbone.sync来使用我们自己的sync方法，比如mongodb，这样backbone也能用于Node.js后端
		sync: function() {
			return Backbone.sync.apply(this, arguments);
		},

		// Get the value of an attribute.
		// 获取实例数据某个属性的值。
		get: function(attr) {
			return this.attributes[attr];
		},

		// Get the HTML-escaped value of an attribute.
		// 获取某个属性的值（经过html编码后），如：© = &copy; 空格 = &nbsp;
		// 参照：http://www.jb51.net/onlineread/htmlchar.htm
		// 使用了_.escape方法对属性值进行html编码。
		escape: function(attr) {
			return _.escape(this.get(attr));
		},

		// Returns `true` if the attribute contains a value that is not null
		// or undefined.
		// 返回boolean值，判断实例属性中是否存在属性attr。
		// 若属性值不为 null 或者 undefined 则返回  `true`
		has: function(attr) {
			return this.get(attr) != null;
		},

		// Set a hash of model attributes on the object, firing `"change"`. This is
		// the core primitive operation of a model, updating the data and notifying
		// anyone who needs to know about the change in state. The heart of the beast.
		// 设置实例数据，方法unset、clear等方法都基于此方法。
		// 在对象上建立模型的属性哈希,此方法会触发实例的change事件。它是Model模块的核心。
		// 更新数据, 通知那些需要知道 模型 状态变化的对象
    // 第一个参数key如果是对象类型，直接将该对象拷贝到this.attributes上，
    // 如果key是字符串，那么将在内部把key，value转成一个临时对象attrs再拷贝到this.attributes上。
    // jQuery API 的风格
		set: function(key, val, options) {
			var attr, attrs, unset, changes, silent, changing, prev, current;
			if (key == null) return this;

			// Handle both `"key", value` and `{key: value}` -style arguments.
			// 处理 `"key", value` 和 `{key: value}` 2种参数形式的情况.
			// 例如：obj.set({key1: value1, key2: value2, ...}, options)
			if (typeof key === 'object') {
				attrs = key;
				options = val;
			// 例如：obj.set(key1, value1, options)
			} else {
				(attrs = {})[key] = val;
			}

			options || (options = {});
			// Run validation.
			// 验证设置的属性是否符合要求，_validate方法内部将会调用validate方法
      // validate方法需要model使用者自己指定
			// 在设置数据之前做属性值校验。如果校验失败，则返回false。
			if (!this._validate(attrs, options)) return false;

			// Extract attributes and options.
			// 标记model数据状态。
			// 提取 属性 和 可选项.
      // 表示应当删除属性，而不是设置属性
			unset = options.unset;		// 实例方法unset、clear会用到的选项。
			// 当silent为true时，不触发change事件
			silent = options.silent;	// 静默设置。
			changes = [];				// 当前数据的哪些数据正在被改变了。
			changing = this._changing;	// 当前实例的数据是否正在被改变（true/false）。
			this._changing = true;		// 将当前实例的数据改变状态置为true，表示当前实例的数据正在被改变。

			// 当前实例的数据没有正在被改变，则初始化实例属性_previousAttributes和changed。
			if (!changing) {
				// 之前的数据。
				this._previousAttributes = _.clone(this.attributes);
				// 这个用来存储，当连续改变实例数据的过程中数据的最新值。
				this.changed = {};
			}

			// 记录当前数据和之前数据。通过current，prev两个参数存储当前数据和之前数据
			// 如果 changing === true，则current和prev值初始化的时候是不一样。
			// 如果 changing === false，则current和prev值初始化的时候是相同的。
			current = this.attributes, prev = this._previousAttributes;

			// Check for changes of `id`.
			// 如果实例的数据属性中包含 this.idAttribute 属性，再设置实例的属性id。如果设置了idAttribute为别的id ，则内部设置一个id来表示这个model
			if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

			// For each `set` attribute, update or delete the current value.
			// 循环设置数据attrs。使用_.isEqual判断两个值是否相等。
			for (attr in attrs) {
				val = attrs[attr];
				// 当前改变了哪些数据，当设置的值与当前的数据attrs的属性值不同时，将要设置的属性的key加入changes列表中
				if (!_.isEqual(current[attr], val)) changes.push(attr);
				// 更新当前实例，在被连续改变数据的过程中，数据的最新值。
				if (!_.isEqual(prev[attr], val)) {
					// this.changed存储改变了的属性和其属性值
					this.changed[attr] = val;
				} else {
					delete this.changed[attr];
				}
				// unset选项设置，在实例方法unset、clear中会用到。
				unset ? delete current[attr] : current[attr] = val;
			}

			// Trigger all relevant attribute changes.
			// 如果不是静默模式（即：options.silent !== true），则会触发实例上注册的事件 change。
			// 首先你得注册实例的change事件，如：obj.on('change:xx', callback, context)。
			// 触发事件 change 的过程中，回调会得到的参数有(当前实例, 老的数据, 选项)。
			if (!silent) {
				if (changes.length) this._pending = options;
				// 触发'change:变更的属性名'事件
				for (var i = 0, l = changes.length; i < l; i++) {
					this.trigger('change:' + changes[i], this, current[changes[i]], options);
				}
			}

			// You might be wondering why there's a `while` loop here. Changes can
			// be recursively nested within `"change"` events.
			// while 循环 修改将被递归嵌套在'events'事件中
			if (changing) return this;
			// 当实例数据结束改变时执行。
			// 如果不是静默模式，则会触发默认事件 change。回调会得到的参数有(当前实例, 选项)。
			if (!silent) {
				// 触发'change'事件，这里使用while，是因为change事件也有可能会调用set方法
        // 所以需要递归的调用
				while (this._pending) {
					options = this._pending;
					this._pending = false;
					this.trigger('change', this, options);
				}
			}
			this._pending = false;
			this._changing = false;
			return this;
		},

		// Remove an attribute from the model, firing `"change"`. `unset` is a noop
		// if the attribute doesn't exist.
		// 删除实例数据方法。主要是由选项 unset 控制，`unset` 如果属性不存在设置为空
		unset: function(attr, options) {
			return this.set(attr, void 0, _.extend({}, options, {
				unset: true
			}));
		},

		// Clear all attributes on the model, firing `"change"`.
		// 清空实例数据方法。主要是由选项 unset 控制，触发 `"change"`.
		clear: function(options) {
			var attrs = {};
			for (var key in this.attributes) attrs[key] = void 0;
			return this.set(attrs, _.extend({}, options, {
				unset: true
			}));
		},

		// Determine if the model has changed since the last `"change"` event.
		// If you specify an attribute name, determine if that attribute has changed.
		// 确保 模型 在上一次更改后再一次更改 `"change"` event.
		// 如果指定了属性名称，判断属性值是否改变。
		hasChanged: function(attr) {
			// 判断model的attributes是否有改变
			if (attr == null) return !_.isEmpty(this.changed);
			// 判断model的某个属性值是否有改变
			return _.has(this.changed, attr);
		},

		// Return an object containing all the attributes that have changed, or
		// false if there are no changed attributes. Useful for determining what
		// parts of a view need to be updated and/or what attributes need to be
		// persisted to the server. Unset attributes will be set to undefined.
		// You can also pass an attributes object to diff against the model,
		// determining if there *would be* a change.
		// 返回一个包含所有改变的属性的对象, 当没有属性被更改，就返回 false.
    // 常用来判断视图块是否需要更新或者那些属性需要保存到后端
    // 未设置的属性将设置为 undefined.
    // 你也可以针对模型传递一个属性对象来改变,决定是否 *would be* 改变.
		// diff 是（要与当前实例数据相比较的）数据。比较之后，如果 diff 里的数据与当前实例数据不一致，
		// 则说明当前实例数据已经被改变，最后会返回改变了的数据集合。
		changedAttributes: function(diff) {
			if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
			var val, changed = false;
			// 如果 this._changing === true 则，实例数据正在被改变，则返回 this._previousAttributes，
			// 否则返回 this.attributes。
			var old = this._changing ? this._previousAttributes : this.attributes;
			for (var attr in diff) {
				if (_.isEqual(old[attr], (val = diff[attr]))) continue;
				(changed || (changed = {}))[attr] = val;
			}
			return changed;
		},

		// Get the previous value of an attribute, recorded at the time the last
		// `"change"` event was fired.
		// 取最近一次（触发了实例change事件后的那次）实例数据的属性为attr的值。
		previous: function(attr) {
			if (attr == null || !this._previousAttributes) return null;
			return this._previousAttributes[attr];
		},

		// Get all of the attributes of the model at the time of the previous
		// `"change"` event.
		//  获取上一次（触发了实例change事件后的那次）实例数据，json格式。
		previousAttributes: function() {
			return _.clone(this._previousAttributes);
		},

		// Fetch the model from the server. If the server's representation of the
		// model differs from its current attributes, they will be overridden,
		// triggering a `"change"` event.
		// 从服务器端获取 模型 .  相当于ajax的get操作
    // 如果服务器端的显示的模型与当前属性有区别，那么覆盖并且触发事件"change"`.
		fetch: function(options) {
			options = options ? _.clone(options) : {};
			if (options.parse === void 0) options.parse = true;
			var model = this;
			// 先缓存用户设置的success
			var success = options.success;
			// fetch方法自带的success回调
			options.success = function(resp) {
				// 从服务器获取数据后设置model的属性值
				if (!model.set(model.parse(resp, options), options)) return false;
				if (success) success(model, resp, options);
				// 触发sync事件
				model.trigger('sync', model, resp, options);
			};
			wrapError(this, options);
			return this.sync('read', this, options);
		},

		// Set a hash of model attributes, and sync the model to the server.
		// If the server returns an attributes hash that differs, the model's
		// state will be `set` again.
		// 设置属性的哈希, 同步模型到服务器.
    // 如果服务器返回一个有区别的属性散列，那么模型的状态要重新设置
		save: function(key, val, options) {
			var attrs, method, xhr, attributes = this.attributes;

			// Handle both `"key", value` and `{key: value}` -style arguments.
			// 处理 `"key", value` and `{key: value}` 2种参数情况.
			if (key == null || typeof key === 'object') {
				attrs = key;
				options = val;
			} else {
				(attrs = {})[key] = val;
			}
			// 默认验证为通过 validate true
			options = _.extend({
				validate: true
			}, options);

			// If we're not waiting and attributes exist, save acts as
			// `set(attr).save(null, opts)` with validation. Otherwise, check if
			// the model will be valid when the attributes, if any, are set.
			// 如果并不在等待队列中并且属性不存在, 保存行为以 `set(attr).save(null, opts)`格式.
      // 如果选项参数里面没有wait方法 即不需要验证，直接就set了
      // options.wait为true用于等待服务器返回结果，再进行属性值的设置（进而view变化）
      // 为false的话，先进行数据验证，再设置属性值（改变view, 拥有更好的用户体验），再提交数据，
      // （这样的话等待服务器返回结果前还原attributes，进行属性值的set操作，包含验证）
			if (attrs && !options.wait) {
				if (!this.set(attrs, options)) return false;
			} else {
				if (!this._validate(attrs, options)) return false;
			}

			// Set temporary attributes if `{wait: true}`.
			if (attrs && options.wait) {
				this.attributes = _.extend({}, attributes, attrs);
			}

			// After a successful server-side save, the client is (optionally)
			// updated with the server-side state.
			if (options.parse === void 0) options.parse = true;
			var model = this;
			var success = options.success;
			options.success = function(resp) {
				// Ensure attributes are restored during synchronous saves.
				model.attributes = attributes;
				var serverAttrs = model.parse(resp, options);
				if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
				if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
					return false;
				}
				if (success) success(model, resp, options);
				model.trigger('sync', model, resp, options);
			};
			wrapError(this, options);

			method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
			if (method === 'patch') options.attrs = attrs;
			xhr = this.sync(method, this, options);

			// Restore attributes.
			if (attrs && options.wait) this.attributes = attributes;

			return xhr;
		},

		// Destroy this model on the server if it was already persisted.
		// Optimistically removes the model from its collection, if it has one.
		// If `wait: true` is passed, waits for the server to respond before removal.
		// ???
		destroy: function(options) {
			options = options ? _.clone(options) : {};
			var model = this;
			var success = options.success;

			var destroy = function() {
				model.trigger('destroy', model, model.collection, options);
			};

			options.success = function(resp) {
				if (options.wait || model.isNew()) destroy();
				if (success) success(model, resp, options);
				if (!model.isNew()) model.trigger('sync', model, resp, options);
			};

			if (this.isNew()) {
				options.success();
				return false;
			}
			wrapError(this, options);

			var xhr = this.sync('delete', this, options);
			if (!options.wait) destroy();
			return xhr;
		},

		// Default URL for the model's representation on the server -- if you're
		// using Backbone's restful methods, override this to change the endpoint
		// that will be called.
		// ???
		url: function() {
			var base =
				_.result(this, 'urlRoot') ||
				_.result(this.collection, 'url') ||
				urlError();
			if (this.isNew()) return base;
			return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
		},

		// **parse** converts a response into the hash of attributes to be `set` on
		// the model. The default implementation is just to pass the response along.
		parse: function(resp, options) {
			return resp;
		},

		// Create a new model with identical attributes to this one.
		// 利用当前model的构造器重新创建一个实例，它俩具有相同属性值。
		clone: function() {
			return new this.constructor(this.attributes);
		},

		// A model is new if it has never been saved to the server, and lacks an id.
		// 通过验证此model无idAttribute属性，判断当前model是新的model，尚未保存到服务器的数据。
		isNew: function() {
			return !this.has(this.idAttribute);
		},

		// Check if the model is currently in a valid state.
		// 验证当前实例所有数据，还是调用当前实例的_validate方法去调用。
		isValid: function(options) {
			return this._validate({}, _.extend(options || {}, {
				validate: true
			}));
		},

		// Run validation against the next complete set of model attributes,
		// returning `true` if all is well. Otherwise, fire an `"invalid"` event.
		// 验证数据，验证失败会触发"invalid"事件。都验证通过才会返回true。
		_validate: function(attrs, options) {
			// options中有选项validate为true，
			// 而且原型中（即：实例中）必须有validate方法存在，否则直接返回true。
			if (!options.validate || !this.validate) return true;
			attrs = _.extend({}, this.attributes, attrs);
			// 实例的validate方法会有返回值，如错误信息，将信息赋给实例属性validationError。
			// 如果没有错误信息，则验证通过。
			var error = this.validationError = this.validate(attrs, options) || null;
			if (!error) return true;
			// 如果验证失败，则会触发事件invalid。
			this.trigger('invalid', this, error, _.extend(options, {
				validationError: error
			}));
			return false;
		}

	});

	// Underscore methods that we want to implement on the Model.
	// 把underscore的这些方法移植到Backbone的model实例上。
	var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

	// Mix in each Underscore method as a proxy to `Model#attributes`.
	// 将这些方法移植到model时，这些方法的第一个参数都是当前model的数据。
	// 其核心还是调用了underscore的相应的方法。
	_.each(modelMethods, function(method) {
		Model.prototype[method] = function() {
			var args = slice.call(arguments);
			args.unshift(this.attributes);
			return _[method].apply(_, args);
		};
	});

	// Backbone.Collection
	// -------------------

	// If models tend to represent a single row of data, a Backbone Collection is
	// more analagous to a table full of data ... or a small slice or page of that
	// table, or a collection of rows that belong together for a particular reason
	// -- all of the messages in this particular folder, all of the documents
	// belonging to this particular author, and so on. Collections maintain
	// indexes of their models, both in order, and for lookup by `id`.

	// Create a new **Collection**, perhaps to contain a specific type of `model`.
	// If a `comparator` is specified, the Collection will maintain
	// its models in sort order, as they're added and removed.
	// 创建新的集合，包含明确类型的model，如果参数comparator被指定，则当前集合将按照comparator有序排列。
	var Collection = Backbone.Collection = function(models, options) {
		options || (options = {});
		// 为Collection集合指定model数据类型和实例数据排序方式。
		if (options.model) this.model = options.model;
		if (options.comparator !== void 0) this.comparator = options.comparator;
		// 重置collection属性。
		this._reset();
		// 初始化collection实例的时候会先调用实例方法initialize，进行一些初始化操作。
		this.initialize.apply(this, arguments);
		// 如果有model数据实例，则调用collection实例方法reset，重置collection实例model数据集合。
		// 选项silent === true，不会触发collection实例上注册的reset事件。
		if (models) this.reset(models, _.extend({
			silent: true
		}, options));
	};

	// Default options for `Collection#set`.
	// collection实例上方法set、add的默认选项。
	var setOptions = {
		add: true,
		remove: true,
		merge: true
	};
	var addOptions = {
		add: true,
		remove: false
	};

	// Define the Collection's inheritable methods.
	// 为Collection实例添加事件系统。
	_.extend(Collection.prototype, Events, {

		// The default model for a collection is just a **Backbone.Model**.
		// This should be overridden in most cases.
		// 数据类型默认为 Backbone.Model 类型，大多情况下需要覆盖此属性。
		model: Model,

		// Initialize is an empty function by default. Override it with your own
		// initialization logic.
		// 需要时重载此函数即可。
		initialize: function() {},

		// The JSON representation of a Collection is an array of the
		// models' attributes.
		// 调用collection实例的map方法（从underscore移植过来的方法）遍历当前collection实例。
		// 为每个model数据应用同个方法，返回（由每个model数据json格式组成的）集合。
		toJSON: function(options) {
			return this.map(function(model) {
				return model.toJSON(options);
			});
		},

		// Proxy `Backbone.sync` by default.
		// ???
		sync: function() {
			return Backbone.sync.apply(this, arguments);
		},

		// Add a model, or list of models to the set.
		// 向当前collection实例增加一个数据model，或者一个数据列表集合。
		add: function(models, options) {
			return this.set(models, _.extend({
				merge: false
			}, options, addOptions));
		},

		// Remove a model, or a list of models from the set.
		// 从当前collection实例中移除一个数据model，或者一个数据列表集合。
		remove: function(models, options) {
			var singular = !_.isArray(models);
			models = singular ? [models] : _.clone(models);
			options || (options = {});
			var i, l, index, model;
			for (i = 0, l = models.length; i < l; i++) {
				model = models[i] = this.get(models[i]);
				if (!model) continue;
				delete this._byId[model.id];
				delete this._byId[model.cid];
				index = this.indexOf(model);
				this.models.splice(index, 1);
				this.length--;
				if (!options.silent) {
					options.index = index;
					model.trigger('remove', model, this, options);
				}
				this._removeReference(model, options);
			}
			return singular ? models[0] : models;
		},

		// Update a collection by `set`-ing a new list of models, adding new ones,
		// removing models that are no longer present, and merging models that
		// already exist in the collection, as necessary. Similar to **Model#set**,
		// the core operation for updating the data contained by the collection.
		set: function(models, options) {
			options = _.defaults({}, options, setOptions);
			if (options.parse) models = this.parse(models, options);
			var singular = !_.isArray(models);
			models = singular ? (models ? [models] : []) : _.clone(models);
			var i, l, id, model, attrs, existing, sort;
			var at = options.at;
			var targetModel = this.model;
			var sortable = this.comparator && (at == null) && options.sort !== false;
			var sortAttr = _.isString(this.comparator) ? this.comparator : null;
			var toAdd = [],
				toRemove = [],
				modelMap = {};
			var add = options.add,
				merge = options.merge,
				remove = options.remove;
			var order = !sortable && add && remove ? [] : false;

			// Turn bare objects into model references, and prevent invalid models
			// from being added.
			for (i = 0, l = models.length; i < l; i++) {
				attrs = models[i] || {};
				if (attrs instanceof Model) {
					id = model = attrs;
				} else {
					id = attrs[targetModel.prototype.idAttribute || 'id'];
				}

				// If a duplicate is found, prevent it from being added and
				// optionally merge it into the existing model.
				if (existing = this.get(id)) {
					if (remove) modelMap[existing.cid] = true;
					if (merge) {
						attrs = attrs === model ? model.attributes : attrs;
						if (options.parse) attrs = existing.parse(attrs, options);
						existing.set(attrs, options);
						if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
					}
					models[i] = existing;

					// If this is a new, valid model, push it to the `toAdd` list.
				} else if (add) {
					model = models[i] = this._prepareModel(attrs, options);
					if (!model) continue;
					toAdd.push(model);
					this._addReference(model, options);
				}

				// Do not add multiple models with the same `id`.
				model = existing || model;
				if (order && (model.isNew() || !modelMap[model.id])) order.push(model);
				modelMap[model.id] = true;
			}

			// Remove nonexistent models if appropriate.
			if (remove) {
				for (i = 0, l = this.length; i < l; ++i) {
					if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
				}
				if (toRemove.length) this.remove(toRemove, options);
			}

			// See if sorting is needed, update `length` and splice in new models.
			if (toAdd.length || (order && order.length)) {
				if (sortable) sort = true;
				this.length += toAdd.length;
				if (at != null) {
					for (i = 0, l = toAdd.length; i < l; i++) {
						this.models.splice(at + i, 0, toAdd[i]);
					}
				} else {
					if (order) this.models.length = 0;
					var orderedModels = order || toAdd;
					for (i = 0, l = orderedModels.length; i < l; i++) {
						this.models.push(orderedModels[i]);
					}
				}
			}

			// Silently sort the collection if appropriate.
			if (sort) this.sort({
				silent: true
			});

			// Unless silenced, it's time to fire all appropriate add/sort events.
			if (!options.silent) {
				for (i = 0, l = toAdd.length; i < l; i++) {
					(model = toAdd[i]).trigger('add', model, this, options);
				}
				if (sort || (order && order.length)) this.trigger('sort', this, options);
			}

			// Return the added (or merged) model (or models).
			return singular ? models[0] : models;
		},

		// When you have more items than you want to add or remove individually,
		// you can reset the entire set with a new list of models, without firing
		// any granular `add` or `remove` events. Fires `reset` when finished.
		// Useful for bulk operations and optimizations.
		reset: function(models, options) {
			options || (options = {});
			for (var i = 0, l = this.models.length; i < l; i++) {
				this._removeReference(this.models[i], options);
			}
			options.previousModels = this.models;
			this._reset();
			models = this.add(models, _.extend({
				silent: true
			}, options));
			if (!options.silent) this.trigger('reset', this, options);
			return models;
		},

		// Add a model to the end of the collection.
		// 向当前collection实例栈末添加一个数据model。
		push: function(model, options) {
			return this.add(model, _.extend({
				at: this.length
			}, options));
		},

		// Remove a model from the end of the collection.
		// 从当前collection实例栈末移除一个数据model。
		pop: function(options) {
			var model = this.at(this.length - 1);
			this.remove(model, options);
			return model;
		},

		// Add a model to the beginning of the collection.
		// 向当前collection实例的队列首部添加一个数据实例。
		unshift: function(model, options) {
			return this.add(model, _.extend({
				at: 0
			}, options));
		},

		// Remove a model from the beginning of the collection.
		// 从当前collection实例的队列首部移除一个数据实例。
		shift: function(options) {
			var model = this.at(0);
			this.remove(model, options);
			return model;
		},

		// Slice out a sub-array of models from the collection.
		// this.models 是一个数组，存储collection实例所属的数据集合。
		// 调用数组方法slice，从collection实例数据集合中取子数组集合。
		slice: function() {
			return slice.apply(this.models, arguments);
		},

		// Get a model from the set by id.
		// 通过id从collection实例集合数据中查找。
		get: function(obj) {
			if (obj == null) return void 0;
			return this._byId[obj] || this._byId[obj.id] || this._byId[obj.cid];
		},

		// Get the model at the given index.
		// 通过索引从数据集合中返回数据model。
		at: function(index) {
			return this.models[index];
		},

		// Return models with matching attributes. Useful for simple cases of
		// `filter`.
		// 从collection实例中查找（具有相同属性attrs）数据model，并返回。
		// 参数first === true时，取所有匹配的数据model中的第一个（而非集合）。否则返回所有匹配的数据集合。
		// 参数first === true时使用了underscore的find方法，如果first === false时使用了underscore的filter方法。
		where: function(attrs, first) {
			if (_.isEmpty(attrs)) return first ? void 0 : [];
			return this[first ? 'find' : 'filter'](function(model) {
				for (var key in attrs) {
					if (attrs[key] !== model.get(key)) return false;
				}
				return true;
			});
		},

		// Return the first model with matching attributes. Useful for simple cases of `find`.
		// 从collection实例中查找（具有相同属性attrs）数据model，并返回。
		// 等同于 this.where(attrs, true)。
		findWhere: function(attrs) {
			return this.where(attrs, true);
		},

		// Force the collection to re-sort itself. You don't need to call this under
		// normal circumstances, as the set will maintain sort order as each item
		// is added.
		// 如果为collection实例设置了comparator属性，则collection实例的数据集合将按照
		// comparator进行排序。当选项silent不为true时（即非静默状态下），会触发collection实例上
		// 注册的sort事件。
		sort: function(options) {
			// 木有comparator属性，则抛出错误。
			if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
			options || (options = {});

			// Run sort based on type of `comparator`.
			// 如果属性comparator为字符串时，将会调用collection实例的sortBy方法进行排序，此时this为context。
			if (_.isString(this.comparator) || this.comparator.length === 1) {
				this.models = this.sortBy(this.comparator, this);
			} else {
				// 参考 http://underscorejs.org/#bind
				this.models.sort(_.bind(this.comparator, this));
			}

			// 非静默状态下，会触发collection实例的sort事件。
			if (!options.silent) this.trigger('sort', this, options);
			return this;
		},

		// Pluck an attribute from each model in the collection.
		// 参考 http://underscorejs.org/#invoke
		// 即：对当前collection实例所拥有的model数据，应用数据所拥有的方法get，从数据里获取属性attr的值。
		pluck: function(attr) {
			return _.invoke(this.models, 'get', attr);
		},

		// Fetch the default set of models for this collection, resetting the
		// collection when they arrive. If `reset: true` is passed, the response
		// data will be passed through the `reset` method instead of `set`.
		// ???
		fetch: function(options) {
			options = options ? _.clone(options) : {};
			if (options.parse === void 0) options.parse = true;
			var success = options.success;
			var collection = this;
			options.success = function(resp) {
				var method = options.reset ? 'reset' : 'set';
				collection[method](resp, options);
				if (success) success(collection, resp, options);
				collection.trigger('sync', collection, resp, options);
			};
			wrapError(this, options);
			return this.sync('read', this, options);
		},

		// Create a new instance of a model in this collection. Add the model to the
		// collection immediately, unless `wait: true` is passed, in which case we
		// wait for the server to agree.
		// ???
		create: function(model, options) {
			options = options ? _.clone(options) : {};
			if (!(model = this._prepareModel(model, options))) return false;
			if (!options.wait) this.add(model, options);
			var collection = this;
			var success = options.success;
			options.success = function(model, resp) {
				if (options.wait) collection.add(model, options);
				if (success) success(model, resp, options);
			};
			model.save(null, options);
			return model;
		},

		// **parse** converts a response into a list of models to be added to the
		// collection. The default implementation is just to pass it through.
		// ???
		parse: function(resp, options) {
			return resp;
		},

		// Create a new collection with an identical list of models as this one.
		// 克隆一个collection实例，用当前collection实例的model数据。
		clone: function() {
			return new this.constructor(this.models);
		},

		// Private method to reset all internal state. Called when the collection
		// is first initialized or reset.
		// 内部方法，当初始化collection实例时、调用reset时，会用到此私有方法。
		_reset: function() {
			this.length = 0;
			this.models = [];
			this._byId = {};
		},

		// Prepare a hash of attributes (or other model) to be added to this
		// collection.
		_prepareModel: function(attrs, options) {
			if (attrs instanceof Model) return attrs;
			options = options ? _.clone(options) : {};
			options.collection = this;
			var model = new this.model(attrs, options);
			if (!model.validationError) return model;
			this.trigger('invalid', this, model.validationError, options);
			return false;
		},

		// Internal method to create a model's ties to a collection.
		_addReference: function(model, options) {
			this._byId[model.cid] = model;
			if (model.id != null) this._byId[model.id] = model;
			if (!model.collection) model.collection = this;
			model.on('all', this._onModelEvent, this);
		},

		// Internal method to sever a model's ties to a collection.
		_removeReference: function(model, options) {
			if (this === model.collection) delete model.collection;
			model.off('all', this._onModelEvent, this);
		},

		// Internal method called every time a model in the set fires an event.
		// Sets need to update their indexes when models change ids. All other
		// events simply proxy through. "add" and "remove" events that originate
		// in other collections are ignored.
		_onModelEvent: function(event, model, collection, options) {
			if ((event === 'add' || event === 'remove') && collection !== this) return;
			if (event === 'destroy') this.remove(model, options);
			if (model && event === 'change:' + model.idAttribute) {
				delete this._byId[model.previous(model.idAttribute)];
				if (model.id != null) this._byId[model.id] = model;
			}
			this.trigger.apply(this, arguments);
		}

	});

	// Underscore methods that we want to implement on the Collection.
	// 90% of the core usefulness of Backbone Collections is actually implemented
	// right here:
	// 将underscore大多方法集成到Collection实例上，这里涉及Backbone.Collection的90%方法接口。
	// 参考 http://underscorejs.org
	var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
		'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
		'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
		'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
		'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
		'lastIndexOf', 'isEmpty', 'chain', 'sample'
	];

	// Mix in each Underscore method as a proxy to `Collection#models`.
	// 其核心是调用了underscore的方法。将当前collection实例的model数据作为方法的第一个参数。
	_.each(methods, function(method) {
		Collection.prototype[method] = function() {
			var args = slice.call(arguments);
			args.unshift(this.models);
			return _[method].apply(_, args);
		};
	});

	// Underscore methods that take a property name as an argument.
	var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

	// Use attributes instead of properties.
	// collection实例排序方法。依然调用的是underscore方法。
	_.each(attributeMethods, function(method) {
		Collection.prototype[method] = function(value, context) {
			var iterator = _.isFunction(value) ? value : function(model) {
				return model.get(value);
			};
			return _[method](this.models, iterator, context);
		};
	});

	// Backbone.View
	// -------------

	// Backbone Views are almost more convention than they are actual code. A View
	// is simply a JavaScript object that represents a logical chunk of UI in the
	// DOM. This might be a single item, an entire list, a sidebar or panel, or
	// even the surrounding frame which wraps your whole app. Defining a chunk of
	// UI as a **View** allows you to define your DOM events declaratively, without
	// having to worry about render order ... and makes it easy for the view to
	// react to specific changes in the state of your models.

	// Creating a Backbone.View creates its initial element outside of the DOM,
	// if an existing element is not provided...
	// Backbone Views 常常比他们真正所编写的代码更常规.
  // 一个 视图 是一个简单的在Dom代理 UI逻辑块的JavaScript对象
  // 它可能是一个简单的项目, 一个完整的列表, 一个侧栏或者面板, 甚至是包含你所用应用的环境框架
  // 定义 UI 来作为一个 **View** 允许你用声明方式定义DOM事件,
  // 无需担心渲染顺序 ... 并且能很容易让视图对你模型状态变化时做出反应。

  // 创建一个DOM以外初始化的 Backbone.View 元素,
  // 如果现有环境不提供...
	var View = Backbone.View = function(options) {
		// 为每一个视图对象创建一个唯一标识, 前缀为"view"
		this.cid = _.uniqueId('view');
		options || (options = {});
		_.extend(this, _.pick(options, viewOptions));
		// 根据this.el是否被赋值，做一些处理
		this._ensureElement();
		// 初始化时调用initialize方法，并且this指向backbone view
		this.initialize.apply(this, arguments);
		this.delegateEvents();
	};

	// Cached regex to split keys for `delegate`.
	// 一个正则，匹配未被空格、换行等分隔符分隔的字符串，或者以空格、换行等分隔符分隔为2段的字符串
	var delegateEventSplitter = /^(\S+)\s*(.*)$/;

	// List of view options to be merged as properties.
	// viewOptions列表记录一些列属性名, 在构造视图对象时, 如果传递的配置项中包含这些名称, 则将属性复制到对象本身
	var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

	// Set up all inheritable **Backbone.View** properties and methods.
	// 设置所有可继承的** Backbone.View ** 属性和方法。
	_.extend(View.prototype, Events, {

		// The default `tagName` of a View's element is `"div"`.
		// 如果在创建视图对象时, 没有设置指定的el元素, 则会通过make方法创建一个元素, tagName为创建元素的默认标签
		tagName: 'div',

		// jQuery delegate for element lookup, scoped to DOM elements within the
		// current view. This should be preferred to global lookups where possible.
		// 相当于jq的find方法，用于查找元素
    // 每个视图中都具有一个$选择器方法, 该方法与jQuery或Zepto类似, 通过传递一个表达式来获取元素
    // 但该方法只会在视图对象的$el元素范围内进行查找, 因此会提高匹配效率
		$: function(selector) {
			return this.$el.find(selector);
		},

		// Initialize is an empty function by default. Override it with your own
		// initialization logic.
		// 初始化方法, 在对象被实例化后自动调用
		initialize: function() {},

		// **render** is the core function that your view should override, in order
		// to populate its element (`this.el`), with the appropriate HTML. The
		// convention is for **render** to always return `this`.
		// render方法与initialize方法类似, 默认没有实现任何逻辑
    // 一般会重载该方法, 以实现对视图中元素的渲染
		render: function() {
			return this;
		},

		// Remove this view by taking the element out of the DOM, and removing any
		// applicable Backbone.Events listeners.
		// 移除当前视图的$el元素
		remove: function() {
			this.$el.remove();
			// 删除绑定的事件，释放内存
			this.stopListening();
			return this;
		},

		// Change the view's element (`this.el` property), including event
		// re-delegation.
		// 为视图对象设置标准的$el及el属性, 该方法在对象创建时被自动调用
		setElement: function(element, delegate) {
			//如果没有视图对象，就取消el的事件绑定
			if (this.$el) this.undelegateEvents();
			// this.$el 存放Jquery或其他库的示例对象
      // 将元素创建为jQuery或Zepto对象, 并存放在$el属性中
			this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
			// this.el存放标准的DOM对象 熟悉jq的话 应该都清楚
			this.el = this.$el[0];
			if (delegate !== false) this.delegateEvents();
			return this;
		},

		// Set callbacks, where `this.events` is a hash of
		//
		// *{"event selector": "callback"}*
		//
		//     {
		//       'mousedown .title':  'edit',
		//       'click .button':     'save',
		//       'click .open':       function(e) { ... }
		//     }
		//
		// pairs. Callbacks will be bound to the view, with `this` set properly.
		// Uses event delegation for efficiency.
		// Omitting the selector binds the event to `this.el`.
		// This only works for delegate-able events: not `focus`, `blur`, and
		// not `change`, `submit`, and `reset` in Internet Explorer.
		// 为视图元素绑定事件
    // events参数配置了需要绑定事件的集合, 格式如('事件名称 元素选择表达式' : '事件方法名称/或事件函数'):
    // {
    //     'click #title': 'edit',
    //     'click .save': 'save'
    //     'click span': function() {}
    // }
    // 该方法在视图对象初始化时会被自动调用, 并将对象中的events属性作为events参数(事件集合)
		delegateEvents: function(events) {
			// 如果没有手动传递events参数, 则从视图对象获取events属性作为事件集合
			if (!(events || (events = _.result(this, 'events')))) return this;
			// 取消当前已经绑定过的events事件 避免重复绑定导致事件执行多次
			this.undelegateEvents();
			// 遍历需要绑定的事件列表
			for (var key in events) {
				 // 获取需要绑定的方法(允许是方法名称或函数)
				var method = events[key];
				// 如果是方法名, 则从对象中获取该函数对象, 因此该方法名必须是视图对象中已定义的方法
				if (!_.isFunction(method)) method = this[events[key]];
				if (!method) continue;

				// 解析事件表达式(key), 从表达式中解析出事件的名字和需要操作的元素
        // 例如 'click #title'将被解析为 'click' 和 '#title' 两部分, 均存放在match数组中
				var match = key.match(delegateEventSplitter);
				// match[1]为解析后的事件名称
        // match[2]为解析后的事件元素选择器表达式
				var eventName = match[1],
					selector = match[2];
				method = _.bind(method, this);
				eventName += '.delegateEvents' + this.cid;
				if (selector === '') {
					this.$el.on(eventName, method);
				} else {
					this.$el.on(eventName, selector, method);
				}
			}
			return this;
		},

		// Clears all callbacks previously bound to the view with `delegateEvents`.
		// You usually don't need to use this, but may wish to if you have multiple
		// Backbone views attached to the same DOM element.
		// 取消视图中当前元素绑定的events事件, 该方法一般不会被使用
    // 除非调用delegateEvents方法重新为视图中的元素绑定事件, 在重新绑定之前会清除当前的事件
    // 或通过setElement方法重新设置试图的el元素, 也会清除当前元素的事件
		undelegateEvents: function() {
			// 如果已经存在了$el属性(可能是手动调用了setElement方法切换视图的元素),则取消之前对$el绑定的events事件
			this.$el.off('.delegateEvents' + this.cid);
			return this;
		},

		// Ensure that the View has a DOM element to render into.
		// If `this.el` is a string, pass it through `$()`, take the first
		// matching element, and re-assign it to `el`. Otherwise, create
		// an element from the `id`, `className` and `tagName` properties.
		// 每一个视图对象都应该有一个el元素, 作为渲染的元素
    // 在构造视图时, 可以设置对象的el属性来指定一个元素
    // 如果设置的el是一个字符串或DOM对象, 则通过$方法将其创建为一个jQuery或Zepto对象
    // 如果没有设置el属性, 则根据传递的tagName, id和className, 调用_createElement方法创建一个元素
    // (新创建的元素不会被添加到文档树中, 而始终存储在内存, 当处理完毕需要渲染到页面时, 一般会在重写的render方法, 或自定义方法中, 访问this.el将其追加到文档)
    // (如果我们需要向页面添加一个目前还没有的元素, 并且需要为其添加一些子元素, 属性, 样式或事件时, 可以通过该方式先将元素创建到内存, 在完成所有操作之后再手动渲染到文档, 可以提高渲染效率)
		_ensureElement: function() {
			 // 如果没有设置el属性, 则创建默认元素
			if (!this.el) {
				// 从对象获取attributes属性, 作为新创建元素的默认属性列表
				var attrs = _.extend({}, _.result(this, 'attributes'));
				// 设置新元素的id
				if (this.id) attrs.id = _.result(this, 'id');
				// 设置新元素的class
				if (this.className) attrs['class'] = _.result(this, 'className');
				var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
				// 调用setElement方法将元素设置为视图所使用的标准元素
				this.setElement($el, false);
			} else {
				// 如果设置了el属性, 则直接调用setElement方法将el元素设置为视图的标准元素
				this.setElement(_.result(this, 'el'), false);
			}
		}

	});

	// Backbone.sync
	// -------------

	// Override this function to change the manner in which Backbone persists
	// models to the server. You will be passed the type of request, and the
	// model in question. By default, makes a RESTful Ajax request
	// to the model's `url()`. Some possible customizations could be:
	//
	// * Use `setTimeout` to batch rapid-fire updates into a single request.
	// * Send up the models as XML instead of JSON.
	// * Persist models via WebSockets instead of Ajax.
	//
	// Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
	// as `POST`, with a `_method` parameter containing the true HTTP method,
	// as well as all requests with the body as `application/x-www-form-urlencoded`
	// instead of `application/json` with the model in a param named `model`.
	// Useful when interfacing with server-side languages like **PHP** that make
	// it difficult to read the body of `PUT` requests.
	// Backbone.sync  同步
	// 重载这个方法来改变 Backbone 持久模型在服务器中的方式、
	// 通过请求类型和问题中的模型
	// 默认情况发送 RESTful Ajax 请求到模型中的`url()`.
	// 一些可行的自定义为:
	//
	// * 使用 `setTimeout` 在一个请求中批量的触发更新.
	// * 发送 XML 而不是 JSON.
	// * 坚持模型通过 WebSockets 而不是 Ajax.
	//
	// 开启 `Backbone.emulateHTTP` 为像 `POST` 一样发送 `PUT` 和 `DELETE` 请求
	// `_method` 参数中包含真正的 HTTP 方法,
	// 以及主体的所有请求 as `application/x-www-form-urlencoded`
	// 替换为 `application/json`参数名为 `model`的模块.
	// 当接口为服务器端语言，如**PHP**时很有用， 使得主体的'PUT'请求难以读取
	// 实际调用Backbone.ajax 请求
	Backbone.sync = function(method, model, options) {
		var type = methodMap[method];

		// Default options, unless specified.
		// 相当于jq的 extend，合并默认值
		_.defaults(options || (options = {}), {
			emulateHTTP: Backbone.emulateHTTP,
			emulateJSON: Backbone.emulateJSON
		});

		// Default JSON-request options.
		// 默认使用json的数据格式
		var params = {
			type: type,
			dataType: 'json'
		};

		// Ensure that we have a URL.
		// 如果不存在url的话 则获取model里面的url设置 ，如果还是没有 则抛出异常
		if (!options.url) {
			params.url = _.result(model, 'url') || urlError();
		}

		// Ensure that we have the appropriate request data.
		// 确保有正确的请求数据.
		if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
			params.contentType = 'application/json';
			params.data = JSON.stringify(options.attrs || model.toJSON(options));
		}

		// For older servers, emulate JSON by encoding the request into an HTML-form.
		// 对于老的服务器, 模拟JSON以HTML的形式.
		if (options.emulateJSON) {
			params.contentType = 'application/x-www-form-urlencoded';
			params.data = params.data ? {
				model: params.data
			} : {};
		}

		// For older servers, emulate HTTP by mimicking the HTTP method with `_method`
		// And an `X-HTTP-Method-Override` header.
		// 对于老的服务器, 模拟 HTTP 通过用 `_method` 方法仿造 HTTP
    // 和一个 `X-HTTP-Method-Override` 头.
		if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
			params.type = 'POST';
			if (options.emulateJSON) params.data._method = type;
			var beforeSend = options.beforeSend;
			options.beforeSend = function(xhr) {
				xhr.setRequestHeader('X-HTTP-Method-Override', type);
				if (beforeSend) return beforeSend.apply(this, arguments);
			};
		}

		// Don't process data on a non-GET request.
		// 在 non-GET 请求中不传递数据.
		if (params.type !== 'GET' && !options.emulateJSON) {
			params.processData = false;
		}

		// If we're sending a `PATCH` request, and we're in an old Internet Explorer
		// that still has ActiveX enabled by default, override jQuery to use that
		// for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
		// 如果我们在旧的IE中发送一个“PATCH”请求
		// 默认情况下仍然启用ActiveX，替换jQuery来使用
		// 代替XHR 当jQuery在IE8上支持“PATCH”时，可以删除此行。
		if (params.type === 'PATCH' && noXhrPatch) {
			params.xhr = function() {
				return new ActiveXObject("Microsoft.XMLHTTP");
			};
		}

		// Make the request, allowing the user to override any Ajax options.
		// 提出请求, 允许用户自定义Ajax选项.
		var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
		model.trigger('request', model, xhr, options);
		return xhr;
	};

	var noXhrPatch =
		typeof window !== 'undefined' && !!window.ActiveXObject &&
		!(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);

	// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
	// 映射 CRUD 到 HTTP 为了默认的 `Backbone.sync` 执行.
	var methodMap = {
		'create': 'POST',
		'update': 'PUT',
		'patch': 'PATCH',
		'delete': 'DELETE',
		'read': 'GET'
	};

	// Set the default implementation of `Backbone.ajax` to proxy through to `$`.
	// Override this if you'd like to use a different library.
	// 通过 `$` 代理来设置 `Backbone.ajax` 的默认执行.
  // 如果想要使用另一个库那么重载它.
	Backbone.ajax = function() {
		return Backbone.$.ajax.apply(Backbone.$, arguments);
	};

	// Backbone.Router
	// ---------------

	// Routers map faux-URLs to actions, and fire events when routes are
	// matched. Creating a new one sets its `routes` hash, if not set statically.
	// 路由映射 faux-URLs 到 actions, 当路由匹配后触发事件
  // 如果还没有静态的设置，创建一个新的 `router` 哈希.
	var Router = Backbone.Router = function(options) {
		options || (options = {});
		if (options.routes) this.routes = options.routes;
		this._bindRoutes();
		this.initialize.apply(this, arguments);
	};

	// Cached regular expressions for matching named param parts and splatted
	// parts of route strings.
	 // 缓存匹配名称参数和路由字符串分割的正则表达式
	var optionalParam = /\((.*?)\)/g;    						// 规则中的括号部分 也就是可有可没有的部分
	var namedParam = /(\(\?)?:\w+/g;     						// 将不带括号部分的 但是:...形式的进行替换可以匹配为非/以外任意字符
	var splatParam = /\*\w+/g;					 						// 将*...形式的替换为除换行以外的任何字符匹配.*
	var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;	// 将 - { } [ ] + ? . , \ ^ $ # 空格 等进行转义

	// Set up all inheritable **Backbone.Router** properties and methods.
	_.extend(Router.prototype, Events, {

		// Initialize is an empty function by default. Override it with your own
		// initialization logic.
		initialize: function() {},

		// Manually bind a single named route to a callback. For example:
		// 手动绑定回调函数到单个路由名称. 例如:
		//     this.route('search/:query/p:num', 'search', function(query, num) {
		//       ...
		//     });
		//
		route: function(route, name, callback) {
			if (!_.isRegExp(route)) route = this._routeToRegExp(route);
			if (_.isFunction(name)) {
				callback = name;
				name = '';
			}
			// 如果callback不存在，则调用name方法
			if (!callback) callback = this[name];
			var router = this;
			Backbone.history.route(route, function(fragment) {
				var args = router._extractParameters(route, fragment);
				router.execute(callback, args);
				router.trigger.apply(router, ['route:' + name].concat(args));
				router.trigger('route', name, args);
				// 触发history的route事件
				Backbone.history.trigger('route', router, name, args);
			});
			return this;
		},

		// Execute a route handler with the provided parameters.  This is an
		// excellent place to do pre-route setup or post-route cleanup.
		execute: function(callback, args) {
			if (callback) callback.apply(this, args);
		},

		// Simple proxy to `Backbone.history` to save a fragment into the history.
		// 将`Backbone.history`作为代理来保存片段到 history.
		navigate: function(fragment, options) {
			Backbone.history.navigate(fragment, options);
			return this;
		},

		// Bind all defined routes to `Backbone.history`. We have to reverse the
		// order of the routes here to support behavior where the most general
		// routes can be defined at the bottom of the route map.
		// 绑定所有定义了的路由到 `Backbone.history`.
    // 在此我们需要调转路由的顺序来支持普通路由在路由映射底部定义的情况
		_bindRoutes: function() {
			if (!this.routes) return;
			this.routes = _.result(this, 'routes');
			var route, routes = _.keys(this.routes);
			while ((route = routes.pop()) != null) {
				this.route(route, this.routes[route]);
			}
		},

		// Convert a route string into a regular expression, suitable for matching
		// against the current location hash.
		// 将路由字符串转换到适合匹配当前 location hash的正则表达式
    // 将route字符串转成正则表达式
		_routeToRegExp: function(route) {
			route = route.replace(escapeRegExp, '\\$&')
				.replace(optionalParam, '(?:$1)?')
				.replace(namedParam, function(match, optional) {
					return optional ? match : '([^/?]+)';
				})
				.replace(splatParam, '([^?]*?)');
			return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');// 构建正则 加上 开始^和结束$
		},

		// Given a route, and a URL fragment that it matches, return the array of
		// extracted decoded parameters. Empty or unmatched parameters will be
		// treated as `null` to normalize cross-browser behavior.
		// 给一个 路由, 当URL的片段匹配后, 返回匹配到的解码后的参数数组.
    // 空或者不匹配的参数会被作为 null 来对待保证跨浏览器兼容
		_extractParameters: function(route, fragment) {
			var params = route.exec(fragment).slice(1);
			return _.map(params, function(param, i) {
				// Don't decode the search params.
				if (i === params.length - 1) return param || null;
				return param ? decodeURIComponent(param) : null;
			});
		}

	});

	// Backbone.History
	// ----------------

	// Handles cross-browser history management, based on either
	// [pushState](http://diveintohtml5.info/history.html) and real URLs, or
	// [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
	// and URL fragments. If the browser supports neither (old IE, natch),
	// falls back to polling.
	var History = Backbone.History = function() {
		this.handlers = [];
		_.bindAll(this, 'checkUrl');

		// Ensure that `History` can be used outside of the browser.
		if (typeof window !== 'undefined') {
			this.location = window.location;
			this.history = window.history;
		}
	};

	// Cached regex for stripping a leading hash/slash and trailing space.
	var routeStripper = /^[#\/]|\s+$/g;

	// Cached regex for stripping leading and trailing slashes.
	var rootStripper = /^\/+|\/+$/g;

	// Cached regex for detecting MSIE.
	var isExplorer = /msie [\w.]+/;

	// Cached regex for removing a trailing slash.
	var trailingSlash = /\/$/;

	// Cached regex for stripping urls of hash.
	var pathStripper = /#.*$/;

	// Has the history handling already been started?
	History.started = false;

	// Set up all inheritable **Backbone.History** properties and methods.
	_.extend(History.prototype, Events, {

		// The default interval to poll for hash changes, if necessary, is
		// twenty times a second.
		// hash更改的事件间隔 针对低版本浏览器
		interval: 50,

		// Are we at the app root?
		atRoot: function() {
			return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
		},

		// Gets the true hash value. Cannot use location.hash directly due to bug
		// in Firefox where location.hash will always be decoded.
		getHash: function(window) {
			var match = (window || this).location.href.match(/#(.*)$/);
			return match ? match[1] : '';
		},

		// Get the cross-browser normalized URL fragment, either from the URL,
		// the hash, or the override.
		// 跨浏览器的得到URL片段 不管是URL hash 或其他
		getFragment: function(fragment, forcePushState) {
			if (fragment == null) {
				if (this._hasPushState || !this._wantsHashChange || forcePushState) {
					fragment = decodeURI(this.location.pathname + this.location.search);
					var root = this.root.replace(trailingSlash, '');
					if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
				} else {
					fragment = this.getHash();
				}
			}
			return fragment.replace(routeStripper, '');
		},

		// Start the hash change handling, returning `true` if the current URL matches
		// an existing route, and `false` otherwise.
		// 开始监听hash change事件（兼容性）
		start: function(options) {
			if (History.started) throw new Error("Backbone.history has already been started");
			History.started = true;

			// Figure out the initial configuration. Do we need an iframe?
			// Is pushState desired ... is it available?
			this.options = _.extend({
				root: '/'
			}, this.options, options);
			this.root = this.options.root;
			this._wantsHashChange = this.options.hashChange !== false;
			this._wantsPushState = !!this.options.pushState; // 是否采用popstate修改地址栏地址
			this._hasPushState = !!(this.options.pushState && this.history && this.history.pushState);
			var fragment = this.getFragment();
			var docMode = document.documentMode;
			var oldIE = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

			// Normalize root to always include a leading and trailing slash.
			// 规范化root中含有头和尾的斜杠.
			this.root = ('/' + this.root + '/').replace(rootStripper, '/');

			if (oldIE && this._wantsHashChange) {
				var frame = Backbone.$('<iframe src="javascript:0" tabindex="-1">');
				this.iframe = frame.hide().appendTo('body')[0].contentWindow;
				this.navigate(fragment);
			}

			// Depending on whether we're using pushState or hashes, and whether
			// 'onhashchange' is supported, determine how we check the URL state.
			if (this._hasPushState) {
				Backbone.$(window).on('popstate', this.checkUrl);
			} else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
				Backbone.$(window).on('hashchange', this.checkUrl);
			} else if (this._wantsHashChange) {
				this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
			}

			// Determine if we need to change the base url, for a pushState link
			// opened by a non-pushState browser.
			this.fragment = fragment;
			var loc = this.location;

			// Transition from hashChange to pushState or vice versa if both are
			// requested.
			if (this._wantsHashChange && this._wantsPushState) {

				// If we've started off with a route from a `pushState`-enabled
				// browser, but we're currently in a browser that doesn't support it...
				if (!this._hasPushState && !this.atRoot()) {
					this.fragment = this.getFragment(null, true);
					this.location.replace(this.root + '#' + this.fragment);
					// Return immediately as browser will do redirect to new url
					return true;

					// Or if we've started out with a hash-based route, but we're currently
					// in a browser where it could be `pushState`-based instead...
				} else if (this._hasPushState && this.atRoot() && loc.hash) {
					this.fragment = this.getHash().replace(routeStripper, '');
					this.history.replaceState({}, document.title, this.root + this.fragment);
				}

			}

			if (!this.options.silent) return this.loadUrl();
		},

		// Disable Backbone.history, perhaps temporarily. Not useful in a real app,
		// but possibly useful for unit testing Routers.
		// 关闭 Backbone.history, 可能暂时性.
    // 在真实应用中无用，但是在单元测试中有用.
		stop: function() {
			Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
			if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
			History.started = false;
		},

		// Add a route to be tested when the fragment changes. Routes added later
		// may override previous routes.
		// 当一个框架改变的时候添加一个测试路由.
    // 路由添加后可能会重写之前的路由.
		route: function(route, callback) {
			this.handlers.unshift({
				route: route,
				callback: callback
			});
		},

		// Checks the current URL to see if it has changed, and if it has,
		// calls `loadUrl`, normalizing across the hidden iframe.
		// 检测当前的URL是否有改变,
    // 如果有，调用 `loadUrl`, 规范隐藏的iframe.
		checkUrl: function(e) {
			var current = this.getFragment();
			if (current === this.fragment && this.iframe) {
				current = this.getFragment(this.getHash(this.iframe));
			}
			if (current === this.fragment) return false;
			if (this.iframe) this.navigate(current);
			this.loadUrl();
		},

		// Attempt to load the current URL fragment. If a route succeeds with a
		// match, returns `true`. If no defined routes matches the fragment,
		// returns `false`.
		// 尝试加载当前的URL片段. 如果路由匹配成功则返回`true`.
    // 定义的路由不能匹配片段时返回 `false`.
		loadUrl: function(fragment) {
			fragment = this.fragment = this.getFragment(fragment);
			return _.any(this.handlers, function(handler) {
				if (handler.route.test(fragment)) {
					handler.callback(fragment);
					return true;
				}
			});
		},

		// Save a fragment into the hash history, or replace the URL state if the
		// 'replace' option is passed. You are responsible for properly URL-encoding
		// the fragment in advance.
		//
		// The options object can contain `trigger: true` if you wish to have the
		// route callback be fired (not usually desirable), or `replace: true`, if
		// you wish to modify the current URL without adding an entry to the history.
		// 保存片段至 hash history,
	  // 或者，如果'replace' 参数传递了就替换URL的状态.
	  // 你需要确保提前进行URL编码.
	  //
	  // 对象的选项包括 `trigger: true` 如果你希望有路由的回调函数被触发（不理想）
	  // `replace: true`, 如果你希望修改当前的URL但是不添加到 history
		navigate: function(fragment, options) {
			if (!History.started) return false;
			if (!options || options === true) options = {
				trigger: !!options
			};

			var url = this.root + (fragment = this.getFragment(fragment || ''));

			// Strip the hash for matching.
			fragment = fragment.replace(pathStripper, '');

			if (this.fragment === fragment) return;
			this.fragment = fragment;

			// Don't include a trailing slash on the root.
			if (fragment === '' && url !== '/') url = url.slice(0, -1);

			// If pushState is available, we use it to set the fragment as a real URL.
			// 如果支持 pushState , 使用片段作为 a real URL.
			if (this._hasPushState) {
				this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

				// If hash changes haven't been explicitly disabled, update the hash
				// fragment to store history.
			} else if (this._wantsHashChange) {
				this._updateHash(this.location, fragment, options.replace);
				if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
					// Opening and closing the iframe tricks IE7 and earlier to push a
					// history entry on hash-tag change.  When replace is true, we don't
					// want this.
					// 在IE7 和更早的版本中用打开关闭iframe是推入history来实现hash-tag变化
          // 我们不希望它真正替换
					if (!options.replace) this.iframe.document.open().close();
					this._updateHash(this.iframe.location, fragment, options.replace);
				}

				// If you've told us that you explicitly don't want fallback hashchange-
				// based history, then `navigate` becomes a page refresh.
			} else {
				return this.location.assign(url);
			}
			if (options.trigger) return this.loadUrl(fragment);
		},

		// Update the hash location, either replacing the current entry, or adding
		// a new one to the browser history.
		// 更新location的 hash, 取代当前的 entry, 或者向浏览器history添加一个新的.
		_updateHash: function(location, fragment, replace) {
			if (replace) {
				var href = location.href.replace(/(javascript:|#).*$/, '');
				location.replace(href + '#' + fragment);
			} else {
				// Some browsers require that `hash` contains a leading #.
				location.hash = '#' + fragment;
			}
		}

	});

	// Create the default Backbone.history.
	Backbone.history = new History;

	// Helpers
	// -------

	// Helper function to correctly set up the prototype chain, for subclasses.
	// Similar to `goog.inherits`, but uses a hash of prototype properties and
	// class properties to be extended.
	// Helper 函数 为子类正确的设置原型链.
  // 与`goog.inherits`类似, 但是使用原型属性和类属性的hash形式进行拓展
	var extend = function(protoProps, staticProps) {
		var parent = this;
		var child;

		// The constructor function for the new subclass is either defined by you
		// (the "constructor" property in your `extend` definition), or defaulted
		// by us to simply call the parent's constructor.
		// 由你定义的构造函数或者简单的有我们的父类构造函数创建新子类
    // ( "constructor" 的属性是有你来扩展定义的)
		if (protoProps && _.has(protoProps, 'constructor')) {
			child = protoProps.constructor;
		} else {
			child = function() {
				return parent.apply(this, arguments);
			};
		}

		// Add static properties to the constructor function, if supplied.
		// 如果提供，给构造函数添加静态属性.
		_.extend(child, parent, staticProps);

		// Set the prototype chain to inherit from `parent`, without calling
		// `parent`'s constructor function.
		// 设置原型链用 `parent`的原型,不调用`parent`的构造函数
		var Surrogate = function() {
			this.constructor = child;
		};
		Surrogate.prototype = parent.prototype;
		child.prototype = new Surrogate;

		// Add prototype properties (instance properties) to the subclass,
		// if supplied.
		// 如果提供了，给子类添加原型属性 (替代 属性)
		if (protoProps) _.extend(child.prototype, protoProps);

		// Set a convenience property in case the parent's prototype is needed
		// later.
		// 设置一个方便的属性来处理之后父类的原型在之后可能被引用的情况
		child.__super__ = parent.prototype;

		return child;
	};

	// Set up inheritance for the model, collection, router, view and history.
	//可参考 http://www.cnblogs.com/snandy/archive/2013/05/27/3097429.html
	Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

	// Throw an error when a URL is needed, and none is supplied.
	// 当URL是必须的但是未提供的时候爆出错误.
	var urlError = function() {
		throw new Error('A "url" property or function must be specified');
	};

	// Wrap an optional error callback with a fallback error event.
	// 包装一个设置的错误回调函数来作为后备错误事件。
	var wrapError = function(model, options) {
		var error = options.error;
		options.error = function(resp) {
			if (error) error(model, resp, options);
			model.trigger('error', model, resp, options);
		};
	};

	return Backbone;

}));