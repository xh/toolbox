import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {hbox, vbox, vspacer} from '@xh/hoist/cmp/layout';
import {textArea} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {isEmpty} from 'lodash';
import {popover} from '@xh/hoist/kit/blueprint';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {grid} from '@xh/hoist/cmp/grid';
import {ChatModel} from '../ChatModel';

export const promptInput = hoistCmp.factory({
    model: uses(ChatModel),
    render({model}) {
        const {inputMsg, taskObserver, inputRef} = model;

        return hbox({
            className: 'tb-prompt-input',
            item: hbox({
                className: 'tb-prompt-input__inner',
                items: [
                    textArea({
                        placeholder: 'Enter a message...',
                        flex: 1,
                        bind: 'inputMsg',
                        commitOnChange: true,
                        ref: inputRef,
                        disabled: taskObserver.isPending,
                        onKeyDown: e => model.onInputKeyDown(e)
                    }),
                    vbox({
                        className: 'tb-prompt-input__buttons',
                        items: [
                            button({
                                icon: Icon.icon({iconName: 'paper-plane'}),
                                intent: 'success',
                                outlined: true,
                                tooltip: 'Send message - or press [Enter]',
                                disabled: !inputMsg || taskObserver.isPending,
                                onClick: () => model.submitAsync()
                            }),
                            vspacer(5),
                            button({
                                icon: Icon.reset(),
                                intent: 'danger',
                                tooltip: 'Restart conversation',
                                disabled: isEmpty(XH.chatGptService.messages),
                                onClick: () => model.clearAndReInitAsync()
                            }),
                            vspacer(5),
                            popover({
                                isOpen: model.showUserMessageHistory,
                                onClose: () => (model.showUserMessageHistory = false),
                                target: button({
                                    icon: Icon.history(),
                                    intent: 'primary',
                                    onClick: () => (model.showUserMessageHistory = true)
                                }),
                                content: userMsgHistory()
                            })
                        ]
                    })
                ]
            })
        });
    }
});

const userMsgHistory = hoistCmp.factory<ChatModel>({
    render({model}) {
        return panel({
            title: 'Message History',
            icon: Icon.history(),
            compactHeader: true,
            headerItems: [
                button({
                    text: 'Clear History',
                    icon: Icon.reset(),
                    onClick: () => XH.chatGptService.clearUserMessageHistory()
                })
            ],
            width: 600,
            height: 300,
            item: grid({model: model.userHistoryGridModel})
        });
    }
});
