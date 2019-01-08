declare global {
    type TLexerActionCallBack = (result?: RegExpExecArray | null, sender?: Lexer) => any;
    interface ILexerMatchResult {
        result: RegExpExecArray | null;
        action: TLexerActionCallBack;
        length: number;
    }
    type TLexerMatchesList = ILexerMatchResult[];
}
export declare class Lexer {
    private rules;
    private tokens;
    private remove;
    private state;
    private index;
    private input;
    private reject;
    defunct: (chr: string) => never;
    addRule(pattern: any, action: TLexerActionCallBack, start?: number | number[]): this;
    setInput(input: string): this;
    lex(): any;
    scan(): TLexerMatchesList;
}
export declare class LexerError extends Error {
    constructor(at: number, token: string);
}
