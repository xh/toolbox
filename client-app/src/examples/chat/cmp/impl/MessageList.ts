import {elementFactory, hoistCmp, HoistProps, uses, XH} from '@xh/hoist/core';
import {isEmpty} from 'lodash';
import {box, div, hbox, img, placeholder} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {errorMessage} from '@xh/hoist/desktop/cmp/error';
import {GptMessage} from '../../../../core/svc/ChatGptService';
import ReactMarkdown from 'react-markdown';
import {ChatModel} from '../ChatModel';
import {structResponsePanel} from './StructResponsePanel';

export const messageList = hoistCmp.factory({
    displayName: 'MessageList',
    model: uses(ChatModel),

    render({model}) {
        const {messages} = XH.chatGptService,
            item = isEmpty(messages)
                ? placeholder(Icon.ellipsisHorizontal(), 'No messages yet...')
                : hbox({
                      flex: 1,
                      items: [
                          div({
                              className: 'tb-msg-list',
                              items: [
                                  ...messages.map(message => msgItem({message})),
                                  // Supports scrolling to bottom of list.
                                  box({ref: model.scrollRef})
                              ]
                          }),
                          structResponsePanel({})
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
            isSelected = model.selectedMsg === message,
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
            className: `tb-msg ${isSelected ? 'tb-msg--selected' : ''}`,
            items: [
                avatar({role}),
                div({
                    className: 'tb-msg__content',
                    items
                })
            ],
            onClick: () => (model.selectedMsg = message)
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

const reactMarkdown = elementFactory(ReactMarkdown);

interface MsgItemProps extends HoistProps<ChatModel> {
    message: GptMessage;
}
