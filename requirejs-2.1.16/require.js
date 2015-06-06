/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.1.16 Copyright (c) 2010-2015, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
//Not using strict: uneven strict support in browsers, #392, and causes
//problems with requirejs.exec()/transpiler plugins that may not be strict.
/*jslint regexp: true, nomen: true, sloppy: true */
/*global window, navigator, document, importScripts, setTimeout, opera */

//三个极其重要的全局变量。
var requirejs, require, define;
(function(global) {
    /*
        @req require|requirejs
        @s s = req.s = {contexts: contexts,newContext: newContext};
        @head document.head|document.getElementsByTagName('base')[0]
        @baseElement document.getElementsByTagName('base')[0]
        @dataMain script.getAttribute('data-main')
        @src dataMain.split('/')
        @interactiveScript script.readyState === 'interactive'
        @currentlyAddingScript 当前正在加载/处理的script节点
        @mainScript src.pop()，即主入口模块
        @subPath src.length ? src.join('/') + '/' : './'
    */
    var req, s, head, baseElement, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath,
        version = '2.1.16', //发布版本
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg, //注释正则
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g, //加载依赖正则
        jsSuffixRegExp = /\.js$/, //js后缀正则
        currDirRegExp = /^\.\//, //当前目录正则
        op = Object.prototype, //Object原型对象
        ostring = op.toString, //对象toString方法
        hasOwn = op.hasOwnProperty, //对象hasOwnProperty方法
        ap = Array.prototype, //Array原型对象
        apsp = ap.splice, //数组splice方法
        //判断是否是浏览器环境。
        isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
        //判断是否是webWorker环境。
        //参考：http://www.cnblogs.com/_franky/archive/2010/11/23/1885773.html
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
        //PS3 indicates loaded and complete, but need to wait for complete
        //specifically. Sequence is 'loading', 'loaded', execution,
        // then 'complete'. The UA check is unfortunate, but not sure how
        //to feature test w/o causing perf issues.
        //兼容PS3平台浏览器。
        //PS3平台使用'complete'，浏览器平台使用'complete|loaded'来判断script节点是否加载完毕。
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
        /^complete$/ : /^(complete|loaded)$/,
        defContextName = '_', //定义作用域名称
        //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        //用于检测是否是opera浏览器。
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        contexts = {}, //作用域内容对象
        cfg = {}, //全局config默认配置信息
        globalDefQueue = [],
        useInteractive = false;

    //判断是否是函数
    function isFunction(it) {
        return ostring.call(it) === '[object Function]';
    }

    //判断是否是数组
    function isArray(it) {
        return ostring.call(it) === '[object Array]';
    }

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    //一个遍历辅助函数，当func函数返回true时，会中断遍历。
    //函数func的参数为：func(value, key, array)。
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) { //效率不高，可以这样：for (var i = 0, l = ary.length; i < l; i++) {//...}
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    /**
     * Helper function for iterating over an array backwards. If the func
     * returns a true value, it will break out of the loop.
     */
    //一个遍历辅助函数，当func函数返回true时，会中断遍历。与each函数相似，只是反序遍历。
    //函数func的参数为：func(value, key, array)。
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    //判断对象属性是否是对象自有属性。
    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }
    //判断对象属性是否是对象自有属性，如果是则获取其属性值。
    function getOwn(obj, prop) {
        return hasProp(obj, prop) && obj[prop];
    }

    /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
    //遍历对象，将对象和属性作为回调参数，如果回调返回true，则中断遍历。
    //函数func的参数为：func(value, key)。
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    //简单的函数用于将source和target属性混合，支持强制覆盖，支持深度混合。
    //@target {Object} 目标对象
    //@source {Object} 源对象
    //@force {Boolean} 强制覆盖已有属性
    //@deepStringMixin {Boolean} 深度递归覆盖
    function mixin(target, source, force, deepStringMixin) {
        if (source) {
            //遍历对象
            eachProp(source, function(value, prop) {
                //强制覆盖或者目标对象木有此属性
                if (force || !hasProp(target, prop)) {
                    //深度递归覆盖
                    if (deepStringMixin && typeof value === 'object' && value &&
                        !isArray(value) && !isFunction(value) &&
                        !(value instanceof RegExp)) {
                        //如果目标对象木有此属性，则置为空对象
                        if (!target[prop]) {
                            target[prop] = {};
                        }
                        //深度循环遍历混合
                        mixin(target[prop], value, force, deepStringMixin);
                    } else {
                        target[prop] = value;
                    }
                }
            });
        }
        return target;
    }

    //Similar to Function.prototype.bind, but the 'this' object is specified
    //first, since it is easier to read/figure out what 'this' will be.
    //为回调fn绑定作用域
    function bind(obj, fn) {
        return function() {
            return fn.apply(obj, arguments);
        };
    }

    //获取当前文档所有script节点
    function scripts() {
        return document.getElementsByTagName('script');
    }

    //抛出错误
    function defaultOnError(err) {
        throw err;
    }

    //Allow getting a global that is expressed in
    //dot notation, like 'a.b.c'.
    //如：'a.b.c' => window.a.b.c
    function getGlobal(value) {
        if (!value) {
            return value; //返回undefined
        }
        var g = global; //window对象
        //如：'a.b.c'
        each(value.split('.'), function(part) {
            g = g[part];
        });
        return g;
    }

    /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
    //生成错误信息并返回
    function makeError(id, msg, err, requireModules) {
        //创建Error实例
        var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
        e.requireType = id; //附加属性
        e.requireModules = requireModules; //附加属性
        if (err) {
            e.originalError = err; //原错误链接
        }
        return e; //返回错误实例
    }


    /*
    * 检查并准备三个全局变量：define、requirejs、require。
    * define、requirejs是重点全局变量，且require === requirejs。
    */
    //如果define已经定义过了（其他AMD加载器），则返回（不会覆盖当前加载器的define方法）。
    if (typeof define !== 'undefined') {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    //如果requirejs已定义，且是函数，则返回，不会覆盖已存在的requirejs接口（可能是其他类库，只是名称冲突）。
    if (typeof requirejs !== 'undefined') {
        if (isFunction(requirejs)) {
            //Do not overwrite an existing requirejs instance.
            return;
        }
        cfg = requirejs; //保留原来的requirejs内容（config配置信息）。
        requirejs = undefined; //重置requirejs变量为undefined（初始化）。
    }

    //Allow for a require config object
    //如果require已经定义，且不是函数，则保留原来的require内容。
    if (typeof require !== 'undefined' && !isFunction(require)) {
        //assume it is a config object.
        cfg = require; //假定require是一个配置对象（config配置信息）。
        require = undefined; //重置require变量为undefined（初始化）。
    }

    //创建作用域内容对象
    //即：contexts[_] = req.s.newContext(contextName);
    function newContext(contextName) {
        //@context 作用域对象，即：requirejs.s._。
        var inCheckLoaded, Module, context, handlers,
            checkLoadedTimeoutId,
            //默认config配置。不要设置一个默认config.map，否则会拖慢normalize()执行效率。
            config = {
                //Defaults. Do not set a default for map
                //config to speed up normalize(), which
                //will run faster if there is no default.
                waitSeconds: 7, //等待加载时间设置，默认7s。
                baseUrl: './', //基目录默认为当前文档所在目录。
                paths: {}, //默认路径配置。
                bundles: {}, //默认bundles配置，“捆绑”，将一些模块捆绑成一个模块。
                pkgs: {}, //默认的pkgs配置。
                shim: {}, //默认的shim配置。
                config: {} //默认的config配置。
            },
            registry = {},
            //registry of just enabled modules, to speed
            //cycle breaking code when lots of modules
            //are registered, but not activated.
            enabledRegistry = {},
            undefEvents = {},
            defQueue = [],
            defined = {},
            urlFetched = {},
            bundlesMap = {}, //模块捆绑后的map信息
            requireCounter = 1,
            unnormalizedCounter = 1;

        /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
        //根据相对路径的 '.' 和 '..' 获取其真实路径（木有'.'和'..'的路径）。
        //如：
        //var b = ['a','b','..', '..', 'c'] => 'a/b/../../c'
        //trimDots(b) => ['c'] => 'c'
        function trimDots(ary) {
            var i, part;
            for (i = 0; i < ary.length; i++) {
                part = ary[i];
                if (part === '.') {
                    ary.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i == 1 && ary[2] === '..') || ary[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        ary.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @param {Boolean} applyMap apply the map config to the value. Should
         * only be done if this normalization is for a dependency ID.
         * @returns {String} normalized name
         */
        //序列化模块名称，将相对链接名称序列化成一个能被映射到真实路径的模块名称。
        //@name {String} 模块名称
        //@baseName {String} 基路径
        //@applyMap {Boolean} 是否应用config.map配置
        function normalize(name, baseName, applyMap) {
            var pkgMain, mapValue, nameParts, i, j, nameSegment, lastIndex,
                foundMap, foundI, foundStarMap, starI, normalizedBaseParts,
                //将baseName转换成数组，如：'js/base/d.js' => ['js', 'base', 'd.js']
                baseParts = (baseName && baseName.split('/')),
                map = config.map, //config.map配置map映射
                //"*"表示全匹配，即所有模块遵循这一设置。如果还有其他匹配项，将会比"*"的配置优先级高。
                //参考 http://blog.csdn.net/kevinwon1985/article/details/8155267
                /*
                    如：
                    requirejs.config({
                        map: {
                            'some/newmodule': {
                                'foo': 'foo1.2'
                            },
                            'some/oldmodule': {
                                'foo': 'foo1.0'
                            }
                        }
                    });
                    在'some/newmodule' 模块中 `require('foo')` 时，加载的是 foo1.2.js ，
                    当 'some/oldmodule' 模块中 `require('foo')` 时，加载的是 foo1.0.js。
                 */
                starMap = map && map['*'];

            //Adjust any relative paths.
            //如：'./a/b/c.js' => ['.', 'a', 'b', 'c.js']
            if (name) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // If wanting node ID compatibility, strip .js from end
                // of IDs. Have to do this here, and not in nameToUrl
                // because node allows either .js or non .js to map
                // to same file.
                // 如果模块名称想带上文件后缀'.js'，需要配置config.nodeIdCompat=true。
                // 如：'./a/b/c.js' => ['.', 'a', 'b', 'c.js'] => ['.', 'a', 'b', 'c']
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                // Starts with a '.' so need the baseName
                // 如果模块名称以'.'开头，则需要baseName来确定绝对路径。
                /*
                    如：
                    name: './a/b/c.js' => ['.', 'a', 'b', 'c.js'] => ['.', a', 'b', 'c']
                    baseParts: 'js/base/d.js' => ['js', 'base', 'd.js'] => ['js', 'base']
                */
                if (name[0].charAt(0) === '.' && baseParts) {
                    //Convert baseName to array, and lop off the last part,
                    //so that . matches that 'directory' and not name of the baseName's
                    //module. For instance, baseName of 'one/two/three', maps to
                    //'one/two/three.js', but we want the directory, 'one/two' for
                    //this normalization.
                    //被序列化后的baseParts，即：砍掉baseName最后一部分，获取其目录，如：'js/base/d.js' => 'js/base/'
                    normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                    //即：name + baseParts
                    // ['js', 'base'] + ['.', a', 'b', 'c'] => ['js', 'base', '.', 'a', 'b', 'c']
                    name = normalizedBaseParts.concat(name);
                }

                trimDots(name); //即：['js', 'base', '.', 'a', 'b', 'c'] => ['js', 'base', 'a', 'b', 'c']
                name = name.join('/'); //即：'js/base/a/b/c'
            }

            //Apply map config if available.
            //是否应用config.map配置。
            //@applyMap {Boolean} 是否应用map配置
            //@map {Object} config.map
            //@baseParts {Array} baseName数组
            //@starMap {Object} "*"全匹配配置
            if (applyMap && map && (baseParts || starMap)) {
                //将模块名name拆分成数组，如：'js/base/a/b/c' => ['js', 'base', 'a', 'b', 'c']
                nameParts = name.split('/');

                //倒序遍历nameParts
                outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
                    //name片段'nameSegment'数据如：
                    //'js/base/a/b/c'
                    //'js/base/a/b'
                    //'js/base/a'
                    //...
                    nameSegment = nameParts.slice(0, i).join('/');

                    //如：'js/base/d.js' => ['js', 'base', 'd.js']
                    if (baseParts) {
                        //Find the longest baseName segment match in the config.
                        //So, do joins on the biggest to smallest lengths of baseParts.
                        //倒序遍历baseParts
                        for (j = baseParts.length; j > 0; j -= 1) {
                            //map片段'mapValue'数据如：
                            //'js/base/d.js'
                            //'js/base'
                            //'js'
                            //...
                            mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

                            //baseName segment has config, find if it has one for
                            //this name.
                            //有匹配的map配置
                            if (mapValue) {
                                mapValue = getOwn(mapValue, nameSegment);
                                if (mapValue) {
                                    //Match, update name to the new value.
                                    foundMap = mapValue;
                                    foundI = i;
                                    break outerLoop;
                                }
                            }
                        }
                    }

                    //Check for a star map match, but just hold on to it,
                    //if there is a shorter segment match later in a matching
                    //config, then favor over this star map.
                    if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                        foundStarMap = getOwn(starMap, nameSegment);
                        starI = i;
                    }
                }

                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                }

                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join('/');
                }
            }

            // If the name points to a package's name, use
            // the package main instead.
            pkgMain = getOwn(config.pkgs, name);

            return pkgMain ? pkgMain : name;
        }

        //移除模块名称为name的script节点
        function removeScript(name) {
            if (isBrowser) {
                //遍历页面上所有已加载的script节点，找到相关模块script，并删除。
                //@data-requiremodule 加载的模块名称
                //@data-requirecontext 当前模块的作用域对象名称
                each(scripts(), function(scriptNode) {
                    if (scriptNode.getAttribute('data-requiremodule') === name &&
                        scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                        scriptNode.parentNode.removeChild(scriptNode);
                        return true;
                    }
                });
            }
        }

        //@id 模块id
        function hasPathFallback(id) {
            var pathConfig = getOwn(config.paths, id);
            if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                //Pop off the first array value, since it failed, and
                //retry
                pathConfig.shift();
                context.require.undef(id);

                //Custom require that does not do map translation, since
                //ID is "absolute", already mapped/resolved.
                context.makeRequire(null, {
                    skipMap: true
                })([id]);

                return true;
            }
        }

        //Turns a plugin!resource to [plugin, resource]
        //with the plugin being undefined if the name
        //did not have a plugin prefix.
        //获取插件模块的前缀和名称。
        //@name {String} name
        //@result {Array} [prefix, name]
        //如：require(['domready!'], function (doc){});
        //如：define(['text!review.txt','image!cat.jpg'],function(review,cat){console.log(review);document.body.appendChild(cat);});
        //如：'text!review.txt' => ['text', 'review.txt']
        function splitPrefix(name) {
            var prefix,
                index = name ? name.indexOf('!') : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }
            return [prefix, name];
        }

        /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         * @param {Boolean} applyMap: apply the map config to the ID.
         * Should only be true if this map is for a dependency.
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var url, pluginModule, suffix, nameParts,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName = '';

            //If no name, then it means it is a require call, generate an
            //internal name.
            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            nameParts = splitPrefix(name);
            prefix = nameParts[0];
            name = nameParts[1];

            if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = getOwn(defined, prefix);
            }

            //Account for relative paths if there is a base name.
            if (name) {
                if (prefix) {
                    if (pluginModule && pluginModule.normalize) {
                        //Plugin is loaded, use its normalize method.
                        normalizedName = pluginModule.normalize(name, function(name) {
                            return normalize(name, parentName, applyMap);
                        });
                    } else {
                        // If nested plugin references, then do not try to
                        // normalize, as it will not normalize correctly. This
                        // places a restriction on resourceIds, and the longer
                        // term solution is not to normalize until plugins are
                        // loaded and all normalizations to allow for async
                        // loading of a loader plugin. But for now, fixes the
                        // common uses. Details in #1131
                        normalizedName = name.indexOf('!') === -1 ?
                            normalize(name, parentName, applyMap) :
                            name;
                    }
                } else {
                    //A regular module.
                    normalizedName = normalize(name, parentName, applyMap);

                    //Normalized name may be a plugin ID due to map config
                    //application in normalize. The map config values must
                    //already be normalized, so do not need to redo that part.
                    nameParts = splitPrefix(normalizedName);
                    prefix = nameParts[0];
                    normalizedName = nameParts[1];
                    isNormalized = true;

                    url = context.nameToUrl(normalizedName);
                }
            }

            //If the id is a plugin id that cannot be determined if it needs
            //normalization, stamp it with a unique ID so two matching relative
            //ids that may conflict can be separate.
            suffix = prefix && !pluginModule && !isNormalized ?
                '_unnormalized' + (unnormalizedCounter += 1) :
                '';

            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ?
                    prefix + '!' + normalizedName :
                    normalizedName) + suffix
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (!mod) {
                mod = registry[id] = new context.Module(depMap);
            }

            return mod;
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (hasProp(defined, id) &&
                (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                    fn(defined[id]);
                }
            } else {
                mod = getModule(depMap);
                if (mod.error && name === 'error') {
                    fn(mod.error);
                } else {
                    mod.on(name, fn);
                }
            }
        }

        function onError(err, errback) {
            var ids = err.requireModules,
                notified = false;

            if (errback) {
                errback(err);
            } else {
                each(ids, function(id) {
                    var mod = getOwn(registry, id);
                    if (mod) {
                        //Set error on module, so it skips timeout checks.
                        mod.error = err;
                        if (mod.events.error) {
                            notified = true;
                            mod.emit('error', err);
                        }
                    }
                });

                if (!notified) {
                    req.onError(err);
                }
            }
        }

        /**
         * Internal method to transfer globalQueue items to this context's
         * defQueue.
         */
        function takeGlobalQueue() {
            //Push all the globalDefQueue items into the context's defQueue
            if (globalDefQueue.length) {
                //Array splice in the values since the context code has a
                //local var ref to defQueue, so cannot just reassign the one
                //on context.
                apsp.apply(defQueue, [defQueue.length, 0].concat(globalDefQueue));
                globalDefQueue = [];
            }
        }

        handlers = {
            'require': function(mod) {
                if (mod.require) {
                    return mod.require;
                } else {
                    return (mod.require = context.makeRequire(mod.map));
                }
            },
            'exports': function(mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    if (mod.exports) {
                        return (defined[mod.map.id] = mod.exports);
                    } else {
                        return (mod.exports = defined[mod.map.id] = {});
                    }
                }
            },
            'module': function(mod) {
                if (mod.module) {
                    return mod.module;
                } else {
                    return (mod.module = {
                        id: mod.map.id,
                        uri: mod.map.url,
                        config: function() {
                            return getOwn(config.config, mod.map.id) || {};
                        },
                        exports: mod.exports || (mod.exports = {})
                    });
                }
            }
        };

        function cleanRegistry(id) {
            //Clean up machinery used for waiting modules.
            delete registry[id];
            delete enabledRegistry[id];
        }

        function breakCycle(mod, traced, processed) {
            var id = mod.map.id;

            if (mod.error) {
                mod.emit('error', mod.error);
            } else {
                traced[id] = true;
                each(mod.depMaps, function(depMap, i) {
                    var depId = depMap.id,
                        dep = getOwn(registry, depId);

                    //Only force things that have not completed
                    //being defined, so still in the registry,
                    //and only if it has not been matched up
                    //in the module already.
                    if (dep && !mod.depMatched[i] && !processed[depId]) {
                        if (getOwn(traced, depId)) {
                            mod.defineDep(i, defined[depId]);
                            mod.check(); //pass false?
                        } else {
                            breakCycle(dep, traced, processed);
                        }
                    }
                });
                processed[id] = true;
            }
        }

        function checkLoaded() {
            var err, usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                reqCalls = [],
                stillLoading = false,
                needCycleCheck = true;

            //Do not bother if this call was a result of a cycle break.
            if (inCheckLoaded) {
                return;
            }

            inCheckLoaded = true;

            //Figure out the state of all the modules.
            eachProp(enabledRegistry, function(mod) {
                var map = mod.map,
                    modId = map.id;

                //Skip things that are not enabled or in error state.
                if (!mod.enabled) {
                    return;
                }

                if (!map.isDefine) {
                    reqCalls.push(mod);
                }

                if (!mod.error) {
                    //If the module should be executed, and it has not
                    //been inited and time is up, remember it.
                    if (!mod.inited && expired) {
                        if (hasPathFallback(modId)) {
                            usingPathFallback = true;
                            stillLoading = true;
                        } else {
                            noLoads.push(modId);
                            removeScript(modId);
                        }
                    } else if (!mod.inited && mod.fetched && map.isDefine) {
                        stillLoading = true;
                        if (!map.prefix) {
                            //No reason to keep looking for unfinished
                            //loading. If the only stillLoading is a
                            //plugin resource though, keep going,
                            //because it may be that a plugin resource
                            //is waiting on a non-plugin cycle.
                            return (needCycleCheck = false);
                        }
                    }
                }
            });

            if (expired && noLoads.length) {
                //If wait time expired, throw error of unloaded modules.
                err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                err.contextName = context.contextName;
                return onError(err);
            }

            //Not expired, check for a cycle.
            if (needCycleCheck) {
                each(reqCalls, function(mod) {
                    breakCycle(mod, {}, {});
                });
            }

            //If still waiting on loads, and the waiting load is something
            //other than a plugin resource, or there are still outstanding
            //scripts, then just try back later.
            if ((!expired || usingPathFallback) && stillLoading) {
                //Something is still waiting to load. Wait for it, but only
                //if a timeout is not already in effect.
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function() {
                        checkLoadedTimeoutId = 0;
                        checkLoaded();
                    }, 50);
                }
            }

            inCheckLoaded = false;
        }

        //模块管理类
        Module = function(map) {
            //模块事件对象
            this.events = getOwn(undefEvents, map.id) || {};
            this.map = map;
            this.shim = getOwn(config.shim, map.id);
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0; //当前模块的依赖计数

            /* this.exports this.factory
               this.depMaps = [],
               this.enabled, this.fetched
            */
        };

        Module.prototype = {
            init: function(depMaps, factory, errback, options) {
                options = options || {};

                //Do not do more inits if already done. Can happen if there
                //are multiple define calls for the same module. That is not
                //a normal, common case, but it is also not unexpected.
                if (this.inited) {
                    return;
                }

                this.factory = factory;

                if (errback) {
                    //Register for errors on this module.
                    this.on('error', errback);
                } else if (this.events.error) {
                    //If no errback already, but there are error listeners
                    //on this module, set up an errback to pass to the deps.
                    errback = bind(this, function(err) {
                        this.emit('error', err);
                    });
                }

                //Do a copy of the dependency array, so that
                //source inputs are not modified. For example
                //"shim" deps are passed in here directly, and
                //doing a direct modification of the depMaps array
                //would affect that config.
                this.depMaps = depMaps && depMaps.slice(0);

                this.errback = errback;

                //Indicate this module has be initialized
                //表明该模块已被初始化
                this.inited = true;

                this.ignore = options.ignore;

                //Could have option to init this module in enabled mode,
                //or could have been previously marked as enabled. However,
                //the dependencies are not known until init is called. So
                //if enabled previously, now trigger dependencies as enabled.
                if (options.enabled || this.enabled) {
                    //Enable this module and dependencies.
                    //Will call this.check()
                    this.enable();
                } else {
                    this.check();
                }
            },

            defineDep: function(i, depExports) {
                //Because of cycles, defined callback for a given
                //export can be called more than once.
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports;
                }
            },

            fetch: function() {
                if (this.fetched) {
                    return;
                }
                this.fetched = true;

                context.startTime = (new Date()).getTime();

                var map = this.map;

                //If the manager is for a plugin managed resource,
                //ask the plugin to load it now.
                if (this.shim) {
                    context.makeRequire(this.map, {
                        enableBuildCallback: true
                    })(this.shim.deps || [], bind(this, function() {
                        return map.prefix ? this.callPlugin() : this.load();
                    }));
                } else {
                    //Regular dependency.
                    return map.prefix ? this.callPlugin() : this.load();
                }
            },

            load: function() {
                var url = this.map.url;

                //Regular dependency.
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url);
                }
            },

            /**
             * Checks if the module is ready to define itself, and if so,
             * define it.
             */
            check: function() {
                if (!this.enabled || this.enabling) {
                    return;
                }

                var err, cjsModule,
                    id = this.map.id,
                    depExports = this.depExports,
                    exports = this.exports,
                    factory = this.factory;

                if (!this.inited) {
                    this.fetch();
                } else if (this.error) {
                    this.emit('error', this.error);
                } else if (!this.defining) {
                    //The factory could trigger another require call
                    //that would result in checking this module to
                    //define itself again. If already in the process
                    //of doing that, skip this work.
                    this.defining = true;

                    if (this.depCount < 1 && !this.defined) {
                        if (isFunction(factory)) {
                            //If there is an error listener, favor passing
                            //to that instead of throwing an error. However,
                            //only do it for define()'d  modules. require
                            //errbacks should not be called for failures in
                            //their callbacks (#699). However if a global
                            //onError is set, use that.
                            if ((this.events.error && this.map.isDefine) ||
                                req.onError !== defaultOnError) {
                                try {
                                    exports = context.execCb(id, factory, depExports, exports);
                                } catch (e) {
                                    err = e;
                                }
                            } else {
                                exports = context.execCb(id, factory, depExports, exports);
                            }

                            // Favor return value over exports. If node/cjs in play,
                            // then will not have a return value anyway. Favor
                            // module.exports assignment over exports object.
                            if (this.map.isDefine && exports === undefined) {
                                cjsModule = this.module;
                                if (cjsModule) {
                                    exports = cjsModule.exports;
                                } else if (this.usingExports) {
                                    //exports already set the defined value.
                                    exports = this.exports;
                                }
                            }

                            if (err) {
                                err.requireMap = this.map;
                                err.requireModules = this.map.isDefine ? [this.map.id] : null;
                                err.requireType = this.map.isDefine ? 'define' : 'require';
                                return onError((this.error = err));
                            }

                        } else {
                            //Just a literal value
                            exports = factory;
                        }

                        this.exports = exports;

                        if (this.map.isDefine && !this.ignore) {
                            defined[id] = exports;

                            if (req.onResourceLoad) {
                                req.onResourceLoad(context, this.map, this.depMaps);
                            }
                        }

                        //Clean up
                        cleanRegistry(id);

                        this.defined = true;
                    }

                    //Finished the define stage. Allow calling check again
                    //to allow define notifications below in the case of a
                    //cycle.
                    this.defining = false;

                    if (this.defined && !this.defineEmitted) {
                        this.defineEmitted = true;
                        this.emit('defined', this.exports);
                        this.defineEmitComplete = true;
                    }

                }
            },

            callPlugin: function() {
                var map = this.map,
                    id = map.id,
                    //Map already normalized the prefix.
                    pluginMap = makeModuleMap(map.prefix);

                //Mark this as a dependency for this plugin, so it
                //can be traced for cycles.
                this.depMaps.push(pluginMap);

                on(pluginMap, 'defined', bind(this, function(plugin) {
                    var load, normalizedMap, normalizedMod,
                        bundleId = getOwn(bundlesMap, this.map.id),
                        name = this.map.name,
                        parentName = this.map.parentMap ? this.map.parentMap.name : null,
                        localRequire = context.makeRequire(map.parentMap, {
                            enableBuildCallback: true
                        });

                    //If current map is not normalized, wait for that
                    //normalized name to load instead of continuing.
                    if (this.map.unnormalized) {
                        //Normalize the ID if the plugin allows it.
                        if (plugin.normalize) {
                            name = plugin.normalize(name, function(name) {
                                return normalize(name, parentName, true);
                            }) || '';
                        }

                        //prefix and name should already be normalized, no need
                        //for applying map config again either.
                        normalizedMap = makeModuleMap(map.prefix + '!' + name,
                            this.map.parentMap);
                        on(normalizedMap,
                            'defined', bind(this, function(value) {
                                this.init([], function() {
                                    return value;
                                }, null, {
                                    enabled: true,
                                    ignore: true
                                });
                            }));

                        normalizedMod = getOwn(registry, normalizedMap.id);
                        if (normalizedMod) {
                            //Mark this as a dependency for this plugin, so it
                            //can be traced for cycles.
                            this.depMaps.push(normalizedMap);

                            if (this.events.error) {
                                normalizedMod.on('error', bind(this, function(err) {
                                    this.emit('error', err);
                                }));
                            }
                            normalizedMod.enable();
                        }

                        return;
                    }

                    //If a paths config, then just load that file instead to
                    //resolve the plugin, as it is built into that paths layer.
                    if (bundleId) {
                        this.map.url = context.nameToUrl(bundleId);
                        this.load();
                        return;
                    }

                    load = bind(this, function(value) {
                        this.init([], function() {
                            return value;
                        }, null, {
                            enabled: true
                        });
                    });

                    load.error = bind(this, function(err) {
                        this.inited = true;
                        this.error = err;
                        err.requireModules = [id];

                        //Remove temp unnormalized modules for this module,
                        //since they will never be resolved otherwise now.
                        eachProp(registry, function(mod) {
                            if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                                cleanRegistry(mod.map.id);
                            }
                        });

                        onError(err);
                    });

                    //Allow plugins to load other code without having to know the
                    //context or how to 'complete' the load.
                    load.fromText = bind(this, function(text, textAlt) {
                        /*jslint evil: true */
                        var moduleName = map.name,
                            moduleMap = makeModuleMap(moduleName),
                            hasInteractive = useInteractive;

                        //As of 2.1.0, support just passing the text, to reinforce
                        //fromText only being called once per resource. Still
                        //support old style of passing moduleName but discard
                        //that moduleName in favor of the internal ref.
                        if (textAlt) {
                            text = textAlt;
                        }

                        //Turn off interactive script matching for IE for any define
                        //calls in the text, then turn it back on at the end.
                        if (hasInteractive) {
                            useInteractive = false;
                        }

                        //Prime the system by creating a module instance for
                        //it.
                        getModule(moduleMap);

                        //Transfer any config to this other module.
                        if (hasProp(config.config, id)) {
                            config.config[moduleName] = config.config[id];
                        }

                        try {
                            req.exec(text);
                        } catch (e) {
                            return onError(makeError('fromtexteval',
                                'fromText eval for ' + id +
                                ' failed: ' + e,
                                e, [id]));
                        }

                        if (hasInteractive) {
                            useInteractive = true;
                        }

                        //Mark this as a dependency for the plugin
                        //resource
                        this.depMaps.push(moduleMap);

                        //Support anonymous modules.
                        context.completeLoad(moduleName);

                        //Bind the value of that module to the value for this
                        //resource ID.
                        localRequire([moduleName], load);
                    });

                    //Use parentName here since the plugin's name is not reliable,
                    //could be some weird string with no path that actually wants to
                    //reference the parentName's path.
                    plugin.load(map.name, localRequire, load, config);
                }));

                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap;
            },

            enable: function() {
                enabledRegistry[this.map.id] = this;
                this.enabled = true;

                //Set flag mentioning that the module is enabling,
                //so that immediate calls to the defined callbacks
                //for dependencies do not trigger inadvertent load
                //with the depCount still being zero.
                this.enabling = true;

                //Enable each dependency
                each(this.depMaps, bind(this, function(depMap, i) {
                    var id, mod, handler;

                    if (typeof depMap === 'string') {
                        //Dependency needs to be converted to a depMap
                        //and wired up to this module.
                        depMap = makeModuleMap(depMap, (this.map.isDefine ? this.map : this.map.parentMap),
                            false, !this.skipMap);
                        this.depMaps[i] = depMap;

                        handler = getOwn(handlers, depMap.id);

                        if (handler) {
                            this.depExports[i] = handler(this);
                            return;
                        }

                        this.depCount += 1;

                        on(depMap, 'defined', bind(this, function(depExports) {
                            this.defineDep(i, depExports);
                            this.check();
                        }));

                        if (this.errback) {
                            on(depMap, 'error', bind(this, this.errback));
                        } else if (this.events.error) {
                            // No direct errback on this module, but something
                            // else is listening for errors, so be sure to
                            // propagate the error correctly.
                            on(depMap, 'error', bind(this, function(err) {
                                this.emit('error', err);
                            }));
                        }
                    }

                    id = depMap.id;
                    mod = registry[id];

                    //Skip special modules like 'require', 'exports', 'module'
                    //Also, don't call enable if it is already enabled,
                    //important in circular dependency cases.
                    if (!hasProp(handlers, id) && mod && !mod.enabled) {
                        context.enable(depMap, this);
                    }
                }));

                //Enable each plugin that is used in
                //a dependency
                eachProp(this.pluginMaps, bind(this, function(pluginMap) {
                    var mod = getOwn(registry, pluginMap.id);
                    if (mod && !mod.enabled) {
                        context.enable(pluginMap, this);
                    }
                }));

                this.enabling = false;

                this.check();
            },

            //为当前模块注册事件name
            //@name 事件名称
            //@cb 回调函数
            on: function(name, cb) {
                var cbs = this.events[name]; //事件回调
                //如果木有事件回调，则注册事件name
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            //触发当前事件name
            //@name 事件名称
            //@evt 事件对象
            emit: function(name, evt) {
                //遍历事件回调
                each(this.events[name], function(cb) {
                    cb(evt);
                });
                //如果是error事件被触发了，则只触发一次。
                if (name === 'error') {
                    //Now that the error handler was triggered, remove
                    //the listeners, since this broken Module instance
                    //can stay around for a while in the registry.
                    delete this.events[name];
                }
            }
        };

        function callGetModule(args) {
            //Skip modules already defined.
            if (!hasProp(defined, args[0])) {
                getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
            }
        }

        //移除script节点事件监听
        //@node DOM节点
        //@func 事件回调
        //@name 标准浏览器下事件名称
        //@ieName ie下事件对应名称
        function removeListener(node, func, name, ieName) {
            //Favor detachEvent because of IE9
            //issue, see attachEvent/addEventListener comment elsewhere
            //in this file.
            //IE下解除事件绑定。
            if (node.detachEvent && !isOpera) {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                //判断是否有此ie事件名称
                if (ieName) {
                    node.detachEvent(ieName, func);
                }
            } else {
                //标准浏览器下解除事件绑定。
                node.removeEventListener(name, func, false);
            }
        }

        /**
         * Given an event from a script node, get the requirejs info from it,
         * and then removes the event listeners on the node.
         * @param {Event} evt
         * @returns {Object}
         */
        //移除script节点上绑定的事件，并返回此节点相关信息。
        //@evt script节点加载事件的事件对象。
        function getScriptData(evt) {
            //Using currentTarget instead of target for Firefox 2.0's sake. Not
            //all old browsers will be supported, but this one was easy enough
            //to support and still makes sense.
            //标准浏览器下evt.currentTarget，ie浏览器下使用evt.srcElement。node为script节点。
            var node = evt.currentTarget || evt.srcElement;

            //Remove the listeners once here.
            //script节点移除'load'（ie下为onreadystatechange）、'error'事件。
            removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
            removeListener(node, context.onScriptError, 'error');

            //返回对象，包括：script节点、模块id。
            return {
                node: node, //script节点
                id: node && node.getAttribute('data-requiremodule') //模块id
            };
        }

        function intakeDefines() {
            var args;

            //Any defined modules in the global queue, intake them now.
            takeGlobalQueue();

            //Make sure any remaining defQueue items get properly processed.
            while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null) {
                    return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' + args[args.length - 1]));
                } else {
                    //args are id, deps, factory. Should be normalized by the
                    //define() function.
                    callGetModule(args);
                }
            }
        }

        //创建作用域对象，即：requirejs.s.contexts._内容。
        context = {
            config: config, //配置信息
            contextName: contextName, //作用域对象名称
            registry: registry, //模块注册缓存
            defined: defined,
            urlFetched: urlFetched,
            defQueue: defQueue,
            Module: Module,
            makeModuleMap: makeModuleMap,
            nextTick: req.nextTick, //延迟执行
            onError: onError,

            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            //配置config配置
            configure: function(cfg) {
                //Make sure the baseUrl ends in a slash.
                //确保baseUrl以'/'结尾，如：
                //'http://www.example.com/static' => 'http://www.example.com/static/'
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                        cfg.baseUrl += '/';
                    }
                }

                //Save off the paths since they require special processing,
                //they are additive.
                var shim = config.shim, //shim配置信息
                    //需要特别处理的配置项，包括：paths、bundles、config、map。
                    objs = {
                        paths: true,
                        bundles: true, //“捆绑”，将一些模块捆绑成一个模块
                        config: true,
                        map: true
                    };

                //遍历config配置内容
                eachProp(cfg, function(value, prop) {
                    //如果是paths、bundles、config、map这些配置项。
                    if (objs[prop]) {
                        //如果木有此配置项，则创建，默认为空对象。
                        if (!config[prop]) {
                            //paths、bundles、config、map这些配置项都是对象。
                            config[prop] = {};
                        }
                        //混合配置项，用新的配置信息深度递归覆盖默认配置项。
                        mixin(config[prop], value, true, true);
                    } else {
                        //如果不是paths、bundles、config、map这些配置项，则直接用新的配置信息覆盖默认配置。
                        config[prop] = value;
                    }
                });

                //Reverse map the bundles
                //“捆绑”，将一些模块捆绑成一个模块
                //参考 http://requirejs.org/docs/api.html#config-bundles
                /*  如：
                    requirejs.config({
                        bundles: {
                            'primary': ['main', 'util', 'text', 'text!template.html'],
                            'secondary': ['text!secondary.html']
                        }
                    });
                    如：生成模块捆绑后的map信息。
                    bundlesMap = {
                        'main': 'primary',
                        'util': 'primary',
                        'text': 'primary',
                        'text!template.html': 'primary',
                        'text!secondary.html': 'secondary'
                    }
                 */
                if (cfg.bundles) {
                    eachProp(cfg.bundles, function(value, prop) {
                        each(value, function(v) {
                            if (v !== prop) {
                                bundlesMap[v] = prop;
                            }
                        });
                    });
                }

                //Merge shim
                //合并shim配置
                //参考 http://requirejs.org/docs/api.html#config-shim
                /*  如：
                    requirejs.config({
                        shim: {
                            'backbone': {
                                deps: ['underscore', 'jquery'],
                                exports: 'Backbone'
                            },
                            'underscore': {
                                exports: '_'
                            },
                            'foo': {
                                deps: ['bar'],
                                exports: 'Foo',
                                init: function (bar) {
                                    return this.Foo.noConflict();
                                }
                            },
                            'jquery.scroll': ['jquery']
                        }
                    });
                 */
                if (cfg.shim) {
                    eachProp(cfg.shim, function(value, id) {
                        //Normalize the structure
                        //如:{'jquery.scroll': ['jquery']}，设置依赖。
                        if (isArray(value)) {
                            value = {
                                deps: value
                            };
                        }
                        //如果有设置exports、init、木有exportsFn，则调用context.makeShimExports生成exportsFn。
                        //即：为每个shim配置添加一个属性'exportsFn'。
                        if ((value.exports || value.init) && !value.exportsFn) {
                            value.exportsFn = context.makeShimExports(value);
                        }
                        shim[id] = value;
                    });
                    config.shim = shim;
                }

                //Adjust packages if necessary.
                //参考 http://requirejs.org/docs/api.html#packages
                /*  如：
                    require.config({
                        packages: [
                            "cart",
                            {
                                name: "store",
                                main: "store"
                            }
                        ]
                    });
                 */
                if (cfg.packages) {
                    each(cfg.packages, function(pkgObj) {
                        var location, name;

                        //如：{packages: ["cart"]} => {packages: [{name: "cart"}]}
                        pkgObj = typeof pkgObj === 'string' ? {
                            name: pkgObj
                        } : pkgObj; //如：{packages: [{name: "store",main: "store"}]}

                        name = pkgObj.name; //包名
                        location = pkgObj.location; //包路径path
                        if (location) {
                            config.paths[name] = pkgObj.location; //设置路径配置
                        }

                        //Save pointer to main module ID for pkg name.
                        //Remove leading dot in main, so main paths are normalized,
                        //and remove any trailing .js, since different package
                        //envs have different conventions: some use a module name,
                        //some use a file name.
                        //设置pkgs配置。pkgObj.name为包目录名称（相对baseUrl），
                        //pkgObj.main为main js，默认为main.js。
                        config.pkgs[name] = pkgObj.name + '/' + (pkgObj.main || 'main')
                            .replace(currDirRegExp, '') //清除目录'./'
                            .replace(jsSuffixRegExp, ''); //清除后缀'.js'
                    });
                }

                //If there are any "waiting to execute" modules in the registry,
                //update the maps for them, since their info, like URLs to load,
                //may have changed.
                //存储着已经加载好了的等待执行的模块
                eachProp(registry, function(mod, id) {
                    //If module already has init called, since it is too
                    //late to modify them, and ignore unnormalized ones
                    //since they are transient.
                    if (!mod.inited && !mod.map.unnormalized) {
                        mod.map = makeModuleMap(id);
                    }
                });

                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                //如果有依赖数组或配置回调被指定，那么将它们作为context.require的参数进行加载模块。
                //在require.js主文件加载前将requirejs设置成一个配置对象，是灰常有用的。
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },

            //根据shim配置里的(value.exports || value.init)来生成exportsFn函数。
            //最终是为了返回exports接口对象。
            makeShimExports: function(value) {
                function fn() {
                    var ret;
                    //如果有init方法，则将init方法作用域指向全局，并返回init方法执行结果。
                    /*  如：
                        requirejs.config({
                            shim: {
                                'foo': {
                                    deps: ['bar'],
                                    exports: 'Foo',
                                    init: function (bar) {
                                        return this.Foo.noConflict();
                                    }
                                }
                            }
                        });
                     */
                    if (value.init) {
                        ret = value.init.apply(global, arguments);
                    }
                    //如果木有返回值，则取全局value.exports接口并返回。
                    return ret || (value.exports && getGlobal(value.exports));
                }
                return fn;
            },

            //加载模块及依赖的主方法
            makeRequire: function(relMap, options) {
                options = options || {};

                function localRequire(deps, callback, errback) {
                    var id, map, requireMod;

                    if (options.enableBuildCallback && callback && isFunction(callback)) {
                        callback.__requireJsBuild = true;
                    }

                    if (typeof deps === 'string') {
                        if (isFunction(callback)) {
                            //Invalid call
                            return onError(makeError('requireargs', 'Invalid require call'), errback);
                        }

                        //If require|exports|module are requested, get the
                        //value for them from the special handlers. Caveat:
                        //this only works while module is being defined.
                        if (relMap && hasProp(handlers, deps)) {
                            return handlers[deps](registry[relMap.id]);
                        }

                        //Synchronous access to one module. If require.get is
                        //available (as in the Node adapter), prefer that.
                        if (req.get) {
                            return req.get(context, deps, relMap, localRequire);
                        }

                        //Normalize module name, if it contains . or ..
                        map = makeModuleMap(deps, relMap, false, true);
                        id = map.id;

                        if (!hasProp(defined, id)) {
                            return onError(makeError('notloaded', 'Module name "' +
                                id +
                                '" has not been loaded yet for context: ' +
                                contextName +
                                (relMap ? '' : '. Use require([])')));
                        }
                        return defined[id];
                    }

                    //Grab defines waiting in the global queue.
                    intakeDefines();

                    //Mark all the dependencies as needing to be loaded.
                    context.nextTick(function() {
                        //Some defines could have been added since the
                        //require call, collect them.
                        intakeDefines();

                        requireMod = getModule(makeModuleMap(null, relMap));

                        //Store if map config should be applied to this require
                        //call for dependencies.
                        requireMod.skipMap = options.skipMap;

                        requireMod.init(deps, callback, errback, {
                            enabled: true
                        });

                        checkLoaded();
                    });

                    return localRequire;
                }

                mixin(localRequire, {
                    isBrowser: isBrowser, //判断是否是浏览器环境

                    /**
                     * Converts a module name + .extension into an URL path.
                     * *Requires* the use of a module name. It does not support using
                     * plain URLs like nameToUrl.
                     */
                    //带后缀的模块名，如：'./a/b/c.js'
                    toUrl: function(moduleNamePlusExt) {
                        var ext,
                            index = moduleNamePlusExt.lastIndexOf('.'),
                            segment = moduleNamePlusExt.split('/')[0],
                            isRelative = segment === '.' || segment === '..'; //判断是否是相对路径

                        //Have a file extension alias, and it is not the
                        //dots from a relative path.
                        if (index !== -1 && (!isRelative || index > 1)) {
                            ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length); //获取后缀
                            moduleNamePlusExt = moduleNamePlusExt.substring(0, index); //获取不带后缀的模块名
                        }

                        return context.nameToUrl(normalize(moduleNamePlusExt,
                            relMap && relMap.id, true), ext, true);
                    },

                    defined: function(id) {
                        return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
                    },

                    specified: function(id) {
                        id = makeModuleMap(id, relMap, false, true).id;
                        return hasProp(defined, id) || hasProp(registry, id);
                    }
                });

                //Only allow undef on top level require calls
                if (!relMap) {
                    localRequire.undef = function(id) {
                        //Bind any waiting define() calls to this context,
                        //fix for #408
                        takeGlobalQueue();

                        var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

                        removeScript(id);

                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];

                        //Clean queued defines too. Go backwards
                        //in array so that the splices do not
                        //mess up the iteration.
                        eachReverse(defQueue, function(args, i) {
                            if (args[0] === id) {
                                defQueue.splice(i, 1);
                            }
                        });

                        if (mod) {
                            //Hold on to listeners in case the
                            //module will be attempted to be reloaded
                            //using a different config.
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events;
                            }

                            cleanRegistry(id);
                        }
                    };
                }

                return localRequire;
            },

            /**
             * Called to enable a module if it is still in the registry
             * awaiting enablement. A second arg, parent, the parent module,
             * is passed in for context, when this method is overridden by
             * the optimizer. Not shown here to keep code compact.
             */
            enable: function(depMap) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                    getModule(depMap).enable();
                }
            },

            /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
            //模块加载完毕触发的事件回调。
            //@moduleName 模块id，也即模块名称。
            completeLoad: function(moduleName) {
                var found, args, mod,
                    shim = getOwn(config.shim, moduleName) || {}, //针对当前模块的shim配置。
                    shExports = shim.exports; //shim配置中的shim.exports。

                takeGlobalQueue();

                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        args[0] = moduleName;
                        //If already found an anonymous module and bound it
                        //to this name, then this is some other anon module
                        //waiting for its completeLoad to fire.
                        if (found) {
                            break;
                        }
                        found = true;
                    } else if (args[0] === moduleName) {
                        //Found matching define call for this script!
                        found = true;
                    }

                    callGetModule(args);
                }

                //Do this after the cycle of callGetModule in case the result
                //of those calls/init calls changes the registry.
                mod = getOwn(registry, moduleName);

                if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                    if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                        if (hasPathFallback(moduleName)) {
                            return;
                        } else {
                            return onError(makeError('nodefine',
                                'No define call for ' + moduleName,
                                null, [moduleName]));
                        }
                    } else {
                        //A script that does not call define(), so just simulate
                        //the call for it.
                        callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
                    }
                }

                checkLoaded();
            },

            /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             * Note that it **does not** call normalize on the moduleName,
             * it is assumed to have already been normalized. This is an
             * internal API, not a public one. Use toUrl for the public API.
             */
            nameToUrl: function(moduleName, ext, skipExt) {
                var paths, syms, i, parentModule, url,
                    parentPath, bundleId,
                    pkgMain = getOwn(config.pkgs, moduleName);

                if (pkgMain) {
                    moduleName = pkgMain;
                }

                bundleId = getOwn(bundlesMap, moduleName);

                if (bundleId) {
                    return context.nameToUrl(bundleId, ext, skipExt);
                }

                //If a colon is in the URL, it indicates a protocol is used and it is just
                //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                //or ends with .js, then assume the user meant to use an url and not a module id.
                //The slash is important for protocol-less URLs as well as full paths.
                if (req.jsExtRegExp.test(moduleName)) {
                    //Just a plain path, not module name lookup, so just return it.
                    //Add extension if it is included. This is a bit wonky, only non-.js things pass
                    //an extension, this method probably needs to be reworked.
                    url = moduleName + (ext || '');
                } else {
                    //A module that needs to be converted to a path.
                    paths = config.paths;

                    syms = moduleName.split('/');
                    //For each module name segment, see if there is a path
                    //registered for it. Start with most specific name
                    //and work up from it.
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join('/');

                        parentPath = getOwn(paths, parentModule);
                        if (parentPath) {
                            //If an array, it means there are a few choices,
                            //Choose the one that is desired
                            if (isArray(parentPath)) {
                                parentPath = parentPath[0];
                            }
                            syms.splice(0, i, parentPath);
                            break;
                        }
                    }

                    //Join the path parts together, then figure out if baseUrl is needed.
                    url = syms.join('/');
                    url += (ext || (/^data\:|\?/.test(url) || skipExt ? '' : '.js'));
                    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                }

                return config.urlArgs ? url +
                    ((url.indexOf('?') === -1 ? '?' : '&') +
                        config.urlArgs) : url;
            },

            //Delegates to req.load. Broken out as a separate function to
            //allow overriding in the optimizer.
            load: function(id, url) {
                req.load(context, id, url);
            },

            /**
             * Executes a module callback function. Broken out as a separate function
             * solely to allow the build system to sequence the files in the built
             * layer in the right sequence.
             *
             * @private
             */
            execCb: function(name, callback, args, exports) {
                return callback.apply(exports, args);
            },

            /**
             * callback for script loads, used to check status of loading.
             *
             * @param {Event} evt the event from the browser for the script
             * that was loaded.
             */
            //脚本加载完毕回调
            //@evt {Event} evt为浏览器脚本加载回调事件对象。
            onScriptLoad: function(evt) {
                //Using currentTarget instead of target for Firefox 2.0's sake. Not
                //all old browsers will be supported, but this one was easy enough
                //to support and still makes sense.
                //用"currentTarget"代替"target"。不是所有老浏览器支持，但是目前主流浏览器都支持。
                //标准浏览器、ie下判断script节点加载完毕状态。
                if (evt.type === 'load' ||
                    (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                    //Reset interactive script so a script node is not held onto for
                    //to long.
                    //如果脚本加载完毕，则重置interactiveScript为空。
                    interactiveScript = null;

                    //Pull out the name of the module and the context.
                    //移走script节点上绑定的事件。
                    var data = getScriptData(evt);
                    /*
                        data包括：script节点、模块id。
                        data = {
                            node: node, //script节点
                            id: node && node.getAttribute('data-requiremodule') //模块id
                        };
                    */
                    context.completeLoad(data.id); //模块id
                }
            },

            /**
             * Callback for script errors.
             */
            //脚本错误回调
            onScriptError: function(evt) {
                //移除script节点事件，并返回script节点信息。
                //即：data === {node: node, id: id}。
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                    return onError(makeError('scripterror', 'Script error for: ' + data.id, evt, [data.id]));
                }
            }
        };

        //加载模块及依赖的主方法，暴露到作用域对象上。
        //如：context.require(cfg.deps || [], cfg.callback);
        context.require = context.makeRequire();
        return context;
    }

    /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
    //req为本地局部变量使用，是requirejs的引用，短名称方便，即：window.requirejs。
    //requirejs是主入口函数，参数如下：
    //@deps 指定要加载的一个依赖数组
    //@callback 回调
    //@errback 错误回调
    //@optional 可选参数
    req = requirejs = function(deps, callback, errback, optional) {

        //Find the right context, use default
        //@context {Object} 作用域对象（局部变量）
        //@config {Object} 配置对象（局部变量）
        //@contextName {Object} 作用域名称，默认为"_"（局部变量）
        var context, config,
            contextName = defContextName; //默认为"_"

        // Determine if have config object in the call.
        // 确定是否是config配置对象被传递进来。即：如果参数deps不是数组和字符串，则认为是config配置信息。
        // 如：requirejs({...}, ['a', 'b'], function(){...});
        // 如果deps是函数呢？
        if (!isArray(deps) && typeof deps !== 'string') {
            // deps is a config object
            // 参数deps为配置信息对象。
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                // 如果有依赖，就调整参数。
                // 即：requirejs({...}, ['a', 'b'], function(){...}, function(){...});
                deps = callback;
                callback = errback;
                errback = optional;
            } else {
                // 即：requirejs({...}, function(){...});
                deps = [];
            }
        }

        //如果有配置config，且有config.context设置（作用域名称，默认为"_"），
        //则将默认的"_"替换为配置中的config.context内容。
        //如：config.context === '__'。
        if (config && config.context) {
            contextName = config.context;
        }

        //判断作用域contexts里是否存在contextName内容，如：
        //contexts = {_: {...}}
        context = getOwn(contexts, contextName);
        //如果不存在，则用req.s.newContext方法依据contextName来创建作用域对象。
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName);
        }

        //如果有配置信息，则调用context.configure方法处理配置。
        if (config) {
            context.configure(config);
        }

        //调用context.require方法加载模块及依赖。
        return context.require(deps, callback, errback);
    };

    /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
    //配置函数，将config配置传递给req方法。即：requirejs.config(config)等价requirejs(config)。
    req.config = function(config) {
        return req(config);
    };

    /**
     * Execute something after the current tick
     * of the event loop. Override for other envs
     * that have a better solution than setTimeout.
     * @param  {Function} fn function to execute later.
     */
    //回调延迟执行
    req.nextTick = typeof setTimeout !== 'undefined' ? function(fn) {
        setTimeout(fn, 4);
    } : function(fn) {
        fn();
    };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    //如果全局变量require不存在，则将req（requirejs）赋给require变量。
    //其实，require === requirejs。
    if (!require) {
        require = req;
    }

    //requireJS版本
    req.version = version;

    //Used to filter out dependencies that are already paths.
    req.jsExtRegExp = /^\/|:|\?|\.js$/; //用于过滤出哪些依赖已经是paths。
    req.isBrowser = isBrowser; //是否是浏览器环境
    //设置require.s或requirejs.s对象内容。
    //@contexts 作用域对象
    //@newContext 创建作用域对象的方法
    s = req.s = {
        contexts: contexts,
        newContext: newContext
    };

    //Create default context.
    //创建（初始化）默认的作用域对象。
    req({});

    //Exports some context-sensitive methods on global require.
    //为全局变量require（或requirejs）添加常用方法：toUrl、undef、defined、specified。
    //这些方法来自contexts[defContextName].require方法的静态方法引用（并将这些方法的作用域指向了contexts[defContextName]）。
    each([
        'toUrl',
        'undef',
        'defined',
        'specified'
    ], function(prop) {
        //Reference from contexts instead of early binding to default context,
        //so that during builds, the latest instance of the default context
        //with its config gets used.
        req[prop] = function() {
            //ctx = contexts[_]
            var ctx = contexts[defContextName];
            //调用ctx.require相应方法，作用域指向ctx。
            return ctx.require[prop].apply(ctx, arguments);
        };
    });

    //如果是浏览器环境，则设置req.s.head（head元素或base元素的父节点）。
    if (isBrowser) {
        //获取页面上head元素节点。不能用document.head获取head元素（IE<=8不能获取到）。
        head = s.head = document.getElementsByTagName('head')[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //bug参考 http://dev.jquery.com/ticket/2709
        //base参考 http://www.w3school.com.cn/tags/tag_base.asp
        //如果页面head元素里有base元素节点，则避免ie6下bug，所以会采用head.insertBefore(node, baseElement)方式。
        //否则采用head.appendChild(node)方式将script节点插入文档拉取其内容。
        baseElement = document.getElementsByTagName('base')[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode;
        }
    }

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
    //任何错误需要显示的生成将被传递给这个函数，
    //如果想自定义错误处理，可以重载此回调函数。
    req.onError = defaultOnError;

    /**
     * Creates the node for the load command. Only used in browser envs.
     */
    //仅仅在浏览器环境下创建script节点
    req.createNode = function(config, moduleName, url) {
        //如果是xhtml模式文档，则创建带有命名空间的script节点。
        var node = config.xhtml ?
            document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
            document.createElement('script');
        //设置节点类型
        node.type = config.scriptType || 'text/javascript';
        //设置编码类型
        node.charset = 'utf-8';
        //异步加载
        node.async = true;
        return node;
    };

    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
    //拉取script节点内容。
    //浏览器环境下，请求模块url，加载模块内容。
    //其他环境中，允许弄一个单独的函数去覆盖此函数。
    req.load = function(context, moduleName, url) {
        //如果有context作用域对象，则取其config配置对象。
        var config = (context && context.config) || {},
            node;
        if (isBrowser) {
            //In the browser so use a script tag
            //浏览器环境下，创建一个script元素节点
            node = req.createNode(config, moduleName, url);

            //设置作用域对象名称和模块名称属性
            node.setAttribute('data-requirecontext', context.contextName); //默认为"_"
            node.setAttribute('data-requiremodule', moduleName); //模块名称

            //Set up load listener. Test attachEvent first because IE9 has
            //a subtle issue in its addEventListener and script onload firings
            //that do not match the behavior of all other browsers with
            //addEventListener support, which fire the onload event for a
            //script right after the script execution. See:
            //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
            //UNFORTUNATELY Opera implements attachEvent but does not follow the script
            //script execution mode.
            //设置script节点加载监听器。
            //IE9下优先使用attachEvent方法，因为IE9的addEventListener方法有个小问题（
            //使用addEventListener方法监听script节点的onload事件时onload事件触发行为跟其他浏览器不一致）。
            if (node.attachEvent &&
                //Check if node.attachEvent is artificially added by custom script or
                //natively supported by browser
                //read https://github.com/jrburke/requirejs/issues/187
                //if we can NOT find [native code] then it must NOT natively supported.
                //in IE8, node.attachEvent does not have toString()
                //Note the test for "[native code" with no closing brace, see:
                //https://github.com/jrburke/requirejs/issues/273
                //1.首先检测node.attachEvent方法是浏览器原生方法还是手动自定义添加的。
                //2.如果在node.attachEvent.toString()结果中不能找到"[native code]"字符串时，它肯定不是浏览器原生方法。
                //3.IE<=8的node.attachEvent方法木有toString方法。
                //4.如果IE浏览器支持attachEvent()或addEventListener()方法，在使用HtmlUnit 2.8(in IE7 mode)测试环境中，
                //  node.attachEvent.toString()方法返回的字符串为"[native code, arity=2"]。
                !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                !isOpera) {
                //Probably IE. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous define call to a name.
                //However, IE reports the script as being in 'interactive'
                //readyState at the time of the define call.
                //可能IE（至少IE6-8）不能正确触发script脚本的onload事件（在脚本执行完毕后）。
                //然而我们不可能去标识一个name去记录当前正在执行define的模块。
                //还好，IE
                useInteractive = true;

                //给script节点绑定'onreadystatechange'事件监听脚本加载情况，判断是否加载完毕。
                node.attachEvent('onreadystatechange', context.onScriptLoad);
                //It would be great to add an error handler here to catch
                //404s in IE9+. However, onreadystatechange will fire before
                //the error handler, so that does not help. If addEventListener
                //is used, then IE will fire error before load, but we cannot
                //use that pathway given the connect.microsoft.com issue
                //mentioned above about not doing the 'script execute,
                //then fire the script load event listener before execute
                //next script' that other browsers do.
                //Best hope: IE10 fixes the issues,
                //and then destroys all installs of IE 6-9.
                //node.attachEvent('onerror', context.onScriptError);
                //标准浏览器下给script节点绑定'load'和'error'事件。
                //1.IE9+可以给script节点添加一个错误回调去监听脚本404状态。然而，onreadystatechange事件会
                //  在错误回调之前被触发，所以没啥用。如果IE9+使用addEventListener方法，错误回调会在load事件前触发。
                //  但是它不能像其他浏览器一样做到'script execute,then fire the script load event listener before execute next script'。
                //  例如：当前a脚本加载完毕（下个脚本b也可能加载完毕）-> a执行完毕 -> a的load事件触发 -> b执行完毕 -> b的load事件触发。
            } else {
                node.addEventListener('load', context.onScriptLoad, false); //判断是否加载完毕
                node.addEventListener('error', context.onScriptError, false); //判断是否加载出错，如：404错误。
            }
            //注意node.src赋值顺序，建议最好先给node绑定事件，后设置src属性值。
            node.src = url;

            //For some cache cases in IE 6-8, the script executes before the end
            //of the appendChild execution, so to tie an anonymous define
            //call to the module name (which is stored on the node), hold on
            //to a reference to this node, but clear after the DOM insertion.
            //IE6-8在某些缓存情况下，脚本会在插入DOM完成前执行。
            //当前正在增加的script节点。
            currentlyAddingScript = node;
            //将script节点追加到head节点。
            if (baseElement) {
                head.insertBefore(node, baseElement); //head里base元素bug导致，使用insertBefore代替appendChild方法。
            } else {
                head.appendChild(node);
            }
            //清空变量currentlyAddingScript，防止ie内存泄漏。
            currentlyAddingScript = null;

            return node;
        } else if (isWebWorker) {
            //webWorker环境下，使用全局importScripts方法。
            //但是，importScripts不是非常高效，它会导致阻塞直到脚本下载完毕。
            //然而，如果是webWorker环境，期望的是仅仅加载一个脚本就好。
            //如果是其他情况，需要重新考虑了。
            try {
                //In a web worker, use importScripts. This is not a very
                //efficient use of importScripts, importScripts will block until
                //its script is downloaded and evaluated. However, if web workers
                //are in play, the expectation that a build has been done so that
                //only one script needs to be loaded anyway. This may need to be
                //reevaluated if other use cases become common.
                importScripts(url);

                //Account for anonymous modules
                context.completeLoad(moduleName);
            } catch (e) {
                //如果出现异常，则生成错误并抛出。
                context.onError(makeError('importscripts',
                    'importScripts failed for ' +
                    moduleName + ' at ' + url,
                    e, [moduleName]));
            }
        }
    };

    //获取状态为"interactive"的script节点。
    function getInteractiveScript() {
        //如果有此状态的script节点，则返回此节点
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        //反序遍历script节点，直到找到状态为此状态的节点，然后返回。
        eachReverse(scripts(), function(script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    //Look for a data-main script attribute, which could also adjust the baseUrl.
    //如果是浏览器平台，且木有配置skipDataMain，即：cfg.skipDataMain === false或undefined。
    //查找有'data-main'属性的script节点，获取main模块mainScript，设置cfg.baseUrl，收集依赖cfg.deps。
    if (isBrowser && !cfg.skipDataMain) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        //反向遍历script节点，找到baseUrl。
        eachReverse(scripts(), function(script) {
            //Set the 'head' where we can append children by
            //using the script's parent.
            //如果木有document.getElementsByTagName('head')或baseElement.parentNode，
            //则将当前script节点的父节点作为head节点（也即拉取模块节点时要追加到的节点）。
            if (!head) {
                head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load. If it is there, the path to data main becomes the
            //baseUrl, if it is not already set.
            //如果script节点有属性'data-main'，则把其值作为baseUrl。
            dataMain = script.getAttribute('data-main');
            if (dataMain) {
                //Preserve dataMain in case it is a path (i.e. contains '?')
                //如：'js/main.js'
                mainScript = dataMain;

                //Set final baseUrl if there is not already an explicit one.
                //如果木有配置cfg.baseUrl
                if (!cfg.baseUrl) {
                    //Pull off the directory of data-main for use as the
                    //baseUrl.
                    //从data-main属性中分析出baseUrl。
                    src = mainScript.split('/'); //如：'js/main.js' => ['js', 'main.js']
                    mainScript = src.pop(); //main模块，如：'main.js'。
                    //获取main模块所在的目录，如果木有，则为当前html文档所在目录。
                    //如：'js/main.js' => 'js/'; 或 'main.js' => './';
                    subPath = src.length ? src.join('/') + '/' : './';
                    //设置baseUrl
                    cfg.baseUrl = subPath;
                }

                //Strip off any trailing .js since mainScript is now
                //like a module name.
                //去掉main模块的后缀'.js'，如：'main.js' => 'main'。
                mainScript = mainScript.replace(jsSuffixRegExp, '');

                //If mainScript is still a path, fall back to dataMain
                //如果mainScript已经是一个path
                if (req.jsExtRegExp.test(mainScript)) {
                    mainScript = dataMain;
                }

                //Put the data-main script in the files to load.
                //如果有默认模块依赖配置，则将mainScript加入依赖数组。
                //如：var requirejs = {deps: ['a', 'b']}。
                cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];

                //返回true，则中断eachReverse函数遍历script节点。
                return true;
            }
        });
    }

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    //这是一个定义模块的函数句柄。不同于requirejs/require函数的是：
    //1.一个字符串参数必定是第一个参数。
    //2.此函数句柄在当前模块所有依赖加载完毕后才能执行。
    //3.所有依赖模块返回值作为模块接口。
    //定义模块的函数。callback回调在此模块的所有依赖被加载完毕后执行。
    //依赖模块返回值作为callback回调的参数。
    define = function(name, deps, callback) {
        var node, context;

        //Allow for anonymous modules
        //定义一个匿名模块，如：define(['jquery'], function(){...});
        if (typeof name !== 'string') {
            //Adjust args appropriately
            //相应的调整参数
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        //定义该模块的时候未手动写上此模块的所有依赖模块，如：
        //define('jquery', function(){...}); 或 define(function(){...});
        if (!isArray(deps)) {
            callback = deps;
            deps = null;
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        //如果定义此模块时，写明了模块依赖，则不会去计算判断当前模块的依赖，否则会通过正则判断其模块依赖。
        //如：define('jquery', function(){...}); 或 define(function(){...});（可能是一个CommonJS模块）。
        if (!deps && isFunction(callback)) {
            deps = [];
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies,
            //but only if there are function args.
            //仅当callback回调有参数时（型参），才从callback回调字符串里移除注释字符串，
            //并查找其依赖模块，将他们收集放入deps数组。
            if (callback.length) {
                callback
                    .toString() //获取callback回调字符串
                    .replace(commentRegExp, '') //将代码中得注释清空
                    //提取依赖，如：require("a") => ["a"]
                    .replace(cjsRequireRegExp, function(match, dep) {
                        deps.push(dep);
                    });

                //May be a CommonJS thing even without require calls, but still
                //could use exports, and module. Avoid doing exports and module
                //work though if it just needs require.
                //REQUIRES the function to expect the CommonJS variables in the
                //order listed below.
                //生成模块依赖数组。
                deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous define() call, do the interactive
        //work.
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute('data-requiremodule');
                }
                context = contexts[node.getAttribute('data-requirecontext')];
            }
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs. If no context, use the global queue, and get it processed
        //in the onscript load callback.
        (context ? context.defQueue : globalDefQueue).push([name, deps, callback]);
    };

    //jQuery对AMD的支持标志。jQuery1.7开始支持AMD规范，jQuery1.11.1去掉了对define.amd.jQuery的判断。
    //参考 http://www.css88.com/archives/4826
    /*
        如：
        if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
            define( "jquery", [], function () { return jQuery; } );
        }
    */
    define.amd = {
        jQuery: true
    };


    /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
    //执行js的函数
    req.exec = function(text) {
        /*jslint evil: true */
        return eval(text);
    };

    //Set up with config info.
    //依据cfg配置信息加载模块或依赖。
    req(cfg);
}(this));
