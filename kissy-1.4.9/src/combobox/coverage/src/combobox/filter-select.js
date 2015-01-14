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
if (! _$jscoverage['/combobox/filter-select.js']) {
  _$jscoverage['/combobox/filter-select.js'] = {};
  _$jscoverage['/combobox/filter-select.js'].lineData = [];
  _$jscoverage['/combobox/filter-select.js'].lineData[6] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[7] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[9] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[10] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[11] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[12] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[13] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[14] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[18] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[26] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[28] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[29] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[30] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[31] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[32] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[33] = 0;
  _$jscoverage['/combobox/filter-select.js'].lineData[36] = 0;
}
if (! _$jscoverage['/combobox/filter-select.js'].functionData) {
  _$jscoverage['/combobox/filter-select.js'].functionData = [];
  _$jscoverage['/combobox/filter-select.js'].functionData[0] = 0;
  _$jscoverage['/combobox/filter-select.js'].functionData[1] = 0;
  _$jscoverage['/combobox/filter-select.js'].functionData[2] = 0;
  _$jscoverage['/combobox/filter-select.js'].functionData[3] = 0;
  _$jscoverage['/combobox/filter-select.js'].functionData[4] = 0;
}
if (! _$jscoverage['/combobox/filter-select.js'].branchData) {
  _$jscoverage['/combobox/filter-select.js'].branchData = {};
  _$jscoverage['/combobox/filter-select.js'].branchData['11'] = [];
  _$jscoverage['/combobox/filter-select.js'].branchData['11'][1] = new BranchData();
  _$jscoverage['/combobox/filter-select.js'].branchData['12'] = [];
  _$jscoverage['/combobox/filter-select.js'].branchData['12'][1] = new BranchData();
  _$jscoverage['/combobox/filter-select.js'].branchData['13'] = [];
  _$jscoverage['/combobox/filter-select.js'].branchData['13'][1] = new BranchData();
  _$jscoverage['/combobox/filter-select.js'].branchData['30'] = [];
  _$jscoverage['/combobox/filter-select.js'].branchData['30'][1] = new BranchData();
}
_$jscoverage['/combobox/filter-select.js'].branchData['30'][1].init(21, 6, '!error');
function visit72_30_1(result) {
  _$jscoverage['/combobox/filter-select.js'].branchData['30'][1].ranCondition(result);
  return result;
}_$jscoverage['/combobox/filter-select.js'].branchData['13'][1].init(21, 37, '_saveData[i].textContent === inputVal');
function visit71_13_1(result) {
  _$jscoverage['/combobox/filter-select.js'].branchData['13'][1].ranCondition(result);
  return result;
}_$jscoverage['/combobox/filter-select.js'].branchData['12'][1].init(29, 20, 'i < _saveData.length');
function visit70_12_1(result) {
  _$jscoverage['/combobox/filter-select.js'].branchData['12'][1].ranCondition(result);
  return result;
}_$jscoverage['/combobox/filter-select.js'].branchData['11'][1].init(40, 9, '_saveData');
function visit69_11_1(result) {
  _$jscoverage['/combobox/filter-select.js'].branchData['11'][1].ranCondition(result);
  return result;
}_$jscoverage['/combobox/filter-select.js'].lineData[6]++;
KISSY.add(function(S, require, exports, module) {
  _$jscoverage['/combobox/filter-select.js'].functionData[0]++;
  _$jscoverage['/combobox/filter-select.js'].lineData[7]++;
  var Combobox = require('./control');
  _$jscoverage['/combobox/filter-select.js'].lineData[9]++;
  function valInAutoCompleteList(inputVal, _saveData) {
    _$jscoverage['/combobox/filter-select.js'].functionData[1]++;
    _$jscoverage['/combobox/filter-select.js'].lineData[10]++;
    var valid = false;
    _$jscoverage['/combobox/filter-select.js'].lineData[11]++;
    if (visit69_11_1(_saveData)) {
      _$jscoverage['/combobox/filter-select.js'].lineData[12]++;
      for (var i = 0; visit70_12_1(i < _saveData.length); i++) {
        _$jscoverage['/combobox/filter-select.js'].lineData[13]++;
        if (visit71_13_1(_saveData[i].textContent === inputVal)) {
          _$jscoverage['/combobox/filter-select.js'].lineData[14]++;
          return _saveData[i];
        }
      }
    }
    _$jscoverage['/combobox/filter-select.js'].lineData[18]++;
    return valid;
  }
  _$jscoverage['/combobox/filter-select.js'].lineData[26]++;
  module.exports = Combobox.extend({
  validate: function(callback) {
  _$jscoverage['/combobox/filter-select.js'].functionData[2]++;
  _$jscoverage['/combobox/filter-select.js'].lineData[28]++;
  var self = this;
  _$jscoverage['/combobox/filter-select.js'].lineData[29]++;
  self.callSuper(function(error, val) {
  _$jscoverage['/combobox/filter-select.js'].functionData[3]++;
  _$jscoverage['/combobox/filter-select.js'].lineData[30]++;
  if (visit72_30_1(!error)) {
    _$jscoverage['/combobox/filter-select.js'].lineData[31]++;
    self.get('dataSource').fetchData(val, function(data) {
  _$jscoverage['/combobox/filter-select.js'].functionData[4]++;
  _$jscoverage['/combobox/filter-select.js'].lineData[32]++;
  var d = valInAutoCompleteList(val, self.normalizeData(data));
  _$jscoverage['/combobox/filter-select.js'].lineData[33]++;
  callback(d ? '' : self.get('invalidMessage'), val, d);
});
  } else {
    _$jscoverage['/combobox/filter-select.js'].lineData[36]++;
    callback(error, val);
  }
});
}}, {
  ATTRS: {
  invalidMessage: {
  value: 'invalid input'}}});
});
