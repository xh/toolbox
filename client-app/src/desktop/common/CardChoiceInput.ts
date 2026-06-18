import {box, div, vbox} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, ButtonGroupInputProps} from '@xh/hoist/desktop/cmp/input';
import {ReactElement, ReactNode} from 'react';
import './CardChoiceInput.scss';

export interface CardChoice {
    /** Value bound to the input when this card is selected. */
    value: any;
    /** Label shown beneath the preview. */
    label: ReactNode;
    /** Visual preview filling the card surface - a mini mockup, type specimen, swatch, etc. */
    preview: ReactNode;
}

/**
 * A chunky, macOS-Settings-style choice control: each option is rendered as a large preview "card"
 * with a label beneath it, and the selected card is highlighted with an accent ring (see the
 * Appearance picker in System Settings). Built on Hoist's `buttonGroupInput`, so it binds like any
 * other HoistInput - e.g. as the `item` of an AppOption `formField`.
 */
export function cardChoiceInput(
    choices: CardChoice[],
    props?: Partial<ButtonGroupInputProps>
): ReactElement {
    return buttonGroupInput({
        className: 'tbox-card-choice',
        ...props,
        items: choices.map(c =>
            button({
                key: String(c.value),
                value: c.value,
                className: 'tbox-card-choice__card',
                text: vbox({
                    className: 'tbox-card-choice__body',
                    items: [
                        box({className: 'tbox-card-choice__preview', item: c.preview}),
                        div({className: 'tbox-card-choice__label', item: c.label})
                    ]
                })
            })
        )
    });
}
