"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var engineHasStickySupport = false;
var engineHasUnicodeSupport = false;
try {
    engineHasStickySupport = typeof /(?:)/.sticky == 'boolean';
}
catch (ignored) {
    engineHasStickySupport = false;
}
try {
    engineHasUnicodeSupport = typeof /(?:)/.unicode == 'boolean';
}
catch (ignored) {
    engineHasUnicodeSupport = false;
}
/**
 * Lexer Class
 */
var Lexer = /** @class */ (function () {
    function Lexer() {
        var _this = this;
        this.rules = [];
        this.tokens = [];
        this.remove = 0;
        this.state = 0;
        this.index = 0;
        this.input = "";
        this.reject = false;
        this.defunct = function (chr) {
            throw new LexerError(_this.index - 1, chr);
        };
    }
    /**
     * Add Rule
     * @param pattern
     * @param action
     * @param start
     */
    Lexer.prototype.addRule = function (pattern, action, start) {
        var global = pattern.global;
        if (!global || engineHasStickySupport && !pattern.sticky) {
            var flags = engineHasStickySupport ? "gy" : "g";
            if (pattern.multiline)
                flags += "m";
            if (pattern.ignoreCase)
                flags += "i";
            if (engineHasUnicodeSupport && pattern.unicode)
                flags += "u";
            pattern = new RegExp(pattern.source, flags);
        }
        this.rules.push({
            pattern: pattern,
            global: global,
            action: action,
            start: Array.isArray(start) ? start : [start || 0]
        });
        return this;
    };
    ;
    /**
     * Set Input Text
     * @param input
     */
    Lexer.prototype.setInput = function (input) {
        this.remove = 0;
        this.state = 0;
        this.index = 0;
        this.tokens.length = 0;
        this.input = input;
        return this;
    };
    ;
    /**
     * Find line and column from index in the input string
     * @param index
     */
    Lexer.prototype.getLineColumn = function (index) {
        index = Math.max(0, Math.min(index, this.input.length));
        var line = 1;
        var col = 1;
        for (var i = 0; i < index; i++) {
            if (this.input[i] === '\n') {
                line++;
                col = 1;
            }
            else {
                col++;
            }
        }
        return { line: line, col: col };
    };
    /**
     * Lex
     */
    Lexer.prototype.lex = function () {
        if (this.tokens.length)
            return this.tokens.shift();
        this.reject = true;
        while (this.index <= this.input.length) {
            var matches = this.scan().splice(this.remove);
            var index = this.index;
            while (matches.length) {
                if (this.reject) {
                    var match = matches.shift();
                    var result = match.result;
                    var length_1 = match.length;
                    this.index += length_1;
                    this.reject = false;
                    this.remove++;
                    var token = match.action(result, this);
                    if (this.reject) {
                        this.index = result.index;
                    }
                    else if (typeof token !== "undefined") {
                        if (Array.isArray(token)) {
                            this.tokens = token.slice(1);
                            token = token[0];
                        }
                        if (length_1) {
                            this.remove = 0;
                        }
                        return token;
                    }
                }
                else
                    break;
            }
            var input = this.input;
            if (index < input.length) {
                if (this.reject) {
                    this.remove = 0;
                    var token = this.defunct(input.charAt(this.index++));
                    if (typeof token !== "undefined") {
                        if (Array.isArray(token)) {
                            this.tokens = token.slice(1);
                            return token[0];
                        }
                        else {
                            return token;
                        }
                    }
                }
                else {
                    if (this.index !== index)
                        this.remove = 0;
                    this.reject = true;
                }
            }
            else if (matches.length)
                this.reject = true;
            else {
                break;
            }
        }
    };
    /**
     * Scan
     */
    Lexer.prototype.scan = function () {
        var matches = [];
        var index = 0;
        var state = this.state;
        var lastIndex = this.index;
        var input = this.input;
        for (var i = 0, length_2 = this.rules.length; i < length_2; i++) {
            var rule = this.rules[i];
            var start = rule.start;
            var states = start.length;
            if ((!states || start.indexOf(state) >= 0) ||
                (state % 2 && states === 1 && !start[0])) {
                var pattern = rule.pattern;
                pattern.lastIndex = lastIndex;
                var result = pattern.exec(input);
                if (result && result.index === lastIndex) {
                    var j = matches.push({
                        result: result,
                        action: rule.action,
                        length: result[0].length
                    });
                    if (rule.global)
                        index = j;
                    while (--j > index) {
                        var k = j - 1;
                        if (matches[j].length > matches[k].length) {
                            var temple = matches[j];
                            matches[j] = matches[k];
                            matches[k] = temple;
                        }
                    }
                }
            }
        }
        return matches;
    };
    return Lexer;
}());
exports.Lexer = Lexer;
/**
 * Lexer Error Class
 * @extends Error
 */
var LexerError = /** @class */ (function (_super) {
    __extends(LexerError, _super);
    function LexerError(at, token) {
        var _this = _super.call(this) || this;
        _this.name = 'IllegalTokenException';
        _this.message = "Unexpected character at index " + at + ": \"" + token + "\" (hex: 0x" + token.charCodeAt(0).toString(16).toUpperCase() + ")";
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, LexerError);
        }
        else {
            _this.stack = (new Error()).stack;
        }
        return _this;
    }
    return LexerError;
}(Error));
exports.LexerError = LexerError;
