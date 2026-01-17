/**
 * Tokenizer Module
 * 
 * Converts SQL string into a stream of tokens for parsing.
 * Handles keywords, identifiers, operators, literals, and punctuation.
 */

/**
 * Token types
 */
const TokenType = {
  KEYWORD: 'KEYWORD',
  IDENTIFIER: 'IDENTIFIER',
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  OPERATOR: 'OPERATOR',
  PUNCTUATION: 'PUNCTUATION',
  EOF: 'EOF'
};

/**
 * SQL keywords
 */
const KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
  'DELETE', 'CREATE', 'TABLE', 'PRIMARY', 'KEY', 'UNIQUE', 'INT', 'TEXT',
  'BOOLEAN', 'JOIN', 'ON', 'AND', 'OR', 'NOT', 'NULL'
];

/**
 * Tokenizer class
 */
class Tokenizer {
  /**
   * Creates a new tokenizer
   * @param {string} input - SQL query string
   */
  constructor(input) {
    this.input = input.trim();
    this.position = 0;
    this.currentChar = this.input[this.position] || null;
  }

  /**
   * Advances to the next character
   * @private
   */
  _advance() {
    this.position++;
    this.currentChar = this.position < this.input.length 
      ? this.input[this.position] 
      : null;
  }

  /**
   * Skips whitespace
   * @private
   */
  _skipWhitespace() {
    while (this.currentChar && /\s/.test(this.currentChar)) {
      this._advance();
    }
  }

  /**
   * Reads a number token
   * @private
   * @returns {string} - Number string
   */
  _readNumber() {
    let number = '';
    while (this.currentChar && /[0-9]/.test(this.currentChar)) {
      number += this.currentChar;
      this._advance();
    }
    return number;
  }

  /**
   * Reads a string literal
   * @private
   * @returns {string} - String value (without quotes)
   */
  _readString() {
    const quote = this.currentChar; // ' or "
    this._advance(); // Skip opening quote
    
    let string = '';
    while (this.currentChar && this.currentChar !== quote) {
      if (this.currentChar === '\\') {
        this._advance();
        // Handle escape sequences
        if (this.currentChar === 'n') {
          string += '\n';
        } else if (this.currentChar === 't') {
          string += '\t';
        } else {
          string += this.currentChar;
        }
      } else {
        string += this.currentChar;
      }
      this._advance();
    }
    
    if (this.currentChar === quote) {
      this._advance(); // Skip closing quote
    }
    
    return string;
  }

  /**
   * Reads an identifier or keyword
   * @private
   * @returns {string} - Identifier string
   */
  _readIdentifier() {
    let identifier = '';
    // Identifiers can start with letter or underscore, then contain letters, numbers, underscores
    while (this.currentChar && /[a-zA-Z0-9_]/.test(this.currentChar)) {
      identifier += this.currentChar;
      this._advance();
    }
    return identifier;
  }

  /**
   * Reads an operator
   * @private
   * @returns {string} - Operator string
   */
  _readOperator() {
    let operator = this.currentChar;
    this._advance();
    
    // Check for two-character operators
    if (this.currentChar) {
      const twoChar = operator + this.currentChar;
      if (['<=', '>=', '!=', '=='].includes(twoChar)) {
        this._advance();
        return twoChar;
      }
    }
    
    return operator;
  }

  /**
   * Gets the next token from the input
   * @returns {Object} - Token object { type, value }
   */
  nextToken() {
    // Skip whitespace
    this._skipWhitespace();

    // End of input
    if (!this.currentChar) {
      return { type: TokenType.EOF, value: null };
    }

    // Number
    if (/[0-9]/.test(this.currentChar)) {
      const number = this._readNumber();
      return { type: TokenType.NUMBER, value: parseInt(number, 10) };
    }

    // String literal
    if (this.currentChar === "'" || this.currentChar === '"') {
      const string = this._readString();
      return { type: TokenType.STRING, value: string };
    }

    // Identifier or keyword
    if (/[a-zA-Z_]/.test(this.currentChar)) {
      const identifier = this._readIdentifier();
      const upperIdentifier = identifier.toUpperCase();
      if (KEYWORDS.includes(upperIdentifier)) {
        return { type: TokenType.KEYWORD, value: upperIdentifier };
      }
      // Return original case for identifiers
      return { type: TokenType.IDENTIFIER, value: identifier };
    }

    // Operators
    if (['=', '<', '>', '!'].includes(this.currentChar)) {
      const operator = this._readOperator();
      return { type: TokenType.OPERATOR, value: operator };
    }

    // Asterisk (for SELECT *)
    if (this.currentChar === '*') {
      this._advance();
      return { type: TokenType.PUNCTUATION, value: '*' };
    }

    // Dot (for table.column syntax)
    if (this.currentChar === '.') {
      this._advance();
      return { type: TokenType.PUNCTUATION, value: '.' };
    }

    // Punctuation
    if (['(', ')', ',', ';'].includes(this.currentChar)) {
      const punctuation = this.currentChar;
      this._advance();
      return { type: TokenType.PUNCTUATION, value: punctuation };
    }

    // Unknown character
    throw new Error(`Unexpected character: ${this.currentChar} at position ${this.position}`);
  }

  /**
   * Tokenizes the entire input
   * @returns {Array<Object>} - Array of tokens
   */
  tokenize() {
    const tokens = [];
    let token;
    
    do {
      token = this.nextToken();
      tokens.push(token);
    } while (token.type !== TokenType.EOF);
    
    return tokens;
  }
}

module.exports = { Tokenizer, TokenType };
