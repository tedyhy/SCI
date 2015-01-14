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
if (! _$jscoverage['/picker/month-panel/control.js']) {
  _$jscoverage['/picker/month-panel/control.js'] = {};
  _$jscoverage['/picker/month-panel/control.js'].lineData = [];
  _$jscoverage['/picker/month-panel/control.js'].lineData[6] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[7] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[12] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[13] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[15] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[16] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[17] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[18] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[21] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[22] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[23] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[26] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[27] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[28] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[31] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[32] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[33] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[34] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[35] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[36] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[37] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[38] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[39] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[44] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[45] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[46] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[47] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[48] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[51] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[52] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[53] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[57] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[58] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[61] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[62] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[63] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[66] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[68] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[69] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[70] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[71] = 0;
  _$jscoverage['/picker/month-panel/control.js'].lineData[77] = 0;
}
if (! _$jscoverage['/picker/month-panel/control.js'].functionData) {
  _$jscoverage['/picker/month-panel/control.js'].functionData = [];
  _$jscoverage['/picker/month-panel/control.js'].functionData[0] = 0;
  _$jscoverage['/picker/month-panel/control.js'].functionData[1] = 0;
  _$jscoverage['/picker/month-panel/control.js'].functionData[2] = 0;
  _$jscoverage['/picker/month-panel/control.js'].functionData[3] = 0;
  _$jscoverage['/picker/month-panel/control.js'].functionData[4] = 0;
  _$jscoverage['/picker/month-panel/control.js'].functionData[5] = 0;
  _$jscoverage['/picker/month-panel/control.js'].functionData[6] = 0;
  _$jscoverage['/picker/month-panel/control.js'].functionData[7] = 0;
  _$jscoverage['/picker/month-panel/control.js'].functionData[8] = 0;
}
if (! _$jscoverage['/picker/month-panel/control.js'].branchData) {
  _$jscoverage['/picker/month-panel/control.js'].branchData = {};
}
_$jscoverage['/picker/month-panel/control.js'].lineData[6]++;
KISSY.add(function(S, require) {
  _$jscoverage['/picker/month-panel/control.js'].functionData[0]++;
  _$jscoverage['/picker/month-panel/control.js'].lineData[7]++;
  var Node = require('node'), Control = require('component/control'), YearPanel = require('../year-panel/control'), MonthPanelRender = require('./render');
  _$jscoverage['/picker/month-panel/control.js'].lineData[12]++;
  var tap = Node.Gesture.tap;
  _$jscoverage['/picker/month-panel/control.js'].lineData[13]++;
  var $ = Node.all;
  _$jscoverage['/picker/month-panel/control.js'].lineData[15]++;
  function goYear(self, direction) {
    _$jscoverage['/picker/month-panel/control.js'].functionData[1]++;
    _$jscoverage['/picker/month-panel/control.js'].lineData[16]++;
    var next = self.get('value').clone();
    _$jscoverage['/picker/month-panel/control.js'].lineData[17]++;
    next.addYear(direction);
    _$jscoverage['/picker/month-panel/control.js'].lineData[18]++;
    self.set('value', next);
  }
  _$jscoverage['/picker/month-panel/control.js'].lineData[21]++;
  function nextYear(e) {
    _$jscoverage['/picker/month-panel/control.js'].functionData[2]++;
    _$jscoverage['/picker/month-panel/control.js'].lineData[22]++;
    e.preventDefault();
    _$jscoverage['/picker/month-panel/control.js'].lineData[23]++;
    goYear(this, 1);
  }
  _$jscoverage['/picker/month-panel/control.js'].lineData[26]++;
  function prevYear(e) {
    _$jscoverage['/picker/month-panel/control.js'].functionData[3]++;
    _$jscoverage['/picker/month-panel/control.js'].lineData[27]++;
    e.preventDefault();
    _$jscoverage['/picker/month-panel/control.js'].lineData[28]++;
    goYear(this, -1);
  }
  _$jscoverage['/picker/month-panel/control.js'].lineData[31]++;
  function chooseCell(e) {
    _$jscoverage['/picker/month-panel/control.js'].functionData[4]++;
    _$jscoverage['/picker/month-panel/control.js'].lineData[32]++;
    e.preventDefault();
    _$jscoverage['/picker/month-panel/control.js'].lineData[33]++;
    var td = $(e.currentTarget);
    _$jscoverage['/picker/month-panel/control.js'].lineData[34]++;
    var tr = td.parent();
    _$jscoverage['/picker/month-panel/control.js'].lineData[35]++;
    var tdIndex = td.index();
    _$jscoverage['/picker/month-panel/control.js'].lineData[36]++;
    var trIndex = tr.index();
    _$jscoverage['/picker/month-panel/control.js'].lineData[37]++;
    var value = this.get('value').clone();
    _$jscoverage['/picker/month-panel/control.js'].lineData[38]++;
    value.setMonth(trIndex * 4 + tdIndex);
    _$jscoverage['/picker/month-panel/control.js'].lineData[39]++;
    this.fire('select', {
  value: value});
  }
  _$jscoverage['/picker/month-panel/control.js'].lineData[44]++;
  function showYearPanel(e) {
    _$jscoverage['/picker/month-panel/control.js'].functionData[5]++;
    _$jscoverage['/picker/month-panel/control.js'].lineData[45]++;
    e.preventDefault();
    _$jscoverage['/picker/month-panel/control.js'].lineData[46]++;
    var yearPanel = this.get('yearPanel');
    _$jscoverage['/picker/month-panel/control.js'].lineData[47]++;
    yearPanel.set('value', this.get('value'));
    _$jscoverage['/picker/month-panel/control.js'].lineData[48]++;
    yearPanel.show();
  }
  _$jscoverage['/picker/month-panel/control.js'].lineData[51]++;
  function setUpYearPanel() {
    _$jscoverage['/picker/month-panel/control.js'].functionData[6]++;
    _$jscoverage['/picker/month-panel/control.js'].lineData[52]++;
    var self = this;
    _$jscoverage['/picker/month-panel/control.js'].lineData[53]++;
    var yearPanel = new YearPanel({
  locale: this.get('locale'), 
  render: self.get('render')});
    _$jscoverage['/picker/month-panel/control.js'].lineData[57]++;
    yearPanel.on('select', onYearPanelSelect, self);
    _$jscoverage['/picker/month-panel/control.js'].lineData[58]++;
    return yearPanel;
  }
  _$jscoverage['/picker/month-panel/control.js'].lineData[61]++;
  function onYearPanelSelect(e) {
    _$jscoverage['/picker/month-panel/control.js'].functionData[7]++;
    _$jscoverage['/picker/month-panel/control.js'].lineData[62]++;
    this.set('value', e.value);
    _$jscoverage['/picker/month-panel/control.js'].lineData[63]++;
    this.get('yearPanel').hide();
  }
  _$jscoverage['/picker/month-panel/control.js'].lineData[66]++;
  return Control.extend({
  bindUI: function() {
  _$jscoverage['/picker/month-panel/control.js'].functionData[8]++;
  _$jscoverage['/picker/month-panel/control.js'].lineData[68]++;
  var self = this;
  _$jscoverage['/picker/month-panel/control.js'].lineData[69]++;
  self.get('nextYearBtn').on(tap, nextYear, self);
  _$jscoverage['/picker/month-panel/control.js'].lineData[70]++;
  self.get('previousYearBtn').on(tap, prevYear, self);
  _$jscoverage['/picker/month-panel/control.js'].lineData[71]++;
  self.get('tbodyEl').delegate(tap, '.' + self.view.getBaseCssClass('cell'), chooseCell, self);
  _$jscoverage['/picker/month-panel/control.js'].lineData[77]++;
  self.get('yearSelectEl').on(tap, showYearPanel, self);
}}, {
  xclass: 'date-picker-month-panel', 
  ATTRS: {
  focusable: {
  value: false}, 
  value: {
  view: 1}, 
  yearPanel: {
  valueFn: setUpYearPanel}, 
  xrender: {
  value: MonthPanelRender}}});
});
