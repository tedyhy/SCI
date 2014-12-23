var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
	rmultiDash = /([A-Z])/g;

// internalData( elem, undefined, undefined, true );
// 参数pvt内部使用，布尔型。当 name 为对象或函数时，如果 pvt===true，则将name值扩展到 cache[ id ] 中。
// 如果 pvt!==true，则将name值扩展到 cache[ id ].data 中。
// 重点：参数 pvt 其实是控制数据缓存在 cache[ id ] 或 cache[ id ].data 中。不管elem是dom元素还是普通对象。
function internalData( elem, name, data, pvt /* Internal Use Only */ ){
	// 判断一个元素是否能接受属性扩展
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var ret, thisCache,
		// 如："jQuery110209568656722549349"
		internalKey = jQuery.expando,

		// We have to handle DOM nodes and JS objects differently because IE6-7
		// can't GC object references properly across the DOM-JS boundary
		// 判断是不是元素节点类型。
		isNode = elem.nodeType,

		// Only DOM nodes need the global jQuery cache; JS object data is
		// attached directly to the object so GC can occur automatically
		// 仅仅 DOM 对象需要用到全局的 jQuery 缓存对象 cache，而普通的对象不需要，本身即可。
		/* $.cache数据格式如下：
			$.cache = {
				7: {
					events: {
						click: [],
						mousedown: [],
						mousemove: []
					},
					handle: fn
				}
			}
		*/
		cache = isNode ? jQuery.cache : elem,

		// Only defining an ID for JS objects if its cache already exists allows
		// the code to shortcut on the same path as a DOM node with no cache
		// 如果是dom节点，则id为元素属性jQuery.expando的值，即：id = elem['jQuery110209568656722549349']；
		// 如果是普通对象，则 id = 'jQuery110209568656722549349'；
		// 判断的意思是：如果 elem[ internalKey ] 有值则 id = internalkey，即'jQuery110209568656722549349'。
		// 参考 http://blog.163.com/wangxiaoxia1221@126/blog/static/107680174201192622359827/
		id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;

	// Avoid doing any more work than we need to when trying to get data on an
	// object that has no data at all
	// (没有id || cache中木有相关缓存 || (pvt!==true && 缓存中木有属性data)) && data参数为空 && name类型为字符串。
	if ( (!id || !cache[id] || (!pvt && !cache[id].data)) && data === undefined && typeof name === "string" ) {
		return;
	}

	// data !== undefined || typeof name !== "string"
	if ( !id ) {
		// Only DOM nodes need a new unique ID for each element since their data
		// ends up in the global cache
		// 如果是dom元素，则从ids垃圾池中取一个id（或者重新生成一个唯一id）给当前元素用。
		if ( isNode ) {
			id = elem[ internalKey ] = core_deletedIds.pop() || jQuery.guid++;
		} else {
			id = internalKey; // 普通对象的id，如："jQuery110209568656722549349"
		}
	}

	// data !== undefined || typeof name !== "string"
	if ( !cache[ id ] ) {
		// Avoid exposing jQuery metadata on plain JS objects when the object
		// is serialized using JSON.stringify
		// 如果是dom元素，则数据为空对象。如果是普通对象，则数据为包含"toJSON"方法的对象
		// （为了防止此对象JSON序列化时暴露了jQuery metadata数据，如id）。
		// "toJSON"的调用场景???
		cache[ id ] = isNode ? {} : { toJSON: jQuery.noop };
	}

	// An object can be passed to jQuery.data instead of a key/value pair; this gets
	// shallow copied over onto the existing cache
	// 如果name为对象或者函数，且参数 pvt===true，则将name值扩展到 cache[ id ] 中。
	// 如果参数 pvt!==true，则将name值扩展到 cache[ id ].data 中。
	if ( typeof name === "object" || typeof name === "function" ) {
		if ( pvt ) {
			cache[ id ] = jQuery.extend( cache[ id ], name );
		} else {
			cache[ id ].data = jQuery.extend( cache[ id ].data, name );
		}
	}

	thisCache = cache[ id ];

	// jQuery data() is stored in a separate object inside the object's internal data
	// cache in order to avoid key collisions between internal data and user-defined
	// data.
	// 如果 pvt!==true，则判断thisCache里有木有data属性，如果木有，则将thisCache.data置为空对象。
	if ( !pvt ) {
		if ( !thisCache.data ) {
			thisCache.data = {};
		}

		thisCache = thisCache.data;
	}

	// data 有值，即：$('a').data('k', v);
	if ( data !== undefined ) {
		thisCache[ jQuery.camelCase( name ) ] = data;
	}

	// Check for both converted-to-camel and non-converted data property names
	// If a data property was specified
	// 即：$('a').data('k');
	if ( typeof name === "string" ) {

		// First Try to find as-is property data
		// 首先找最开始的name，如："data-url"，如果木有数据，则找驼峰式命名规则的name，如："data-url"->"dataUrl"。
		ret = thisCache[ name ];

		// Test for null|undefined property data
		if ( ret == null ) {

			// Try to find the camelCased property
			ret = thisCache[ jQuery.camelCase( name ) ];
		}
	} else {
		ret = thisCache;
	}

	return ret;
}

