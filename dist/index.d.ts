declare function Lexer(defunct: any): void;
declare namespace Lexer {
    var defunct: (chr: any) => never;
    var engineHasStickySupport: boolean;
    var engineHasUnicodeSupport: boolean;
}
