/*!
 * PopupJS
 * Date: 2014-11-09
 * https://github.com/aui/popupjs
 * (c) 2009-2014 TangBin, http://www.planeArt.cn
 *
 * This is licensed under the GNU LGPL, version 2.1 or later.
 * For details, see: http://www.gnu.org/licenses/lgpl-2.1.html
 */

define(function(require) {

    var $ = require('jquery');

    var _count = 0; // 当前页面所有Popup浮层的计数器
    var _isIE6 = !('minWidth' in $('html')[0].style); // 判断是否是ie6
    var _isFixed = !_isIE6; // ie6不支持fixed


    function Popup() {

        this.destroyed = false; // 浮层是否被销毁

        // 创建浮层jquery对象
        this.__popup = $('<div />')
            /*使用 <dialog /> 元素可能导致 z-index 永远置顶的问题(chrome)*/
            .css({
                display: 'none',
                position: 'absolute',
                /*
                left: 0,
                top: 0,
                bottom: 'auto',
                right: 'auto',
                margin: 0,
                padding: 0,
                border: '0 none',
                background: 'transparent'
                */
                outline: 0
            })
            .attr('tabindex', '-1')
            .html(this.innerHTML)
            .appendTo('body');

        // 浮层遮罩
        this.__backdrop = this.__mask = $('<div />')
            .css({
                opacity: .7,
                background: '#000'
            });


        // 使用 HTMLElement 作为外部接口使用，而不是 jquery 对象
        // 统一的接口利于未来 Popup 移植到其他 DOM 库中
        this.node = this.__popup[0]; // 浮层DOM
        this.backdrop = this.__backdrop[0]; // 遮罩DOM

        _count++; // 浮层计数累计
    }


    $.extend(Popup.prototype, {

        /**
         * 初始化完毕事件，在 show()、showModal() 执行
         * @name Popup.prototype.onshow
         * @event
         */

        /**
         * 关闭事件，在 close() 执行
         * @name Popup.prototype.onclose
         * @event
         */

        /**
         * 销毁前事件，在 remove() 前执行
         * @name Popup.prototype.onbeforeremove
         * @event
         */

        /**
         * 销毁事件，在 remove() 执行
         * @name Popup.prototype.onremove
         * @event
         */

        /**
         * 重置事件，在 reset() 执行
         * @name Popup.prototype.onreset
         * @event
         */

        /**
         * 焦点事件，在 foucs() 执行
         * @name Popup.prototype.onfocus
         * @event
         */

        /**
         * 失焦事件，在 blur() 执行
         * @name Popup.prototype.onblur
         * @event
         */

        /** 浮层 DOM 节点[*] */
        node: null,

        /** 遮罩 DOM 节点[*] */
        backdrop: null,

        /** 是否开启固定定位[*] */
        fixed: false,

        /** 判断对话框是否删除[*] */
        destroyed: true,

        /** 判断对话框是否显示 */
        open: false,

        /** close 返回值 */
        returnValue: '',

        /** 是否自动聚焦 */
        autofocus: true,

        /** 对齐方式[*] */
        align: 'bottom left',

        /** 内部的 HTML 字符串 */
        innerHTML: '',

        /** CSS 类名 */
        className: 'ui-popup',

        /**
         * 显示浮层
         * @anchor   {HTMLElement, Event}  指定位置（可选）
         */
        show: function(anchor) {
            // 如果浮层被销毁，则直接返回
            if (this.destroyed) {
                return this;
            }

            var that = this; // 浮层实例
            var popup = this.__popup; // 浮层
            var backdrop = this.__backdrop; // 遮罩

            this.__activeElement = this.__getActive(); // 获取当前聚焦元素

            this.open = true; // 浮层被标记为打开
            this.follow = anchor || this.follow; // 获取浮层需要follow的元素


            // 初始化 show 方法（是否第一次初始化浮层，this.__ready默认为false）。
            if (!this.__ready) {

                popup
                    .addClass(this.className) // 默认为'ui-popup'
                    .attr('role', this.modal ? 'alertdialog' : 'dialog') // 浮层角色
                    .css('position', this.fixed ? 'fixed' : 'absolute'); // 是否fixed，默认为false

                if (!_isIE6) { // 非ie6下绑定resize事件
                    $(window).on('resize', $.proxy(this.reset, this));
                }

                // 模态浮层的遮罩
                if (this.modal) {
                    var backdropCss = {
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        userSelect: 'none',
                        zIndex: this.zIndex || Popup.zIndex
                    };

                    // 模块浮层添加类'ui-popup-modal'
                    popup.addClass(this.className + '-modal');

                    // ie6不支持fixed，则采用绝对定位
                    if (!_isFixed) {
                        $.extend(backdropCss, {
                            position: 'absolute',
                            width: $(window).width() + 'px',
                            height: $(document).height() + 'px'
                        });
                    }


                    backdrop
                        .css(backdropCss)
                        .attr({
                            tabindex: '0'
                        })
                        .on('focus', $.proxy(this.focus, this));

                    // 锁定 tab 的焦点操作
                    this.__mask = backdrop
                        .clone(true)
                        .attr('style', '')
                        .insertAfter(popup);

                    backdrop
                        .addClass(this.className + '-backdrop')
                        .insertBefore(popup);

                    this.__ready = true;
                }

                // 如果浮层木有内容，则默认内容为this.innerHTML的内容
                if (!popup.html()) {
                    popup.html(this.innerHTML);
                }
            }

            // 为浮层添加类'ui-popup-show'并显示。
            popup
                .addClass(this.className + '-show')
                .show();

            backdrop.show(); // 显示遮罩

            // 重置浮层位置并让其获取焦点
            this.reset().focus();
            this.__dispatchEvent('show'); // 触发'show'事件回调

            return this;
        },


        /** 显示模态浮层。参数参见 show() */
        showModal: function() {
            this.modal = true; // 模态标记
            return this.show.apply(this, arguments); // 调用浮层实例show方法
        },


        /** 关闭浮层 */
        close: function(result) {

            if (!this.destroyed && this.open) {

                if (result !== undefined) {
                    this.returnValue = result;
                }

                this.__popup.hide().removeClass(this.className + '-show');
                this.__backdrop.hide();
                this.open = false;
                this.blur(); // 恢复焦点，照顾键盘操作的用户
                this.__dispatchEvent('close');
            }

            return this;
        },


        /** 销毁浮层 */
        remove: function() {

            if (this.destroyed) {
                return this;
            }

            this.__dispatchEvent('beforeremove');

            if (Popup.current === this) {
                Popup.current = null;
            }


            // 从 DOM 中移除节点
            this.__popup.remove();
            this.__backdrop.remove();
            this.__mask.remove();


            if (!_isIE6) {
                $(window).off('resize', this.reset);
            }


            this.__dispatchEvent('remove');

            for (var i in this) {
                delete this[i];
            }

            return this;
        },


        /** 重置位置 */
        reset: function() {
            // 需要follow的元素
            var elem = this.follow;

            // 如果有follow元素，则follow之，否则居中显示
            if (elem) {
                this.__follow(elem);
            } else {
                this.__center();
            }

            this.__dispatchEvent('reset'); // 触发reset事件回调

            return this;
        },


        /** 让浮层获取焦点 */
        focus: function() {

            var node = this.node;
            var popup = this.__popup;
            var current = Popup.current;
            var index = this.zIndex = Popup.zIndex++;

            if (current && current !== this) {
                current.blur(false);
            }

            // 检查焦点是否在浮层里面
            if (!$.contains(node, this.__getActive())) {
                var autofocus = popup.find('[autofocus]')[0];

                if (!this._autofocus && autofocus) {
                    this._autofocus = true;
                } else {
                    autofocus = node;
                }

                this.__focus(autofocus);
            }

            // 设置叠加高度
            popup.css('zIndex', index);
            //this.__backdrop.css('zIndex', index);

            Popup.current = this;
            popup.addClass(this.className + '-focus');

            this.__dispatchEvent('focus');

            return this;
        },


        /** 让浮层失去焦点。将焦点退还给之前的元素，照顾视力障碍用户 */
        blur: function() {

            var activeElement = this.__activeElement;
            var isBlur = arguments[0];


            if (isBlur !== false) {
                this.__focus(activeElement);
            }

            this._autofocus = false;
            this.__popup.removeClass(this.className + '-focus');
            this.__dispatchEvent('blur');

            return this;
        },


        /**
         * 添加事件
         * @param   {String}    事件类型
         * @param   {Function}  监听函数
         */
        addEventListener: function(type, callback) {
            this.__getEventListener(type).push(callback);
            return this;
        },


        /**
         * 删除事件
         * @param   {String}    事件类型
         * @param   {Function}  监听函数
         */
        removeEventListener: function(type, callback) {
            var listeners = this.__getEventListener(type);
            for (var i = 0; i < listeners.length; i++) {
                if (callback === listeners[i]) {
                    listeners.splice(i--, 1);
                }
            }
            return this;
        },


        // 获取事件缓存
        __getEventListener: function(type) {
            var listener = this.__listener; // 事件缓存器
            if (!listener) {
                listener = this.__listener = {}; // 如果木有事件缓存器，则创建之
            }
            if (!listener[type]) {
                listener[type] = []; // 如果木有此类事件回调缓存，则创建之
            }
            return listener[type];
        },


        // 派发事件（触发事件）
        __dispatchEvent: function(type) {
            var listeners = this.__getEventListener(type);

            if (this['on' + type]) {
                this['on' + type]();
            }

            // 遍历事件回调并执行
            for (var i = 0; i < listeners.length; i++) {
                listeners[i].call(this);
            }
        },


        // 对元素安全聚焦
        __focus: function(elem) {
            // 防止 iframe 跨域无权限报错
            // 防止 IE 不可见元素报错
            try {
                // ie11 bug: iframe 页面点击会跳到顶部
                // ie11 自动聚焦时，判断是否是iframe，如果是则让元素聚焦。
                if (this.autofocus && !/^iframe$/i.test(elem.nodeName)) {
                    elem.focus();
                }
            } catch (e) {}
        },


        // 获取当前焦点的元素，包括获取iframe聚焦元素
        __getActive: function() {
            try { // try: ie8~9, iframe #26
                var activeElement = document.activeElement;
                var contentDocument = activeElement.contentDocument;
                // 判断是否是iframe
                var elem = contentDocument && contentDocument.activeElement || activeElement;
                return elem;
            } catch (e) {}
        },


        // 居中浮层
        __center: function() {
            // 浮层jquery对象
            var popup = this.__popup;
            var $window = $(window);
            var $document = $(document);
            var fixed = this.fixed;
            var dl = fixed ? 0 : $document.scrollLeft();
            var dt = fixed ? 0 : $document.scrollTop();
            var ww = $window.width();
            var wh = $window.height();
            var ow = popup.width();
            var oh = popup.height();
            var left = (ww - ow) / 2 + dl;
            var top = (wh - oh) * 382 / 1000 + dt; // 黄金比例
            var style = popup[0].style;


            style.left = Math.max(parseInt(left), dl) + 'px';
            style.top = Math.max(parseInt(top), dt) + 'px';
        },


        // 指定位置 @param    {HTMLElement, Event}  anchor
        __follow: function(anchor) {

            var $elem = anchor.parentNode && $(anchor);
            var popup = this.__popup;


            if (this.__followSkin) {
                popup.removeClass(this.__followSkin);
            }


            // 隐藏元素不可用
            if ($elem) {
                var o = $elem.offset();
                if (o.left * o.top < 0) {
                    return this.__center();
                }
            }

            var that = this;
            var fixed = this.fixed;

            var $window = $(window);
            var $document = $(document);
            var winWidth = $window.width();
            var winHeight = $window.height();
            var docLeft = $document.scrollLeft();
            var docTop = $document.scrollTop();


            var popupWidth = popup.width();
            var popupHeight = popup.height();
            var width = $elem ? $elem.outerWidth() : 0;
            var height = $elem ? $elem.outerHeight() : 0;
            var offset = this.__offset(anchor);
            var x = offset.left;
            var y = offset.top;
            var left = fixed ? x - docLeft : x;
            var top = fixed ? y - docTop : y;


            var minLeft = fixed ? 0 : docLeft;
            var minTop = fixed ? 0 : docTop;
            var maxLeft = minLeft + winWidth - popupWidth;
            var maxTop = minTop + winHeight - popupHeight;


            var css = {};
            var align = this.align.split(' ');
            var className = this.className + '-';
            var reverse = {
                top: 'bottom',
                bottom: 'top',
                left: 'right',
                right: 'left'
            };
            var name = {
                top: 'top',
                bottom: 'top',
                left: 'left',
                right: 'left'
            };


            var temp = [{
                top: top - popupHeight,
                bottom: top + height,
                left: left - popupWidth,
                right: left + width
            }, {
                top: top,
                bottom: top - popupHeight + height,
                left: left,
                right: left - popupWidth + width
            }];


            var center = {
                left: left + width / 2 - popupWidth / 2,
                top: top + height / 2 - popupHeight / 2
            };


            var range = {
                left: [minLeft, maxLeft],
                top: [minTop, maxTop]
            };


            // 超出可视区域重新适应位置
            $.each(align, function(i, val) {

                // 超出右或下边界：使用左或者上边对齐
                if (temp[i][val] > range[name[val]][1]) {
                    val = align[i] = reverse[val];
                }

                // 超出左或右边界：使用右或者下边对齐
                if (temp[i][val] < range[name[val]][0]) {
                    align[i] = reverse[val];
                }

            });


            // 一个参数的情况
            if (!align[1]) {
                name[align[1]] = name[align[0]] === 'left' ? 'top' : 'left';
                temp[1][align[1]] = center[name[align[1]]];
            }


            //添加follow的css, 为了给css使用
            className += align.join('-') + ' ' + this.className + '-follow';

            that.__followSkin = className;


            if ($elem) {
                popup.addClass(className);
            }


            css[name[align[0]]] = parseInt(temp[0][align[0]]);
            css[name[align[1]]] = parseInt(temp[1][align[1]]);
            popup.css(css);

        },


        // 获取元素相对于页面的位置（包括iframe内的元素）
        // 暂时不支持两层以上的 iframe 套嵌
        // @anchor DOM元素或者事件对象event
        __offset: function(anchor) {

            var isNode = anchor.parentNode;
            var offset = isNode ? $(anchor).offset() : {
                left: anchor.pageX,
                top: anchor.pageY
            };


            anchor = isNode ? anchor : anchor.target;
            var ownerDocument = anchor.ownerDocument;
            var defaultView = ownerDocument.defaultView || ownerDocument.parentWindow;

            if (defaultView == window) { // IE <= 8 只能使用两个等于号
                return offset;
            }

            // {Element: Ifarme}
            var frameElement = defaultView.frameElement;
            var $ownerDocument = $(ownerDocument);
            var docLeft = $ownerDocument.scrollLeft();
            var docTop = $ownerDocument.scrollTop();
            var frameOffset = $(frameElement).offset();
            var frameLeft = frameOffset.left;
            var frameTop = frameOffset.top;

            return {
                left: offset.left + frameLeft - docLeft,
                top: offset.top + frameTop - docTop
            };
        }

    });


    /** 当前叠加高度 */
    Popup.zIndex = 1024;


    /** 顶层浮层的实例 */
    Popup.current = null;


    return Popup;

});
