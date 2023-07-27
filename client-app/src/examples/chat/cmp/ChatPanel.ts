import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {ChatModel} from './ChatModel';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {messageList} from './impl/MessageList';
import {promptInput} from './impl/PromptInput';
import {placeholder} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/desktop/cmp/button';
import './Chat.scss';

export const chatPanel = hoistCmp.factory({
    displayName: 'ChatPanel',
    model: creates(ChatModel),

    render({model}) {
        return panel({
            items: XH.chatGptService.isInitialized
                ? [messageList(), promptInput()]
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
