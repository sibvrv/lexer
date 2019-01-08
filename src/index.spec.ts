import {Lexer} from './index';
import {assert} from 'chai';

const testStrings = [
  'ABCDEFG',        // line:0, index:0
  'HIJKLMNOPQRSTU', // line:1, index:8
  'VWXYZ',          // line:2, index:23
  '日本語の文字',     // line:3, index:29
  'English words'   // line:4, index:36
];

describe('Basic Tests', function () {
  describe('getLineColumn function', function () {
    const lexer = new Lexer();
    lexer.setInput(testStrings.join('\n'));

    it('Returns line-column for the first line', function () {
      const result = lexer.getLineColumn(3);
      assert.deepEqual(result, {line: 1, col: 4});
    });

    it('Returns line-column for the middle line', function () {
      const result = lexer.getLineColumn(15);
      assert.deepEqual(result, {line: 2, col: 8});
    });

    it('Returns line-column for the line containing wide chars', function () {
      const result = lexer.getLineColumn(33);
      assert.deepEqual(result, {line: 4, col: 5});
    });

    it('Returns line-column for the last line', function () {
      const result = lexer.getLineColumn(43);
      assert.deepEqual(result, {line: 5, col: 8});
    });

    it('Returns line-column for the last character', function () {
      const result = lexer.getLineColumn(48);
      assert.deepEqual(result, {line: 5, col: 13});
    });
  });
});
