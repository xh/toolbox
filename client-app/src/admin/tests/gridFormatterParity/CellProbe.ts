/** What the Formatter Parity probe reads from one rendered grid cell. */
export interface CellReading {
    /** Visible text, less any text hidden with `visibility: hidden`. */
    text: string;
    /** Sign classes on the cell or any element in it, then the computed color of its text. */
    sign: string;
    /** True if the cell reserves room for a ledger `)`, as a hidden span or an `::after`. */
    placeholder: boolean;
    /** Px from the cell's left and right edges to its text, and from its middle to the text's. */
    offsets: {left: number; right: number; middle: number};
    /** Width of the cell, in px. */
    width: number;
}

/** How a pair of cells can differ. 'missing' means one cell of the pair was not rendered. */
export type ParityCheck = 'text' | 'sign' | 'placeholder' | 'alignment' | 'width' | 'missing';

/** One difference between a pair of cells, with each side's reading as JSON. */
export interface CellDiff {
    check: ParityCheck;
    renderer: string;
    formatter: string;
}

// Offsets and widths within this many px count as equal, to allow for sub-pixel rounding.
const TOLERANCE_PX = 0.5;

/** Read the visible content, sign styling, ledger placeholder and geometry of a grid cell. */
export function readCell(cell: HTMLElement): CellReading {
    const textNodes = visibleTextNodes(cell),
        // Measure from the first to the last non-blank text, so whitespace does not shift it.
        printed = textNodes.filter(it => it.data.trim()),
        first = printed[0],
        last = printed[printed.length - 1],
        cellRect = cell.getBoundingClientRect(),
        signClasses = [cell, ...Array.from(cell.querySelectorAll('*'))]
            .flatMap(it => Array.from(it.classList))
            .filter(it => it.endsWith('-val'))
            .sort(),
        color = window.getComputedStyle(first ? first.parentElement : cell).color;

    let offsets = null;
    if (first) {
        const range = document.createRange();
        range.setStart(first, 0);
        range.setEnd(last, last.length);
        const textRect = range.getBoundingClientRect();
        offsets = {
            left: textRect.left - cellRect.left,
            right: cellRect.right - textRect.right,
            middle: (textRect.top + textRect.bottom - cellRect.top - cellRect.bottom) / 2
        };
    }

    return {
        text: textNodes.map(it => it.data).join(''),
        sign: [...signClasses, color].join(' '),
        placeholder: hasLedgerPlaceholder(cell),
        offsets,
        width: cellRect.width
    };
}

/** Compare the renderer and formatter readings of one cell pair, returning each difference. */
export function compareCells(renderer: CellReading, formatter: CellReading): CellDiff[] {
    const ret: CellDiff[] = [],
        add = (check: ParityCheck, r: any, f: any) =>
            ret.push({check, renderer: JSON.stringify(r), formatter: JSON.stringify(f)});

    if (renderer.text !== formatter.text) add('text', renderer.text, formatter.text);
    if (renderer.sign !== formatter.sign) add('sign', renderer.sign, formatter.sign);
    if (renderer.placeholder !== formatter.placeholder) {
        add('placeholder', renderer.placeholder, formatter.placeholder);
    }
    if (!offsetsMatch(renderer.offsets, formatter.offsets)) {
        add('alignment', roundOffsets(renderer.offsets), roundOffsets(formatter.offsets));
    }
    if (!withinTolerance(renderer.width, formatter.width)) {
        add('width', renderer.width, formatter.width);
    }
    return ret;
}

//------------------
// Implementation
//------------------
function visibleTextNodes(cell: HTMLElement): Text[] {
    const ret: Text[] = [],
        walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    let node: Text;
    while ((node = walker.nextNode() as Text)) {
        if (node.data && !node.parentElement.closest('[style*="visibility: hidden"]')) {
            ret.push(node);
        }
    }
    return ret;
}

// A renderer reserves the room with a hidden `)` span. A formatter cell does it with an `::after`.
function hasLedgerPlaceholder(cell: HTMLElement): boolean {
    return (
        !!cell.querySelector('[style*="visibility: hidden"]') ||
        window.getComputedStyle(cell, '::after').content === '")"'
    );
}

function offsetsMatch(a: CellReading['offsets'], b: CellReading['offsets']): boolean {
    if (!a || !b) return a === b;
    return (
        withinTolerance(a.left, b.left) &&
        withinTolerance(a.right, b.right) &&
        withinTolerance(a.middle, b.middle)
    );
}

function withinTolerance(a: number, b: number): boolean {
    return Math.abs(a - b) <= TOLERANCE_PX;
}

function roundOffsets(offsets: CellReading['offsets']) {
    if (!offsets) return null;
    const round = (v: number) => Math.round(v * 10) / 10;
    return {left: round(offsets.left), right: round(offsets.right), middle: round(offsets.middle)};
}
