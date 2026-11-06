import {Icon} from '@xh/hoist/icon';
import type {MouseEvent} from 'react';
import {clamp, round} from 'lodash';
import {type ContextMenuSpec, HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {clipboardMenuItem} from '@xh/hoist/desktop/cmp/clipboard';

export class BasicPanelModel extends HoistModel {
    @bindable accessor state: string = null;
    @bindable accessor compactHeader: boolean = false;
    @bindable accessor triggerError: boolean = false;

    /** Relative scale for the panel text - `em`, so it tracks the app font size at 1. */
    @bindable accessor textScale: number = 1;

    @bindable accessor showContextMenu = true;
    @bindable accessor appliedContextMenu: ContextMenuSpec = null;

    constructor() {
        super();

        this.addReaction({
            track: () => this.showContextMenu,
            run: () => {
                this.appliedContextMenu = this.showContextMenu ? this.panelContextMenu : null;
            },
            fireImmediately: true
        });
    }

    demoText = [
        'Reading on a screen asks more of the eye than reading on paper. Light comes from behind the text rather than falling across it, glare shifts with the room, and the page can be any width the window happens to be. Good screen typography works around all of that. It starts with type large enough to read without effort, then gives each line enough room to breathe. None of this is decoration. A reader who has to squint or backtrack loses the thread, and the writing fails no matter how carefully it was composed.',

        'Line length matters more than most people expect. Set a paragraph across the full width of a wide monitor and the eye struggles to find the start of the next line, so it lands on the wrong one and the reader has to hunt for the place. Typographers have long recommended somewhere between sixty and eighty characters per line for continuous prose. The exact figure matters less than the habit of checking. Resize a window until the text feels awkward and the boundary becomes obvious soon enough.',

        'Contrast deserves the same attention. Pure black on pure white is harsher than it needs to be, and very light gray on white is a common mistake that looks refined in a mockup and punishes anyone reading in bright sunlight. The safer approach is to pick a foreground and a background with a measured contrast ratio, then test the result on a cheap laptop screen rather than an expensive one. Accessibility guidelines put useful numbers on this, and meeting them rarely costs anything visually.',

        'Spacing does the quiet work of structure. Space above a heading binds it to the section it introduces, while space below pushes it away. Get that relationship backward and a reader scanning the page will attach every heading to the wrong block of text. The same principle governs lists, captions, and the gap between paragraphs. Position carries meaning, and it carries that meaning faster than any label or rule can. A reader absorbs the shape of a page long before reading a word of it.',

        'Choosing a typeface is less mysterious than it looks. Most of the work is done by a small number of decisions: whether the letters carry serifs, how tall the lowercase sits against the capitals, and how clearly similar shapes stay distinct. A capital I, a lowercase l, and the digit one should never be mistaken for one another in an interface that shows account numbers or code. Beyond that, restraint pays. Two families are usually plenty, and one of them can often be the system font.',

        'Dark interfaces changed the calculation without changing the principles. Light text on a dark field tends to look heavier than the same text reversed, so a weight that reads well on white can feel bloated on black. Many designers step the weight down slightly for dark mode and soften the background away from pure black. Testing both themes side by side catches this quickly, and a palette defined once in variables makes the adjustment cheap to apply everywhere at once.',

        'None of these rules survive contact with every situation, which is why the last step is always to read the thing. Print it, open it on a phone, hand it to someone who has not seen it before and watch where they slow down. The places where a reader hesitates are the places worth fixing.'
    ];

    changeTextSize(up: boolean) {
        const step = up ? TEXT_SCALE_STEP : -TEXT_SCALE_STEP;
        this.textScale = round(clamp(this.textScale + step, TEXT_SCALE_MIN, TEXT_SCALE_MAX), 2);
    }

    /** Word under the cursor when the context menu was opened - see the `Lookup` item below. */
    private wordAtCursor: string = null;

    getWordAtEvent(e: MouseEvent | PointerEvent): string {
        const range = document.caretPositionFromPoint?.(e.clientX, e.clientY);
        if (!range) return null;

        const textNode = range.offsetNode;

        // Only split TEXT_NODEs
        if (textNode?.nodeType === 3) {
            const offset = range.offset,
                text = textNode.nodeValue,
                wordCharRegex = /[a-zA-Z0-9_]/;

            let start = offset;
            let end = offset;

            // Expand backwards to find the start of the word
            while (start > 0 && wordCharRegex.test(text[start - 1])) {
                start--;
            }

            // Expand forwards to find the end of the word
            while (end < text.length && wordCharRegex.test(text[end])) {
                end++;
            }

            // If the character at the offset wasn't a word character, or no word was found
            if (start === end || !wordCharRegex.test(text[offset])) {
                return null;
            }

            return text.substring(start, end);
        }
    }

    private panelContextMenu: ContextMenuSpec = [
        {heading: 'This Panel'},
        clipboardMenuItem({
            text: 'Copy Text',
            getCopyText: () => this.demoText.join('\n')
        }),
        {
            text: 'Increase Text Size',
            icon: Icon.plusCircle(),
            prepareFn: item => (item.disabled = this.textScale >= TEXT_SCALE_MAX),
            actionFn: () => this.changeTextSize(true)
        },
        {
            text: 'Decrease Text Size',
            icon: Icon.minusCircle(),
            prepareFn: item => (item.disabled = this.textScale <= TEXT_SCALE_MIN),
            actionFn: () => this.changeTextSize(false)
        },
        {
            text: 'Text Size Presets',
            icon: Icon.plusCircle(),
            items: [
                {text: 'Small', actionFn: () => (this.textScale = TEXT_SCALE_MIN)},
                {text: 'Normal', actionFn: () => (this.textScale = 1)},
                {text: 'Large', actionFn: () => (this.textScale = TEXT_SCALE_MAX)}
            ]
        },

        // 'Lookup' hides itself unless the click landed on a word - right-click the empty space
        // below the text and this heading drops along with it, rather than stranding a label
        {heading: 'Word Under Cursor'},
        {
            text: 'Lookup',
            icon: Icon.book(),
            prepareFn: (item, {contextMenuEvent}) => {
                // Resolve the word before the menu renders - by `actionFn` time, a hit-test at
                // the click point would land on the menu itself.
                const word = (this.wordAtCursor = this.getWordAtEvent(contextMenuEvent));

                if (word) {
                    item.text = `Lookup "${word}"`;
                    item.hidden = false;
                    return;
                }

                // reset to defaults
                item.text = 'Lookup';
                item.hidden = true;
            },
            actionFn: () => {
                window.open(
                    `https://www.merriam-webster.com/dictionary/${this.wordAtCursor}`,
                    '_blank'
                );
            }
        }
    ];
}

// Deliberately few steps, so the actions reach their limits (and disable) within a click or two.
const TEXT_SCALE_MIN = 0.8,
    TEXT_SCALE_MAX = 1.4,
    TEXT_SCALE_STEP = 0.2;
