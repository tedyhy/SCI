// 参考 https://mathiasbynens.be/demo/jquery-support
// 参考 http://blog.csdn.net/xxb2008/article/details/9145059
// 参考 http://xxing22657-yahoo-com-cn.iteye.com/blog/1044984
// 参考 http://jsdashi.com/development/316.html
jQuery.support = (function( support ) {

	var all, a, input, select, fragment, opt, eventName, isSupported, i,
		div = document.createElement("div");

	// Setup
	div.setAttribute( "className", "t" );
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";

	// Finish early in limited (non-browser) environments
	// 非浏览器环境下直接返回空对象。
	all = div.getElementsByTagName("*") || [];
	a = div.getElementsByTagName("a")[ 0 ];
	if ( !a || !a.style || !all.length ) {
		return support;
	}

	// First batch of tests
	// 获取dom节点 select、option、input
	select = document.createElement("select");
	opt = select.appendChild( document.createElement("option") );
	input = div.getElementsByTagName("input")[ 0 ];
	// cssText：设置样式
    // 说明：在IE中最后一个分号会被删掉,可以添加一个分号来解决这个问题。
    // 例如: Element.style.cssText += ';width:100px;height:100px;top:100px;left:100px;'。
	a.style.cssText = "top:1px;float:left;opacity:.5";

	// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
    // 参考 http://www.bkjia.com/Javascript/329354.html
    // 首先，标准浏览器直接使用原始属性名；其次，IE6/7非以上列举的属性仍然用原始属性名；
    // 最后这些特殊属性（与JS关键字同名如for，class）使用fixAttr。
	support.getSetAttribute = div.className !== "t";

	// IE strips leading whitespace when .innerHTML is used
	// 检测节点类型是否为文本节点。如果为true，则说明是在非IE环境下，第一个儿子节点为空白字符，nodeName为"#text"。
	// 如果为false，则说明是IE下，第一个儿子节点为link元素，nodeName为"link"，nodeType为1。
	// 使用innerHTML，IE会自动剔除HTML代码头部的空白符。
	support.leadingWhitespace = div.firstChild.nodeType === 3;

	// Make sure that tbody elements aren't automatically inserted
	// IE will insert them into empty tables
	// 检查是否会自动为table插入tbody，会的话为false，不会则为true。
	// IE下，将自动向空table里插入节点tbody。
	support.tbody = !div.getElementsByTagName("tbody").length;

	// Make sure that link elements get serialized correctly by innerHTML
	// This requires a wrapper element in IE
	// 验证innerHTML插入链接元素是否可被序列化，成功则返回true，失败返回false。
    // 所谓序列化是指：可被读取的一种存储标准，在IE6~8中返回false。
	support.htmlSerialize = !!div.getElementsByTagName("link").length;

	// Get the style information from getAttribute
	// (IE uses .cssText instead)
	// IE 用 .cssText 代替用方法 getAttribute 取dom元素属性style。
	support.style = /top/.test( a.getAttribute("style") );

	// Make sure that URLs aren't manipulated
	// (IE normalizes it by default)
    // 验证getAttribute("href")返回值是否原封不动，成功返回true，失败返回false。
    // 在IE6~7中会返回false，因为他的URL已被序列化，即："/a" => "http://www.a.com/a"。
	support.hrefNormalized = a.getAttribute("href") === "/a";

	// Make sure that element opacity exists
	// (IE uses filter instead)
	// Use a regex to work around a WebKit issue. See #5145
	// 确保元素属性 opacity 存在，即支持样式 opacity。ie6-8下用filter的alpha滤镜代替，其他浏览器用 opacity。
	support.opacity = /^0.5/.test( a.style.opacity );

	// Verify style float existence
	// (IE uses styleFloat instead of cssFloat)
	// 验证样式float是否存在。IE6-8 用 "styleFloat" 代替 "cssFloat"。
	support.cssFloat = !!a.style.cssFloat;

	// Check the default checkbox/radio value ("" on WebKit; "on" elsewhere)
	// 检查 checkbox/radio 的默认值（WebKit内核浏览器默认为空字符串""，其他地方都为“on”字符串）。
	support.checkOn = !!input.value;

	// Make sure that a selected-by-default option has a working selected property.
	// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
	// 验证创建的select元素的第一个option元素是否会默认选中，成功返回true，失败返回false。
    // FF，Chrome返回true，IE6~10返回false。
    // 注意：option元素的父元素不一定是select，也有可能是optgroup。
	support.optSelected = opt.selected;

	// Tests for enctype support on a form (#6743)
	// 验证创建form的enctype属性是否存在，存在返回true，不存在返回fasle（IE6~9，均存在）。
    // enctype:设置表单的MIME编码,默认编码格式是：
    // application/x-www-form-urlencoded，不能用于文件上传；multipart/form-data，才能完整的传递文件数据。
	support.enctype = !!document.createElement("form").enctype;

	// Makes sure cloning an html5 element does not cause problems
	// Where outerHTML is undefined, this still works
	// 验证是否支持html5节点复制，成功返回ture，失败返回false。
    // 失败：复制的节点cloneNode(true).innerHTML返回一个空字符串。
	support.html5Clone = document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>";

	// Will be defined later
	// 稍后将重新被定义，这里是默认值。
	support.inlineBlockNeedsLayout = false;
	support.shrinkWrapBlocks = false;
	support.pixelPosition = false;
	support.deleteExpando = true;
	support.noCloneEvent = true;
	support.reliableMarginRight = true;
	support.boxSizingReliable = true;

	// Make sure checked status is properly cloned
	// 检测单选框选中状态能否正确克隆。
    // 在IE6~9中会返回false,无法正确克隆。
    // (1) 设置checkbox的checked为true。
	input.checked = true;
	// (2) cloneNode克隆（复制）一份checkbox，获取他的checked值。
	support.noCloneChecked = input.cloneNode( true ).checked;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	// 检测select元素设置为disabled后，其所有option子元素是否也会被设置为disabled。
	// (1)禁用下拉列表
	select.disabled = true;
	// (2)获取下拉列表子元素的disabled是否为true。
	// 测试：IE FF Chrome Safair Opera 的opt.disabled都为false，说明option不会被设置为disabled。
	// 其他：部分webkit会被设置为disabled,需要老版本的chrome支持。
	support.optDisabled = !opt.disabled;

	// Support: IE<9
	// 检测是否能删除附加在DOM Element上的属性或数据。
    // 在IE6~7中返回false,若事先声明这个属性，那么在IE8返回true，否者返回false。
	try {
		delete div.test;
	} catch( e ) {
		support.deleteExpando = false;
	}

	// Check if we can trust getAttribute("value")
	// 检测用setAttribute方法设置input的value属性，通过getAttribute方法获取value属性值是否一致。
    // 在IE6~9和opera中返回false，其他返回true。
	input = document.createElement("input");
	input.setAttribute( "value", "" );
	support.input = input.getAttribute( "value" ) === "";

	// Check if an input maintains its value after becoming a radio
	// 检测input元素被设置为radio类型后，是否仍然保持原先的值保持成功返回true，失败返回false。
	input.value = "t";
	input.setAttribute( "type", "radio" );
	support.radioValue = input.value === "t";

	// #11217 - WebKit loses check when the name is after the checked attribute
	// 先设置input“选中”，然后再设置“名称”，即name在checked后被设置时，在老版本的chrome和safair下有兼容问题。
	input.setAttribute( "checked", "t" );
	input.setAttribute( "name", "t" );

	// 创建一个文档片段。
	fragment = document.createDocumentFragment();
	fragment.appendChild( input );

	// Check if a disconnected checkbox will retain its checked
	// value of true after appended to the DOM (IE6/7)
	// 检测(使用setAttribute)被添加到DOM中的checkbox是否仍然保留原先的选中状态成功返回true，失败返回false。
    // 在IE6~7中，返回false。
    // 其他：（1） safair下 若先未设置"名称"，返回true。 
    // 其他：（2） safair下 若设置"名称"，则返回false。
	support.appendChecked = input.checked;

	// WebKit doesn't clone checked state correctly in fragments
	// 检测fragment中的checkbox的选中状态能否被复制，成功返回true,失败返回false
    // 在IE6~7中，失败返回false
    // 其他：（1） safair下 若先设置"名称"后"选中"返回true
    // 其他：（2） safair下 若先设置"选中"后"名称"返回false
	support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE<9
	// Opera does not clone events (and typeof div.attachEvent === undefined).
	// IE9-10 clones events bound via attachEvent, but they don't trigger with .click()
	// Opera不能克隆事件，并且 typeof div.attachEvent === undefined。
    // IE9-10 克隆元素时会克隆元素通过 attachEvent 绑定的事件，但是他们不能通过方法 .click() 触发。
    // (1)IE的注册事件
	if ( div.attachEvent ) {
		div.attachEvent( "onclick", function() {
			support.noCloneEvent = false;
		});
		// (2)克隆DOM Element并执行onclick事件
		div.cloneNode( true ).click();
	}

	// Support: IE<9 (lack submit/change bubble), Firefox 17+ (lack focusin event)
	// Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
	// 参考 http://blog.csdn.net/xxb2008/article/details/9145059
	// IE<9 不支持 submitBubbles 和 changeBubbles。
	// ie均支持focusinBubbles。FF都不支持focusinBubbles。
	for ( i in { submit: true, change: true, focusin: true }) {
		div.setAttribute( eventName = "on" + i, "t" );

		support[ i + "Bubbles" ] = eventName in window || div.attributes[ eventName ].expando === false;
	}

	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	// Support: IE<9
	// Iteration over object's inherited properties before its own.
	for ( i in jQuery( support ) ) {
		break;
	}
	support.ownLast = i !== "0";

	// Run tests that need a body at doc ready
	jQuery(function() {
		var container, marginDiv, tds,
			divReset = "padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",
			body = document.getElementsByTagName("body")[0];

		if ( !body ) {
			// Return for frameset docs that don't have a body
			return;
		}

		container = document.createElement("div");
		container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px";

		body.appendChild( container ).appendChild( div );

		// Support: IE8
		// Check if table cells still have offsetWidth/Height when they are set
		// to display:none and there are still other visible table cells in a
		// table row; if so, offsetWidth/Height are not reliable for use when
		// determining if an element has been hidden directly using
		// display:none (it is still safe to use offsets if a parent element is
		// hidden; don safety goggles and see bug #4512 for more information).
		div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
		tds = div.getElementsByTagName("td");
		tds[ 0 ].style.cssText = "padding:0;margin:0;border:0;display:none";
		isSupported = ( tds[ 0 ].offsetHeight === 0 );

		tds[ 0 ].style.display = "";
		tds[ 1 ].style.display = "none";

		// Support: IE8
		// Check if empty table cells still have offsetWidth/Height
		support.reliableHiddenOffsets = isSupported && ( tds[ 0 ].offsetHeight === 0 );

		// Check box-sizing and margin behavior.
		div.innerHTML = "";
		div.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;";

		// Workaround failing boxSizing test due to offsetWidth returning wrong value
		// with some non-1 values of body zoom, ticket #13543
		jQuery.swap( body, body.style.zoom != null ? { zoom: 1 } : {}, function() {
			support.boxSizing = div.offsetWidth === 4;
		});

		// Use window.getComputedStyle because jsdom on node.js will break without it.
		if ( window.getComputedStyle ) {
			// safari下返回 "1%"，因此等于false。而其他浏览器会转换成像素值。
			support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
			// IE下，如果是怪异模式，width不等于 "4px"，需要减去padding、border。
			support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

			// Check if div with explicit width and no margin-right incorrectly
			// gets computed margin-right based on width of container. (#3333)
			// Fails in WebKit before Feb 2011 nightlies
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			marginDiv = div.appendChild( document.createElement("div") );
			marginDiv.style.cssText = div.style.cssText = divReset;
			marginDiv.style.marginRight = marginDiv.style.width = "0";
			div.style.width = "1px";

			support.reliableMarginRight =
				!parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
		}

		if ( typeof div.style.zoom !== core_strundefined ) {
			// Support: IE<8
			// Check if natively block-level elements act like inline-block
			// elements when setting their display to 'inline' and giving
			// them layout
			div.innerHTML = "";
			div.style.cssText = divReset + "width:1px;padding:1px;display:inline;zoom:1";
			support.inlineBlockNeedsLayout = ( div.offsetWidth === 3 );

			// Support: IE6
			// Check if elements with layout shrink-wrap their children
			div.style.display = "block";
			div.innerHTML = "<div></div>";
			div.firstChild.style.width = "5px";
			support.shrinkWrapBlocks = ( div.offsetWidth !== 3 );

			if ( support.inlineBlockNeedsLayout ) {
				// Prevent IE 6 from affecting layout for positioned elements #11048
				// Prevent IE from shrinking the body in IE 7 mode #12869
				// Support: IE<8
				body.style.zoom = 1;
			}
		}

		body.removeChild( container );

		// Null elements to avoid leaks in IE
		// 清空dom元素变量，避免IE下内存泄露。
		container = div = tds = marginDiv = null;
	});

	// Null elements to avoid leaks in IE
	// 清空dom元素变量，避免IE下内存泄露。
	// http://www.cnblogs.com/meteoric_cry/archive/2010/09/14/1825951.html
	all = select = fragment = opt = a = input = null;

	return support;
})({});

