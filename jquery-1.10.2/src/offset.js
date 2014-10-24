// jquery对象offset方法，获取/设置匹配元素相对当前文档的偏移
jQuery.fn.offset = function( options ) {
	// 如果有参数，则设置元素的offset属性
	if ( arguments.length ) {
		return options === undefined ?
			this :
			this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
	}

	// 没有参数，则返回元素的offset属性值
	var docElem, win,
		box = { top: 0, left: 0 },
		elem = this[ 0 ],
		doc = elem && elem.ownerDocument; // 元素所属document。document.ownerDocument为null

	if ( !doc ) {
		return;
	}

	docElem = doc.documentElement; // 取html元素

	// Make sure it's not a disconnected DOM node
	// 确保此DOM元素在其html元素内
	if ( !jQuery.contains( docElem, elem ) ) {
		return box;
	}

	// If we don't have gBCR, just use 0,0 rather than error
	// BlackBerry 5, iOS 3 (original iPhone)
	// 如果没有getBoundingClientRect方法时，用返回 0,0 代替错误更好。
	// gBCR方法取的是匹配元素相对于视口的偏移。
	if ( typeof elem.getBoundingClientRect !== core_strundefined ) {
		box = elem.getBoundingClientRect();
	}
	win = getWindow( doc );
	return {
		top: box.top  + ( win.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
		left: box.left + ( win.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
	};
	// window.pageYoffset 标准浏览器取滚动条滚动高度（即垂直坐标）。
	// document.documentElement.scrollTop ie浏览器取滚动条滚动高度。
	// document.documentElement.clientHeight 浏览器视口可见区域高度。
	// document.documentElement.clientTop html的边框高度。
};

jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var position = jQuery.css( elem, "position" );

		// set position first, in-case top/left are set even on static elem
		// 如果position是"static"，则设置成"relative"
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		var curElem = jQuery( elem ),
			curOffset = curElem.offset(), // 取相对文档的偏移
			curCSSTop = jQuery.css( elem, "top" ),
			curCSSLeft = jQuery.css( elem, "left" ),
			calculatePosition = ( position === "absolute" || position === "fixed" ) && jQuery.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
			props = {}, curPosition = {}, curTop, curLeft;

		// need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		// 如果top/left值为"auto"，且position值为"absolute/fixed"，则说明其top/left值尚未指定，需要重新获取其相对父元素的偏移。
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;
		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};


jQuery.fn.extend({
	// jquery对象position方法，获取匹配元素相对父元素的偏移。
	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			parentOffset = { top: 0, left: 0 },
			elem = this[ 0 ];

		// fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
		// 如果是"fixed"，则取元素相对视口的偏移
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// we assume that getBoundingClientRect is available when computed position is fixed
			offset = elem.getBoundingClientRect();
		} else {
			// Get *real* offsetParent
			// 调用方法offsetParent()获取offsetParent元素，即元素的父元素
			offsetParent = this.offsetParent();

			// Get correct offsets
			// 取当前元素的offset值
			offset = this.offset();

			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				// 取父元素的offset值
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			// 算上父元素的border宽
			parentOffset.top  += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		// 去掉当前元素的margin值，取得当前元素相对其父元素的真实偏移
		return {
			top:  offset.top  - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true)
		};
	},
	// 元素的相对父元素
	offsetParent: function() {
		return this.map(function() {
			// 用DOM元素原生属性offsetParent获取其父元素，如果没有则取document.documentElement。
			var offsetParent = this.offsetParent || docElem;

			// ???
			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position") === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}
			return offsetParent || docElem;
		});
	}
});


// Create scrollLeft and scrollTop methods
// 创建scrollLeft、scrollTop方法
jQuery.each( {scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function( method, prop ) {
	var top = /Y/.test( prop );

	jQuery.fn[ method ] = function( val ) {
		// ???
		return jQuery.access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? (prop in win) ? win[ prop ] : win.document.documentElement[ method ] : elem[ method ];
			}

			if ( win ) {
				// window原生方法滚动到指定位置px
				win.scrollTo(
					!top ? val : jQuery( win ).scrollLeft(),
					top ? val : jQuery( win ).scrollTop()
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

// 获取当前元素所属的（所在的）window对象
function getWindow( elem ) {
	return jQuery.isWindow( elem ) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow : //ie8- document.parentWindow，ie9+/标准 document.defaultView
			false;
}
