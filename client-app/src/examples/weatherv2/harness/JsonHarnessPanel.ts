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

    render({model}) {
        return panel({
            testId: 'json-panel',
            ref: model.containerRef,
            title: 'JSON Spec Editor',
            icon: Icon.code(),
            compactHeader: true,
            flex: 1,
            minHeight: 0,
            item: vbox({flex: 1, items: [editorArea(), validationDisplay()]}),
            bbar: bottomToolbar()
        });
    }
});

const editorArea = hoistCmp.factory({
    render() {
        return jsonInput({
            testId: 'json-editor',
            bind: 'editorValue',
            flex: 1,
            width: '100%',
            commitOnChange: true,
            enableSearch: true,
            showCopyButton: true,
            showFormatButton: true,
            showFullscreenButton: true
        });
    }
});

const validationDisplay = hoistCmp.factory<JsonHarnessModel>({
    render({model}) {
        const {lastValidation, lastError} = model;

        if (!lastValidation && !lastError) return null;

        let icon, title, className;
        if (lastError) {
            icon = Icon.warning();
            title = 'Error';
            className = 'weather-v2-validation--error';
        } else if (!lastValidation.valid) {
            icon = Icon.warning();
            title = `${lastValidation.errors.length} error(s), ${lastValidation.warnings.length} warning(s)`;
            className = 'weather-v2-validation--error';
        } else {
            icon = Icon.warning();
            title = `Valid with ${lastValidation.warnings.length} warning(s)`;
            className = 'weather-v2-validation--warning';
        }

        const messages = lastError
            ? [lastError]
            : [...(lastValidation?.errors ?? []), ...(lastValidation?.warnings ?? [])];

        return panel({
            icon,
            title,
            className: `weather-v2-validation ${className}`,
            compactHeader: true,
            maxHeight: 200,
            headerItems: [
                button({
                    icon: Icon.close(),
                    minimal: true,
                    small: true,
                    onClick: () => model.dismissValidation()
                })
            ],
            item: div({
                className: 'weather-v2-validation-details',
                style: {overflow: 'auto'},
                items: messages.slice(0, 10).map((m, i) =>
                    div({
                        key: i,
                        className: `weather-v2-validation-msg weather-v2-validation-msg--${typeof m === 'string' ? 'error' : m.level}`,
                        item:
                            typeof m === 'string'
                                ? m
                                : `[${m.level.toUpperCase()}] ${m.path ? m.path + ': ' : ''}${m.message}`
                    })
                )
            })
        });
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
                testId: 'json-load-example',
                options: exampleOptions,
                placeholder: 'Load Example...',
                width: 180,
                enableFilter: false,
                onChange: (val: string) => {
                    if (val) model.loadExample(val);
                }
            }),
            button({
                testId: 'json-sync-btn',
                icon: Icon.sync(),
                text: 'Sync from Dash',
                tooltip: 'Overwrite editor with current dashboard state',
                disabled: !model.isDiverged,
                onClick: () => model.syncFromDashboard()
            }),
            filler(),
            button({
                testId: 'json-validate-btn',
                icon: Icon.check(),
                text: 'Validate',
                onClick: () => model.validateOnly()
            }),
            '-',
            button({
                testId: 'json-apply-btn',
                icon: Icon.play(),
                text: 'Apply to Dash',
                tooltip: 'Apply editor spec to the dashboard',
                intent: 'success',
                disabled: !model.isDiverged,
                onClick: () => model.applySpec()
            })
        );
    }
});
