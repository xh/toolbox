import {creates, hoistCmp} from '@xh/hoist/core';
import {div, filler, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select} from '@xh/hoist/desktop/cmp/input';
import {jsonInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {JsonHarnessModel} from './JsonHarnessModel';

export const jsonHarnessPanel = hoistCmp.factory({
    displayName: 'JsonHarnessPanel',
    model: creates(JsonHarnessModel),

    render() {
        return panel({
            title: 'JSON Spec Editor',
            icon: Icon.code(),
            compactHeader: true,
            item: vbox({flex: 1, items: [editorArea(), validationDisplay()]}),
            bbar: bottomToolbar()
        });
    }
});

const editorArea = hoistCmp.factory({
    render() {
        return jsonInput({
            bind: 'editorValue',
            flex: 1,
            commitOnChange: true,
            enableSearch: true,
            showCopyButton: false,
            showFormatButton: true,
            showFullscreenButton: true
        });
    }
});

const validationDisplay = hoistCmp.factory<JsonHarnessModel>({
    render({model}) {
        const {lastValidation, lastError} = model;

        if (!lastValidation && !lastError) return null;

        if (lastError) {
            return div({
                className: 'weather-v2-validation weather-v2-validation--error',
                item: lastError
            });
        }

        if (!lastValidation) return null;

        const {valid, errors, warnings} = lastValidation;
        const items = [];

        if (valid && warnings.length === 0) {
            items.push(
                div({
                    className: 'weather-v2-validation weather-v2-validation--success',
                    item: 'Spec is valid.'
                })
            );
        } else if (valid) {
            items.push(
                div({
                    className: 'weather-v2-validation weather-v2-validation--warning',
                    item: `Valid with ${warnings.length} warning(s).`
                })
            );
        } else {
            items.push(
                div({
                    className: 'weather-v2-validation weather-v2-validation--error',
                    item: `${errors.length} error(s), ${warnings.length} warning(s).`
                })
            );
        }

        const messages = [...errors, ...warnings];
        if (messages.length > 0) {
            items.push(
                div({
                    className: 'weather-v2-validation-details',
                    items: messages.slice(0, 10).map((m, i) =>
                        div({
                            key: i,
                            className: `weather-v2-validation-msg weather-v2-validation-msg--${m.level}`,
                            item: `[${m.level.toUpperCase()}] ${m.path ? m.path + ': ' : ''}${m.message}`
                        })
                    )
                })
            );
        }

        return vbox(...items);
    }
});

const bottomToolbar = hoistCmp.factory<JsonHarnessModel>({
    render({model}) {
        const exampleOptions = model.exampleSpecs.map(e => ({
            value: e.name,
            label: e.name
        }));

        return toolbar(
            select({
                options: exampleOptions,
                placeholder: 'Load Example...',
                width: 180,
                enableFilter: false,
                onChange: (val: string) => {
                    if (val) model.loadExample(val);
                }
            }),
            button({
                icon: Icon.sync(),
                text: 'Sync',
                title: 'Load current dashboard state into editor',
                onClick: () => model.syncFromDashboard()
            }),
            filler(),
            button({
                icon: Icon.check(),
                text: 'Validate',
                onClick: () => model.validateOnly()
            }),
            button({
                icon: Icon.play(),
                text: 'Apply',
                intent: 'success',
                onClick: () => model.applySpec()
            }),
            button({
                icon: Icon.copy(),
                text: 'Copy Spec',
                onClick: () => model.copySpecAsync()
            })
        );
    }
});
