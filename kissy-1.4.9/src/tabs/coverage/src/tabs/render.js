function BranchData() {
    this.position = -1;
    this.nodeLength = -1;
    this.src = null;
    this.evalFalse = 0;
    this.evalTrue = 0;

    this.init = function(position, nodeLength, src) {
        this.position = position;
        this.nodeLength = nodeLength;
        this.src = src;
        return this;
    }

    this.ranCondition = function(result) {
        if (result)
            this.evalTrue++;
        else
            this.evalFalse++;
    };

    this.pathsCovered = function() {
        var paths = 0;
        if (this.evalTrue > 0)
          paths++;
        if (this.evalFalse > 0)
          paths++;
        return paths;
    };

    this.covered = function() {
        return this.evalTrue > 0 && this.evalFalse > 0;
    };

    this.toJSON = function() {
        return '{"position":' + this.position
            + ',"nodeLength":' + this.nodeLength
            + ',"src":' + jscoverage_quote(this.src)
            + ',"evalFalse":' + this.evalFalse
            + ',"evalTrue":' + this.evalTrue + '}';
    };

    this.message = function() {
        if (this.evalTrue === 0 && this.evalFalse === 0)
            return 'Condition never evaluated         :\t' + this.src;
        else if (this.evalTrue === 0)
            return 'Condition never evaluated to true :\t' + this.src;
        else if (this.evalFalse === 0)
            return 'Condition never evaluated to false:\t' + this.src;
        else
            return 'Condition covered';
    };
}

BranchData.fromJson = function(jsonString) {
    var json = eval('(' + jsonString + ')');
    var branchData = new BranchData();
    branchData.init(json.position, json.nodeLength, json.src);
    branchData.evalFalse = json.evalFalse;
    branchData.evalTrue = json.evalTrue;
    return branchData;
};

BranchData.fromJsonObject = function(json) {
    var branchData = new BranchData();
    branchData.init(json.position, json.nodeLength, json.src);
    branchData.evalFalse = json.evalFalse;
    branchData.evalTrue = json.evalTrue;
    return branchData;
};

function buildBranchMessage(conditions) {
    var message = 'The following was not covered:';
    for (var i = 0; i < conditions.length; i++) {
        if (conditions[i] !== undefined && conditions[i] !== null && !conditions[i].covered())
          message += '\n- '+ conditions[i].message();
    }
    return message;
};

function convertBranchDataConditionArrayToJSON(branchDataConditionArray) {
    var array = [];
    var length = branchDataConditionArray.length;
    for (var condition = 0; condition < length; condition++) {
        var branchDataObject = branchDataConditionArray[condition];
        if (branchDataObject === undefined || branchDataObject === null) {
            value = 'null';
        } else {
            value = branchDataObject.toJSON();
        }
        array.push(value);
    }
    return '[' + array.join(',') + ']';
}

function convertBranchDataLinesToJSON(branchData) {
    if (branchData === undefined) {
        return '{}'
    }
    var json = '';
    for (var line in branchData) {
        if (json !== '')
            json += ','
        json += '"' + line + '":' + convertBranchDataConditionArrayToJSON(branchData[line]);
    }
    return '{' + json + '}';
}

function convertBranchDataLinesFromJSON(jsonObject) {
    if (jsonObject === undefined) {
        return {};
    }
    for (var line in jsonObject) {
        var branchDataJSON = jsonObject[line];
        if (branchDataJSON !== null) {
            for (var conditionIndex = 0; conditionIndex < branchDataJSON.length; conditionIndex ++) {
                var condition = branchDataJSON[conditionIndex];
                if (condition !== null) {
                    branchDataJSON[conditionIndex] = BranchData.fromJsonObject(condition);
                }
            }
        }
    }
    return jsonObject;
}
function jscoverage_quote(s) {
    return '"' + s.replace(/[\u0000-\u001f"\\\u007f-\uffff]/g, function (c) {
        switch (c) {
            case '\b':
                return '\\b';
            case '\f':
                return '\\f';
            case '\n':
                return '\\n';
            case '\r':
                return '\\r';
            case '\t':
                return '\\t';
            // IE doesn't support this
            /*
             case '\v':
             return '\\v';
             */
            case '"':
                return '\\"';
            case '\\':
                return '\\\\';
            default:
                return '\\u' + jscoverage_pad(c.charCodeAt(0).toString(16));
        }
    }) + '"';
}

function getArrayJSON(coverage) {
    var array = [];
    if (coverage === undefined)
        return array;

    var length = coverage.length;
    for (var line = 0; line < length; line++) {
        var value = coverage[line];
        if (value === undefined || value === null) {
            value = 'null';
        }
        array.push(value);
    }
    return array;
}

function jscoverage_serializeCoverageToJSON() {
    var json = [];
    for (var file in _$jscoverage) {
        var lineArray = getArrayJSON(_$jscoverage[file].lineData);
        var fnArray = getArrayJSON(_$jscoverage[file].functionData);

        json.push(jscoverage_quote(file) + ':{"lineData":[' + lineArray.join(',') + '],"functionData":[' + fnArray.join(',') + '],"branchData":' + convertBranchDataLinesToJSON(_$jscoverage[file].branchData) + '}');
    }
    return '{' + json.join(',') + '}';
}


function jscoverage_pad(s) {
    return '0000'.substr(s.length) + s;
}

