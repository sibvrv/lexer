let engineHasStickySupport = false;
let engineHasUnicodeSupport = false;

try {
  engineHasStickySupport = typeof (/(?:)/ as any).sticky == 'boolean';
} catch (ignored) {
  engineHasStickySupport = false;
}

try {
  engineHasUnicodeSupport = typeof (/(?:)/ as any).unicode == 'boolean';
} catch (ignored) {
  engineHasUnicodeSupport = false;
}

declare global {
  type TLexerActionCallBack = (result?: RegExpExecArray | null, sender?: Lexer) => any;

  interface ILexerMatchResult {
    result: RegExpExecArray | null;
    action: TLexerActionCallBack;
    length: number;
  }

  type TLexerMatchesList = ILexerMatchResult[];
}

/**
 * Lexer Class
 */
export class Lexer {

  private rules: any[] = [];

  private tokens: any[] = [];
  private remove = 0;

  private state = 0;
  private index = 0;
  private input = "";

  private reject: boolean = false;

  defunct = (chr: string) => {
    throw new LexerError(this.index - 1, chr);
  };

  /**
   * Add Rule
   * @param pattern
   * @param action
   * @param start
   */
  addRule(pattern: any, action: TLexerActionCallBack, start?: number | number[]) {
    let global = pattern.global;

    if (!global || engineHasStickySupport && !pattern.sticky) {
      let flags = engineHasStickySupport ? "gy" : "g";
      if (pattern.multiline) flags += "m";
      if (pattern.ignoreCase) flags += "i";
      if (engineHasUnicodeSupport && pattern.unicode) flags += "u";
      pattern = new RegExp(pattern.source, flags);
    }

    this.rules.push({
      pattern,
      global,
      action,
      start: Array.isArray(start) ? start : [start || 0]
    });

    return this;
  };

  /**
   * Set Input Text
   * @param input
   */
  setInput(input: string) {
    this.remove = 0;

    this.state = 0;
    this.index = 0;
    this.tokens.length = 0;
    this.input = input;
    return this;
  };

  /**
   * Find line and column from index in the input string
   * @param index
   */
  getLineColumn(index: number) {
    index = Math.max(0, Math.min(index, this.input.length));
    let line = 1;
    let col = 1;
    for (let i = 0; i < index; i++) {
      if (this.input[i] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
    }
    return {line, col};
  }

  /**
   * Lex
   */
  lex() {
    if (this.tokens.length) return this.tokens.shift();

    this.reject = true;

    while (this.index <= this.input.length) {
      let matches = this.scan().splice(this.remove);
      let index = this.index;

      while (matches.length) {
        if (this.reject) {
          let match = matches.shift()!;
          let result = match.result!;
          let length = match.length;
          this.index += length;
          this.reject = false;
          this.remove++;

          let token = match.action(result, this);
          if (this.reject) {
            this.index = result.index;
          } else if (typeof token !== "undefined") {
            if (Array.isArray(token)) {
              this.tokens = token.slice(1);
              token = token[0];
            }

            if (length) {
              this.remove = 0;
            }
            return token;
          }
        } else break;
      }

      let input = this.input;

      if (index < input.length) {
        if (this.reject) {
          this.remove = 0;

          let token: any = this.defunct(input.charAt(this.index++));
          if (typeof token !== "undefined") {
            if (Array.isArray(token)) {
              this.tokens = token.slice(1);
              return token[0];
            } else {
              return token;
            }
          }
        } else {
          if (this.index !== index) this.remove = 0;
          this.reject = true;
        }
      } else if (matches.length)
        this.reject = true;
      else {
        break;
      }
    }
  }

  /**
   * Scan
   */
  scan(): TLexerMatchesList {
    let matches: TLexerMatchesList = [];

    let index = 0;

    let state = this.state;
    let lastIndex = this.index;
    let input = this.input;

    for (let i = 0, length = this.rules.length; i < length; i++) {
      let rule = this.rules[i];
      let start = rule.start;
      let states = start.length;

      if ((!states || start.indexOf(state) >= 0) ||
        (state % 2 && states === 1 && !start[0])) {
        let pattern = rule.pattern;
        pattern.lastIndex = lastIndex;
        let result = pattern.exec(input);

        if (result && result.index === lastIndex) {
          let j = matches.push({
            result,
            action: rule.action,
            length: result[0].length
          });

          if (rule.global) index = j;

          while (--j > index) {
            let k = j - 1;

            if (matches[j].length > matches[k].length) {
              let temple = matches[j];
              matches[j] = matches[k];
              matches[k] = temple;
            }
          }
        }
      }
    }

    return matches;
  }
}

/**
 * Lexer Error Class
 * @extends Error
 */
export class LexerError extends Error {
  constructor(at: number, token: string) {
    super();

    this.name = 'IllegalTokenException';
    this.message = `Unexpected character at index ${at}: "${token}" (hex: 0x${token.charCodeAt(0).toString(16).toUpperCase()})`;

    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, LexerError);
    } else {
      this.stack = (new Error()).stack;
    }
  }
}
