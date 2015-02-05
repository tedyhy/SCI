jQuery.fn.extend({
	wrapAll: function( html ) {
		// 如果html是函数，则将其递归执行，将其返回值应用于wrapAll方法
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapAll( html.call(this, i) );
			});
		}
		// 能进入wrapAll方法的元素，应该只有一个，因此判断是否有此元素存在
		if ( this[0] ) {
			// 用html创建一个元素用来包围选择的jquery对象元素
			var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);
			// 如果选择的jquery对象有父节点，则用insertBefore方法操作：将wrap插入到当前jquery对象元素前边
			// 参考 http://www.w3school.com.cn/jsref/met_node_insertbefore.asp
			if ( this[0].parentNode ) {
				wrap.insertBefore( this[0] );
			}

			// 迭代wrap里的子元素，将选择的jquery对象元素插入到最里层的元素内
			wrap.map(function() {
				var elem = this;

				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
					elem = elem.firstChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},
	// 用html元素包围选择的jquery对象
	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents(); // contents() 取当前元素下的所有子节点，包括文本节点。children()取元素子节点，不包括文本节点。
			// 如果当前元素有子节点，则把所有子节点应用于wrapAll方法。否则，把html追加到当前元素成为其子元素。
			if ( contents.length ) {
				contents.wrapAll( html );
			} else {
				self.append( html ); // 这是wrap和wrapInner的区别
			}
		});
	},

	// 用html元素包围选择的jquery对象
	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );
		// 遍历jquery对象，每个jquery对象应用wrapAll方法
		return this.each(function(i) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	// 删除被选元素的父元素。
	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	}
});
