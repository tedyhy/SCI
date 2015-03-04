/**
 * DatePicker 1.0.0
 *
 * A jQuery-based DatePicker that provides an easy way of creating both single
 * and multi-viewed calendars capable of accepting single, range, and multiple
 * selected dates.  Easily styled with two example styles provided: an attractive
 * 'dark' style, and a Google Analytics-like 'clean' style.
 *
 * View project page for Examples and Documentation:
 * http://foxrunsoftware.github.com/DatePicker/
 *
 * This project is distinct from and not affiliated with the jquery.ui.datepicker.
 *
 * Copyright 2012, Justin Stern (www.foxrunsoftware.net)
 * Dual licensed under the MIT and GPL Version 2 licenses.
 *
 * Based on Work by Original Author: Stefan Petre www.eyecon.ro
 *
 * Depends:
 *   jquery.js
 */
(function($) {
	var DatePicker = function() {
		var ids = {},
			views = {
				years: 'datepickerViewYears',
				moths: 'datepickerViewMonths',
				days: 'datepickerViewDays'
			},
			tpl = {
				wrapper: '<div class="datepicker"><div class="datepickerBorderT" /><div class="datepickerBorderB" /><div class="datepickerBorderL" /><div class="datepickerBorderR" /><div class="datepickerBorderTL" /><div class="datepickerBorderTR" /><div class="datepickerBorderBL" /><div class="datepickerBorderBR" /><div class="datepickerContainer"><table cellspacing="0" cellpadding="0"><tbody><tr></tr></tbody></table></div></div>',
				head: [
					'<td class="datepickerBlock">',
					'<table cellspacing="0" cellpadding="0">',
					'<thead>',
					'<tr>',
					'<th colspan="7"><a class="datepickerGoPrev" href="#"><span><%=prev%></span></a>',
					'<a class="datepickerMonth" href="#"><span></span></a>',
					'<a class="datepickerGoNext" href="#"><span><%=next%></span></a></th>',
					'</tr>',
					'<tr class="datepickerDoW">',
					'<th><span><%=day1%></span></th>',
					'<th><span><%=day2%></span></th>',
					'<th><span><%=day3%></span></th>',
					'<th><span><%=day4%></span></th>',
					'<th><span><%=day5%></span></th>',
					'<th><span><%=day6%></span></th>',
					'<th><span><%=day7%></span></th>',
					'</tr>',
					'</thead>',
					'</table></td>'
				],
				space: '<td class="datepickerSpace"><div></div></td>',
				days: [
					'<tbody class="datepickerDays">',
					'<tr>',
					'<td class="<%=weeks[0].days[0].classname%>"><a href="#"><span><%=weeks[0].days[0].text%></span></a></td>',
					'<td class="<%=weeks[0].days[1].classname%>"><a href="#"><span><%=weeks[0].days[1].text%></span></a></td>',
					'<td class="<%=weeks[0].days[2].classname%>"><a href="#"><span><%=weeks[0].days[2].text%></span></a></td>',
					'<td class="<%=weeks[0].days[3].classname%>"><a href="#"><span><%=weeks[0].days[3].text%></span></a></td>',
					'<td class="<%=weeks[0].days[4].classname%>"><a href="#"><span><%=weeks[0].days[4].text%></span></a></td>',
					'<td class="<%=weeks[0].days[5].classname%>"><a href="#"><span><%=weeks[0].days[5].text%></span></a></td>',
					'<td class="<%=weeks[0].days[6].classname%>"><a href="#"><span><%=weeks[0].days[6].text%></span></a></td>',
					'</tr>',
					'<tr>',
					'<td class="<%=weeks[1].days[0].classname%>"><a href="#"><span><%=weeks[1].days[0].text%></span></a></td>',
					'<td class="<%=weeks[1].days[1].classname%>"><a href="#"><span><%=weeks[1].days[1].text%></span></a></td>',
					'<td class="<%=weeks[1].days[2].classname%>"><a href="#"><span><%=weeks[1].days[2].text%></span></a></td>',
					'<td class="<%=weeks[1].days[3].classname%>"><a href="#"><span><%=weeks[1].days[3].text%></span></a></td>',
					'<td class="<%=weeks[1].days[4].classname%>"><a href="#"><span><%=weeks[1].days[4].text%></span></a></td>',
					'<td class="<%=weeks[1].days[5].classname%>"><a href="#"><span><%=weeks[1].days[5].text%></span></a></td>',
					'<td class="<%=weeks[1].days[6].classname%>"><a href="#"><span><%=weeks[1].days[6].text%></span></a></td>',
					'</tr>',
					'<tr>',
					'<td class="<%=weeks[2].days[0].classname%>"><a href="#"><span><%=weeks[2].days[0].text%></span></a></td>',
					'<td class="<%=weeks[2].days[1].classname%>"><a href="#"><span><%=weeks[2].days[1].text%></span></a></td>',
					'<td class="<%=weeks[2].days[2].classname%>"><a href="#"><span><%=weeks[2].days[2].text%></span></a></td>',
					'<td class="<%=weeks[2].days[3].classname%>"><a href="#"><span><%=weeks[2].days[3].text%></span></a></td>',
					'<td class="<%=weeks[2].days[4].classname%>"><a href="#"><span><%=weeks[2].days[4].text%></span></a></td>',
					'<td class="<%=weeks[2].days[5].classname%>"><a href="#"><span><%=weeks[2].days[5].text%></span></a></td>',
					'<td class="<%=weeks[2].days[6].classname%>"><a href="#"><span><%=weeks[2].days[6].text%></span></a></td>',
					'</tr>',
					'<tr>',
					'<td class="<%=weeks[3].days[0].classname%>"><a href="#"><span><%=weeks[3].days[0].text%></span></a></td>',
					'<td class="<%=weeks[3].days[1].classname%>"><a href="#"><span><%=weeks[3].days[1].text%></span></a></td>',
					'<td class="<%=weeks[3].days[2].classname%>"><a href="#"><span><%=weeks[3].days[2].text%></span></a></td>',
					'<td class="<%=weeks[3].days[3].classname%>"><a href="#"><span><%=weeks[3].days[3].text%></span></a></td>',
					'<td class="<%=weeks[3].days[4].classname%>"><a href="#"><span><%=weeks[3].days[4].text%></span></a></td>',
					'<td class="<%=weeks[3].days[5].classname%>"><a href="#"><span><%=weeks[3].days[5].text%></span></a></td>',
					'<td class="<%=weeks[3].days[6].classname%>"><a href="#"><span><%=weeks[3].days[6].text%></span></a></td>',
					'</tr>',
					'<tr>',
					'<td class="<%=weeks[4].days[0].classname%>"><a href="#"><span><%=weeks[4].days[0].text%></span></a></td>',
					'<td class="<%=weeks[4].days[1].classname%>"><a href="#"><span><%=weeks[4].days[1].text%></span></a></td>',
					'<td class="<%=weeks[4].days[2].classname%>"><a href="#"><span><%=weeks[4].days[2].text%></span></a></td>',
					'<td class="<%=weeks[4].days[3].classname%>"><a href="#"><span><%=weeks[4].days[3].text%></span></a></td>',
					'<td class="<%=weeks[4].days[4].classname%>"><a href="#"><span><%=weeks[4].days[4].text%></span></a></td>',
					'<td class="<%=weeks[4].days[5].classname%>"><a href="#"><span><%=weeks[4].days[5].text%></span></a></td>',
					'<td class="<%=weeks[4].days[6].classname%>"><a href="#"><span><%=weeks[4].days[6].text%></span></a></td>',
					'</tr>',
					'<tr>',
					'<td class="<%=weeks[5].days[0].classname%>"><a href="#"><span><%=weeks[5].days[0].text%></span></a></td>',
					'<td class="<%=weeks[5].days[1].classname%>"><a href="#"><span><%=weeks[5].days[1].text%></span></a></td>',
					'<td class="<%=weeks[5].days[2].classname%>"><a href="#"><span><%=weeks[5].days[2].text%></span></a></td>',
					'<td class="<%=weeks[5].days[3].classname%>"><a href="#"><span><%=weeks[5].days[3].text%></span></a></td>',
					'<td class="<%=weeks[5].days[4].classname%>"><a href="#"><span><%=weeks[5].days[4].text%></span></a></td>',
					'<td class="<%=weeks[5].days[5].classname%>"><a href="#"><span><%=weeks[5].days[5].text%></span></a></td>',
					'<td class="<%=weeks[5].days[6].classname%>"><a href="#"><span><%=weeks[5].days[6].text%></span></a></td>',
					'</tr>',
					'</tbody>'
				],
				months: [
					'<tbody class="<%=className%>">',
					'<tr>',
					'<td colspan="2"><a href="#"><span><%=data[0]%></span></a></td>',
					'<td colspan="2"><a href="#"><span><%=data[1]%></span></a></td>',
					'<td colspan="2"><a href="#"><span><%=data[2]%></span></a></td>',
					'<td colspan="1"><a href="#"><span><%=data[3]%></span></a></td>',
					'</tr>',
					'<tr>',
					'<td colspan="2"><a href="#"><span><%=data[4]%></span></a></td>',
					'<td colspan="2"><a href="#"><span><%=data[5]%></span></a></td>',
					'<td colspan="2"><a href="#"><span><%=data[6]%></span></a></td>',
					'<td colspan="1"><a href="#"><span><%=data[7]%></span></a></td>',
					'</tr>',
					'<tr>',
					'<td colspan="2"><a href="#"><span><%=data[8]%></span></a></td>',
					'<td colspan="2"><a href="#"><span><%=data[9]%></span></a></td>',
					'<td colspan="2"><a href="#"><span><%=data[10]%></span></a></td>',
					'<td colspan="1"><a href="#"><span><%=data[11]%></span></a></td>',
					'</tr>',
					'</tbody>'
				]
			},
			defaults = {
				/**
				 * The currently selected date(s).  This can be: a single date, an array
				 * of two dates (sets a range when 'mode' is 'range'), or an array of
				 * any number of dates (selects all dates when 'mode' is 'multiple'.
				 * The supplied dates can be any one of: Date object, milliseconds
				 * (as from date.getTime(), date.valueOf()), or a date string
				 * parseable by Date.parse().
				 */
				// 当前选中的日期，可以是一个或多个，如：[new Date, new Date]、new Date或者'2015/2/16'。
				date: null,
				/**
				 * Optional date which determines the current calendar month/year.  This
				 * can be one of: Date object, milliseconds (as from date.getTime(), date.valueOf()), or a date string
				 * parseable by Date.parse().  Defaults to todays date.
				 */
				current: null,
				/**
				 * true causes the datepicker calendar to be appended to the DatePicker
				 * element and rendered, false binds the DatePicker to an event on the trigger element
				 */
				inline: false,
				/**
				 * Date selection mode, one of 'single', 'range' or 'multiple'.  Default
				 * 'single'.  'Single' allows the selection of a single date, 'range'
				 * allows the selection of range of dates, and 'multiple' allows the
				 * selection of any number of individual dates.
				 */
				mode: 'single',
				/**
				 * Number of side-by-side calendars, defaults to 1.
				 */
				calendars: 1,
				/**
				 * The day that starts the week, where 0: Sunday, 1: Monday, 2: Tuesday, 3: Wednesday, 4: Thursday, 5: Friday, 6: Saturday.  Defaults to Sunday
				 */
				// 一周的开始
				starts: 0,
				/**
				 * Previous link text.  Default '&#9664;' (Unicode left arrow)
				 */
				// Unicode编码，左箭头“◀”。
				prev: '&#9664;',
				/**
				 * Next link text.  Default '&#9664;' (Unicode left arrow)
				 */
				// Unicode编码，右箭头“▶”。
				next: '&#9654;',
				/**
				 * Initial calendar view, one of 'days', 'months' or 'years'.  Defaults to 'days'.
				 */
				view: 'days',
				/**
				 * Date picker's position relative to the trigger element (non inline
				 * mode only), one of 'top', 'left', 'right' or 'bottom'. Defaults to 'bottom'
				 */
				position: 'bottom',
				/**
				 * The trigger event used to show a non-inline calendar.  Defaults to
				 * 'focus' which is useful when the trigger element is a text input,
				 * can also be 'click' for instance if the trigger element is a button
				 * or some text element.
				 */
				showOn: 'focus',
				/**
				 * Callback, invoked prior to the rendering of each date cell, which
				 * allows control of the styling of the cell via the returned hash.
				 *
				 * @param HTMLDivElement el the datepicker containing element, ie the
				 *        div with class 'datepicker'
				 * @param Date date the date that will be rendered
				 * @return hash with the following optional attributes:
				 *         selected: if true, date will be selected
				 *         disabled: if true, date cell will be disabled
				 *         className: css class name to add to the cell
				 */
				onRenderCell: function() {
					return {}
				},
				/* 
				 * Callback, invoked when a date is selected, with 'this' referring to
				 * the HTMLElement that DatePicker was invoked upon.
				 *
				 * @param dates: Selected date(s) depending on calendar mode.  When calendar mode  is 'single' this
				 *        is a single Date object.  When calendar mode is 'range', this is an array containing
				 *        a 'from' and 'to' Date objects.  When calendar mode is 'multiple' this is an array
				 *        of Date objects.
				 * @param HTMLElement el the DatePicker element, ie the element that DatePicker was invoked upon
				 */
				onChange: function() {},
				/**
				 * Invoked before a non-inline datepicker is shown, with 'this'
				 * referring to the HTMLElement that DatePicker was invoked upon, ie
				 * the trigger element
				 *
				 * @param HTMLDivElement el The datepicker container element, ie the div with class 'datepicker'
				 * @return true to allow the datepicker to be shown, false to keep it hidden
				 */
				onBeforeShow: function() {
					return true
				},
				/**
				 * Invoked after a non-inline datepicker is shown, with 'this'
				 * referring to the HTMLElement that DatePicker was invoked upon, ie
				 * the trigger element
				 *
				 * @param HTMLDivElement el The datepicker container element, ie the div with class 'datepicker'
				 */
				onAfterShow: function() {},
				/**
				 * Invoked before a non-inline datepicker is hidden, with 'this'
				 * referring to the HTMLElement that DatePicker was invoked upon, ie
				 * the trigger element
				 *
				 * @param HTMLDivElement el The datepicker container element, ie the div with class 'datepicker'
				 * @return true to allow the datepicker to be hidden, false to keep it visible
				 */
				onBeforeHide: function() {
					return true
				},
				/**
				 * Invoked after a non-inline datepicker is hidden, with 'this'
				 * referring to the HTMLElement that DatePicker was invoked upon, ie
				 * the trigger element
				 *
				 * @param HTMLDivElement el The datepicker container element, ie the div with class 'datepicker'
				 */
				onAfterHide: function() {},
				/**
				 * Locale text for day/month names: provide a hash with keys 'daysMin', 'months' and 'monthsShort'. Default english
				 */
				// 本地化，默认为英文。
				/*
					locale: {
						daysMin: ["日", "一", "二", "三", "四", "五", "六"],
						months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一", "十二"],
						monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一", "十二"]
					}
				*/
				locale: {
					daysMin: ["S", "M", "T", "W", "T", "F", "S"],
					months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
					monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
				},
				/**
				 * The combined height from the top/bottom borders.  'false' is the default
				 * and generally the correct value.
				 */
				extraHeight: false,
				/**
				 * The combined width from the left/right borders.  'false' is the default
				 * and generally the correct value.
				 */
				extraWidth: false,
				/**
				 * Private option, used to determine when a range is selected
				 */
				// 私有选项，用于确定一个日期区间被选择。
				lastSel: false
			},

			/**
			 * Internal method which renders the calendar cells
			 *
			 * @param HTMLDivElement el datepicker container element
			 */
			// 渲染日历单元格。
			fill = function(el) {
				// 取当前日历选项信息。
				var options = $(el).data('datepicker');
				var cal = $(el);
				var currentCal = Math.floor(options.calendars / 2),
					date, data, dow, month, cnt = 0,
					days, indic, indic2, html, tblCal;

				// 将每个日历单元格移除。
				cal.find('td>table tbody').remove();
				// 遍历处理每个日历，生成日历单元格。
				for (var i = 0; i < options.calendars; i++) {
					date = new Date(options.current);
					date.addMonths(-currentCal + i);
					tblCal = cal.find('table').eq(i + 1);

					// 为第一个日历添加类'datepickerFirstView'
					if (i == 0) tblCal.addClass('datepickerFirstView');
					// 为最后一个日历添加类'datepickerLastView'
					if (i == options.calendars - 1) tblCal.addClass('datepickerLastView');

					// 当前为选择天
					if (tblCal.hasClass('datepickerViewDays')) {
						dow = date.getMonthName(true) + ", " + date.getFullYear();
					// 当前为选择月
					} else if (tblCal.hasClass('datepickerViewMonths')) {
						dow = date.getFullYear();
					// 当前为选择年
					} else if (tblCal.hasClass('datepickerViewYears')) {
						dow = (date.getFullYear() - 6) + ' - ' + (date.getFullYear() + 5);
					}
					tblCal.find('thead tr:first th a:eq(1) span').text(dow);
					dow = date.getFullYear() - 6;
					data = {
						data: [],
						className: 'datepickerYears'
					}
					for (var j = 0; j < 12; j++) {
						data.data.push(dow + j);
					}
					// datepickerYears template
					html = tmpl(tpl.months.join(''), data);
					date.setDate(1);
					data = {
						weeks: [],
						test: 10
					};
					month = date.getMonth();
					var dow = (date.getDay() - options.starts) % 7;
					date.addDays(-(dow + (dow < 0 ? 7 : 0)));
					cnt = 0;
					while (cnt < 42) {
						indic = parseInt(cnt / 7, 10);
						indic2 = cnt % 7;
						if (!data.weeks[indic]) {
							data.weeks[indic] = {
								days: []
							};
						}
						data.weeks[indic].days[indic2] = {
							text: date.getDate(),
							classname: []
						};
						var today = new Date();
						if (today.getDate() == date.getDate() && today.getMonth() == date.getMonth() && today.getYear() == date.getYear()) {
							data.weeks[indic].days[indic2].classname.push('datepickerToday');
						}
						if (date > today) {
							// current month, date in future
							data.weeks[indic].days[indic2].classname.push('datepickerFuture');
						}

						if (month != date.getMonth()) {
							data.weeks[indic].days[indic2].classname.push('datepickerNotInMonth');
							// disable clicking of the 'not in month' cells
							data.weeks[indic].days[indic2].classname.push('datepickerDisabled');
						}
						if (date.getDay() == 0) {
							data.weeks[indic].days[indic2].classname.push('datepickerSunday');
						}
						if (date.getDay() == 6) {
							data.weeks[indic].days[indic2].classname.push('datepickerSaturday');
						}
						var fromUser = options.onRenderCell(el, date);
						var val = date.valueOf();
						if (options.date && (!$.isArray(options.date) || options.date.length > 0)) {
							if (fromUser.selected || options.date == val || $.inArray(val, options.date) > -1 || (options.mode == 'range' && val >= options.date[0] && val <= options.date[1])) {
								data.weeks[indic].days[indic2].classname.push('datepickerSelected');
							}
						}
						if (fromUser.disabled) {
							data.weeks[indic].days[indic2].classname.push('datepickerDisabled');
						}
						if (fromUser.className) {
							data.weeks[indic].days[indic2].classname.push(fromUser.className);
						}
						data.weeks[indic].days[indic2].classname = data.weeks[indic].days[indic2].classname.join(' ');
						cnt++;
						date.addDays(1);
					}
					// Fill the datepickerDays template with data
					html = tmpl(tpl.days.join(''), data) + html;

					data = {
						data: options.locale.monthsShort,
						className: 'datepickerMonths'
					};
					// datepickerMonths template
					html = tmpl(tpl.months.join(''), data) + html;
					tblCal.append(html);
				}
			},

			/**
			 * Extends the Date object with some useful helper methods
			 * 根据本地化，扩展Date原型方法。
			 */
			extendDate = function(locale) {
				// 'tempDate' 为缓存的当前日期。
				if (Date.prototype.tempDate) {
					return;
				}
				Date.prototype.tempDate = null;
				Date.prototype.months = locale.months;
				Date.prototype.monthsShort = locale.monthsShort;
				Date.prototype.getMonthName = function(fullName) {
					return this[fullName ? 'months' : 'monthsShort'][this.getMonth()];
				};
				// 增加天
				Date.prototype.addDays = function(n) {
					this.setDate(this.getDate() + n);
					this.tempDate = this.getDate(); // 缓存计算后的日期。
				};
				// 增加月
				Date.prototype.addMonths = function(n) {
					// 如果木有缓存日期，则取当前日期并缓存。
					if (this.tempDate == null) {
						this.tempDate = this.getDate();
					}
					this.setDate(1);
					this.setMonth(this.getMonth() + n);
					this.setDate(Math.min(this.tempDate, this.getMaxDays()));
				};
				Date.prototype.addYears = function(n) {
					if (this.tempDate == null) {
						this.tempDate = this.getDate();
					}
					this.setDate(1);
					this.setFullYear(this.getFullYear() + n);
					this.setDate(Math.min(this.tempDate, this.getMaxDays()));
				};
				// 获取一个月份中最大的一天日期，即一个月份中的最后一天。
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
			},

			/**
			 * Internal method which lays out the calendar widget
			 */
			// 内部方法勾画出日历组件
			layout = function(el) {
				var options = $(el).data('datepicker');
				var cal = $('#' + options.id); // 从选项options.id获取到日历元素
				// 算上额外的宽高
				if (options.extraHeight === false) {
					var divs = $(el).find('div');
					options.extraHeight = divs.get(0).offsetHeight + divs.get(1).offsetHeight; // heights from top/bottom borders
					options.extraWidth = divs.get(2).offsetWidth + divs.get(3).offsetWidth; // widths from left/right borders
				}
				var tbl = cal.find('table:first').get(0);
				var width = tbl.offsetWidth; // table自身宽度
				var height = tbl.offsetHeight; // table自身高度
				cal.css({
					width: width + options.extraWidth + 'px',
					height: height + options.extraHeight + 'px'
				}).find('div.datepickerContainer').css({
					width: width + 'px',
					height: height + 'px'
				});
			},

			/**
			 * Internal method, bound to the HTML DatePicker Element, onClick.
			 * This is the function that controls the behavior of the calendar when
			 * the title, next/previous, or a date cell is clicked on.
			 */
			click = function(ev) {
				if ($(ev.target).is('span')) {
					ev.target = ev.target.parentNode;
				}
				var el = $(ev.target);
				if (el.is('a')) {
					ev.target.blur();
					if (el.hasClass('datepickerDisabled')) {
						return false;
					}
					var options = $(this).data('datepicker');
					var parentEl = el.parent();
					var tblEl = parentEl.parent().parent().parent();
					var tblIndex = $('table', this).index(tblEl.get(0)) - 1;
					var tmp = new Date(options.current);
					var changed = false;
					var fillIt = false;
					var currentCal = Math.floor(options.calendars / 2);

					if (parentEl.is('th')) {
						// clicking the calendar title

						if (el.hasClass('datepickerMonth')) {
							// clicking on the title of a Month Datepicker
							tmp.addMonths(tblIndex - currentCal);

							if (options.mode == 'range') {
								// range, select the whole month
								options.date[0] = (tmp.setHours(0, 0, 0, 0)).valueOf();
								tmp.addDays(tmp.getMaxDays() - 1);
								tmp.setHours(23, 59, 59, 0);
								options.date[1] = tmp.valueOf();
								fillIt = true;
								changed = true;
								options.lastSel = false;
							} else if (options.calendars == 1) {
								// single/multiple mode with a single calendar: swap between daily/monthly/yearly view.
								// Note:  there's no reason a multi-calendar widget can't have this functionality,
								//   however I think it looks really unintuitive.
								if (tblEl.eq(0).hasClass('datepickerViewDays')) {
									tblEl.eq(0).toggleClass('datepickerViewDays datepickerViewMonths');
									el.find('span').text(tmp.getFullYear());
								} else if (tblEl.eq(0).hasClass('datepickerViewMonths')) {
									tblEl.eq(0).toggleClass('datepickerViewMonths datepickerViewYears');
									el.find('span').text((tmp.getFullYear() - 6) + ' - ' + (tmp.getFullYear() + 5));
								} else if (tblEl.eq(0).hasClass('datepickerViewYears')) {
									tblEl.eq(0).toggleClass('datepickerViewYears datepickerViewDays');
									el.find('span').text(tmp.getMonthName(true) + ", " + tmp.getFullYear());
								}
							}
						} else if (parentEl.parent().parent().is('thead')) {
							// clicked either next/previous arrows
							if (tblEl.eq(0).hasClass('datepickerViewDays')) {
								options.current.addMonths(el.hasClass('datepickerGoPrev') ? -1 : 1);
							} else if (tblEl.eq(0).hasClass('datepickerViewMonths')) {
								options.current.addYears(el.hasClass('datepickerGoPrev') ? -1 : 1);
							} else if (tblEl.eq(0).hasClass('datepickerViewYears')) {
								options.current.addYears(el.hasClass('datepickerGoPrev') ? -12 : 12);
							}
							fillIt = true;
						}

					} else if (parentEl.is('td') && !parentEl.hasClass('datepickerDisabled')) {
						// clicking the calendar grid

						if (tblEl.eq(0).hasClass('datepickerViewMonths')) {
							// clicked a month cell
							options.current.setMonth(tblEl.find('tbody.datepickerMonths td').index(parentEl));
							options.current.setFullYear(parseInt(tblEl.find('thead th a.datepickerMonth span').text(), 10));
							options.current.addMonths(currentCal - tblIndex);
							tblEl.eq(0).toggleClass('datepickerViewMonths datepickerViewDays');
						} else if (tblEl.eq(0).hasClass('datepickerViewYears')) {
							// clicked a year cell
							options.current.setFullYear(parseInt(el.text(), 10));
							tblEl.eq(0).toggleClass('datepickerViewYears datepickerViewMonths');
						} else {
							// clicked a day cell
							var val = parseInt(el.text(), 10);
							tmp.addMonths(tblIndex - currentCal);
							if (parentEl.hasClass('datepickerNotInMonth')) {
								tmp.addMonths(val > 15 ? -1 : 1);
							}
							tmp.setDate(val);
							switch (options.mode) {
								case 'multiple':
									val = (tmp.setHours(0, 0, 0, 0)).valueOf();
									if ($.inArray(val, options.date) > -1) {
										$.each(options.date, function(nr, dat) {
											if (dat == val) {
												options.date.splice(nr, 1);
												return false;
											}
										});
									} else {
										options.date.push(val);
									}
									break;
								case 'range':
									if (!options.lastSel) {
										// first click: set to the start of the day
										options.date[0] = (tmp.setHours(0, 0, 0, 0)).valueOf();
									}
									// get the very end of the day clicked
									val = (tmp.setHours(23, 59, 59, 0)).valueOf();

									if (val < options.date[0]) {
										// second range click < first
										options.date[1] = options.date[0] + 86399000; // starting date + 1 day
										options.date[0] = val - 86399000; // minus 1 day
									} else {
										// initial range click, or final range click >= first
										options.date[1] = val;
									}
									options.lastSel = !options.lastSel;
									break;
								default:
									options.date = tmp.valueOf();
									break;
							}
							changed = true;
						}
						fillIt = true;
					}
					if (fillIt) {
						fill(this);
					}
					if (changed) {
						options.onChange.apply(this, prepareDate(options));
					}
				}
				return false;
			},

			/**
			 * Internal method, called from the public getDate() method, and when
			 * invoking the onChange callback function
			 *
			 * @param object options with the following attributes: 'mode' which can
			 *        be one of 'single', 'range', or 'multiple'.  Attribute 'date'
			 *        which will be a single timestamp when 'mode' is 'single', or
			 *        an array of timestamps otherwise.  Attribute 'el' which is the
			 *        HTML element that DatePicker was invoked upon.
			 * @return array where the first item is either a Date object, or an
			 *         array of Date objects, depending on the DatePicker mode, and
			 *         the second item is the HTMLElement that DatePicker was invoked
			 *         upon.
			 */
			// 内部方法，被getDate方法调用，onChange回调执行时会调用。
			// 实际上是一个辅助方法，将返回如下格式的值，如：
			// [[from, to], options.el];
			prepareDate = function(options) {
				var dates = null;
				// 单个日历模式
				if (options.mode == 'single') {
					if (options.date) dates = new Date(options.date);
				} else { // 多个日历模式
					dates = [];
					$(options.date).each(function(i, val) {
						dates.push(new Date(val));
					});
				}
				return [dates, options.el];
			},

			/**
			 * Internal method, returns an object containing the viewport dimensions
			 */
			// 获取视口大小
			getViewport = function() {
				var m = document.compatMode == 'CSS1Compat';
				return {
					l: window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft),
					t: window.pageYOffset || (m ? document.documentElement.scrollTop : document.body.scrollTop),
					w: window.innerWidth || (m ? document.documentElement.clientWidth : document.body.clientWidth),
					h: window.innerHeight || (m ? document.documentElement.clientHeight : document.body.clientHeight)
				};
			},

			/**
			 * Internal method, returns true if el is a child of parentEl
			 */
			isChildOf = function(parentEl, el, container) {
				if (parentEl == el) {
					return true;
				}
				if (parentEl.contains) {
					return parentEl.contains(el);
				}
				if (parentEl.compareDocumentPosition) {
					return !!(parentEl.compareDocumentPosition(el) & 16);
				}
				var prEl = el.parentNode;
				while (prEl && prEl != container) {
					if (prEl == parentEl)
						return true;
					prEl = prEl.parentNode;
				}
				return false;
			},

			/**
			 * Bound to the HTML DatePicker element when it's not inline, and also
			 * can be called directly to show the bound datepicker.  A DatePicker
			 * calendar shown with this method will hide on a mouseclick outside
			 * of the calendar.
			 *
			 * Method is not applicable for inline DatePickers
			 */
			// 显示日历控件
			show = function(ev) {
				var cal = $('#' + $(this).data('datepickerId'));
				// 如果日历控件已经显示，则返回。
				if (!cal.is(':visible')) {
					var calEl = cal.get(0);
					var options = cal.data('datepicker');

					// 显示之前执行 onBeforeShow 回调。如果回调执行出现错误，直接返回。
					var test = options.onBeforeShow.apply(this, [calEl]);
					if (!test) return;

					// 生成日历单元格
					fill(calEl);
					// 日历定位显示
					var pos = $(this).offset();
					// 获取视口相关数据
					var viewPort = getViewport();
					var top = pos.top;
					var left = pos.left;
					// var oldDisplay = $.curCSS(calEl, 'display');
					// 文档流中生成日历容器
					cal.css({
						visibility: 'hidden',
						display: 'block'
					});
					layout(calEl);
					// 日历定位
					switch (options.position) {
						case 'top':
							top -= calEl.offsetHeight;
							break;
						case 'left':
							left -= calEl.offsetWidth;
							break;
						case 'right':
							left += this.offsetWidth;
							break;
						case 'bottom':
							top += this.offsetHeight;
							break;
					}
					// 根据浏览器视口大小自动调节日历位置。
					if (top + calEl.offsetHeight > viewPort.t + viewPort.h) {
						top = pos.top - calEl.offsetHeight;
					}
					if (top < viewPort.t) {
						top = pos.top + this.offsetHeight + calEl.offsetHeight;
					}
					if (left + calEl.offsetWidth > viewPort.l + viewPort.w) {
						left = pos.left - calEl.offsetWidth;
					}
					if (left < viewPort.l) {
						left = pos.left + this.offsetWidth
					}
					// 显示并定位日历
					cal.css({
						visibility: 'visible',
						display: 'block',
						top: top + 'px',
						left: left + 'px'
					});
					// 触发 'onAfterShow' 事件。
					options.onAfterShow.apply(this, [calEl]);
					$(document).bind('mousedown', {
						cal: cal,
						trigger: this
					}, hide); // global listener so clicking outside the calendar will close it
				}
				return false;
			},

			/**
			 * Hide a non-inline DatePicker calendar.
			 *
			 * Not applicable for inline DatePickers.
			 *
			 * @param ev Event object
			 */
			hide = function(ev) {
				if (ev.target != ev.data.trigger && !isChildOf(ev.data.cal.get(0), ev.target, ev.data.cal.get(0))) {
					if (ev.data.cal.data('datepicker').onBeforeHide.apply(this, [ev.data.cal.get(0)]) != false) {
						ev.data.cal.hide();
						ev.data.cal.data('datepicker').onAfterHide.apply(this, [ev.data.cal.get(0)]);
						$(document).unbind('mousedown', hide); // remove the global listener
					}
				}
			},

			/**
			 * Internal method to normalize the selected date based on the current
			 * calendar mode.
			 */
			// 内部方法，基于当前日历模式及其参数date（如：[new Date, new Date]或者'2015/2/16'）处理并返回数组集合，形式如下：
			// 1. 1423929600000
			// 2. [1423929600000] 或 [1423929600000, 1423929600001]
			// 3. [1423929600000, 1423929600001, 1423929600002, 1423929600003]
			// 4. [1423929600000, 1423929600001]
			normalizeDate = function(mode, date) {
				// if range/multi mode, make sure that the current date value is at least an empty array
				// 如果是 'range/multiple' 模式且木有参数date，则返回值至少保证date是数组值。
				if (mode != 'single' && !date) date = [];

				// if we have a selected date and not a null or empty array
				// 如果有参数date，且为数组/非数组值。
				if (date && (!$.isArray(date) || date.length > 0)) {
					// Create a standardized date depending on the calendar mode
					// 'range/multiple' 模式。
					if (mode != 'single') {
						/*
							参数date为非数组，形式如下：
							1425466665438、
							'2015/01/01'、'2015-01-01'、
							'2015/01/01 9:9:9:6'、'2015-01-01 9:9:9:6'、
							'Wed Mar 04 2015 18:57:30 GMT+0800 (中国标准时间)'
						 */
						if (!$.isArray(date)) {
							date = [((new Date(date)).setHours(0, 0, 0, 0)).valueOf()];
							if (mode == 'range') {
								// create a range of one day
								// 如果是 'range' 模式，则向后增加24h。
								date.push(((new Date(date[0])).setHours(23, 59, 59, 0)).valueOf());
							}

						// 参数date为数组值，形式如：['2015/01/01', '2015/01/02', '2015/01/03']等。
						} else {
							for (var i = 0; i < date.length; i++) {
								date[i] = ((new Date(date[i])).setHours(0, 0, 0, 0)).valueOf();
							}
							// 如果是 'range' 模式，则自动补全开始和结束日期。
							if (mode == 'range') {
								// for range mode, create the other end of the range
								// 如：['2015/01/01']
								if (date.length == 1) date.push(new Date(date[0]));
								// 日期区间即：'2015/01/01 00:00:00' - '2015/01/01 23:59:59'
								date[1] = ((new Date(date[1])).setHours(23, 59, 59, 0)).valueOf();
							}
						}
					} else {
						// mode is single, convert date object into a timestamp
						// 如果是 'single' 模式，则将日期对象转换成时间戳。
						// 即：+new Date(date)，返回值类似：1423929600000。
						// setHours使用方法参考 http://www.w3school.com.cn/jsref/jsref_setHours.asp
						date = ((new Date(date)).setHours(0, 0, 0, 0)).valueOf();
					}
					// at this point date is either a timestamp at hour zero 
					//  for 'single' mode, an array of timestamps at hour zero for 
					//  'multiple' mode, or a two-item array with timestamps at hour
					//  zero and hour 23:59 for 'range' mode
				}
				return date;
			};
		return {
			/**
			 * 'Public' functions
			 */

			/**
			 * Called when element.DatePicker() is invoked
			 *
			 * Note that 'this' is the HTML element that DatePicker was invoked upon
			 * @see DatePicker()
			 */
			// 初始化日历
			init: function(options) {
				// 初始化选项
				options = $.extend({}, defaults, options || {});
				// 根据本地化扩展日期实例原型方法。
				extendDate(options.locale);
				// 需要展示的日历个数
				options.calendars = Math.max(1, parseInt(options.calendars, 10) || 1);
				// 日历模式，默认为 'single'，即：只可选择一天。
				// 'multiple' 选择多天。
				// 'range' 选择日期区间。
 				options.mode = /single|multiple|range/.test(options.mode) ? options.mode : 'single';

 				// 遍历日历元素
				return this.each(function() {
					// 如果元素上木有 'datepicker' 数据，则初始化，否则跳过已经初始化过的元素。
					if (!$(this).data('datepicker')) {
						options.el = this; // 设置当前日历元素缓存options.el，如：input。

						// 处理开始、结束日期
						options.date = normalizeDate(options.mode, options.date);

						// 当前日期
						if (!options.current) {
							options.current = new Date();
						} else {
							options.current = new Date(options.current);
						}
						options.current.setDate(1);
						options.current.setHours(0, 0, 0, 0);

						// 当前日历id
						var id = 'datepicker_' + parseInt(Math.random() * 1000),
							cnt;
						options.id = id;
						// 在元素上缓存数据 'datepickerId'。
						$(this).data('datepickerId', options.id);
						// 处理日历元素（设置属性id，绑定datepicker数据，绑定click事件回调）
						var cal = $(tpl.wrapper).attr('id', id).bind('click', click).data('datepicker', options);
						// 为日历元素添加自定义类
						if (options.className) {
							cal.addClass(options.className);
						}
						var html = '';
						// 根据日历个数遍历生成html。
						for (var i = 0; i < options.calendars; i++) {
							cnt = options.starts; // 一周起始日期
							if (i > 0) {
								html += tpl.space;
							}
							// calendar header template
							// 生成日历头部
							html += tmpl(tpl.head.join(''), {
								prev: options.prev,
								next: options.next,
								day1: options.locale.daysMin[(cnt++) % 7],
								day2: options.locale.daysMin[(cnt++) % 7],
								day3: options.locale.daysMin[(cnt++) % 7],
								day4: options.locale.daysMin[(cnt++) % 7],
								day5: options.locale.daysMin[(cnt++) % 7],
								day6: options.locale.daysMin[(cnt++) % 7],
								day7: options.locale.daysMin[(cnt++) % 7]
							});
						}
						cal
							.find('tr:first').append(html) // 将日历html塞入日历容器
							.find('table').addClass(views[options.view]); // 为每个table添加类

						// 为每个日历填充单元格？？？
						fill(cal.get(0));
						// 如果 options.inline === true
						// 生成的日历直接展示在cal内部（显示的）。
						if (options.inline) {
							cal.appendTo(this).show().css('position', 'relative');
							layout(cal.get(0)); //？？？
						} else {
							// 生成的日历在body内部，需要触发focus事件才能显示生成的日历。
							// 否则，日历元素直接追加到 document.body 里。
							cal.appendTo(document.body);
							// 元素聚焦事件
							$(this).bind(options.showOn, show);
						}
					}
				});
			},

			/**
			 * Shows the DatePicker, applicable only when the picker is not inline
			 *
			 * @return the DatePicker HTML element
			 * @see DatePickerShow()
			 */
			// 显示日历
			showPicker: function() {
				var id;
				return this.each(function() {
					if (id = $(this).data('datepickerId')) {
						var cal = $('#' + id);
						var options = cal.data('datepicker');
						// 如果options.inline === false则日历直接调用show方法显示日历组件。
						if (!options.inline) {
							show.apply(this);
						}
					}
				});
			},

			/**
			 * Hides the DatePicker, applicable only when the picker is not inline
			 *
			 * @return the DatePicker HTML element
			 * @see DatePickerHide()
			 */
			// 隐藏日历
			hidePicker: function() {
				var id;
				return this.each(function() {
					if (id = $(this).data('datepickerId')) {
						var cal = $('#' + id);
						var options = cal.data('datepicker');
						// 如果options.inline === false，则日历直接隐藏。
						if (!options.inline) {
							$('#' + id).hide();
						}
					}
				});
			},

			/**
			 * Sets the DatePicker current date, and optionally shifts the current
			 * calendar to that date.
			 *
			 * @param Date|String|int|Array date The currently selected date(s).
			 *        This can be: a single date, an array
			 *        of two dates (sets a range when 'mode' is 'range'), or an array of
			 *        any number of dates (selects all dates when 'mode' is 'multiple'.
			 *        The supplied dates can be any one of: Date object, milliseconds
			 *        (as from date.getTime(), date.valueOf()), or a date string
			 *        parseable by Date.parse().
			 * @param boolean shiftTo if true, shifts the visible calendar to the
			 *        newly set date(s)
			 *
			 * @see DatePickerSetDate()
			 */
			// 设置当前选中日期，参数shiftTo为boolean值。（作用于多个日历）
			setDate: function(date, shiftTo) {
				return this.each(function() {
					if ($(this).data('datepickerId')) {
						var cal = $('#' + $(this).data('datepickerId'));
						var options = cal.data('datepicker'); // 获取日历选项
						options.date = normalizeDate(options.mode, date); // 序列化日期

						// 如果参数shiftTo为真，则设置options.current值。
						if (shiftTo) {
							// 如果是多个日期模式，则取第一个起始日期。
							options.current = new Date(options.mode != 'single' ? options.date[0] : options.date);
						}
						fill(cal.get(0));
					}
				});
			},

			/**
			 * Returns the currently selected date(s) and the datepicker element.
			 *
			 * @return array where the first element is the selected date(s)  When calendar mode  is 'single' this
			 *        is a single date object, or null if no date is selected.  When calendar mode is 'range', this is an array containing
			 *        a 'from' and 'to' date objects, or the empty array if no date range is selected.  When calendar mode is 'multiple' this
			 *       	is an array of Date objects, or the empty array if no date is selected.
			 *        The second element is the HTMLElement that DatePicker was invoked upon
			 *
			 * @see DatePickerGetDate()
			 */
			// 返回当前选中的日期和日历元素（作用于单个日历）
			getDate: function() {
				if (this.size() > 0) {
					// 返回值，如：[[from, to], options.el];
					return prepareDate($('#' + $(this).data('datepickerId')).data('datepicker'));
				}
			},

			/**
			 * Clears the currently selected date(s)
			 *
			 * @see DatePickerClear()
			 */
			// 清除当前选中日期（作用于单个日历）
			clear: function() {
				return this.each(function() {
					if ($(this).data('datepickerId')) {
						var cal = $('#' + $(this).data('datepickerId'));
						var options = cal.data('datepicker');
						if (options.mode == 'single') { // 单个日历模式
							options.date = null;
						} else { // 多个日历模式
							options.date = [];
						}
						fill(cal.get(0));
					}
				});
			},

			/**
			 * Only applicable when the DatePicker is inline
			 *
			 * @see DatePickerLayout()
			 */
			// 适用于日历在页面上显示的情况，即：options.inline === true。（作用于多个日历）
			fixLayout: function() {
				return this.each(function() {
					if ($(this).data('datepickerId')) {
						var cal = $('#' + $(this).data('datepickerId'));
						var options = cal.data('datepicker'); // 从'datepickerId'获取当前日历选项数据
						if (options.inline) {
							// 如果options.inline===true，则调用layout方法勾画出日历组件。
							layout(cal.get(0));
						}
					}
				});
			}
		};
	}(); // DatePicker

	// Extend jQuery with the following functions so that they can be called on HTML elements, ie: $('#widgetCalendar').DatePicker();
	// 暴露常用方法到原型上
	$.fn.extend({
		DatePicker: DatePicker.init, // 根据options初始化日历
		DatePickerHide: DatePicker.hidePicker, // 隐藏日历
		DatePickerShow: DatePicker.showPicker, // 显示日历
		DatePickerSetDate: DatePicker.setDate, // 设置当前选中日历日期
		DatePickerGetDate: DatePicker.getDate, // 获取当前选中日历日期
		DatePickerClear: DatePicker.clear, // 清除当前选中的日历日期
		DatePickerLayout: DatePicker.fixLayout // 当选项options.inline===true时，修复layout。
	});
})(jQuery);

// jquery 模板方法
(function() {
	// within here, 'this' refers to the window object
	var cache = {};

	this.tmpl = function tmpl(str, data) {
		// Figure out if we're getting a template, or if we need to
		// load the template - and be sure to cache the result.
		var fn = !/\W/.test(str) ?
			cache[str] = cache[str] ||
			tmpl(document.getElementById(str).innerHTML) :

			// Generate a reusable function that will serve as a template
			// generator (and which will be cached).
			new Function("obj",
				"var p=[],print=function(){p.push.apply(p,arguments);};" +

				// Introduce the data as local variables using with(){}
				"with(obj){p.push('" +

				// Convert the template into pure JavaScript
				str
				.replace(/[\r\t\n]/g, " ")
				.split("<%").join("\t")
				.replace(/((^|%>)[^\t]*)'/g, "$1\r")
				.replace(/\t=(.*?)%>/g, "',$1,'")
				.split("\t").join("');")
				.split("%>").join("p.push('")
				.split("\r").join("\\'") + "');}return p.join('');");

		// Provide some basic currying to the user
		return data ? fn(data) : fn;
	};
})();