/*
 * Graphs of the MOSE reports, drawn with Chart.js 4.
 *
 * A graph is a ``` block named after its type (the Markdown renderer gives the code element the
 * class language-<type>) with a Markdown table inside: the first row is the title then the
 * labels, the |---| row is skipped, the other rows are the data.
 *
 * The reports are read on screen and printed to A4, where there is no hover: the values that
 * matter are written on the charts, and the charts are drawn at 3x for a sharp print.
 */
(function () {
	'use strict';

	// Colors. Capacity: used is a recessive neutral, free the report teal; free turns to the
	// status colors when low, always with its value and a warning sign written beside it.
	var INK = '#0b0b0b';
	var INK_SECONDARY = '#52514e';
	var GRID = '#e1e0d9';
	var AXIS = '#c3c2b7';
	var SURFACE = '#ffffff';
	var USED = '#dde4e7';
	var FREE = '#00a3a3';
	var STATUS = { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b', neutral: '#898781' };
	// Series of the other graphs, in this fixed order; past eight, a series is drawn in gray.
	var SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
	var EXTRA_SERIES = '#c3c2b7';

	var FREE_WARNING = 25;
	var FREE_CRITICAL = 15;
	var WIDTH = 650;
	var FONT = '"Segoe UI", Helvetica, Arial, sans-serif';
	var GRAPH_TYPES = ['Volbarstacked', 'NasVolume', 'CommVaultJob', 'plotly', 'plotlybarstacked', 'Multiline', 'StorageEvolution', 'warningPie', 'Ardagram'];

	var chartCount = 0;

	// The table of a graph block: { title, labels, rows: [{ name, cells }] }.
	function parseTable(text) {
		var lines = text.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(function (line) {
			return line.indexOf('|') !== -1;
		});
		var rows = [];
		lines.forEach(function (line) {
			if (/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line)) {
				return;
			}
			var cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (cell) { return cell.trim(); });
			rows.push(cells);
		});
		if (rows.length === 0) {
			return null;
		}
		var header = rows.shift();
		return {
			title: header[0] || '',
			labels: header.slice(1),
			rows: rows.map(function (cells) { return { name: cells[0] || '', cells: cells.slice(1) }; })
		};
	}

	// A number from a table cell ("34", "2.4", "2,4", "34 %"), or null.
	function toNumber(cell) {
		if (cell === undefined || cell === null) {
			return null;
		}
		var text = String(cell).replace(/[%\s]/g, '');
		if (text.indexOf('.') === -1) {
			text = text.replace(',', '.');
		}
		var value = parseFloat(text);
		return isFinite(value) ? value : null;
	}

	function formatPercent(value) {
		return Math.round(value) + ' %';
	}

	// Sizes: the modules write bytes; smaller numbers are already in the unit of the title.
	function formatSize(value) {
		if (value < 1e6) {
			return (Math.round(value * 10) / 10).toString();
		}
		var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
		var unit = 0;
		while (value >= 1024 && unit < units.length - 1) {
			value /= 1024;
			unit++;
		}
		return (value >= 100 ? Math.round(value) : Math.round(value * 10) / 10) + ' ' + units[unit];
	}

	function shorten(text, length) {
		return text.length > length ? text.slice(0, length - 1) + '…' : text;
	}

	function freeColor(percent) {
		if (percent < FREE_CRITICAL) {
			return STATUS.critical;
		}
		if (percent < FREE_WARNING) {
			return STATUS.warning;
		}
		return FREE;
	}

	// Commvault job statuses keep their meaning whatever their order in the table.
	function jobStatusColor(name, index) {
		var status = name.toLowerCase();
		if (status === 'completed') { return STATUS.good; }
		if (status.indexOf('error') !== -1 || status.indexOf('warning') !== -1) { return STATUS.warning; }
		if (status.indexOf('fail') !== -1) { return STATUS.critical; }
		if (status.indexOf('kill') !== -1) { return STATUS.serious; }
		if (status.indexOf('commit') !== -1) { return STATUS.neutral; }
		return seriesColor(index);
	}

	function seriesColor(index) {
		return index < SERIES.length ? SERIES[index] : EXTRA_SERIES;
	}

	// Text written on a chart: { x, y, text, align, baseline, color, bold }.
	function drawLabels(chart, labels) {
		var ctx = chart.ctx;
		ctx.save();
		labels.forEach(function (label) {
			ctx.font = (label.bold ? '600 ' : '') + '12px ' + FONT;
			ctx.fillStyle = label.color || INK;
			ctx.textAlign = label.align || 'left';
			ctx.textBaseline = label.baseline || 'middle';
			ctx.fillText(label.text, label.x, label.y);
		});
		ctx.restore();
	}

	function baseOptions(title) {
		return {
			responsive: false,
			animation: false,
			devicePixelRatio: 3,
			layout: { padding: { top: 4, right: 8, bottom: 4, left: 4 } },
			plugins: {
				title: {
					display: !!title,
					text: title,
					align: 'start',
					color: INK,
					font: { family: FONT, size: 14, weight: '600' },
					padding: { top: 0, bottom: 10 }
				},
				legend: {
					position: 'bottom',
					align: 'start',
					labels: { color: INK_SECONDARY, font: { family: FONT, size: 12 }, boxWidth: 12, boxHeight: 12, padding: 14 }
				},
				tooltip: { enabled: true }
			}
		};
	}

	function axis(extra) {
		var options = {
			grid: { color: GRID, drawTicks: false },
			border: { color: AXIS },
			ticks: { color: INK_SECONDARY, font: { family: FONT, size: 12 }, padding: 6 }
		};
		for (var key in extra) {
			options[key] = extra[key];
		}
		return options;
	}

	// Capacity: one horizontal bar per volume, disk or datastore, used then free, in %, with the
	// free part written at the end of the bar.
	function capacityChart(items, title) {
		var height = 64 + items.length * 30;
		var anyLow = items.some(function (item) { return item.free < FREE_WARNING; });
		var legendItems = [
			{ text: 'Used', fillStyle: USED, strokeStyle: USED, lineWidth: 0 },
			{ text: 'Free', fillStyle: FREE, strokeStyle: FREE, lineWidth: 0 }
		];
		if (anyLow) {
			legendItems.push({ text: 'Free under ' + FREE_WARNING + ' %', fillStyle: STATUS.warning, strokeStyle: STATUS.warning, lineWidth: 0 });
			legendItems.push({ text: 'Free under ' + FREE_CRITICAL + ' %', fillStyle: STATUS.critical, strokeStyle: STATUS.critical, lineWidth: 0 });
		}

		var options = baseOptions(title);
		options.indexAxis = 'y';
		options.layout.padding.right = 150;
		options.scales = {
			x: axis({ stacked: true, min: 0, max: 100, ticks: { color: INK_SECONDARY, font: { family: FONT, size: 12 }, padding: 6, stepSize: 25, callback: function (value) { return value + ' %'; } } }),
			y: axis({ stacked: true, grid: { display: false }, border: { color: AXIS } })
		};
		options.plugins.legend.labels.generateLabels = function () { return legendItems; };
		options.plugins.legend.onClick = function () {};
		options.plugins.tooltip.callbacks = {
			label: function (context) {
				var item = items[context.dataIndex];
				return context.dataset.label + ': ' + formatPercent(context.parsed.x) + (item.sizes && context.datasetIndex === 1 ? ' (' + item.sizes + ')' : '');
			}
		};

		return {
			height: height,
			config: {
				type: 'bar',
				data: {
					labels: items.map(function (item) { return shorten(item.name, 36); }),
					datasets: [
						{ label: 'Used', data: items.map(function (item) { return 100 - item.free; }), backgroundColor: USED, borderColor: SURFACE, borderWidth: { right: 2 }, borderSkipped: false, barThickness: 16 },
						{ label: 'Free', data: items.map(function (item) { return item.free; }), backgroundColor: items.map(function (item) { return freeColor(item.free); }), barThickness: 16 }
					]
				},
				options: options,
				plugins: [{
					id: 'freeLabels',
					afterDatasetsDraw: function (chart) {
						var meta = chart.getDatasetMeta(1);
						drawLabels(chart, items.map(function (item, index) {
							var low = item.free < FREE_WARNING;
							return {
								x: chart.chartArea.right + 8,
								y: meta.data[index].y,
								text: (low ? '⚠ ' : '') + formatPercent(item.free) + ' free' + (item.sizes ? ' · ' + item.sizes : ''),
								color: low ? INK : INK_SECONDARY,
								bold: low
							};
						}));
					}
				}]
			}
		};
	}

	// Stacked bars, one per column, a dataset per row, with the total written above each bar.
	function stackedChart(table, colors) {
		var options = baseOptions(table.title);
		options.scales = {
			x: axis({ stacked: true, grid: { display: false }, ticks: { color: INK_SECONDARY, font: { family: FONT, size: 12 }, padding: 6, maxRotation: 45, autoSkip: false } }),
			y: axis({ stacked: true, beginAtZero: true, ticks: { color: INK_SECONDARY, font: { family: FONT, size: 12 }, padding: 6, precision: 0 } })
		};
		options.layout.padding.top = 16;
		var datasets = table.rows.map(function (row, index) {
			var color = colors(row.name, index);
			return {
				label: row.name,
				data: table.labels.map(function (label, column) { return toNumber(row.cells[column]) || 0; }),
				backgroundColor: color,
				borderColor: SURFACE,
				borderWidth: { top: 2 },
				borderSkipped: false,
				maxBarThickness: 36
			};
		});
		return {
			height: 340,
			config: {
				type: 'bar',
				data: { labels: table.labels, datasets: datasets },
				options: options,
				plugins: [{
					id: 'totals',
					afterDatasetsDraw: function (chart) {
						var labels = [];
						table.labels.forEach(function (label, column) {
							var total = 0;
							var top = null;
							datasets.forEach(function (dataset, index) {
								var meta = chart.getDatasetMeta(index);
								if (meta.hidden || !dataset.data[column]) {
									return;
								}
								total += dataset.data[column];
								var element = meta.data[column];
								top = top === null ? element.y : Math.min(top, element.y);
							});
							if (top !== null) {
								labels.push({ x: chart.getDatasetMeta(0).data[column].x, y: top - 4, text: String(Math.round(total * 10) / 10), align: 'center', baseline: 'bottom', color: INK_SECONDARY });
							}
						});
						drawLabels(chart, labels);
					}
				}]
			}
		};
	}

	// Bars of one row (or grouped bars of several rows), values written at the end of the bars.
	function barChart(table) {
		var single = table.rows.length === 1;
		var options = baseOptions(table.title);
		options.plugins.legend.display = !single;
		options.layout.padding.top = 16;
		options.scales = {
			x: axis({ grid: { display: false } }),
			y: axis({ beginAtZero: true })
		};
		var datasets = table.rows.map(function (row, index) {
			return {
				label: row.name,
				data: table.labels.map(function (label, column) { return toNumber(row.cells[column]); }),
				backgroundColor: seriesColor(index),
				maxBarThickness: 36
			};
		});
		var showValues = table.labels.length * datasets.length <= 16;
		return {
			height: 320,
			config: {
				type: 'bar',
				data: { labels: table.labels, datasets: datasets },
				options: options,
				plugins: [{
					id: 'values',
					afterDatasetsDraw: function (chart) {
						if (!showValues) {
							return;
						}
						var labels = [];
						datasets.forEach(function (dataset, index) {
							chart.getDatasetMeta(index).data.forEach(function (element, column) {
								if (dataset.data[column] !== null) {
									labels.push({ x: element.x, y: element.y - 4, text: String(dataset.data[column]), align: 'center', baseline: 'bottom', color: INK_SECONDARY });
								}
							});
						});
						drawLabels(chart, labels);
					}
				}]
			}
		};
	}

	// Lines, one per row; StorageEvolution rows start with a second name column (the disk).
	function lineChart(table, withDisk) {
		var labels = withDisk ? table.labels.slice(1) : table.labels;
		var many = labels.length > 12;
		var datasets = table.rows.map(function (row, index) {
			var cells = withDisk ? row.cells.slice(1) : row.cells;
			var name = withDisk ? row.name + ' ' + (row.cells[0] || '') : row.name;
			var color = seriesColor(index);
			return {
				label: name.trim(),
				data: labels.map(function (label, column) { return toNumber(cells[column]); }),
				borderColor: color,
				backgroundColor: color,
				borderWidth: 2,
				pointRadius: many ? 0 : 4,
				pointBorderColor: SURFACE,
				pointBorderWidth: 2,
				tension: 0,
				spanGaps: true
			};
		});
		var options = baseOptions(table.title);
		options.scales = { x: axis({ grid: { display: false } }), y: axis({}) };
		options.layout.padding.right = datasets.length <= 4 ? 56 : 8;
		return {
			height: 340,
			config: {
				type: 'line',
				data: { labels: labels, datasets: datasets },
				options: options,
				plugins: [{
					id: 'lastValues',
					afterDatasetsDraw: function (chart) {
						// The last value of each line, when there are few lines.
						if (datasets.length > 4) {
							return;
						}
						var written = [];
						datasets.forEach(function (dataset, index) {
							var points = chart.getDatasetMeta(index).data;
							for (var column = dataset.data.length - 1; column >= 0; column--) {
								if (dataset.data[column] !== null) {
									written.push({ x: points[column].x + 8, y: points[column].y, text: String(dataset.data[column]), color: INK_SECONDARY });
									break;
								}
							}
						});
						drawLabels(chart, written);
					}
				}]
			}
		};
	}

	// Share of OK / warning / critical items: a doughnut in the status colors, with the % written.
	function statusShareChart(table) {
		var values = table.labels.map(function (label, column) { return toNumber(table.rows[0].cells[column]) || 0; });
		var total = values.reduce(function (sum, value) { return sum + value; }, 0);
		var colors = [STATUS.good, STATUS.warning, STATUS.critical, STATUS.serious, STATUS.neutral];
		var options = baseOptions(table.title);
		options.plugins.legend.position = 'right';
		options.plugins.legend.labels.generateLabels = function () {
			return table.labels.map(function (label, index) {
				return { text: label + ': ' + values[index] + (total ? ' (' + formatPercent(values[index] * 100 / total) + ')' : ''), fillStyle: colors[index] || EXTRA_SERIES, strokeStyle: SURFACE, lineWidth: 0 };
			});
		};
		options.plugins.legend.onClick = function () {};
		return {
			height: 260,
			config: {
				type: 'doughnut',
				data: {
					labels: table.labels,
					datasets: [{ data: values, backgroundColor: table.labels.map(function (label, index) { return colors[index] || EXTRA_SERIES; }), borderColor: SURFACE, borderWidth: 2 }]
				},
				options: options
			}
		};
	}

	// The chart of a graph block, or null when it has no data to draw.
	function buildChart(type, table) {
		if (!table || table.rows.length === 0 || table.labels.length === 0) {
			return null;
		}
		var hasNumber = table.rows.some(function (row) {
			return row.cells.some(function (cell) { return toNumber(cell) !== null; });
		});
		if (!hasNumber) {
			return null;
		}

		if (type === 'NasVolume') {
			// Rows: volume, free, used.
			var volumes = [];
			table.rows.forEach(function (row) {
				var free = toNumber(row.cells[0]) || 0;
				var used = toNumber(row.cells[1]) || 0;
				var total = free + used;
				if (total > 0) {
					volumes.push({ name: row.name, free: free * 100 / total, sizes: formatSize(free) + ' of ' + formatSize(total) });
				}
			});
			return volumes.length ? capacityChart(volumes, 'Volume capacity') : null;
		}
		if (type === 'Volbarstacked' && table.rows.length === 1) {
			// One row of free %, one column per datastore, volume or disk.
			var row = table.rows[0];
			var items = [];
			table.labels.forEach(function (label, column) {
				var free = toNumber(row.cells[column]);
				if (free !== null && free >= 0 && free <= 100) {
					items.push({ name: label, free: free });
				}
			});
			if (items.length === 0) {
				return null;
			}
			var date = /\d/.test(row.name) ? ' – ' + row.name : '';
			return capacityChart(items, 'Free space' + date);
		}
		if (type === 'CommVaultJob') {
			return stackedChart(table, jobStatusColor);
		}
		if (type === 'Volbarstacked' || type === 'plotlybarstacked') {
			return stackedChart(table, function (name, index) { return seriesColor(index); });
		}
		if (type === 'Multiline' || type === 'StorageEvolution') {
			return lineChart(table, type === 'StorageEvolution');
		}
		if (type === 'warningPie') {
			return statusShareChart(table);
		}
		return barChart(table);
	}

	function renderBlock(code, type) {
		if (code.getAttribute('data-ardareport-graph')) {
			return;
		}
		code.setAttribute('data-ardareport-graph', type);
		var text = code.textContent;
		var container = code.parentNode && code.parentNode.tagName === 'PRE' ? code.parentNode : code;
		container.style.background = 'none';
		container.style.border = '0';
		container.style.textAlign = 'center';

		code.textContent = '';
		code.style.background = 'none';
		if (type === 'Ardagram') {
			return;
		}

		// The table stays in the page for screen readers and copy; the chart is the picture of it.
		var source = document.createElement('span');
		source.className = 'visually-hidden';
		source.textContent = text;
		code.appendChild(source);

		var chart = buildChart(type, parseTable(text));
		if (!chart) {
			var empty = document.createElement('span');
			empty.textContent = 'No data for this graph.';
			empty.style.color = INK_SECONDARY;
			empty.style.fontStyle = 'italic';
			code.appendChild(empty);
			return;
		}

		var canvas = document.createElement('canvas');
		canvas.id = 'ardareport-graph-' + (chartCount++);
		canvas.width = WIDTH;
		canvas.height = chart.height;
		canvas.style.width = WIDTH + 'px';
		canvas.style.height = chart.height + 'px';
		canvas.setAttribute('role', 'img');
		canvas.setAttribute('aria-label', (chart.config.options.plugins.title.text || type) + ' graph; the data table follows.');
		code.insertBefore(canvas, source);
		new window.Chart(canvas, chart.config);
	}

	function renderAll(root) {
		if (!window.Chart || !/^4\./.test(window.Chart.version || '')) {
			return;
		}
		GRAPH_TYPES.forEach(function (type) {
			var blocks = (root || document).querySelectorAll('.language-' + type);
			Array.prototype.forEach.call(blocks, function (block) {
				// The class is on the code element, or on its pre for some Markdown renderers.
				var code = block.tagName === 'PRE' ? (block.querySelector('code') || block) : block;
				renderBlock(code, type);
			});
		});
	}

	window.ArdaReportGraphs = { render: renderAll };
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function () { renderAll(); });
	}
	else {
		renderAll();
	}
	// Graphs added after the page is ready, e.g. by a Markdown renderer running late.
	window.addEventListener('load', function () { renderAll(); });
}());
