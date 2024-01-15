'use strict';

const {expect} = require('chai');
var xUtils = require('../index.js');

describe('xcraft.utils', function () {
  describe('string camelcasify', function () {
    var topics = [
      {
        in: '',
        out: '',
      },
      {
        in: 'foo.bar',
        out: 'fooBar',
      },
      {
        in: 'fooBar',
        out: 'fooBar',
      },
      {
        in: 'f.o.o.b.a.r',
        out: 'fOOBAR',
      },
      {
        in: 'fo.ob.ar',
        out: 'foObAr',
      },
    ];

    topics.forEach(function (item) {
      it('camelcasify ' + item.in, function () {
        expect(xUtils.string.camelcasify(item.in)).to.be.equal(item.out);
      });
    });
  });

  describe('string capitalize', function () {
    var strings = [
      {
        in: '',
        out: '',
      },
      {
        in: 'foobar',
        out: 'Foobar',
      },
      {
        in: 'FOOBAR',
        out: 'Foobar',
      },
      {
        in: 'fOOBAR',
        out: 'Foobar',
      },
      {
        in: 'Foobar',
        out: 'Foobar',
      },
    ];

    strings.forEach(function (str) {
      it('capitalize ' + str.in, function () {
        expect(xUtils.string.capitalize(str.in)).to.be.equal(str.out);
      });
    });
  });
});