function internalRemoveData( elem, name, pvt ) {
	// 判断一个元素是否能接受属性扩展
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var thisCache, i,
		isNode = elem.nodeType,

		// See jQuery.data for more information
		cache = isNode ? jQuery.cache : elem,
		id = isNode ? elem[ jQuery.expando ] : jQuery.expando;

	// If there is already no cache entry for this object, there is no
	// purpose in continuing
	// 如果 cache[ id ] 不存在，则返回。
	if ( !cache[ id ] ) {
		return;
	}

	// 如果有参数name。
	if ( name ) {

		thisCache = pvt ? cache[ id ] : cache[ id ].data;

		if ( thisCache ) {

			// Support array or space separated string names for data keys
			// data keys 支持数组或空格隔开的字符串name。如：name = ["a", "b"] 或 "a b"。
			if ( !jQuery.isArray( name ) ) {

				// try the string as a key before any manipulation
				// 首先尝试将name作为一个字符串key去处理。
				if ( name in thisCache ) {
					name = [ name ];
				} else {

					// split the camel cased version by spaces unless a key with the spaces exists
					// 如果驼峰式name木有值，则尝试用空格分隔字符串key成数组。
					name = jQuery.camelCase( name );
					if ( name in thisCache ) {
						name = [ name ];
					} else {
						name = name.split(" ");
					}
				}
			} else {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				// 将数组name中每个key都改成驼峰式命名。
				name = name.concat( jQuery.map( name, jQuery.camelCase ) );
			}

			i = name.length;
			while ( i-- ) {
				delete thisCache[ name[i] ];
			}

			// If there is no data left in the cache, we want to continue
			// and let the cache object itself get destroyed
			// 如果 thisCache 不为空对象，则不删除 thisCache。
			if ( pvt ? !isEmptyDataObject(thisCache) : !jQuery.isEmptyObject(thisCache) ) {
				return;
			}
		}
	}

	// See jQuery.data for more information
	// 如果 pvt!==true，则从$.cache中删除当前dom相关整个缓存的数据 cache[ id ].data。
	if ( !pvt ) {
		delete cache[ id ].data;

		// Don't destroy the parent cache unless the internal data object
		// had been the only thing left in it
		// 如果 cache[ id ] 中有属性值，则不能清除 cache[ id ]。
		if ( !isEmptyDataObject( cache[ id ] ) ) {
			return;
		}
	}

	// Destroy the cache
	// 如果是dom节点，且 cache[ id ] 中木有属性值，则清除 cache[ id ]。
	// manipulation.js
	if ( isNode ) {
		jQuery.cleanData( [ elem ], true );

	// Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
	/* jshint eqeqeq: false */
	// 如果dom支持 delete div.test 或者 cache不是一个window对象。
	} else if ( jQuery.support.deleteExpando || cache != cache.window ) {
		/* jshint eqeqeq: true */
		delete cache[ id ];

	// When all else fails, null
	// 如果前两种情况都不支持，则将缓存置空。
	} else {
		cache[ id ] = null;
	}
}

