import {form} from '@xh/hoist/cmp/form';
import {div, filler, hframe, pre, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {select, switchInput, textArea, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {EmailTestModel} from './EmailTestModel';

export const EmailTestPanel = hoistCmp({
    model: creates(EmailTestModel),

    render() {
        return hframe(sendForm(), vframe(sendResult(), hframe(parseAddresses(), configs())));
    }
});

const sendForm = hoistCmp.factory<EmailTestModel>(({model}) =>
    panel({
        title: 'EmailService.sendEmail()',
        icon: Icon.mail(),
        compactHeader: true,
        width: 480,
        mask: model.sendTask,
        item: form({
            fieldDefaults: {inline: true, minimal: true, labelWidth: 110},
            item: div({
                className: 'xh-pad',
                items: [
                    formField({field: 'to', item: textInput()}),
                    formField({field: 'cc', item: textInput()}),
                    formField({field: 'bcc', item: textInput()}),
                    formField({
                        field: 'from',
                        item: textInput({placeholder: 'xhEmailDefaultSender'})
                    }),
                    formField({field: 'subject', item: textInput()}),
                    formField({
                        field: 'bodyType',
                        item: select({
                            options: ['html', 'text'],
                            enableFilter: false,
                            width: 120
                        })
                    }),
                    formField({field: 'body', item: textArea({height: 90})}),
                    formField({
                        field: 'attachmentType',
                        item: select({
                            options: [
                                {label: 'None', value: null},
                                {label: 'byte[]', value: 'bytes'},
                                {label: 'File', value: 'file'},
                                {label: 'InputStreamSource', value: 'inputStreamSource'},
                                {label: 'Invalid (String)', value: 'invalid'}
                            ],
                            enableFilter: false,
                            width: 200
                        })
                    }),
                    formField({field: 'markImportant', item: switchInput()}),
                    formField({field: 'async', item: switchInput()})
                ]
            })
        }),
        bbar: toolbar(
            filler(),
            button({
                text: 'Send',
                icon: Icon.mail(),
                intent: 'success',
                minimal: false,
                onClick: () => model.sendAsync()
            })
        )
    })
);

const sendResult = hoistCmp.factory<EmailTestModel>(({model}) => {
    const {sendResult} = model;
    return panel({
        title: 'Last result',
        icon: sendResult ? (sendResult.success ? Icon.check() : Icon.warning()) : Icon.info(),
        compactHeader: true,
        flex: 1,
        item: pre({
            className: 'xh-pad',
            style: {margin: 0, overflow: 'auto', fontSize: 12},
            item: sendResult ? JSON.stringify(sendResult, null, 2) : 'No email sent yet.'
        })
    });
});

const parseAddresses = hoistCmp.factory<EmailTestModel>(({model}) =>
    panel({
        title: 'EmailService.parseAddresses()',
        icon: Icon.code(),
        compactHeader: true,
        flex: 1,
        height: 200,
        tbar: [
            textInput({bind: 'parseInput', flex: 1, placeholder: 'e.g.  a, ,b@c.com,,  or  NONE'}),
            button({
                text: 'Parse',
                icon: Icon.play(),
                minimal: false,
                onClick: () => model.parseAddressesAsync()
            })
        ],
        item: pre({
            className: 'xh-pad',
            style: {margin: 0, overflow: 'auto', fontSize: 12},
            item: model.parseResult
                ? JSON.stringify(model.parseResult, null, 2)
                : 'Blank entries should be dropped and "none" (any case) should return null.'
        })
    })
);

const configs = hoistCmp.factory<EmailTestModel>(({model}) =>
    panel({
        title: 'xhEmail* configs',
        icon: Icon.settings(),
        compactHeader: true,
        flex: 1,
        height: 200,
        tbar: [
            filler(),
            button({
                text: 'Refresh',
                icon: Icon.refresh(),
                onClick: () => model.refreshAsync()
            })
        ],
        item: pre({
            className: 'xh-pad',
            style: {margin: 0, overflow: 'auto', fontSize: 12},
            item: model.configs ? JSON.stringify(model.configs, null, 2) : 'Loading...'
        })
    })
);
