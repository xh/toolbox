import {div, hbox, input, label} from '@xh/hoist/cmp/layout';
import type {HoistProps} from '@xh/hoist/core';
import {hoistCmp} from '@xh/hoist/core';
import {textInput} from '@xh/hoist/desktop/cmp/input';
import {normalizeHex} from '../lib/FaviconSpec';

export interface ColorFieldProps extends HoistProps {
    label: string;
    /** Current color as '#rrggbb'. */
    value: string;
    /** Called with a normalized '#rrggbb' color. */
    onChange: (hex: string) => void;
}

/**
 * A native color swatch paired with a hex text field. The swatch updates live while dragging; the
 * text field applies on commit (Enter or blur), accepting 3 or 6 digit hex with or without '#' and
 * reverting anything else.
 */
export const colorField = hoistCmp.factory<ColorFieldProps>({
    displayName: 'ColorField',
    model: false,
    className: 'tb-color-field',

    render({label: text, value, onChange, className}) {
        return div({
            className,
            items: [
                label({className: 'tb-color-field__label', item: text}),
                hbox({
                    className: 'tb-color-field__inputs',
                    items: [
                        input({
                            type: 'color',
                            className: 'tb-color-field__swatch',
                            title: `Pick ${text.toLowerCase()} color`,
                            value,
                            onChange: e => {
                                const hex = normalizeHex(e.currentTarget.value);
                                if (hex) onChange(hex);
                            }
                        }),
                        textInput({
                            className: 'tb-color-field__hex',
                            value,
                            width: 78,
                            spellCheck: false,
                            selectOnFocus: true,
                            onCommit: v => {
                                const hex = normalizeHex(v);
                                if (hex) onChange(hex);
                            }
                        })
                    ]
                })
            ]
        });
    }
});