jQuery.extend({
	// 为jQuery事件绑定、dom（或普通元素）缓存数据提供的缓存对象。
	cache: {},

	// The following elements throw uncatchable exceptions if you
	// attempt to add expando properties to them.
	// 如果试图给下列元素添加扩展属性时，将抛出异常。
	noData: {
		// java web小程序
		"applet": true,
		// 参考 http://www.w3school.com.cn/html5/html5_embed.asp
		"embed": true,
		// Ban all objects except for Flash (which handle expandos)
		// 参考 http://bufanliu.iteye.com/blog/200590
		// 此flash object能添加扩展属性。
		"object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
	},

	// 判断dom元素或者普通对象是否有数据缓存。
	hasData: function( elem ) {
		elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
		return !!elem && !isEmptyDataObject( elem );
	},

	// jQuery.data( this, key );
	// jQuery.data( elem, key, data );
	// 取缓存数据或存储缓存数据。
	data: function( elem, name, data ) {
		return internalData( elem, name, data );
	},

	// jQuery.removeData( this, key );
	// 移除缓存的数据。
	removeData: function( elem, name ) {
		return internalRemoveData( elem, name );
	},

	// For internal use only.
	// 通过 internalData 方法，利用元素/普通对象的id从 $.cache 里取或存储相关缓存数据。
	// 与 $.data 方法最大的区别是，参数 pvt===true，即：缓存的数据没有存储到 cache[ id ].data 上，而是存储在 cache[ id ] 上。
	_data: function( elem, name, data ) {
		return internalData( elem, name, data, true );
	},

	// 与 $.removeData 方法最大的区别是，参数 pvt===true，即：移除 cache[ id ] 上缓存的数据。
	_removeData: function( elem, name ) {
		return internalRemoveData( elem, name, true );
	},

	// A method for determining if a DOM node can handle the data expando
	// 一个方法用来确定一个DOM节点（或普通对象）是否能够处理数据扩展。
	acceptData: function( elem ) {
		// Do not set data on non-element because it will not be cleared (#8335).
		// 如果是dom元素，则必须确定此元素节点类型为 1、9才行。
		if ( elem.nodeType && elem.nodeType !== 1 && elem.nodeType !== 9 ) {
			return false;
		}

		// 通过 jQuery.noData 方法来判断元素（或普通对象）是否能够处理数据扩展。
		// 这里主要是判断 jQuery.noData 对象中的3个类型
		var noData = elem.nodeName && jQuery.noData[ elem.nodeName.toLowerCase() ];

		// nodes accept data unless otherwise specified; rejection can be conditional
		// noData 的值为 undefined 或 true 或 "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"。???
		return !noData || noData !== true && elem.getAttribute("classid") === noData;
	}
});

jQuery.fn.extend({
	// 例如：$('a').data('k', v);
	data: function( key, value ) {
		var attrs, name,
			data = null,
			i = 0,
			elem = this[0];

		// Special expections of .data basically thwart jQuery.access,
		// so implement the relevant behavior ourselves

		// Gets all values
		// ???
		if ( key === undefined ) {
			if ( this.length ) {
				data = jQuery.data( elem );

				if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
					attrs = elem.attributes;
					for ( ; i < attrs.length; i++ ) {
						name = attrs[i].name;

						if ( name.indexOf("data-") === 0 ) {
							name = jQuery.camelCase( name.slice(5) );

							dataAttr( elem, name, data[ name ] );
						}
					}
					jQuery._data( elem, "parsedAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		// 类似这样：$('a').data({"a": 1, "b": 2});
		if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		return arguments.length > 1 ?

			// Sets one value
			// 类似这样：$('a').data("a", 1);
			this.each(function() {
				jQuery.data( this, key, value );
			}) :

			// Gets one value
			// Try to fetch any internally stored data first
			// 类似这样：$('a').data("a");
			elem ? dataAttr( elem, key, jQuery.data( elem, key ) ) : null;
	},
	// 例如：$('a').removeData('k');
	removeData: function( key ) {
		return this.each(function() {
			jQuery.removeData( this, key );
		});
	}
});

// dataAttr( elem, name, data[ name ] );
function dataAttr( elem, key, data ) {
	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	// 如果缓存中木有此元素相关缓存数据，则尝试从此元素节点上的 html5 data-* 属性查找数据。
	if ( data === undefined && elem.nodeType === 1 ) {

		// 即："ABC" => "data-a-b-c"
		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

		data = elem.getAttribute( name );

		// 如果dom节点上的属性值为字符串，则返回属性值。
		if ( typeof data === "string" ) {
			/*
				类型转换，如：
				"true"=>true,
				"false"=>false,
				"null"=>null,
				"567"=>567,
				"567.0"=>"0567.0",
				"{"a":1,"b":2}"=>{"a":1,"b":2}
			*/
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
					// 将字符串转换为数字。
					+data + "" === data ? +data :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
						data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			// 将修改过的数据保存到缓存中。
			jQuery.data( elem, key, data );

		} else {
			data = undefined;
		}
	}

	return data;
}

// checks a cache object for emptiness
// 检查缓存对象是否为空，如：{data: {}, toJSON: function(){}} 或 {toJSON: function(){}}
function isEmptyDataObject( obj ) {
	var name;
	for ( name in obj ) {

		// if the public data object is empty, the private is still empty
		if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
			continue;
		}
		if ( name !== "toJSON" ) {
			return false;
		}
	}

	return true;
}