function jscoverage_html_escape(s) {
    return s.replace(/[<>\&\"\']/g, function (c) {
        return '&#' + c.charCodeAt(0) + ';';
    });
}
try {
  if (typeof top === 'object' && top !== null && typeof top.opener === 'object' && top.opener !== null) {
    // this is a browser window that was opened from another window

    if (! top.opener._$jscoverage) {
      top.opener._$jscoverage = {};
    }
  }
}
catch (e) {}

try {
  if (typeof top === 'object' && top !== null) {
    // this is a browser window

    try {
      if (typeof top.opener === 'object' && top.opener !== null && top.opener._$jscoverage) {
        top._$jscoverage = top.opener._$jscoverage;
      }
    }
    catch (e) {}

    if (! top._$jscoverage) {
      top._$jscoverage = {};
    }
  }
}
catch (e) {}

try {
  if (typeof top === 'object' && top !== null && top._$jscoverage) {
    this._$jscoverage = top._$jscoverage;
  }
}
catch (e) {}
if (! this._$jscoverage) {
  this._$jscoverage = {};
}
if (! _$jscoverage['/tabs/render.js']) {
  _$jscoverage['/tabs/render.js'] = {};
  _$jscoverage['/tabs/render.js'].lineData = [];
  _$jscoverage['/tabs/render.js'].lineData[6] = 0;
  _$jscoverage['/tabs/render.js'].lineData[7] = 0;
  _$jscoverage['/tabs/render.js'].lineData[9] = 0;
  _$jscoverage['/tabs/render.js'].lineData[11] = 0;
  _$jscoverage['/tabs/render.js'].lineData[15] = 0;
  _$jscoverage['/tabs/render.js'].lineData[19] = 0;
  _$jscoverage['/tabs/render.js'].lineData[20] = 0;
  _$jscoverage['/tabs/render.js'].lineData[24] = 0;
  _$jscoverage['/tabs/render.js'].lineData[27] = 0;
  _$jscoverage['/tabs/render.js'].lineData[34] = 0;
  _$jscoverage['/tabs/render.js'].lineData[35] = 0;
}
if (! _$jscoverage['/tabs/render.js'].functionData) {
  _$jscoverage['/tabs/render.js'].functionData = [];
  _$jscoverage['/tabs/render.js'].functionData[0] = 0;
  _$jscoverage['/tabs/render.js'].functionData[1] = 0;
  _$jscoverage['/tabs/render.js'].functionData[2] = 0;
  _$jscoverage['/tabs/render.js'].functionData[3] = 0;
  _$jscoverage['/tabs/render.js'].functionData[4] = 0;
}
if (! _$jscoverage['/tabs/render.js'].branchData) {
  _$jscoverage['/tabs/render.js'].branchData = {};
  _$jscoverage['/tabs/render.js'].branchData['35'] = [];
  _$jscoverage['/tabs/render.js'].branchData['35'][1] = new BranchData();
  _$jscoverage['/tabs/render.js'].branchData['35'][2] = new BranchData();
}
_$jscoverage['/tabs/render.js'].branchData['35'][2].init(110, 29, 'orientation && orientation[1]');
function visit14_35_2(result) {
  _$jscoverage['/tabs/render.js'].branchData['35'][2].ranCondition(result);
  return result;
}_$jscoverage['/tabs/render.js'].branchData['35'][1].init(110, 38, 'orientation && orientation[1] || \'top\'');
function visit13_35_1(result) {
  _$jscoverage['/tabs/render.js'].branchData['35'][1].ranCondition(result);
  return result;
}_$jscoverage['/tabs/render.js'].lineData[6]++;
KISSY.add(function(S, require) {
  _$jscoverage['/tabs/render.js'].functionData[0]++;
  _$jscoverage['/tabs/render.js'].lineData[7]++;
  var Container = require('component/container');
  _$jscoverage['/tabs/render.js'].lineData[9]++;
  var CLS = 'top bottom left right';
  _$jscoverage['/tabs/render.js'].lineData[11]++;
  return Container.getDefaultRender().extend({
  beforeCreateDom: function(renderData) {
  _$jscoverage['/tabs/render.js'].functionData[1]++;
  _$jscoverage['/tabs/render.js'].lineData[15]++;
  renderData.elCls.push(this.getBaseCssClass(this.control.get('barOrientation')));
}, 
  decorateDom: function() {
  _$jscoverage['/tabs/render.js'].functionData[2]++;
  _$jscoverage['/tabs/render.js'].lineData[19]++;
  var control = this.control;
  _$jscoverage['/tabs/render.js'].lineData[20]++;
  control.get('bar').set('changeType', control.get('changeType'));
}, 
  '_onSetBarOrientation': function(v) {
  _$jscoverage['/tabs/render.js'].functionData[3]++;
  _$jscoverage['/tabs/render.js'].lineData[24]++;
  var self = this, el = self.$el;
  _$jscoverage['/tabs/render.js'].lineData[27]++;
  el.removeClass(self.getBaseCssClass(CLS)).addClass(self.getBaseCssClass(v));
}}, {
  name: 'TabsRender', 
  HTML_PARSER: {
  barOrientation: function(el) {
  _$jscoverage['/tabs/render.js'].functionData[4]++;
  _$jscoverage['/tabs/render.js'].lineData[34]++;
  var orientation = el[0].className.match(/(top|bottom|left|right)\b/);
  _$jscoverage['/tabs/render.js'].lineData[35]++;
  return visit13_35_1(visit14_35_2(orientation && orientation[1]) || 'top');
}}});
});
