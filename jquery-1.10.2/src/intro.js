/*!
 * jQuery JavaScript Library v@VERSION
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: @DATE
 */
 /*
  * 匿名函数自执行，传window参数的意义，避免去js最顶部查找window，参数就相当于局部变量。有利于压缩
  *undefined参数的意义，为避免被修改。属于window下的一个属性，不是保留字和关键字，在某些浏览器下（如IE7,8），undefined的值可被修改。
  */
(function( window, undefined ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//"use strict";
