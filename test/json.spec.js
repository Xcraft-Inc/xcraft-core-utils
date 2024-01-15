'use strict';

const {expect} = require('chai');
const {dotKeysToObject} = require('../lib/json.js');

describe('xcraft.utils.json', function () {
  describe('json', function () {
    it('dotKeysToObject', function () {
      const input = {
        ['le.chevalier.Bragon']: {
          ['formé.par.le.Rige']: {
            ['et.Mara.la.mère.de']: 'Pélisse',
          },
        },
      };

      const output = {
        le: {
          chevalier: {
            Bragon: {
              formé: {
                par: {
                  le: {
                    Rige: {
                      et: {
                        Mara: {
                          la: {
                            mère: {
                              de: 'Pélisse',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const result = dotKeysToObject(input);
      expect(result).to.be.eql(output);
    });
  });
});
