var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
	rmultiDash = /([A-Z])/g;

// internalData( elem, undefined, undefined, true );
// 参数pvt内部使用，布尔型。当 name 为对象或函数时，如果 pvt===true，则将name值扩展到 cache[ id ] 中。
// 如果 pvt!==true，则将name值扩展到 cache[ id ].data 中。
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
		id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;

	// Avoid doing any more work than we need to when trying to get data on an
	// object that has no data at all
	// (没有id || cache中木有相关缓存 || (pvt!==true && 缓存中木有属性data)) && data参数为空 && name类型为字符串。
	if ( (!id || !cache[id] || (!pvt && !cache[id].data)) && data === undefined && typeof name === "string" ) {
		return;
	}

	if ( !id ) {
		// Only DOM nodes need a new unique ID for each element since their data
		// ends up in the global cache
		// 如果是dom元素，则从垃圾ids里随便取一个id（或者重新生成一个唯一id）给当前元素用。
		if ( isNode ) {
			id = elem[ internalKey ] = core_deletedIds.pop() || jQuery.guid++;
		} else {
			id = internalKey; // 普通对象的id，如："jQuery110209568656722549349"
		}
	}

	// 没有缓存数据
	if ( !cache[ id ] ) {
		// Avoid exposing jQuery metadata on plain JS objects when the object
		// is serialized using JSON.stringify
		// 如果是dom元素，则数据为空对象。如果是普通对象，则数据为包含"toJSON"方法的对象
		// （为了防止此对象JSON序列化时暴露了jQuery metadata数据，如id）。
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
	if ( !cache[ id ] ) {
		return;
	}

	if ( name ) {

		thisCache = pvt ? cache[ id ] : cache[ id ].data;

		if ( thisCache ) {

			// Support array or space separated string names for data keys
			if ( !jQuery.isArray( name ) ) {

				// try the string as a key before any manipulation
				if ( name in thisCache ) {
					name = [ name ];
				} else {

					// split the camel cased version by spaces unless a key with the spaces exists
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
				name = name.concat( jQuery.map( name, jQuery.camelCase ) );
			}

			i = name.length;
			while ( i-- ) {
				delete thisCache[ name[i] ];
			}

			// If there is no data left in the cache, we want to continue
			// and let the cache object itself get destroyed
			if ( pvt ? !isEmptyDataObject(thisCache) : !jQuery.isEmptyObject(thisCache) ) {
				return;
			}
		}
	}

	// See jQuery.data for more information
	if ( !pvt ) {
		delete cache[ id ].data;

		// Don't destroy the parent cache unless the internal data object
		// had been the only thing left in it
		if ( !isEmptyDataObject( cache[ id ] ) ) {
			return;
		}
	}

	// Destroy the cache
	if ( isNode ) {
		jQuery.cleanData( [ elem ], true );

	// Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
	/* jshint eqeqeq: false */
	} else if ( jQuery.support.deleteExpando || cache != cache.window ) {
		/* jshint eqeqeq: true */
		delete cache[ id ];

	// When all else fails, null
	} else {
		cache[ id ] = null;
	}
}

jQuery.extend({
	// 为jQuery事件绑定提供的信息缓存。
	cache: {},

	// The following elements throw uncatchable exceptions if you
	// attempt to add expando properties to them.
	// 如果试图给下列元素添加扩展属性时，将抛出异常。
	noData: {
		"applet": true,
		"embed": true,
		// Ban all objects except for Flash (which handle expandos)
		"object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
	},

	hasData: function( elem ) {
		elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
		return !!elem && !isEmptyDataObject( elem );
	},

	// jQuery.data( this, key );
	// jQuery.data( elem, key, data );
	data: function( elem, name, data ) {
		return internalData( elem, name, data );
	},

	// jQuery.removeData( this, key );
	removeData: function( elem, name ) {
		return internalRemoveData( elem, name );
	},

	// For internal use only.
	// 内部使用的方法。
	// 通过 internalData 方法，利用元素/普通对象的id从 $.cache 里取相关缓存数据。
	// 如：jQuery._data( elem );
	_data: function( elem, name, data ) {
		return internalData( elem, name, data, true );
	},

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
		if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		return arguments.length > 1 ?

			// Sets one value
			this.each(function() {
				jQuery.data( this, key, value );
			}) :

			// Gets one value
			// Try to fetch any internally stored data first
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
	// 如果从元素节点上没有找到任何数据，则尝试从元素的 html5 data-* 属性查找数据。
	if ( data === undefined && elem.nodeType === 1 ) {

		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			/*
				类型转换：
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
					+data + "" === data ? +data :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
						data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			jQuery.data( elem, key, data );

		} else {
			data = undefined;
		}
	}

	return data;
}

// checks a cache object for emptiness
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
