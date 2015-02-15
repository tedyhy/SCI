//日历
$(function($) {
	var options = {
		mode: 'single',
		inline: false,
		calendars: 1,
		date: new Date(),
		locale: {
			daysMin: ["日", "一", "二", "三", "四", "五", "六"],
			months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一", "十二"],
			monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一", "十二"]
		},
		changeMonth: true,
		changeYear: true
	};
	Date.prototype.getMaxDays = function() {
		var tmpDate = new Date(Date.parse(this)),
			d = 28,
			m;
		m = tmpDate.getMonth();
		d = 28;
		while (tmpDate.getMonth() == m) {
			d++;
			tmpDate.setDate(d);
		}
		return d - 1;
	};
	Date.prototype.cloneAddYears = function(n) {
		var _this = new Date(this.getTime());
		if (_this.tempDate == null) {
			_this.tempDate = _this.getDate();
		}
		_this.setDate(1);
		_this.setFullYear(_this.getFullYear() + n);
		_this.setDate(Math.min(_this.tempDate, _this.getMaxDays()));
		return _this;
	};

	var _start = $('#createDate'),
		_end = $('#expireDate'),
		_now = new Date($('#currentDate').val()),
		_next = new Date($('#lastDayOfNextMonth').val()),
		_hour = $('#currentHour').val();

	$.extend({
		formatDate: function(format, date) {
			var map = {
				yyyy: date.getFullYear(),
				mm: $.getFullNumber(date.getMonth() + 1),
				dd: $.getFullNumber(date.getDate())
			}
			for (var i in map) {
				if (Object.hasOwnProperty.call(map, i)) {
					format = format.replace(new RegExp(i), map[i]);
				}
			}
			return format;
		},
		parseDate: function(format, date) {
			if (date.constructor == Date) {
				return new Date(date);
			}
			var parts = date.split(/\W+/);
			var against = format.split(/\W+/),
				d, m, y, h, min, now = new Date();
			for (var i = 0; i < parts.length; i++) {
				switch (against[i]) {
					case 'dd':
						d = parseInt(parts[i], 10);
						break;
					case 'mm':
						m = parseInt(parts[i], 10) - 1;
						break;
					case 'yyyy':
					case 'Y':
						y = parseInt(parts[i], 10);
						y += y > 100 ? 0 : (y < 29 ? 2000 : 1900);
						break;
				}
			}
			return new Date(
				y === undefined ? now.getFullYear() : y,
				m === undefined ? now.getMonth() : m,
				d === undefined ? now.getDate() : d
			);
		},
		getFullNumber: function(mNum) {
			if (mNum < 10) {
				mNum = '0' + mNum;
			}
			return mNum;
		},
		changeHours: function(obj1, obj2, hour) {
			var hour = +hour + 1;
			if (obj1.val() === obj1.attr('data-time')) {
				obj2.find('option').each(function(m) {
					if (m < hour) {
						$(this).attr('disabled', true);
					}
					$(this).removeAttr('selected');
				});
				$(obj2.find('option')[hour]).attr("selected", "selected");
			} else {
				obj2.find('option').each(function() {
					$(this).removeAttr('disabled');
					$(this).removeAttr('selected');
				});
				$(obj2.find('option')[0]).attr("selected", "selected");
			}
		}
	});
	var format = 'yyyy-mm-dd';

	$.each([_start, _end], function(i, el) {
		$(el).bind('focus', function() {
			var $this = $(this),
				val = $this.val() ? $this.val() : $this.attr('data-time');
			$this.DatePickerSetDate($.parseDate(format, val), 1);
		});
	});

	_start.DatePicker($.extend(true, {
		onChange: function(date) {
			var options = $('#' + _end.data('datepickerId')).data('datepicker');
			options.minDate = date;
			var sDate = $.formatDate(format, date);
			_start.val(sDate);
			_start.DatePickerHide();
			$.changeHours(_start, $('#startHour'), _hour);
		},
		minDate: _now,
		maxDate: _next,
		onRenderCell: function(el, date) {
			var opts = $(el).data('datepicker'),
				_max = new Date($('#expireDate').val());
			return {
				disabled: date < opts.minDate || date > (opts.maxDate > _max ? _max : opts.maxDate)
			};
		}
	}, options));


	_end.DatePicker($.extend(true, {
		onChange: function(date) {
			var sDate = $.formatDate(format, date);
			_end.val(sDate);
			_end.DatePickerHide();
			$.changeHours(_end, $('#endHour'), _hour);
		},
		minDate: _now,
		maxDate: _next,
		onRenderCell: function(el, date) {
			var opts = $(el).data('datepicker');
			return {
				disabled: date < opts.minDate || date > opts.maxDate
			};
		}
	}, options));
	$.changeHours(_start, $('#startHour'), _hour);
});