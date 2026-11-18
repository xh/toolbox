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
        children: form({
            fieldDefaults: {inline: true, minimal: true, labelWidth: 110},
            children: div({
                className: 'xh-pad',
                children: [
                    formField({field: 'to', children: textInput()}),
                    formField({field: 'cc', children: textInput()}),
                    formField({field: 'bcc', children: textInput()}),
                    formField({
                        field: 'from',
                        children: textInput({placeholder: 'xhEmailDefaultSender'})
                    }),
                    formField({field: 'subject', children: textInput()}),
                    formField({
                        field: 'bodyType',
                        children: select({
                            options: ['html', 'text'],
                            enableFilter: false,
                            width: 120
                        })
                    }),
                    formField({field: 'body', children: textArea({height: 90})}),
                    formField({
                        field: 'attachmentType',
                        children: select({
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
                    formField({field: 'markImportant', children: switchInput()}),
                    formField({field: 'async', children: switchInput()})
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
        children: jsonOutput({value: sendResult, placeholder: 'No email sent yet.'})
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
        children: jsonOutput({
            value: model.parseResult,
            placeholder: 'Blank entries should be dropped and "none" (any case) should return null.'
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
        children: jsonOutput({value: model.configs, placeholder: 'Loading...'})
    })
);

const jsonOutput = hoistCmp.factory(({value, placeholder}) =>
    pre({
        className: 'xh-pad',
        style: {margin: 0, overflow: 'auto', fontSize: 12},
        children: value ? JSON.stringify(value, null, 2) : placeholder
    })
);
