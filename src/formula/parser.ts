import type { Expression } from '#/formula/ast.types'
import { ParserError } from '#/formula/parser.types'
import type { Token } from '#/formula/tokenizer.types'

/** Parser entry point; behavior will be implemented against parser.test.ts. */
export function parse(tokens: Token[]): Expression {
  throw new ParserError('Parser not implemented', tokens[0]?.start ?? 0)
}
