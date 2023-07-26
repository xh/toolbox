import {library} from '@fortawesome/fontawesome-svg-core';
import {faPaperPlane, faRobot, faUserRobotXmarks} from '@fortawesome/pro-regular-svg-icons';
import {elementFactory, hoistCmp, HoistProps, uses, XH} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import '../../core/Toolbox.scss';
import {box, div, fragment, hbox, img, placeholder, vbox, vspacer} from '@xh/hoist/cmp/layout';
import {jsonInput, select, switchInput, textArea} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import {isEmpty} from 'lodash';
import {GptMessage} from '../../core/svc/ChatGptService';
import ReactMarkdown from 'react-markdown';
import './Chat.scss';
import {errorMessage} from '@xh/hoist/desktop/cmp/error';
import {popover} from '@xh/hoist/kit/blueprint';
import {grid} from '@xh/hoist/cmp/grid';

library.add(faPaperPlane, faRobot, faUserRobotXmarks);

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            tbar: appBar({
                icon: Icon.icon({iconName: 'robot', size: '2x'}),
                appMenuButtonProps: {hideLogoutItem: false},
                rightItems: [appBarControls()]
            }),
            items: XH.chatGptService.isInitialized
                ? [msgList(), promptInput()]
                : placeholder(
                      Icon.icon({iconName: 'user-robot-xmarks'}),
                      'ChatGPTService not initialized.',
                      button({
                          text: 'Retry',
                          onClick: () => XH.chatGptService.clearAndReInitAsync()
                      })
                  )
        });
    }
});

const msgList = hoistCmp.factory<AppModel>({
    render({model}) {
        const {messages} = XH.chatGptService,
            item = isEmpty(messages)
                ? placeholder(Icon.ellipsisHorizontal(), 'No messages yet...')
                : div({
                      className: 'tb-msg-list',
                      items: [
                          ...messages.map(message => msgItem({message})),
                          // Supports scrolling to bottom of list.
                          box({ref: model.scrollRef})
                      ]
                  });

        return panel({
            item,
            loadingIndicator: model.taskObserver
        });
    }
});

const msgItem = hoistCmp.factory<MsgItemProps>({
    render({model, message}) {
        const {role, content, function_call} = message,
            items = [];

        // System message is visible via popover from top toolbar.
        if (role === 'system') return null;

        if (content) {
            items.push(reactMarkdown(content));
        }

        if (function_call) {
            const {name, arguments: args} = function_call;
            items.push(
                hbox({
                    className: 'tb-msg__content--func',
                    items: [Icon.func(), div(`${name}(${args})`)]
                })
            );
        }

        if (isEmpty(items)) {
            items.push(errorMessage({error: 'No content returned - unexpected'}));
        }

        return hbox({
            className: `tb-msg`,
            items: [
                avatar({role}),
                div({
                    className: 'tb-msg__content',
                    items
                })
            ]
        });
    }
});

const avatar = hoistCmp.factory({
    render({role}) {
        let item,
            isIcon = true;
        switch (role) {
            case 'system':
                item = Icon.gear();
                break;
            case 'assistant':
                item = Icon.icon({iconName: 'robot'});
                break;
            case 'user':
                item = img({src: XH.getUser().profilePicUrl, referrerPolicy: 'no-referrer'});
                isIcon = false;
                break;
        }

        return div({
            className: `tb-msg__avatar ${isIcon ? '' : 'tb-msg__avatar--icon'}`,
            item
        });
    }
});

const promptInput = hoistCmp.factory({
    model: uses(AppModel),
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

const appBarControls = hoistCmp.factory<AppModel>({
    render({model}) {
        const popSize = {width: '70vw', minWidth: '800px', height: '80vh'};
        return fragment(
            popover({
                target: button({
                    text: 'Functions',
                    icon: Icon.func(),
                    outlined: true
                }),
                content: panel({
                    title: 'Provided Function Library',
                    icon: Icon.func(),
                    compactHeader: true,
                    className: 'xh-popup--framed',
                    ...popSize,
                    item: jsonInput({
                        value: JSON.stringify(XH.chatGptService.functions, null, 2),
                        readonly: true,
                        width: '100%',
                        height: '100%'
                    })
                })
            }),
            appBarSeparator(),
            popover({
                target: button({
                    text: 'System Message',
                    icon: Icon.gear(),
                    outlined: true
                }),
                content: panel({
                    title: 'Initial System Message',
                    icon: Icon.gear(),
                    compactHeader: true,
                    className: 'xh-popup--framed',
                    item: div({
                        style: {...popSize, padding: 10, overflow: 'auto'},
                        item: reactMarkdown({
                            item: XH.chatGptService.systemMessage?.content ?? 'None found'
                        })
                    })
                })
            }),
            switchInput({
                value: XH.chatGptService.sendSystemMessage,
                onChange: v => (XH.chatGptService.sendSystemMessage = v)
            }),
            appBarSeparator(),
            modelSelector()
        );
    }
});

const modelSelector = hoistCmp.factory({
    render() {
        return select({
            enableFilter: false,
            width: 150,
            value: XH.chatGptService.model,
            options: XH.chatGptService.selectableModels,
            onChange: v => (XH.chatGptService.model = v)
        });
    }
});

const userMsgHistory = hoistCmp.factory<AppModel>({
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

interface MsgItemProps extends HoistProps<AppModel> {
    message: GptMessage;
}

const reactMarkdown = elementFactory(ReactMarkdown);
