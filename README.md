# SpotGamma Frontend Take-Home

## What we are creating

This project is a small, editable spreadsheet built with React and TypeScript. It renders a 10 by 10 grid with columns A through J and rows 1 through 10. Every cell accepts raw text. Entries beginning with `=` are evaluated as formulas that may reference individual cells or ranges.

The spreadsheet maintains a dependency graph between cells. When a cell changes, every dependent formula is recalculated immediately. Formula updates that would introduce a circular dependency are rejected and reported without destabilizing the grid.

The completed application will be deployed to GitHub Pages from this repository.

## Scope

### Formula language

The requirements call for simple mathematical formulas and range-based formulas, but they do not define which mathematical functions must be supported. Excel and Google Sheets each expose dozens of functions across mathematical, statistical, conditional, matrix, and other categories. Reproducing those catalogs would obscure the main engineering work in this exercise.

This project will instead support a representative subset that covers ordinary arithmetic, calculations over ranges, and common scalar operations. The subset is broad enough to demonstrate a reusable formula engine while keeping the implementation focused on parsing, dependency tracking, cycle detection, and efficient recalculation.

Supported operators include:

- Addition with `+`
- Subtraction with `-`
- Multiplication with `*`
- Division with `/`
- Exponentiation with `^`
- Unary positive and negative signs
- Parentheses for explicit precedence

Supported range functions include:

- `SUM`
- `AVERAGE`
- `MIN`
- `MAX`
- `COUNT`
- `PRODUCT`

Supported scalar functions include:

- `ABS`
- `ROUND`
- `FLOOR`
- `CEILING`
- `SQRT`
- `POWER`
- `MOD`

Functions may accept numeric literals, cell references, or ranges where appropriate. For example:

```text
=A1 + B2 * 3
=(A1 + B1) / 2
=SUM(A1:A10)
=SUM(A1:A5, C1, 10)
=AVERAGE(A1:B5)
=ROUND(A1 / B1, 2)
=POWER(A1, 2)
```

### Deliberate exclusions

Conditional aggregates, trigonometric functions, volatile functions, array-producing functions, matrix operations, and statistical distributions are outside the initial scope. These additions would expand spreadsheet compatibility without strengthening the core dependency and recalculation model that the challenge is designed to exercise.

The formula engine will use an extensible function registry so additional functions can be introduced without changing the parser.

## Architecture

### Grid rendering

The grid dimensions will be configurable, with 10 columns and 10 rows as the defaults. React will render the cells as a flat list. CSS Grid will receive the column count and control placement and wrapping, which keeps layout concerns out of the component structure.

Each cell will preserve three distinct pieces of state: the raw user input, the calculated display value, and any validation error. Plain text remains unchanged. Input beginning with `=` enters the formula pipeline.

### Formula pipeline

Formula handling will proceed through a fixed sequence:

```text
raw input
  -> tokenize
  -> parse into an expression tree
  -> collect cell references
  -> validate dependencies
  -> evaluate
  -> recalculate affected cells
  -> commit the new state
```

Regular expressions will recognize individual tokens such as numbers, cell references, operators, and function names. A small parser will build the expression tree, preserving precedence and nested function calls without relying on JavaScript evaluation.

The function registry will map supported function names to their implementations. Parsing remains independent of the available functions, so the supported formula set can grow without restructuring the parser.

### Dependency graph

The spreadsheet will maintain two graph indexes. A dependency index records the cells referenced by each formula. A reverse index records the formulas that depend on each cell.

```text
dependencies[B1] = { A1 }
dependents[A1] = { B1 }
```

The dependency index supports cycle detection. The reverse index supports targeted recalculation. Range references will expand into their individual cell dependencies.

Formula edits will be validated as transactions. The proposed dependencies are checked before the accepted graph is changed. If a new formula introduces a path back to its own cell, the new edit is rejected and the previous valid state remains intact. The most recent edit is therefore the invalid operation, regardless of when the other cells in the cycle were created.

### Recalculation

After a valid edit, the reverse dependency index identifies the affected cells. Those cells will be evaluated in dependency order and committed together. Unrelated cells will not be recalculated.

This design keeps formula evaluation, graph maintenance, and React rendering separate. It also bounds the work performed by an edit to the portion of the grid that can actually change.

## Deployment

GitHub Actions deploys the application to GitHub Pages. A push to `main`, or a manual run from the Actions tab, starts the workflow in `.github/workflows/deploy.yml`. The workflow installs the locked dependencies with pnpm, runs the production build, uploads `dist` as a Pages artifact, and publishes that artifact with GitHub's official Pages action.

This keeps generated files out of the repository and avoids maintaining a separate deployment branch. GitHub Pages must use **GitHub Actions** as its source under **Settings → Pages**.
