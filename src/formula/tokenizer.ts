import { TokenizerError, type Token } from '#/formula/tokenizer.types'

/**
 * Checks the contiguous ASCII digit range used by formula syntax and reports
 * whether the character is an ASCII digit.
 */
const isDigit = (character: string) => character >= '0' && character <= '9'

/**
 * Checks the contiguous ASCII letter ranges used by formula syntax and reports
 * whether the character is an uppercase or lowercase ASCII letter.
 */
const isLetter = (character: string) =>
  (character >= 'A' && character <= 'Z') || (character >= 'a' && character <= 'z')

/** Reports whether the character is whitespace that the tokenizer should ignore. */
const isWhitespace = (character: string) => /\s/.test(character)

/** Finds the first position whose character does not satisfy the predicate. */
function advanceWhile(
  expression: string,
  start: number,
  predicate: (character: string) => boolean
): number {
  let end = start
  while (end < expression.length && predicate(expression[end])) end += 1
  return end
}

/**
 * Reads a numeric literal beginning at the supplied position.
 */
function scanNumericLiteral(expression: string, start: number): Token {
  let end = advanceWhile(expression, start, isDigit)

  if (expression[end] === '.') {
    end = advanceWhile(expression, end + 1, isDigit)
  }

  const boundary = expression[end] ?? ''
  // Rejects joined or repeated number syntax such as `12A1` and `1.2.3`.
  if (boundary === '.' || isLetter(boundary)) {
    throw new TokenizerError('Malformed number', end)
  }

  const lexeme = expression.slice(start, end)
  return { end, lexeme, start, type: 'number', value: Number(lexeme) }
}

/**
 * Reads an identifier or cell reference beginning at the supplied position,
 * producing its normalized token.
 */
function scanIdentifierOrCellReference(expression: string, start: number): Token {
  const letterEnd = advanceWhile(expression, start, isLetter)
  const end = advanceWhile(expression, letterEnd, isDigit)

  // A cell reference cannot resume letters after its row, as in `A1B2`.
  if (isLetter(expression[end] ?? '')) {
    throw new TokenizerError('Malformed cell reference', end)
  }

  const lexeme = expression.slice(start, end)
  const normalized = lexeme.toUpperCase()
  return letterEnd === end
    ? { end, lexeme, name: normalized, start, type: 'identifier' }
    : { end, lexeme, reference: normalized, start, type: 'cell' }
}

/**
 * Reads a single-character operator or delimiter, producing its positioned token
 * or `undefined` when the character is not a symbol.
 */
function scanOperatorOrDelimiter(character: string, position: number): Token | undefined {
  const positioned = { end: position + 1, lexeme: character, start: position }

  switch (character) {
    case '+':
    case '-':
    case '*':
    case '/':
    case '^':
      return { ...positioned, lexeme: character, operator: character, type: 'operator' }
    case '(':
      return { ...positioned, type: 'leftParen' }
    case ')':
      return { ...positioned, type: 'rightParen' }
    case ',':
      return { ...positioned, type: 'comma' }
    case ':':
      return { ...positioned, type: 'colon' }
  }
}

/**
 * Converts a formula expression into positioned tokens followed by an
 * end-of-input token.
 */
export function tokenize(expression: string): Token[] {
  const tokens: Token[] = []
  let position = 0

  while (position < expression.length) {
    const character = expression[position]

    if (isWhitespace(character)) {
      position = advanceWhile(expression, position, isWhitespace)
      continue
    }

    if (isDigit(character) || (character === '.' && isDigit(expression[position + 1] ?? ''))) {
      const token = scanNumericLiteral(expression, position)
      tokens.push(token)
      position = token.end
      continue
    }

    if (isLetter(character)) {
      const token = scanIdentifierOrCellReference(expression, position)
      tokens.push(token)
      position = token.end
      continue
    }

    const symbol = scanOperatorOrDelimiter(character, position)
    // Rejects unsupported syntax such as `=A1`, `$A$1`, or `A1 @ B1`.
    if (!symbol) throw new TokenizerError(`Unexpected character ${character}`, position)

    tokens.push(symbol)
    position += 1
  }

  tokens.push({ end: position, lexeme: '', start: position, type: 'eof' })
  return tokens
}
