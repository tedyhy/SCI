## jQuery JavaScript Library v1.10.2的简化理解
[jQuery JavaScript Library v1.10.2](http://code.jquery.com/jquery-1.10.2.js)
---
````javascript
(function( window, undefined ) {
    
})( window );
````
匿名函数自执行，把里面的代码变为局部，防止冲突。然后对外提供接口。
提供接口的方法。把需要对外提供的接口挂载到window的下面。
````javascript
(function( window, undefined ) {
    (21, 117) 定义了一些变量和函数 jQuery = function(){};
    (119, 312) 给JQ对象添加一些属性和方法
    (314, 376) extend: JQ的继承方法
    (378, 915) jQuery.extend() 扩展的一些静态的属性和方法即工具方法
    (917, 976) 监听DOM加载，DOM加载完毕后进行回调
    (979, 981) 填充 class2type 对象，类型映射。
    (983, 998) 判断是否是类数组
    (1012, 2991) Sizzle： 复杂选择器的实现
    (3015, 3177) Callbacks: 回调对象: 对函数的统一管理
    (3178, 3318) Deferred: 延迟对象：对异步的统一管理
    (3319, 3563) support: 功能检测的方法
    (3565, 3900) data()方法的功能: 数据缓存
    (3901, 4046) queue()方法的功能: 队列管理
    (4047, 4705) attr() prop() addClass()等方法 对元素属性的操作
    (4706, 5700) on() trigger()等事件操作的相关方法
    (5701, 6793) DOM操作 添加，删除，获取，包装，dom筛选
    (6794, 7454) css() 样式的操作
    (7455, 8813) 提交的数据和ajax() ajax() load() getJson()等方法
    (8814, 9545) animate() 运动的方法 show() hide() toggle()等方法
    (9546,9755 ) offset() 位置和尺寸的一些方法
    (9767,9787) jquery对模块化的支持
    (9775) window.jQuery = window.$ = jQuery;将jquery这个函数挂载到window下的jquery
    
})( window );
````