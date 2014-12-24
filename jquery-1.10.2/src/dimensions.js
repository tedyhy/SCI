// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
// 创建 innerHeight, innerWidth, height, width, outerHeight 和 outerWidth 方法。
// 参考 http://api.jquery.com/category/dimensions/
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {

	// jQuery.each( { padding: "innerHeight", content: "height", "": "outerHeight" }, function(){//...} );
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// margin is only for outerHeight, outerWidth
		// 仅方法 outerHeight, outerWidth 把margin值计算在内。
		jQuery.fn[ funcName ] = function( margin, value ) {
			/*
				height(width):高度（宽度）
				innerHeight(innerWidth):高度（宽度）＋内边距(padding)
				outerHeight(outerWidth):高度（宽度）＋内边距(padding)＋边框(border)
				outerHeight(outerWidth) 参数为true时：高度（宽度）＋内边距(padding)＋边框(border)＋外边距(margin)
			*/
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				// extra为： "content"、"padding"、"border"、"margin"
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return jQuery.access( this, function( elem, type, value ) {
				var doc;

				// 如果 elem 是 window 对象，则返回 window.document.documentElement.clientHeight 值。
				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				// 如果 elem 是 document 元素，则取：document.body.scrollHeight、document.body.offsetHeight、
				// document.documentElement.scrollHeight、document.documentElement.offsetHeight、
				// document.documentElement.clientHeight 中值最大的一个。
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
					// unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.
					// 参考 http://blog.csdn.net/wangjj_016/article/details/5304788
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});
