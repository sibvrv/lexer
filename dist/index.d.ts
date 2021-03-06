declare global {
    type TLexerActionCallBack = (result?: RegExpExecArray | null, sender?: Lexer) => any;
    interface ILexerMatchResult {
        result: RegExpExecArray | null;
        action: TLexerActionCallBack;
        length: number;
    }
    interface ILexerRule {
        pattern: RegExp;
        global: boolean;
        action: TLexerActionCallBack;
        start: number[];
    }
    type TLexerMatchesList = ILexerMatchResult[];
}
/**
 * Lexer Error Class
 * @extends Error
 */
export declare class LexerError extends Error {
    constructor(at: number, token: string);
}
/**
 * Lexer Class
 */
export declare class Lexer {
    private rules;
    private tokens;
    private remove;
    private state;
    private index;
    private input;
    private reject;
    defunct: (chr: string) => any;
    /**
     * Add Rule
     * @param pattern
     * @param action
     * @param start
     */
    addRule(pattern: RegExp, action: TLexerActionCallBack, start?: number | number[]): this;
    /**
     * Set Input Text
     * @param input
     */
    setInput(input: string): this;
    /**
     * Find line and column from index in the input string
     * @param index
     */
    getLineColumn(index: number): {
        line: number;
        col: number;
    };
    /**
     * Lex
     */
    lex(): any;
    /**
     * Scan
     */
    scan(): TLexerMatchesList;
}
