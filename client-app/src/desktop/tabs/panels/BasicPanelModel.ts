import {Icon} from '@xh/hoist/icon';
import {MouseEvent} from 'react';
import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {clipboardMenuItem} from '@xh/hoist/desktop/cmp/clipboard';

export class BasicPanelModel extends HoistModel {
    @bindable state: string = null;
    @bindable compactHeader: boolean = false;
    @bindable triggerError: boolean = false;

    @bindable showContextMenu = true;
    @bindable appliedContextMenu = null;

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => this.showContextMenu,
            run: () => {
                this.appliedContextMenu = this.showContextMenu ? this.panelContextMenu : null;
            },
            fireImmediately: true
        });
    }

    demoText = [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris ut aliquam lectus. Morbi maximus, dui et facilisis tincidunt, orci quam posuere purus, sed mollis tortor orci a magna. Aliquam aliquam risus eu turpis blandit placerat. Quisque porta egestas vulputate. Ut vehicula tincidunt laoreet. Maecenas metus arcu, tristique sit amet lectus sed, suscipit posuere dui. Vestibulum et est et elit blandit molestie. Sed auctor interdum tristique. Quisque ac felis non dolor laoreet elementum eu et felis. Praesent id ultricies tortor. Praesent a laoreet nisl.',

        'Mauris metus leo, rutrum nec finibus at, finibus sit amet quam. Etiam commodo ante ac dui congue, ac venenatis nisl sollicitudin. Nam sodales interdum diam ac molestie. Aenean justo nisi, venenatis vel orci vel, iaculis pretium sapien. Nam blandit tristique eros sit amet sollicitudin. Cras facilisis pretium ex sit amet hendrerit. Ut ut orci nec dolor varius faucibus. Nunc vulputate feugiat nunc quis egestas. Nam congue in mauris sit amet varius. Sed eget nulla sodales, posuere urna vitae, ultricies lacus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam elementum mauris arcu, id iaculis magna interdum a. Ut convallis augue id mi feugiat imperdiet. Aliquam fringilla ipsum sit amet magna lacinia, vel dapibus risus lacinia. Donec ut porta ex, a consequat mauris. Mauris non malesuada nunc.',

        'Vivamus nec metus at justo bibendum molestie. Fusce ullamcorper ut eros sit amet finibus. Phasellus ut condimentum neque. Nulla venenatis augue volutpat, vestibulum diam tincidunt, egestas mi. Donec metus diam, lacinia sit amet felis vel, sollicitudin egestas nulla. Quisque id odio nibh. Nulla facilisi. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nunc varius consectetur diam, nec malesuada nunc ornare id. Morbi ullamcorper luctus est quis faucibus. Donec fringilla semper justo eget condimentum. Quisque in dolor scelerisque, faucibus metus ac, suscipit eros. Etiam tempor, justo a eleifend egestas, mauris felis laoreet arcu, eu ultricies erat mauris sed sem. Vestibulum convallis lorem urna, vitae tristique elit ornare ac.',

        'Maecenas interdum elit quis erat molestie, at tristique sem malesuada. Pellentesque non neque eget risus gravida accumsan. Proin orci tellus, dapibus in risus vel, sollicitudin accumsan ligula. Donec tincidunt eleifend efficitur. Nam vel mauris quis mauris cursus tincidunt. Sed et venenatis metus. Donec non posuere elit. Praesent congue elit eu dapibus venenatis. Ut quis mi vitae ligula cursus porttitor. Curabitur aliquam sem eget nibh interdum, et ultrices nunc ornare. Quisque et gravida nisi. Curabitur lobortis a velit et ultricies. Nullam at felis eleifend, pharetra risus ut, faucibus felis. Cras nec risus pulvinar, vulputate neque in, ultricies libero. Praesent dignissim magna ut auctor euismod. Sed vehicula purus non purus viverra, vel congue eros mollis.',

        'Morbi eget tincidunt ex. Mauris eget egestas nulla. Pellentesque egestas sapien blandit nisi pellentesque varius. Cras dignissim consectetur mauris, eu faucibus quam mattis vel. Curabitur in libero purus. Duis nulla turpis, faucibus sed tristique eget, pretium id nibh. Phasellus sit amet egestas lectus. Donec in aliquet tortor.'
    ];

    changeTextSize(up: boolean) {
        const el = document.querySelector('.tb-panel-text-reader') as HTMLElement,
            fontSize = window.getComputedStyle(el).fontSize,
            currentSize = parseFloat(fontSize);

        el.style.fontSize = `${currentSize + (up ? 1 : -1)}px`;
    }

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

    private panelContextMenu = [
        clipboardMenuItem({
            text: 'Copy Text',
            getCopyText: () => this.demoText.join('\n')
        }),
        {
            text: 'Increase Text Size',
            icon: Icon.plusCircle(),
            actionFn: () => this.changeTextSize(true)
        },
        {
            text: 'Decrease Text Size',
            icon: Icon.minusCircle(),
            actionFn: () => this.changeTextSize(false)
        },
        {
            text: 'Lookup',
            icon: Icon.book(),
            prepareFn: (item, contextMenuEvent) => {
                const word = this.getWordAtEvent(contextMenuEvent);

                if (word) {
                    item.text = `Lookup "${word}"`;
                    item.hidden = false;
                    return;
                }

                // reset to defaults
                item.text = 'Lookup';
                item.hidden = true;
            },
            actionFn: (e, contextMenuEvent) => {
                console.log(contextMenuEvent);
                const word = this.getWordAtEvent(contextMenuEvent);
                window.open(`https://www.merriam-webster.com/dictionary/${word}`, '_blank');
            }
        }
    ];
}
