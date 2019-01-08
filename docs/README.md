# Lexer #

An elegant armor-plated JavaScript lexer modelled after flex. Easily extensible to tailor to your need for perfection.

Forked from https://github.com/aaditmshah/lexer

## Usage ##

Creating a lexer is as simple as instantiating the constructor `Lexer`.

```javascript
let lexer = new Lexer;
```

After creating a lexer you may add rules to the lexer using the method `addRule`. The first argument to the function must be a `RegExp` object (the pattern to match). The second argument must be a function (the action to call when the pattern matches some text). The arguments passed to the function are the lexeme that was matched and all the substrings matched by parentheticals in the regular expression if any.

```javascript
let lexer = new Lexer;

lexer.addRule(/[a-f\d]+/i, function (lexeme) {
    return "HEX";
});
```

After adding rules to the lexer you may set the property `input` of the lexer to any string that you wish to tokenize and then call the method `lex`. The function returns the first non `undefined` value returned by an action. Else it returns `undefined` if it scans the entire input string. On calling `lex` it starts scanning where it last left off. The `addRule` and `setInput` methods of the lexer support chaining.

```javascript
let lines = 0;
let chars = 0;

(new Lexer).addRule(/\n/, function () {
    lines++;
    chars++;
}).addRule(/./, function () {
    chars++;
}).setInput("Hello World!").lex();
```

If the lexer can't match any pattern then it executes the default rule which matches the next character in the input string. The default action may be specified as an argument to the constructor. Setting the property `reject` on the `this` object in an action to `true` tells the lexer to reject the current rule and match the next best rule.

```javascript
let row = 1;
let col = 1;

let lexer = new Lexer(function (char) {
    throw new Error("Unexpected character at row " + row + ", col " + col + ": " + char);
});

lexer.addRule(/\n/, function () {
    row++;
    col = 1;
}, []);

lexer.addRule(/./, function () {
    this.reject = true;
    col++;
}, []);

lexer.input = "Hello World!";

lexer.lex();
```

You may even specify [start conditions](http://flex.sourceforge.net/manual/Start-Conditions.html "Start Conditions - Lexical Analysis With Flex, for Flex 2.5.37") for every rule as an optional third argument to the `addRule` method (which must be an array of unsigned integers). By default all rules are active in the initial state (i.e. `0`). Odd start conditions are inclusive while even start conditions are exclusive. Rules with an empty array as the third argument are always active.

## Integration with Jison ##

The generated lexer may be used as a custom scanner for Jison. Actions must return tokens and associated text must be made available in the property `yytext` on the object `this` from within the action.

```javascript
let Parser = require("jison").Parser;
let Lexer = require("lex");

let grammar = {
    "bnf": {
        "expression" :[[ "e EOF",   "return $1;"  ]],
        "e" :[[ "NUMBER",  "$$ = Number(yytext);" ]]
    }
};

let parser = new Parser(grammar);
let lexer = parser.lexer = new Lexer;

lexer.addRule(/\s+/, function () {});

lexer.addRule(/[0-9]+(?:\.[0-9]+)?\b/, function (lexeme) {
    this.yytext = lexeme;
    return "NUMBER";
});

lexer.addRule(/$/, function () {
    return "EOF";
});

parser.parse("2");
```

Starting from v1.6.0 you can return multiple values from an action by returning an array. The elements of the array will be returned individually by the `lex` method. This allows you to implement features like [python style indentation](http://docs.python.org/release/2.5.1/ref/indentation.html "2.1.8 Indentation") as follows:

```javascript
let indent = [0];

let lexer = new Lexer;

lexer.addRule(/^[\t ]*/gm, function (lexeme) {
    let indentation = lexeme.length;

    if (indentation > indent[0]) {
        indent.unshift(indentation);
        return "INDENT";
    }

    let tokens = [];

    while (indentation < indent[0]) {
        tokens.push("DEDENT");
        indent.shift();
    }

    if (tokens.length) return tokens;
});
```

## Global Patterns ##

Sometimes you may wish to match a pattern which need not necessarily generate the longest possible string. Since the scanner sorts the matched strings according to their length there's no way to do so. Hence in v1.7.0 I introduced global patterns. Strings matching these patterns are never sorted. This allows you to match a shorter strings before longer ones:

```javascript
let lexer = new Lexer;

lexer.addRule(/^ */gm, function (lexeme) {
    console.log(lexeme.length);
});

lexer.addRule(/[0-9]+/, function (lexeme) {
    console.log(lexeme);
});

lexer.setInput("37");

lexer.lex();
```

The above program first logs the number of spaces at the beginning of the line (`0`) and then the number `37` although the length of the string `"37"` is greater than the empty string `""`. This is because it's the first rule and the `global` flag for its pattern is set.
