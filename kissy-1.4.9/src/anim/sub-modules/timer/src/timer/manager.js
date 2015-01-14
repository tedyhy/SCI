/**
 * @ignore
 * single timer for the whole anim module
 * @author yiminghe@gmail.com
 */
KISSY.add(function (S) {
    var stamp = S.stamp,
        win = S.Env.host,
    // note in background tab, interval is set to 1s in chrome/firefox
    // no interval change in ie for 15, if interval is less than 15
    // then in background tab interval is changed to 15
        INTERVAL = 15,
    // https://gist.github.com/paulirish/1579671
        requestAnimationFrameFn,
        cancelAnimationFrameFn;

    // http://bugs.jquery.com/ticket/9381
    if (0) {
        requestAnimationFrameFn = win.requestAnimationFrame;
        cancelAnimationFrameFn = win.cancelAnimationFrame;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !requestAnimationFrameFn; ++x) {
            requestAnimationFrameFn = win[vendors[x] + 'RequestAnimationFrame'];
            cancelAnimationFrameFn = win[vendors[x] + 'CancelAnimationFrame'] ||
                win[vendors[x] + 'CancelRequestAnimationFrame'];
        }
    } else {
        requestAnimationFrameFn = function (fn) {
            return setTimeout(fn, INTERVAL);
        };
        cancelAnimationFrameFn = function (timer) {
            clearTimeout(timer);
        };
    }

    return {
        runnings: {},

        timer: null,

        start: function (anim) {
            var self = this,
                kv = stamp(anim);
            if (self.runnings[kv]) {
                return;
            }
            self.runnings[kv] = anim;
            self.startTimer();
        },

        stop: function (anim) {
            this.notRun(anim);
        },

        notRun: function (anim) {
            var self = this,
                kv = stamp(anim);
            delete self.runnings[kv];
            if (S.isEmptyObject(self.runnings)) {
                self.stopTimer();
            }
        },

        pause: function (anim) {
            this.notRun(anim);
        },

        resume: function (anim) {
            this.start(anim);
        },

        startTimer: function () {
            var self = this;
            if (!self.timer) {
                self.timer = requestAnimationFrameFn(function run() {
                    if (self.runFrames()) {
                        self.stopTimer();
                    } else {
                        self.timer = requestAnimationFrameFn(run);
                    }
                });
            }
        },

        stopTimer: function () {
            var self = this,
                t = self.timer;
            if (t) {
                cancelAnimationFrameFn(t);
                self.timer = 0;
            }
        },

        runFrames: function () {
            var self = this,
                r,
                flag,
                runnings = self.runnings;
            for (r in runnings) {
                // in case stop in frame
                runnings[r].frame();
            }
            //noinspection LoopStatementThatDoesntLoopJS
            for (r in runnings) {
                flag = 0;
                break;
            }
            return flag === undefined;
        }
    };
});
/**
 * @ignore
 *
 * !TODO: deal with https://developers.google.com/chrome/whitepapers/pagevisibility
 */