/*
 * mose-actions.js - the web view of the "Suivi des actions" action-tracker.
 *
 * It turns every ``` mose-actions fenced code block (rendered by wp-githuber-md as
 * <pre><code class="language-mose-actions">...</code></pre>) into a Red/Orange/Green table with a
 * Synthese line, matching what htmltoPDF.ps1 builds for the PDF. Enqueue it on gi.grassone.be the
 * same way view.js / mermaid.js are loaded (e.g. a Code Snippets footer snippet, or the theme).
 *
 * The PDF does NOT use this file: htmltoPDF.ps1 fetches the raw HTML (no JavaScript runs) and builds
 * the same table server-side, so the two must be kept in step.
 */
(function () {
  'use strict';

  var PALETTE = {
    red: { row: '#fdecea', bar: '#d93025', pill: '#d93025' },
    orange: { row: '#fff4e5', bar: '#e8710a', pill: '#e8710a' },
    green: { row: '#e7f4ea', bar: '#188038', pill: '#188038' },
    neutral: { row: '#ffffff', bar: '#cfd4da', pill: '#5f6368' }
  };
  var RED = ['r', 'red', 'rouge', 'rood', 'rot', 'critical', 'crit', 'high', 'urgent', 'ko', 'nok', '3'];
  var ORANGE = ['o', 'a', 'orange', 'amber', 'oranje', 'medium', 'med', 'warning', 'warn', 'attention', 'ongoing', 'wip', 'in progress', 'en cours', '2'];
  var GREEN = ['g', 'v', 'green', 'vert', 'groen', 'ok', 'done', 'resolved', 'resolu', 'resolu', 'closed', 'clos', 'fait', 'low', '1'];

  function status(value) {
    var v = (value || '').trim().toLowerCase();
    if (!v) { return null; }
    if (RED.indexOf(v) >= 0) { return 'red'; }
    if (ORANGE.indexOf(v) >= 0) { return 'orange'; }
    if (GREEN.indexOf(v) >= 0) { return 'green'; }
    switch (v.charAt(0)) {
      case 'r': return 'red';
      case 'o': case 'a': return 'orange';
      case 'g': case 'v': return 'green';
      default: return null;
    }
  }

  function enc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function matchAny(text, words) {
    var re = new RegExp(words, 'i');
    return re.test(text);
  }

  function build(text) {
    var title = null;
    var rows = [];
    text.split(/\r?\n/).forEach(function (line) {
      var t = line.trim();
      if (!t) { return; }
      if (t.charAt(0) === '#') { title = t.replace(/^#+/, '').trim(); return; }
      if (/^\|?\s*[-:| ]+\s*\|?$/.test(t) && t.indexOf('-') >= 0) { return; }
      var parts = t.split('|');
      var start = 0, end = parts.length - 1;
      if (t.charAt(0) === '|') { start = 1; }
      if (t.charAt(t.length - 1) === '|') { end = parts.length - 2; }
      var cells = [];
      for (var i = start; i <= end; i++) { cells.push(parts[i].trim()); }
      if (cells.length) { rows.push(cells); }
    });
    if (!rows.length) { return null; }

    var header, statusIdx = -1, ownerIdx = -1, dueIdx = -1;
    var first = rows[0];
    var named = first.filter(function (c) {
      return matchAny(c, 'issue|solution|owner|due|date|status|statut|comment|action|probl|responsable|.cheance|priorit');
    }).length;
    if (named >= 2) {
      header = first;
      rows.shift();
      header.forEach(function (name, i) {
        if (statusIdx < 0 && matchAny(name, 'status|statut|rag')) { statusIdx = i; }
        if (ownerIdx < 0 && matchAny(name, 'owner|responsable|assign')) { ownerIdx = i; }
        if (dueIdx < 0 && matchAny(name, 'due|date|.ch.ance|deadline')) { dueIdx = i; }
      });
    } else {
      header = ['Issue', 'Solution', 'Owner', 'Due date', 'Status', 'Comments'];
      statusIdx = 4; ownerIdx = 2; dueIdx = 3;
    }
    var columns = header.length;

    if (statusIdx < 0) {
      for (var c = 0; c < columns; c++) {
        var hits = 0, vals = 0;
        rows.forEach(function (r) { if (r[c]) { vals++; if (status(r[c])) { hits++; } } });
        if (vals > 0 && hits === vals) { statusIdx = c; break; }
      }
    }

    var counts = { red: 0, orange: 0, green: 0, neutral: 0 }, noOwner = 0, withDue = 0;
    var html = '<div class="mose-actions" style="margin:14px 0;">';
    if (title) {
      html += '<p style="font-family:\'Fira Sans\',Arial,sans-serif;font-weight:bold;font-size:1.25em;margin:0 0 6px;">' + enc(title) + '</p>';
    }
    html += '<table style="border-collapse:collapse;width:100%;font-family:\'Fira Sans\',Arial,sans-serif;font-size:0.95em;"><thead><tr>';
    for (var h = 0; h < columns; h++) {
      var align = h === statusIdx ? 'center' : 'left';
      html += '<th style="background:#1f3864;color:#fff;text-align:' + align + ';padding:6px 8px;border:1px solid #cfd4da;font-weight:bold;">' + enc(header[h]) + '</th>';
    }
    html += '</tr></thead><tbody>';

    rows.forEach(function (row) {
      var st = (statusIdx >= 0 && statusIdx < row.length) ? status(row[statusIdx]) : null;
      var key = st || 'neutral';
      counts[key]++;
      if (ownerIdx >= 0 && !row[ownerIdx]) { noOwner++; }
      if (dueIdx >= 0 && row[dueIdx]) { withDue++; }
      var tint = PALETTE[key];
      html += '<tr style="background:' + tint.row + ';">';
      for (var i = 0; i < columns; i++) {
        var value = i < row.length ? row[i] : '';
        var cellStyle = 'padding:6px 8px;border:1px solid #cfd4da;vertical-align:top;';
        if (i === 0) { cellStyle += 'border-left:4px solid ' + tint.bar + ';'; }
        if (i === statusIdx) {
          if (st) {
            var label = value ? enc(value) : (key.charAt(0).toUpperCase() + key.slice(1));
            html += '<td style="' + cellStyle + 'text-align:center;"><span style="display:inline-block;padding:2px 12px;border-radius:11px;background:' + tint.pill + ';color:#fff;font-weight:bold;white-space:nowrap;">' + label + '</span></td>';
          } else {
            html += '<td style="' + cellStyle + 'text-align:center;">' + enc(value) + '</td>';
          }
        } else {
          html += '<td style="' + cellStyle + '">' + enc(value) + '</td>';
        }
      }
      html += '</tr>';
    });
    html += '</tbody></table>';

    html += '<p style="font-family:\'Fira Sans\',Arial,sans-serif;font-size:0.9em;margin:6px 0 0;"><strong>Synthèse —</strong> Total : ' + rows.length +
      ' · <span style="color:#d93025;font-weight:bold;">● Red : ' + counts.red + '</span>' +
      ' · <span style="color:#e8710a;font-weight:bold;">● Orange : ' + counts.orange + '</span>' +
      ' · <span style="color:#188038;font-weight:bold;">● Green : ' + counts.green + '</span>';
    if (ownerIdx >= 0) { html += ' · Sans owner : ' + noOwner; }
    if (dueIdx >= 0) { html += ' · Avec échéance : ' + withDue; }
    html += '</p></div>';
    return html;
  }

  function run() {
    var blocks = document.querySelectorAll('code.language-mose-actions');
    for (var i = 0; i < blocks.length; i++) {
      var code = blocks[i];
      var pre = code.closest ? code.closest('pre') : code.parentNode;
      var target = pre || code;
      var html = build(code.textContent || '');
      if (!html) { continue; }
      var wrap = document.createElement('div');
      wrap.innerHTML = html;
      target.parentNode.replaceChild(wrap.firstChild, target);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
