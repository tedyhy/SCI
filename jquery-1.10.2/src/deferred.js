/*
 * http://wiki.commonjs.org/wiki/Promises/A
 * https://github.com/kriskowal/q
 * http://www.cnblogs.com/snandy/archive/2012/12/19/2812935.html
 * http://www.cnblogs.com/chaojidan/p/4168382.html
 * http://api.jquery.com/category/deferred-object/
 * http://api.jquery.com/promise/
 *
 */

jQuery.extend({

	// 调用 $.Deferred 生成一个Deferred对象
	Deferred: function( func ) {
		// 设置一个元数组变量，用于存储状态及回调关联
		var tuples = [
				// action, add listener, listener list, final state
				// 分别表示成功，失败，处理三种状态
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending", // 初始化默认状态为"pending"进行中
			promise = {
				// 返回Deferred对象状态，如："pending | resolved | rejected"
				state: function() {
					return state;
				},
				// 添加回调，不论状态为"resolved | rejected"，这个回调都会被执行
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				//???
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var action = tuple[ 0 ],
								fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ](function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
									newDefer[ action + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				// 如果提供了deferred对象，则将promise对象扩展到deferred对象上，否则直接返回promise对象。
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		// 兼容老版本，提供方法pipe，等同于then方法
		promise.pipe = promise.then;

		// Add list-specific methods
		// 增加方法到 promise 对象
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ], // Callbacks对象
				stateString = tuple[ 3 ]; // 状态描述，如："resolved | rejected"

			// promise[ done | fail | progress ] = list.add
			// 增加方法 [ done | fail | progress ] 到promise对象。
			// 这些方法其实就是回调列表的add方法，为回调列表添加新的回调。
			promise[ tuple[1] ] = list.add;

			// Handle state
			// 如："resolved | rejected"
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					// 改变deferred对象状态
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				// ???
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ]
			// 扩展到deferred对象上的方法有：deferred[ resolve | reject | notify ]
			deferred[ tuple[0] ] = function() {
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			// deferred[ resolveWith | rejectWidth | notifyWidth ]
			// 方法需要手动指定( context, args ) 
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		// 将promise对象方法扩展到deferred对象上。
		promise.promise( deferred );

		// Call given func if any
		/*
			例子：
			var wait = function(dtd) {
				setTimeout(function() {
					alert("执行完毕！");
					dtd.resolve(); // 改变deferred对象的执行状态
				}, 5e3);
				return dtd;
			};
			$.Deferred(wait)
				.done(function() {
					alert("哈哈，成功了！");
				})
				.fail(function() {
					alert("出错啦！");
				});

			如果$.Deferred方法有参数func且为函数，则执行它，
			并将deferred对象作为参数传递给函数func，将this指向deferred对象。
		*/
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		// 返回deferred对象
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = core_slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
					if( values === progressValues ) {
						deferred.notifyWith( contexts, values );
					} else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});
