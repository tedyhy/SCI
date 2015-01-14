/**
 * animation using js timer
 * @author yiminghe@gmail.com
 * @ignore
 */
KISSY.add(function (S,require) {
    var Dom = require('dom');
    var AnimBase = require('./base');
    var Easing = require('./timer/easing');
    var AM = require('./timer/manager');
    var Fx = require('./timer/fx');
    var SHORT_HANDS = require('./timer/short-hand');
    require('./timer/color');
    require('./timer/transform');

    var camelCase = Dom._camelCase,
        NUMBER_REG = /^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i;

    function Anim() {
        var self = this,
            to;
        Anim.superclass.constructor.apply(self, arguments);
        // camel case uniformity
        S.each(to = self.to, function (v, prop) {
            var camelProp = camelCase(prop);
            if (prop !== camelProp) {
                to[camelProp] = to[prop];
                delete to[prop];
            }
        });
    }

    S.extend(Anim, AnimBase, {
        prepareFx: function () {
            var self = this,
                node = self.node,
                _propsData = self._propsData;

            S.each(_propsData, function (_propData) {
                // ms
                _propData.duration *= 1000;
                _propData.delay *= 1000;
                if (typeof _propData.easing === 'string') {
                    _propData.easing = Easing.toFn(_propData.easing);
                }
            });

            // 扩展分属性
            S.each(SHORT_HANDS, function (shortHands, p) {
                var origin,
                    _propData = _propsData[p],
                    val;
                if (_propData) {
                    val = _propData.value;
                    origin = {};
                    S.each(shortHands, function (sh) {
                        // 得到原始分属性之前值
                        origin[sh] = Dom.css(node, sh);
                    });
                    Dom.css(node, p, val);
                    S.each(origin, function (val, sh) {
                        // 如果分属性没有显式设置过，得到期待的分属性最后值
                        if (!(sh in _propsData)) {
                            _propsData[sh] = S.merge(_propData, {
                                value: Dom.css(node, sh)
                            });
                        }
                        // 还原
                        Dom.css(node, sh, val);
                    });
                    // 删除复合属性
                    delete _propsData[p];
                }
            });

            var prop,
                _propData,
                val,
                to,
                from,
                propCfg,
                fx,
                isCustomFx = 0,
                unit,
                parts;

            if (S.isPlainObject(node)) {
                isCustomFx = 1;
            }

            // 取得单位，并对单个属性构建 Fx 对象
            for (prop in _propsData) {
                _propData = _propsData[prop];
                val = _propData.value;
                propCfg = {
                    isCustomFx: isCustomFx,
                    prop: prop,
                    anim: self,
                    fxType: _propData.fxType,
                    type: _propData.type,
                    propData: _propData
                };
                fx = Fx.getFx(propCfg);

                to = val;

                from = fx.cur();

                val += '';
                unit = '';
                parts = val.match(NUMBER_REG);

                if (parts) {
                    to = parseFloat(parts[2]);
                    unit = parts[3];

                    // 有单位但单位不是 px
                    if (unit && unit !== 'px' && from) {
                        var tmpCur = 0,
                            to2 = to;
                        do {
                            ++to2;
                            Dom.css(node, prop, to2 + unit);
                            // in case tmpCur==0
                            tmpCur = fx.cur();
                        } while (tmpCur === 0);
                        from = (to2 / tmpCur) * from;
                        Dom.css(node, prop, from + unit);
                    }

                    // 相对
                    if (parts[1]) {
                        to = ( (parts[ 1 ] === '-=' ? -1 : 1) * to ) + from;
                    }
                }

                propCfg.from = from;
                propCfg.to = to;
                propCfg.unit = unit;
                fx.load(propCfg);
                _propData.fx = fx;
            }
        },

        // frame of animation
        frame: function () {
            var self = this,
                prop,
                end = 1,
                fx,
                _propData,
                _propsData = self._propsData;
            for (prop in _propsData) {
                _propData = _propsData[prop];
                fx = _propData.fx;
                fx.frame();
                // in case call stop in frame
                if (self.isRejected() || self.isResolved()) {
                    return;
                }
                end &= fx.pos === 1;
            }
            var currentTime = S.now(),
                duration = self.config.duration * 1000,
                remaining = Math.max(0,
                    self.startTime + duration - currentTime),
                temp = remaining / duration || 0,
                percent = 1 - temp;
            self.defer.notify([self, percent, remaining]);
            if (end) {
                // complete 事件只在动画到达最后一帧时才触发
                self.stop(end);
            }
        },

        doStop: function (finish) {
            var self = this,
                prop,
                fx,
                _propData,
                _propsData = self._propsData;
            AM.stop(self);
            if (finish) {
                for (prop in _propsData) {
                    _propData = _propsData[prop];
                    fx = _propData.fx;
                    // fadeIn() -> call stop
                    if (fx) {
                        fx.frame(1);
                    }
                }
            }
        },

        doStart: function () {
            AM.start(this);
        }
    });

    Anim.Easing = Easing;
    Anim.Fx = Fx;

    return Anim;
});
/*
 2013-09
 - support custom anim object

 2013-01 yiminghe@gmail.com
 - 分属性细粒度控制 {'width':{value:,easing:,fx: }}
 - 重构，merge css3 transition and js animation

 2011-11 yiminghe@gmail.com
 - 重构，抛弃 emile，优化性能，只对需要的属性进行动画
 - 添加 stop/stopQueue/isRunning，支持队列管理

 2011-04 yiminghe@gmail.com
 - 借鉴 yui3 ，中央定时器，否则 ie6 内存泄露？
 - 支持配置 scrollTop/scrollLeft

 - 效率需要提升，当使用 nativeSupport 时仍做了过多动作
 - opera nativeSupport 存在 bug ，浏览器自身 bug ?
 - 实现 jQuery Effects 的 queue / specialEasing / += / 等特性

 NOTES:
 - 与 emile 相比，增加了 borderStyle, 使得 border: 5px solid #ccc 能从无到有，正确显示
 - api 借鉴了 YUI, jQuery 以及 http://www.w3.org/TR/css3-transitions/
 - 代码实现了借鉴了 Emile.js: http://github.com/madrobby/emile *
 */
