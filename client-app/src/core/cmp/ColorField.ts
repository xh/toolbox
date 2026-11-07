import {div, hbox, input, label} from '@xh/hoist/cmp/layout';
import type {HoistProps} from '@xh/hoist/core';
import {hoistCmp} from '@xh/hoist/core';
import {textInput} from '@xh/hoist/desktop/cmp/input';
import classNames from 'classnames';
import {isString} from 'lodash';
import './ColorField.scss';

export interface ColorFieldProps extends HoistProps {
    /** Caption above the inputs. Omit where the field sits in a row that has its own label. */
    label?: string;
    /** Current color as '#rrggbb', or null for none. */
    value: string;
    /** Called with a normalized '#rrggbb' color, or with null when cleared. */
    onChange: (hex: string) => void;
    /** True to show a clear button on the hex field, for a color that is optional. */
    enableClear?: boolean;
}

/**
 * A native color swatch paired with a hex text field. The swatch updates live while dragging. The
 * text field applies on commit (Enter or blur), accepts 3 or 6 digit hex with or without '#', and
 * reverts anything else.
 */
export const colorField = hoistCmp.factory<ColorFieldProps>({
    displayName: 'ColorField',
    model: false,
    className: 'tb-color-field',

    render({label: text, value, onChange, enableClear, className}) {
        return div({
            className,
            items: [
                label({omit: !text, className: 'tb-color-field__label', item: text}),
                hbox({
                    className: 'tb-color-field__inputs',
                    items: [
                        input({
                            type: 'color',
                            className: classNames(
                                'tb-color-field__swatch',
                                !value && 'tb-color-field__swatch--empty'
                            ),
                            title: text ? `Pick ${text.toLowerCase()} color` : 'Pick a color',
                            // The native input needs a color - black stands in for none.
                            value: value ?? '#000000',
                            onChange: e => {
                                const hex = normalizeHex(e.currentTarget.value);
                                if (hex) onChange(hex);
                            }
                        }),
                        textInput({
                            className: 'tb-color-field__hex',
                            value,
                            width: enableClear ? 100 : 78,
                            spellCheck: false,
                            selectOnFocus: true,
                            enableClear,
                            onCommit: v => {
                                if (enableClear && !v) {
                                    onChange(null);
                                    return;
                                }
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

/** Normalize '#?rgb' or '#?rrggbb' (any case) to '#rrggbb' lowercase, or return null if invalid. */
export function normalizeHex(s: string): string | null {
    if (!isString(s)) return null;
    const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim());
    if (!match) return null;

    let hex = match[1].toLowerCase();
    if (hex.length === 3) hex = hex.replace(/./g, c => c + c);
    return '#' + hex;
}
