import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {ChatModel} from './ChatModel';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {messageList} from './cmp/MessageList';
import {promptInput} from './cmp/PromptInput';
import {placeholder} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/desktop/cmp/button';

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
