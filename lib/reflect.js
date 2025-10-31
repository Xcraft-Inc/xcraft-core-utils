'use strict';

// Not compatible CommonJS
// https://github.com/sindresorhus/fn-args/blob/v6.0.0/index.js

function funcParams(function_) {
  if (typeof function_ !== 'function') {
    throw new TypeError('Expected a function');
  }

  const commentRegex = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/gm;
  const quotes = ['`', '"', "'"];

  const functionSource = function_.toString().replace(commentRegex, ''); // Function with no comments

  let functionWithNoDefaults = '';
  let depth = 0; // () [] {}
  let index = 0;

  // To remove default values we can not use regexp because finite automaton can not handle such
  // things as (potential) infinity-nested blocks (), [], {}

  // Remove default values
  for (
    ;
    index < functionSource.length && functionSource.charAt(index) !== ')';
    index += 1
  ) {
    // Exiting if an arrow occurs. Needed when arrow function without '()'.
    if (functionSource.startsWith('=>', index)) {
      functionWithNoDefaults = functionSource;
      index = functionSource.length;
      break;
    }

    // If we found a default value - skip it
    if (functionSource.charAt(index) === '=') {
      for (
        ;
        index < functionSource.length &&
        ((functionSource.charAt(index) !== ',' &&
          functionSource.charAt(index) !== ')') ||
          depth !== 0);
        index += 1
      ) {
        // Skip all quotes
        let wasQuote = false;

        for (const quote of quotes) {
          if (functionSource.charAt(index) === quote) {
            index += 1;

            for (
              ;
              index < functionSource.length &&
              functionSource.charAt(index) !== quote;

            ) {
              index += 1;
            }

            wasQuote = true;
            break;
          }
        }

        // If any quote type was skipped, start the cycle again
        if (wasQuote) {
          continue;
        }

        switch (
          functionSource.charAt(index) // Keeps correct depths of all types of parenthesises
        ) {
          case '(':
          case '[':
          case '{':
            depth += 1;
            break;
          case ')':
          case ']':
          case '}':
            depth -= 1;
            break;
          default:
        }
      }

      if (functionSource.charAt(index) === ',') {
        functionWithNoDefaults += ',';
      }

      if (functionSource.charAt(index) === ')') {
        // Quits from the cycle immediately
        functionWithNoDefaults += ')';
        break;
      }
    } else {
      functionWithNoDefaults += functionSource.charAt(index);
    }
  }

  if (index < functionSource.length && functionSource.charAt(index) === ')') {
    functionWithNoDefaults += ')';
  }

  // The first part matches parens-less arrow functions
  // The second part matches the rest
  const regexFnArguments = /^(?:async)?([^=()]+)=|\(([^)]+)\)/;

  const match = regexFnArguments.exec(functionWithNoDefaults);

  return match
    ? (match[1] || match[2])
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    : [];
}

function parseOptions(args) {
  const result = [];

  /* This regex is able to parse correctly options like:
   *   --option=dirname
   *   --option="dir name"
   *  "--option=dir name"
   *   --option="\"dirname\""
   *   --option=dir\ name
   *   --option='dir name'
   *  '--option=dir name'
   *   --option='\'dirname\''
   *
   * white spaces ---------------------------------------------.
   * escaped double/single quotes  -----------------.          |
   * single-quotes ------------------.              |          |
   * double-quotes --.               |              |          |
   *                 |               |              |          |      */
  args /*            v               v              v          v      */
    .match(/("(?:\\"|[^"])+"|'(?:\\'|[^'])+'|(?:\\ |[^ \n'"])+|[ \n]+)/g)
    .forEach(function (arg) {
      if (arg.trim().length === 0) {
        result.push('');
      } else {
        const idx = result.length ? result.length - 1 : 0;
        if (!result[idx]) {
          result[idx] = arg;
        } else {
          result[idx] += arg;
        }
      }
    });

  return result;
}

module.exports = {
  funcParams,
  parseOptions,
};
