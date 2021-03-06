// 一些事件相关正则匹配
var rformElems = /^(?:input|select|textarea)$/i,
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

// 函数，返回布尔值true
function returnTrue() {
	return true;
}
// 函数，返回布尔值false
function returnFalse() {
	return false;
}
// 安全返回当前聚焦dom
function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
// 事件处理方法，如：添加事件回调、移除事件回调、触发事件回调。
// 参考 http://www.cnblogs.com/aaronjs/p/3481075.html
jQuery.event = {

	global: {},
	// elem为DOM元素节点 或 普通对象。
	// 如：jQuery.event.add( this, types, fn, data, selector );
	add: function( elem, types, handler, data, selector ) {
		var tmp, events, t, handleObjIn,
			special, eventHandle, handleObj,
			handlers, type, namespaces, origType,
			// 通过 $._data 方法，利用元素/普通对象的id从 $.cache 里取相关缓存数据。
			// 方法来自 data.js。
			elemData = jQuery._data( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		// 允许为普通对象绑定事件。
		// 不会为没有缓存数据或者是text、comment的节点绑定事件。
		// elemData 对象内容如：
		/**
			elemData = {
				events: {
					click: [
						{
							data: undefined,
							guid: 2,
							handler: fn1,
							namespace: "",
							type: "click"
						}
					]
				},
				handle: fn
			}
		**/
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		// 如果handler是个包含 handler、selector、guid 属性的对象。如果handler是对象，则内容如下：
		/**
			handler = {
				handler: fn
				selector: 'a'
				guid: 2
			}
		**/
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		// 确保当前事件回调fn有唯一ID，主要用于稍后查找/删除回调fn。
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		// 如果元素缓存数据中没有 events 数据，则初始化元素事件对象 events。
		if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}
		// 如果元素缓存数据中没有 handle 回调，则初始化它。
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// ???
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== core_strundefined && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			// 定义事件处理器对应的元素，用于防止IE非原生事件中的内存泄露。
			// 即：elemData.handle.elem = elem;
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		// 类似这样的事件绑定：types = "click.aaa.bbb focus blur"
		types = ( types || "" ).match( core_rnotwhite ) || [""]; // ["click.aaa.bbb", "focus", "blur"]
		t = types.length;
		// 遍历要绑定的事件数组
		while ( t-- ) {
			// tmp = ["click.aaa.bbb", "click", "aaa.bbb"]
			tmp = rtypenamespace.exec( types[t] ) || [];
			// tmp[1] = "click"
			type = origType = tmp[1];
			// namespaces = ["aaa", "bbb"]
			// 为什么要sort。???
			namespaces = ( tmp[2] || "" ).split( "." ).sort(); // ["aaa", "bbb"]

			// There *must* be a type, no attaching namespace-only handlers
			// 一定要有事件类型。
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			// 取特殊事件的数据对象。
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			// ???
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			// 取特殊事件的数据对象。
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type, // 经过特殊事件对象special处理后的事件类型type。
				origType: origType, // 最初绑定的事件类型。
				data: data, // 绑定的数据。
				handler: handler, // 事件回调函数体。
				guid: handler.guid, // 事件回调guid。
				selector: selector, // 选择器。
				// 正则验证当前选择器是否需要context。此正则出自sizzle.js。
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			// 第一次使用时初始化回调队列（数组）。
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0; // 未处理的回调个数。

				// Only use addEventListener/attachEvent if the special events handler returns false
				// 如果木有方法setup或者setup返回false，则仅仅使用addEventListener/attachEvent为元素elem绑定事件。
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					// Bind the global event handler to the element
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );

					} else if ( elem.attachEvent ) {
						elem.attachEvent( "on" + type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			// 向回调列表堆栈中新增回调函数。
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			// 表示事件曾经使用过，用于事件优化。基本上没用。
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		// 设置为null避免IE中循环引用导致的内存泄露。
		elem = null;
	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {
		var j, handleObj, tmp,
			origCount, t, events,
			special, handlers, type,
			namespaces, origType,
			elemData = jQuery.hasData( elem ) && jQuery._data( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		// 类似这样的事件绑定：types = "click.aaa.bbb focus blur"
		types = ( types || "" ).match( core_rnotwhite ) || [""]; // ["click.aaa.bbb", "focus", "blur"]
		t = types.length;
		while ( t-- ) {
			// tmp = ["click.aaa.bbb", "click", "aaa.bbb"]
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1]; // "click"
			namespaces = ( tmp[2] || "" ).split( "." ).sort(); // ["aaa", "bbb"]

			// Unbind all events (on this namespace, if provided) for the element
			// 如果没有解绑事件，则递归遍历dom上相关事件并移除。
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		// 如果 elemData 里的events为空，则删除 events 对象和 handle 回调。
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;

			// removeData also checks for emptiness and clears the expando if empty
			// so use it instead of delete
			jQuery._removeData( elem, "events" );
		}
	},

	// jQuery.event.trigger( type, data, this );
	trigger: function( event, data, elem, onlyHandlers ) {
		var handle, ontype, cur,
			bubbleType, special, tmp, i,
			eventPath = [ elem || document ],
			type = core_hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = core_hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		// 如果元素节点是 text或者comment，则不触发事件回调。
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
				event.preventDefault();
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
				jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Can't use an .isFunction() check here because IE6/7 fails that test.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && elem[ type ] && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					try {
						elem[ type ]();
					} catch ( e ) {
						// IE<9 dies on focus/blur to hidden element (#1486,#12518)
						// only reproducible on winXP IE8 native, not IE9 in IE8 mode
					}
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, ret, handleObj, matched, j,
			handlerQueue = [],
			args = core_slice.call( arguments ),
			handlers = ( jQuery._data( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var sel, handleObj, matches, i,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

			/* jshint eqeqeq: false */
			for ( ; cur != this; cur = cur.parentNode || this ) {
				/* jshint eqeqeq: true */

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && (cur.disabled !== true || event.type !== "click") ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	fix: function( event ) {
		// 如果事件对象event有属性jQuery.expando，如："jQuery110206474665417335927"。
		// 则说明此事件对象是经过修复的，所以直接返回事件对象event。
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,	// 事件类型。
			originalEvent = event,	// 创建原始事件对象copy。
			fixHook = this.fixHooks[ type ]; // 从this.fixHooks里取当前事件类型的相关Hooks缓存。

		if ( !fixHook ) {
			// 通过正则判断是那种事件类型。
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: IE<9
		// Fix target property (#1925)
		// IE<9事件对象无target属性，只有srcElement。
		if ( !event.target ) {
			event.target = originalEvent.srcElement || document;
		}

		// Support: Chrome 23+, Safari?
		// Target should not be a text node (#504, #13143)
		// event.target不应该是一个文本节点。如果是文本节点，就找文本节点的父节点。
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		// Support: IE<9
		// For mouse/key events, metaKey==false if it's undefined (#3368, #11328)
		event.metaKey = !!event.metaKey;

		return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	// 包含了一些键盘和鼠标事件共同基本属性
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	// 缓存修复过的鼠标或键盘事件，缓存的内容是keyHooks、mouseHooks。内容如下：
	/*
		this.fixHooks = {
			'click': this.mouseHooks,
			'keyup': this.keyHooks,
			...
		}
	*/
	fixHooks: {},

	// 键盘事件钩子
	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			// 如果键盘事件对象不包含属性which，则增加which属性。此属性有兼容性：charCode(IE)、keyCode。
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	// 鼠标事件钩子
	// 参考http://www.cnblogs.com/MrBackKom/archive/2012/06/25/2562920.html
	mouseHooks: {
		props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var body, eventDoc, doc,
				button = original.button,	// 鼠标按键
				fromElement = original.fromElement;	// 鼠标事件的关联元素（ie），标准浏览器为original.relatedTarget。

			// Calculate pageX/Y if missing and clientX/Y available
			// 如果 pageX/Y 属性丢失，而且 clientX/Y 属性可用，则重新计算属性 pageX/Y。
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				// 重新为 event.pageX/event.pageY 赋值
				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add relatedTarget, if necessary
			// ie下为事件对象event添加 relatedTarget 属性（兼容ie8-）
			if ( !event.relatedTarget && fromElement ) {
				event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			// 为鼠标click事件对象添加 which 属性。标准浏览器为：1 === left; 2 === middle; 3 === right
			// 参考http://zhidao.baidu.com/question/130386852.html
			// ???
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					try {
						this.focus();
						return false;
					} catch ( e ) {
						// Support: IE<9
						// If we error on focus to hidden element (#1486, #12518),
						// let .trigger() run the handlers
					}
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( jQuery.nodeName( this, "input" ) && this.type === "checkbox" && this.click ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Even when returnValue equals to undefined Firefox will still show alert
				if ( event.result !== undefined ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

// 移除dom元素上绑定的事件，兼容标准浏览器和ie。
jQuery.removeEvent = document.removeEventListener ?
	// 标准浏览器
	function( elem, type, handle ) {
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle, false );
		}
	} :
	// ie
	function( elem, type, handle ) {
		var name = "on" + type;

		if ( elem.detachEvent ) {

			// #8545, #7054, preventing memory leaks for custom events in IE6-8
			// detachEvent needed property on element, by name of that event, to properly expose it to GC
			// 如果dom元素不支持此事件，则把元素的此属性置为null。
			if ( typeof elem[ name ] === core_strundefined ) {
				elem[ name ] = null;
			}

			elem.detachEvent( name, handle );
		}
	};

// jQuery事件回调函数的事件对象event的构造器。
jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	// 检测this是不是Event对象，如果不是，new一个Event对象出来，这样就避免了外部new对象。
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	// 原生事件对象
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		// 为 jQuery Event 事件对象新增属性isDefaultPrevented，判断当前事件的默认动作是否被取消，返回值是布尔型。
		/*	1.src.defaultPrevented 返回一个布尔值,表明当前事件的默认动作是否被取消,也就是是否执行了 event.preventDefault()方法。
			兼容性参考 https://developer.mozilla.org/zh-CN/docs/Web/API/event.defaultPrevented
			2.src.getPreventDefault是一个方法，即以前的非标准的已经被废弃的方法，返回布尔值，同样是判断当前事件的默认动作是否被取消。
		*/
		this.isDefaultPrevented = ( src.defaultPrevented || src.returnValue === false ||
			src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	// 如果原生事件对象里木有属性timestamp，则创建一个。
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	// 一个标记，说明此事件对象是被处理过的。
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
// 参考 http://www.w3school.com.cn/jsref/dom_obj_event.asp
jQuery.Event.prototype = {
	isDefaultPrevented: returnFalse, // 函数，判断是否调用过preventDefault()方法
	isPropagationStopped: returnFalse, // 函数，判断是否调用过stopPropagation()方法
	isImmediatePropagationStopped: returnFalse, // 函数，判断是否调用过stopImmediatePropagation()方法

	// 取消元素事件的默认动作
	preventDefault: function() {
		var e = this.originalEvent; // 原生事件对象

		this.isDefaultPrevented = returnTrue;
		if ( !e ) {
			return;
		}

		// If preventDefault exists, run it on the original event
		// 用原生的事件对象方法 event.preventDefault();
		if ( e.preventDefault ) {
			e.preventDefault();

		// Support: IE
		// Otherwise set the returnValue property of the original event to false
		// ie下设置事件对象属性 event.returnValue = false;
		} else {
			e.returnValue = false;
		}
	},
	// 取消事件冒泡
	stopPropagation: function() {
		var e = this.originalEvent; // 原生事件对象

		this.isPropagationStopped = returnTrue;
		if ( !e ) {
			return;
		}
		// If stopPropagation exists, run it on the original event
		// 用原生的事件对象方法 event.stopPropagation();
		if ( e.stopPropagation ) {
			e.stopPropagation();
		}

		// Support: IE
		// Set the cancelBubble property of the original event to true
		// ie下设置事件对象属性 event.cancelBubble = true;
		e.cancelBubble = true;
	},
	// 该元素当前事件回调执行后，其后续的事件回调将不再执行，并取消事件冒泡
	// 参考 http://www.365mini.com/page/jquery-event-stopimmediatepropagation.htm
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
// 用mouseover/out来模拟mouseenter/leave，从而实现mouseenter/leave也能冒泡的功能。
// mouseenter/leave和mouseover/out最大的区别就是mouseenter/leave不能冒泡。因此要用mouseover/out来模拟。
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget, // 鼠标事件相关联dom元素。
				handleObj = event.handleObj; // 事件相关信息对象。

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			// 这个判断就决定了mouseenter/leave只有当鼠标移动到真正的target dom元素上时才会触发事件。区别了mouseover/out。
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				// 回调执行前，事件对象event.type值为mouseenter/leave。
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				// 执行完毕回调后，将事件对象event.type置为mouseover/out。
				event.type = fix;
			}
			return ret;
		}
	};
});

// IE submit delegation
// IE < 9 不支持submitBubbles。
if ( !jQuery.support.submitBubbles ) {

	jQuery.event.special.submit = {
		setup: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Lazy-add a submit handler when a descendant form may potentially be submitted
			jQuery.event.add( this, "click._submit keypress._submit", function( e ) {
				// Node name check avoids a VML-related crash in IE (#9807)
				var elem = e.target,
					form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ? elem.form : undefined;
				if ( form && !jQuery._data( form, "submitBubbles" ) ) {
					jQuery.event.add( form, "submit._submit", function( event ) {
						event._submit_bubble = true;
					});
					jQuery._data( form, "submitBubbles", true );
				}
			});
			// return undefined since we don't need an event listener
		},

		postDispatch: function( event ) {
			// If form was submitted by the user, bubble the event up the tree
			if ( event._submit_bubble ) {
				delete event._submit_bubble;
				if ( this.parentNode && !event.isTrigger ) {
					jQuery.event.simulate( "submit", this.parentNode, event, true );
				}
			}
		},

		teardown: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Remove delegated handlers; cleanData eventually reaps submit handlers attached above
			jQuery.event.remove( this, "._submit" );
		}
	};
}

// IE change delegation and checkbox/radio fix
// IE < 9 不支持changeBubbles。
if ( !jQuery.support.changeBubbles ) {

	jQuery.event.special.change = {

		setup: function() {

			if ( rformElems.test( this.nodeName ) ) {
				// IE doesn't fire change on a check/radio until blur; trigger it on click
				// after a propertychange. Eat the blur-change in special.change.handle.
				// This still fires onchange a second time for check/radio after blur.
				if ( this.type === "checkbox" || this.type === "radio" ) {
					jQuery.event.add( this, "propertychange._change", function( event ) {
						if ( event.originalEvent.propertyName === "checked" ) {
							this._just_changed = true;
						}
					});
					jQuery.event.add( this, "click._change", function( event ) {
						if ( this._just_changed && !event.isTrigger ) {
							this._just_changed = false;
						}
						// Allow triggered, simulated change events (#11500)
						jQuery.event.simulate( "change", this, event, true );
					});
				}
				return false;
			}
			// Delegated event; lazy-add a change handler on descendant inputs
			jQuery.event.add( this, "beforeactivate._change", function( e ) {
				var elem = e.target;

				if ( rformElems.test( elem.nodeName ) && !jQuery._data( elem, "changeBubbles" ) ) {
					jQuery.event.add( elem, "change._change", function( event ) {
						if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
							jQuery.event.simulate( "change", this.parentNode, event, true );
						}
					});
					jQuery._data( elem, "changeBubbles", true );
				}
			});
		},

		handle: function( event ) {
			var elem = event.target;

			// Swallow native change events from checkbox/radio, we already triggered them above
			if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
				return event.handleObj.handler.apply( this, arguments );
			}
		},

		teardown: function() {
			jQuery.event.remove( this, "._change" );

			return !rformElems.test( this.nodeName );
		}
	};
}

// Create "bubbling" focus and blur events
// 如果不支持 focusin、focusout 事件，则通过修改回调函数，用focus、blur事件模拟 focusin、focusout。
if ( !jQuery.support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler while someone wants focusin/focusout
		var attaches = 0,
			handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		// 将 focusin、focusout事件方法特殊处理回调放入 jQuery.event.special。
		jQuery.event.special[ fix ] = {
			// 主要是在Firefox中模拟focusin和focusout事件的，因为各大主流浏览器只有他不支持这两个事件。
			setup: function() {
				if ( attaches++ === 0 ) {
					document.addEventListener( orig, handler, true );
				}
			},
			// 移除事件
			teardown: function() {
				if ( --attaches === 0 ) {
					document.removeEventListener( orig, handler, true );
				}
			}
		};
	});
}

jQuery.fn.extend({
	// “one”参数内部用
	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var type, origFn;

		// Types can be a map of types/handlers
		// 类似这样：$('body').on({"click": fn1, "focus": fn2, "blur": fn3}, 'a', data);
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				// 类似这样：$('body').on({"click": fn1, "focus": fn2, "blur": fn3}, data);
				data = data || selector;
				selector = undefined;
			}
			// 遍历对象迭代调用on绑定事件
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		// 类似这样：$('body').on("click", fn);
		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			// 类似这样：$('body').on("click", "a", fn);
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// 类似这样：$('body').on("click", data, fn);
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		// 类似这样：$('body').on("click", 'a', data, false);即：fn为布尔类型false。此时，回调是"returnFalse"。
		if ( fn === false ) {
			fn = returnFalse;
		// 类似这样：$('body').on("click", 'a', data, 0);
		// 即：fn有值且为非布尔类型，但是通过类型转换成false，如：fn === 0。
		} else if ( !fn ) {
			return this;
		}

		// 参数one是内部使用的参数，用来实现只绑定事件一次。
		// one === 1 时，这个事件只用一次，用完就用off取消掉。实现了事件 one 的效果。
		// 事实上jQuery的 one 事件就是通过此参数控制的。
		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				// 调用jQuery实例对象的off方法，取消事件绑定。注意参数为事件event对象。
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			// 将origFn回调的属性guid值赋给新生成的回调fn，使两者保持一致。
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			// 遍历jQuery对象，为每个jQuery对象绑定相关事件。
			// 实质是通过 jQuery.event.add 为jQuery对象绑定事件。
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;

		// types 是事件event对象。???
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		// 类似这样：$('body').off({"click": fn1, "focus": fn2, "blur": fn3}, 'a');
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			// 遍历移除绑定的事件
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		// 类似这样：$('body').off('click', fn) 或者 $('body').off('click', false)
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			// 遍历jQuery对象，为每个jQuery对象移除绑定事件。
			// 实质是通过 jQuery.event.remove 为jQuery对象移除绑定事件。
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	// 参考 http://www.w3school.com.cn/jquery/event_triggerhandler.asp
	triggerHandler: function( type, data ) {
		// 只取匹配的第一个元素
		var elem = this[0];
		if ( elem ) {
			// 返回的是事件处理函数的返回值，而不是具有可链性的 jQuery 对象。
			// 此外，如果没有处理程序被触发，则这个方法返回 undefined。
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});
