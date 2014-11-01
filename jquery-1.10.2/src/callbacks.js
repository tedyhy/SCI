/*
 * jQuery.Callbacks是jquery在1.7版本之后加入的，是从1.6版中的_Deferred对象中抽离的，
 * 主要用来进行对函数队列list的 add、remove、fire、lock、disable 等操作，
 * 并提供 once、memory、unique、stopOnFalse 四个option进行一些特殊的控制，
 * jquery的官方文档：http://api.jquery.com/jQuery.Callbacks/
 * 博客讲解：http://www.cnblogs.com/lmule/p/3463515.html
 */
// String to Object options format cache
// Callbacks选项缓存，如：jQuery.Callbacks("once memory")
// { "once memory": {"once": true, "memory": true} }
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
// 将字符串选项（如："once memory"）转换成对象，并存储到缓存中。
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	});
	return object; // "once memory" =》{"once": true, "memory": true}
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * 两个例子方法：
 *	function fn1( value ) {
 *	  console.log( value );
 *	}
 *	 
 *	function fn2( value ) {
 *	  console.log( "fn2 says: " + value );
 *	  return false;
 *	}
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *					确保回调列表中函数仅仅被触发一次。
 *					（即：仅仅list中的第一个回调被触发，list中的后续的回调都不会再被触发了）。
 *					看例子：
 *					var callbacks = $.Callbacks( "once" );
 *					callbacks.add( fn1 );
 *					callbacks.fire( "foo" );
 *					callbacks.add( fn2 );
 *					callbacks.fire( "bar" );
 *					callbacks.remove( fn2 );
 *					callbacks.fire( "foobar" );
 *					output: foo
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *					记忆参数。看下面的例子：
 *					var callbacks = $.Callbacks( "memory" );
 *					callbacks.add( fn1 );
 *					callbacks.fire( "foo" );
 *					callbacks.add( fn2 );
 *					callbacks.fire( "bar" );
 *					callbacks.remove( fn2 );
 *					callbacks.fire( "foobar" );
 *					output:
 *						foo
 *						fn2 says:foo
 *						bar
 *						fn2 says:bar
 *						foobar
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *					确保每个回调唯一，不允许有重复的回调存在。
 *	stopOnFalse:	interrupt callings when a callback returns false
 *					当一个回调返回false，则中断剩余所有回调的触发。
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		// 标记list是否正在被触发
		firing,
		// Last fire value (for non-forgettable lists)
		// 记录上次触发回调时所用的参数值
		memory,
		// Flag to know if list was already fired
		// 标记list是否已经被触发过。
		fired,
		// End of the loop when firing
		// 记录正在被触发的回调列表长度。
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		// 当前正在被触发的回调的索引（移除回调的时候会修改这个参数）。
		firingIndex,
		// First callback to fire (used internally by add and fireWith)
		// 第一个被触发的回调索引。
		firingStart,
		// Actual callback list
		// 回调列表（用来存储回调）。
		list = [],
		// Stack of fire calls for repeatable lists
		// 一个堆栈，用于临时存储回调函数（那些要在list触发完成之后触发的函数）。
		// 如果options.once===true时，stack为undefined。
		// 如果options.once===false时，stack初始化为空数组。
		stack = !options.once && [],
		// Fire callbacks
		// 触发回调list，参数data=[context, args]
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() ); // 自调用
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		// 管理回调列表list的对象
		self = {
			// Add a callback or a collection of callbacks to the list
			// 增加一个或多个回调函数到list数组里。
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								// 类数组，如：{0: fn, 1: [fn, fn], 2: fn, length: 3}
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			// 从list中移除一个回调
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							// 如果list中的回调正在被触发，则修改相关变量
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			// 如果有参数fn，则判断此回调是否在list中。如果无参数，则判断是否有list存在（或者list中是否有回调存在）。
			has: function( fn ) {
				return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
			},
			// Remove all callbacks from the list
			// 清空list中所有回调
			empty: function() {
				list = [];
				firingLength = 0;
				return this;
			},
			// Have the list do nothing anymore
			// 禁用list，list中不再有回调了
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			// 判断list是否被禁用
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			// 锁住list，保持list当前状态
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			// 判断是否被锁住了
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( list && ( !fired || stack ) ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			// 触发list里的回调（用给定的参数）
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			// list里的回调是否被触发。
			fired: function() {
				return !!fired;
			}
		};

	return self;
};
