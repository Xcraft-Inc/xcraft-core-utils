'use strict';

var util = require('util');
var colors = require('picocolors');
var figlet = require('figlet');
var ansiRegex = require('ansi-regex');

var xUtils = require('..');

var colored = {
  verb: (text) => colors.cyanBright(colors.bold(text)),
  info: (text) => colors.greenBright(colors.bold(text)),
  warn: (text) => colors.yellowBright(colors.bold(text)),
  err: (text) => colors.redBright(colors.bold(text)),
  dbg: (text) => colors.magentaBright(colors.bold(text)),
};

var indent = 20;

function colorIndexes(text) {
  const regex = ansiRegex();
  const list = [];
  let res;
  while ((res = regex.exec(text))) {
    list.push({
      color: res[0],
      index: res.index,
    });
  }
  return list;
}

exports.getIndent = function () {
  return indent;
};

exports.computeIndent = function (prefix, mod) {
  var len = prefix.length + mod.length + 2;
  len = indent - len;
  if (len < 0) {
    indent += -len;
    len = 0;
  }

  return len;
};

exports.decorate = function (mode, prefix, mod, log, maxWidth, stripBegin) {
  if (!maxWidth) {
    // https://github.com/medikoo/cli-color/blob/b9080d464c76930b3cbfb7f281999fcc26f39fb1/window-size.js#L6
    maxWidth = process.stdout.columns || 0;
  }

  var len = exports.computeIndent(prefix, mod);
  var spaces = mode.length < 4 ? '  ' : ' ';
  var begin = util.format(
    '%s [%s%s] %s:%s',
    colors.white(prefix),
    colors.whiteBright(colors.bold(mod)),
    new Array(len + 1).join(colors.blackBright('.')),
    colored[mode](xUtils.string.capitalize(mode)),
    spaces
  );
  var text = log.replace(/\n/g, ' \n') + ' ';

  var beginLength = begin.replace(ansiRegex(), '').length;
  var availableSpace = maxWidth - beginLength - 1;
  if (availableSpace <= 1) {
    return util.format('%s%s', begin, text);
  }

  let beginEmbedded = '';
  let textNoColor = text.replace(ansiRegex(), '');
  const embedded = /^[a-zA-Z]+ \[[a-zA-Z/.\-_]+\] (?:Verb|Info|Warn|Err|Dbg):/.test(
    textNoColor
  );

  /* Try to detect an embedded xLog */
  if (embedded) {
    const limit = text.indexOf(':');
    beginEmbedded = text.substr(0, limit + 1);
    text = text.substr(limit + 1);
    textNoColor = textNoColor.substr(textNoColor.indexOf(':') + 1);
  }

  /* Retrieve the position of all ANSI colors. */
  let colorsOffset = 0;
  const colorsList = colorIndexes(text);
  if (colorsList.length) {
    text = textNoColor;
  }

  var output = '';
  let _output = '';
  spaces = new Array(beginLength + 1).join(' ');

  if (embedded) {
    const beginEmbeddedNoCol = beginEmbedded.replace(ansiRegex(), '');
    const beginEmbeddedLength = beginEmbeddedNoCol.length;
    const isSmall = /(Err|Dbg):$/.test(beginEmbeddedNoCol); // only 3 chars
    const length = beginLength - beginEmbeddedLength + (isSmall ? -1 : 0);
    const padding = length > 0 ? new Array(length).join(' ') : '';
    if (!stripBegin) {
      _output += `${begin}...\n`;
    }
    begin = `${padding}${beginEmbedded}` + (isSmall ? ' ' : '');
  }

  /* Example with an available space of 120 chars.
   * (.{1,119}[ /\\]|.{120})
   */
  var regex = new RegExp(
    '(.{1,' +
      (parseInt(availableSpace) - 1) +
      '}[ /\\\\]|.{' +
      availableSpace +
      '})',
    'g'
  );
  var matches = text.match(regex) || [text];
  matches.forEach(function (part, index) {
    output += begin + part;
    colorsOffset += begin.length;

    /* Restore the colors */
    while (colorsList.length) {
      const offset = colorsList[0].index + colorsOffset;
      if (offset < output.length) {
        output =
          output.substr(0, offset) +
          colorsList[0].color +
          output.substr(offset);
        colorsList.shift();
      } else {
        break;
      }
    }

    if (index < matches.length - 1) {
      output += '\n';
      colorsOffset++;
    }
    begin = spaces;
  });

  return _output + output;
};

exports.graffiti = function (text, callback) {
  figlet(
    text,
    {
      font: 'Graffiti',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    },
    (err, data) => {
      if (err) {
        callback(err);
        return;
      }

      const output = data.replace(/[_/\\]/g, (match) => {
        switch (match) {
          case '_': {
            return colors.green(match);
          }
          case '/': {
            return colors.greenBright(match);
          }
          case '\\': {
            return colors.blackBright(match);
          }
          case '|': {
            return colors.white(match);
          }
        }
      });

      callback(null, output);
    }
  );
};
