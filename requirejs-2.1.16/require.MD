1.require 和 requirejs 一样
2.配置变量
var requirejs = {};
或
var require = {};
3.
requirejs.config({}); 相当于 requirejs({});

4.
requirejs({...}, ['a', 'b'], function(){...});
requirejs({...}, function(){...});

5.config
config = {
    xhtml: true,
    scriptType: 'text/javascript'
}

6.定义一个匿名模块
define(['jquery'], function(){...});

define('jquery', function(){...}); 或 define(function(){...});





