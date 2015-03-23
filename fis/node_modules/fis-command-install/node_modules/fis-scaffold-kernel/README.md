fis-scaffold-kernel
===================

### INSTALL

```bash
$ npm install fis-scaffold-kernel --save
```

### API

```javascript
var options = {
    type: 'github', //default `lights`; support github,gitlab,lights
    log: {
        writer: stdout, //default `stdout`
        level: 0 //default show all log; set `0` == silent.
    }
}
var scaffold = new (require('fis-scaffold-kernel'))(options);
```

#### scaffold.download(id, cb)

download a component from the repos(github, gitlab, lights)

```javascript
scaffold.download('xiangshouding/glob.js@master', function (err, temp_path) {
    //balabalabala...
});
```

#### scaffold.prompt(schema, cb)

https://github.com/flatiron/prompt

```javascript
scaffold.prompt([{name: 'test'}], function (err, result) {
    //...
});
```

#### scaffold.deliver(from, to, roadmap)

deliver all files from `from` to `to`

```javascript
scaffold.deliver('./from', './to', [
    {
        reg: '*.js',
        release: 'js/$&'
    }, {
        reg: '**',
        release: false
    }
]);
```

#### scaffold.release(id, to, schema, roadmap, cb)

```javascript
scaffold.release(
    'xiangshouding/glob.js@master',
    __dirname + '/output',
    [],
    [
        {
            reg: '*glob.js',
            release: 'glob/$&'
        },
        {
            reg: '*',
            release: false
        }
    ],
    function (err) {
        console.log(err);
    }
);
```
or

new replacer

```javascript
scaffold.release(
    'xiangshouding/glob.js@master',
    __dirname + '/output',
    function (tmp_path, done) {
        var files = scaffold.util.find(tmp_path);
        scaffold.prompt([{name: 'glob'}], function (err, results) {
            if (err) {
                //if
                    //done()
                //else
                    //scaffold.deliver(tmp_path, to, roadmap);
                return;
            }
            
            //replace...
            //if
                //done()
            //else
                //scaffold.deliver(tmp_path, to, roadmap);
        });
    },
    [
        {
            reg: '*glob.js',
            release: 'glob/$&'
        },
        {
            reg: '*',
            release: false
        }
    ],
    function (err) {
        console.log(err);
    }
);
```