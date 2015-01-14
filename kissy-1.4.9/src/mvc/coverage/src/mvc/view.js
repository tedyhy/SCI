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
if (! _$jscoverage['/mvc/view.js']) {
  _$jscoverage['/mvc/view.js'] = {};
  _$jscoverage['/mvc/view.js'].lineData = [];
  _$jscoverage['/mvc/view.js'].lineData[6] = 0;
  _$jscoverage['/mvc/view.js'].lineData[7] = 0;
  _$jscoverage['/mvc/view.js'].lineData[8] = 0;
  _$jscoverage['/mvc/view.js'].lineData[10] = 0;
  _$jscoverage['/mvc/view.js'].lineData[12] = 0;
  _$jscoverage['/mvc/view.js'].lineData[13] = 0;
  _$jscoverage['/mvc/view.js'].lineData[14] = 0;
  _$jscoverage['/mvc/view.js'].lineData[16] = 0;
  _$jscoverage['/mvc/view.js'].lineData[24] = 0;
  _$jscoverage['/mvc/view.js'].lineData[26] = 0;
  _$jscoverage['/mvc/view.js'].lineData[27] = 0;
  _$jscoverage['/mvc/view.js'].lineData[28] = 0;
  _$jscoverage['/mvc/view.js'].lineData[29] = 0;
  _$jscoverage['/mvc/view.js'].lineData[36] = 0;
  _$jscoverage['/mvc/view.js'].lineData[37] = 0;
  _$jscoverage['/mvc/view.js'].lineData[38] = 0;
  _$jscoverage['/mvc/view.js'].lineData[40] = 0;
  _$jscoverage['/mvc/view.js'].lineData[44] = 0;
  _$jscoverage['/mvc/view.js'].lineData[45] = 0;
  _$jscoverage['/mvc/view.js'].lineData[46] = 0;
  _$jscoverage['/mvc/view.js'].lineData[47] = 0;
  _$jscoverage['/mvc/view.js'].lineData[48] = 0;
  _$jscoverage['/mvc/view.js'].lineData[49] = 0;
  _$jscoverage['/mvc/view.js'].lineData[55] = 0;
  _$jscoverage['/mvc/view.js'].lineData[56] = 0;
  _$jscoverage['/mvc/view.js'].lineData[57] = 0;
  _$jscoverage['/mvc/view.js'].lineData[58] = 0;
  _$jscoverage['/mvc/view.js'].lineData[59] = 0;
  _$jscoverage['/mvc/view.js'].lineData[60] = 0;
  _$jscoverage['/mvc/view.js'].lineData[69] = 0;
  _$jscoverage['/mvc/view.js'].lineData[76] = 0;
  _$jscoverage['/mvc/view.js'].lineData[94] = 0;
  _$jscoverage['/mvc/view.js'].lineData[95] = 0;
  _$jscoverage['/mvc/view.js'].lineData[96] = 0;
  _$jscoverage['/mvc/view.js'].lineData[98] = 0;
}
if (! _$jscoverage['/mvc/view.js'].functionData) {
  _$jscoverage['/mvc/view.js'].functionData = [];
  _$jscoverage['/mvc/view.js'].functionData[0] = 0;
  _$jscoverage['/mvc/view.js'].functionData[1] = 0;
  _$jscoverage['/mvc/view.js'].functionData[2] = 0;
  _$jscoverage['/mvc/view.js'].functionData[3] = 0;
  _$jscoverage['/mvc/view.js'].functionData[4] = 0;
  _$jscoverage['/mvc/view.js'].functionData[5] = 0;
  _$jscoverage['/mvc/view.js'].functionData[6] = 0;
  _$jscoverage['/mvc/view.js'].functionData[7] = 0;
  _$jscoverage['/mvc/view.js'].functionData[8] = 0;
}
if (! _$jscoverage['/mvc/view.js'].branchData) {
  _$jscoverage['/mvc/view.js'].branchData = {};
  _$jscoverage['/mvc/view.js'].branchData['13'] = [];
  _$jscoverage['/mvc/view.js'].branchData['13'][1] = new BranchData();
  _$jscoverage['/mvc/view.js'].branchData['37'] = [];
  _$jscoverage['/mvc/view.js'].branchData['37'][1] = new BranchData();
  _$jscoverage['/mvc/view.js'].branchData['94'] = [];
  _$jscoverage['/mvc/view.js'].branchData['94'][1] = new BranchData();
}
_$jscoverage['/mvc/view.js'].branchData['94'][1].init(25, 21, 'typeof s === \'string\'');
function visit107_94_1(result) {
  _$jscoverage['/mvc/view.js'].branchData['94'][1].ranCondition(result);
  return result;
}_$jscoverage['/mvc/view.js'].branchData['37'][1].init(54, 7, 'prevVal');
function visit106_37_1(result) {
  _$jscoverage['/mvc/view.js'].branchData['37'][1].ranCondition(result);
  return result;
}_$jscoverage['/mvc/view.js'].branchData['13'][1].init(13, 21, 'typeof f === \'string\'');
function visit105_13_1(result) {
  _$jscoverage['/mvc/view.js'].branchData['13'][1].ranCondition(result);
  return result;
}_$jscoverage['/mvc/view.js'].lineData[6]++;
KISSY.add(function(S, require) {
  _$jscoverage['/mvc/view.js'].functionData[0]++;
  _$jscoverage['/mvc/view.js'].lineData[7]++;
  var Node = require('node');
  _$jscoverage['/mvc/view.js'].lineData[8]++;
  var Attribute = require('attribute');
  _$jscoverage['/mvc/view.js'].lineData[10]++;
  var $ = Node.all;
  _$jscoverage['/mvc/view.js'].lineData[12]++;
  function normFn(self, f) {
    _$jscoverage['/mvc/view.js'].functionData[1]++;
    _$jscoverage['/mvc/view.js'].lineData[13]++;
    if (visit105_13_1(typeof f === 'string')) {
      _$jscoverage['/mvc/view.js'].lineData[14]++;
      return self[f];
    }
    _$jscoverage['/mvc/view.js'].lineData[16]++;
    return f;
  }
  _$jscoverage['/mvc/view.js'].lineData[24]++;
  return Attribute.extend({
  constructor: function() {
  _$jscoverage['/mvc/view.js'].functionData[2]++;
  _$jscoverage['/mvc/view.js'].lineData[26]++;
  this.callSuper.apply(this, arguments);
  _$jscoverage['/mvc/view.js'].lineData[27]++;
  var events;
  _$jscoverage['/mvc/view.js'].lineData[28]++;
  if ((events = this.get('events'))) {
    _$jscoverage['/mvc/view.js'].lineData[29]++;
    this._afterEventsChange({
  newVal: events});
  }
}, 
  _afterEventsChange: function(e) {
  _$jscoverage['/mvc/view.js'].functionData[3]++;
  _$jscoverage['/mvc/view.js'].lineData[36]++;
  var prevVal = e.prevVal;
  _$jscoverage['/mvc/view.js'].lineData[37]++;
  if (visit106_37_1(prevVal)) {
    _$jscoverage['/mvc/view.js'].lineData[38]++;
    this._removeEvents(prevVal);
  }
  _$jscoverage['/mvc/view.js'].lineData[40]++;
  this._addEvents(e.newVal);
}, 
  _removeEvents: function(events) {
  _$jscoverage['/mvc/view.js'].functionData[4]++;
  _$jscoverage['/mvc/view.js'].lineData[44]++;
  var el = this.get('el');
  _$jscoverage['/mvc/view.js'].lineData[45]++;
  for (var selector in events) {
    _$jscoverage['/mvc/view.js'].lineData[46]++;
    var event = events[selector];
    _$jscoverage['/mvc/view.js'].lineData[47]++;
    for (var type in event) {
      _$jscoverage['/mvc/view.js'].lineData[48]++;
      var callback = normFn(this, event[type]);
      _$jscoverage['/mvc/view.js'].lineData[49]++;
      el.undelegate(type, selector, callback, this);
    }
  }
}, 
  _addEvents: function(events) {
  _$jscoverage['/mvc/view.js'].functionData[5]++;
  _$jscoverage['/mvc/view.js'].lineData[55]++;
  var el = this.get('el');
  _$jscoverage['/mvc/view.js'].lineData[56]++;
  for (var selector in events) {
    _$jscoverage['/mvc/view.js'].lineData[57]++;
    var event = events[selector];
    _$jscoverage['/mvc/view.js'].lineData[58]++;
    for (var type in event) {
      _$jscoverage['/mvc/view.js'].lineData[59]++;
      var callback = normFn(this, event[type]);
      _$jscoverage['/mvc/view.js'].lineData[60]++;
      el.delegate(type, selector, callback, this);
    }
  }
}, 
  render: function() {
  _$jscoverage['/mvc/view.js'].functionData[6]++;
  _$jscoverage['/mvc/view.js'].lineData[69]++;
  return this;
}, 
  destroy: function() {
  _$jscoverage['/mvc/view.js'].functionData[7]++;
  _$jscoverage['/mvc/view.js'].lineData[76]++;
  this.get('el').remove();
}}, {
  ATTRS: {
  el: {
  value: '<div />', 
  getter: function(s) {
  _$jscoverage['/mvc/view.js'].functionData[8]++;
  _$jscoverage['/mvc/view.js'].lineData[94]++;
  if (visit107_94_1(typeof s === 'string')) {
    _$jscoverage['/mvc/view.js'].lineData[95]++;
    s = $(s);
    _$jscoverage['/mvc/view.js'].lineData[96]++;
    this.setInternal('el', s);
  }
  _$jscoverage['/mvc/view.js'].lineData[98]++;
  return s;
}}, 
  events: {}}});
});
