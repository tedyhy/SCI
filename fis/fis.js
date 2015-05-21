/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

//kernel
//加载fis-kernel模块
var fis = module.exports = require('fis-kernel');

//merge standard conf
//增加modules配置信息
fis.config.merge({
    modules : {
        preprocessor: { //预处理器
            js: 'components',
            css: 'components',
            html: 'components'
        },
        postprocessor : { //后处理器
            js : 'jswrapper'
        },
        optimizer : { //优化器
            js : 'uglify-js',
            css : 'clean-css',
            png : 'png-compressor'
        },
        spriter : 'csssprites', //雪碧图工具
        packager : 'map',
        deploy : 'default', //部署
        prepackager: 'derived'
    }
});

//exports cli object
//创建命名空间 fis.cli
fis.cli = {};

fis.cli.name = 'fis';

//colors
//colors工具
fis.cli.colors = require('colors');

//commander object
//commander工具
fis.cli.commander = null;

//package.json
//读取package.json文件内容
//__dirname为命令执行目录
fis.cli.info = fis.util.readJSON(__dirname + '/package.json');

//output help info
//帮助方法简介，包括各种标准命令用法，如：fis -h 或 fis --help。
fis.cli.help = function(){
    var content = [
        '',
        '  Usage: ' + fis.cli.name + ' <command>',
        '',
        '  Commands:',
        ''
    ];

    fis.cli.help.commands.forEach(function(name){
        /*cmd如下：
            cmd = {
                name: 'release',
                desc: 'build and deploy your project',
                register: function(){}
            };
        */
        var cmd = fis.require('command', name);
        name = cmd.name || name;
        name = fis.util.pad(name, 12); //'release     '
        content.push('    ' + name + (cmd.desc || ''));
    });

    content = content.concat([
        '',
        '  Options:',
        '',
        '    -h, --help     output usage information',
        '    -v, --version  output the version number',
        '    --no-color     disable colored output',
        ''
    ]);
    console.log(content.join('\n'));
};

//fis三条主要的命令
fis.cli.help.commands = [ 'release', 'install', 'server' ];

//output version info
//获取版本信息方法
fis.cli.version = function(){
    var content = [
        '',
        '  v' + fis.cli.info.version,
        '',
        ' __' + '/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'.bold.red + '__' + '/\\\\\\\\\\\\\\\\\\\\\\'.bold.yellow + '_____' + '/\\\\\\\\\\\\\\\\\\\\\\'.bold.green + '___',
        '  _' + '\\/\\\\\\///////////'.bold.red + '__' + '\\/////\\\\\\///'.bold.yellow + '____' + '/\\\\\\/////////\\\\\\'.bold.green + '_' + '       ',
        '   _' + '\\/\\\\\\'.bold.red + '_________________' + '\\/\\\\\\'.bold.yellow + '______' + '\\//\\\\\\'.bold.green + '______' + '\\///'.bold.green + '__',
        '    _' + '\\/\\\\\\\\\\\\\\\\\\\\\\'.bold.red + '_________' + '\\/\\\\\\'.bold.yellow + '_______' + '\\////\\\\\\'.bold.green + '_________' + '     ',
        '     _' + '\\/\\\\\\///////'.bold.red + '__________' + '\\/\\\\\\'.bold.yellow + '__________' + '\\////\\\\\\'.bold.green + '______' + '    ',
        '      _' + '\\/\\\\\\'.bold.red + '_________________' + '\\/\\\\\\'.bold.yellow + '_____________' + '\\////\\\\\\'.bold.green + '___' + '   ',
        '       _' + '\\/\\\\\\'.bold.red + '_________________' + '\\/\\\\\\'.bold.yellow + '______' + '/\\\\\\'.bold.green + '______' + '\\//\\\\\\'.bold.green + '__',
        '        _' + '\\/\\\\\\'.bold.red + '______________' + '/\\\\\\\\\\\\\\\\\\\\\\'.bold.yellow + '_' + '\\///\\\\\\\\\\\\\\\\\\\\\\/'.bold.green + '___',
        '         _' + '\\///'.bold.red + '______________' + '\\///////////'.bold.yellow + '____' + '\\///////////'.bold.green + '_____',
        ''
    ].join('\n');
    console.log(content);
};

//循环判断argv里是否有参数search
//@argv {Array}
//@search {String}
function hasArgv(argv, search){
    var pos = argv.indexOf(search);
    var ret = false;
    while(pos > -1){
        argv.splice(pos, 1);
        pos = argv.indexOf(search);
        ret = true;
    }
    return ret;
}

//run cli tools
//fis启动接口方法，argv参数为process.argv，即：[ 'node', '/Users/hanli/git/SCI/fis/bin/fis', ... ]。
fis.cli.run = function(argv){
    // console.log(argv)
    fis.processCWD = process.cwd(); //process.cwd()返回当前进程的工作目录，如："/Users/hanli/git/SCI/fis"

    //如果有参数'--no-color'，则说明console输出不带color。
    if(hasArgv(argv, '--no-color')){
        fis.cli.colors.mode = 'none'; //控制台输出颜色模式
    }

    //如：$ bin/fis -v => first === '-v'
    var first = argv[2];
    //查看fis帮助信息，如：fis 或 fis -h 或 fis --help。
    if(argv.length < 3 || first === '-h' ||  first === '--help'){
        fis.cli.help();
    //查看fis版本信息，如：fis -v 或 fis --version。
    } else if(first === '-v' || first === '--version'){
        fis.cli.version();
    //查看fis帮助信息，如：fis -。
    } else if(first[0] === '-'){
        fis.cli.help();
    //否则加载'commander'模块，分析命令调用相应命令。
    } else {
        //register command
        //通过command模块构建[ 'release', 'install', 'server' ]3个命令的命令控制台。
        //参考https://www.npmjs.com/package/commander
        var commander = fis.cli.commander = require('commander');
        /*cmd如下：
            cmd = {
                name: 'release',
                desc: 'build and deploy your project',
                register: function(){}
            };
        */
        var cmd = fis.require('command', argv[2]);
        cmd.register(
            //返回一个对象（注册的commander选项）作为参数传给cmd.register回调。
            commander
                .command(cmd.name || first)
                .usage(cmd.usage) //暂时未定义
                .description(cmd.desc)
        );
        //分析命令行参数，即：commander.parse(process.argv);
        commander.parse(argv);
    }
};
