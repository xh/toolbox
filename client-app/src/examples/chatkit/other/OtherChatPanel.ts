import {chatWorkspace} from '@xh/hoist-chat-kit/desktop/cmp/workspace';
import {div, form, span, textarea} from '@xh/hoist/cmp/layout';
import {creates, elementFactory, hoistCmp, HoistModel, useLocalModel, uses} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {OtherChatAssistantModel} from './OtherChatAssistantModel';
import {OtherChatModel} from './OtherChatModel';
import './OtherChatPanel.scss';

/**
 * The kit's chat workspace around a conversation from another library. The sidebar, rail, header
 * and thread states are the kit's. The conversation in the middle is the other library's own
 * view, which the workspace keeps mounted as the selection changes.
 */
export const otherChatPanel = hoistCmp.factory({
    displayName: 'OtherChatPanel',
    model: creates(OtherChatAssistantModel),

    render({model}) {
        return chatWorkspace({
            model: model.workspaceModel,
            testId: 'other-workspace',
            notice: 'The conversation runs on a stand-in for another chat library. Ask with "slow" or "fail" in the question to see the list follow its turns.',
            conversationView: otherChatView({model: model.chatModel})
        });
    }
});

/**
 * The other library's view of the shown thread. Written with plain elements, as a third-party
 * library's would be, rather than the kit's components.
 */
const otherChatView = hoistCmp.factory<OtherChatModel>({
    displayName: 'OtherChatView',
    model: uses(OtherChatModel),

    render({model}) {
        const impl = useLocalModel(OtherChatViewModel),
            {messages, isShownRunning} = model;

        return div({
            className: 'tb-other-chat',
            items: [
                div({className: 'tb-other-chat__badge', item: 'Other library'}),
                div({
                    className: 'tb-other-chat__messages',
                    items: messages.length
                        ? messages.map(it =>
                              div({
                                  key: it.id,
                                  className: `tb-other-chat__msg tb-other-chat__msg--${it.role}`,
                                  items: [
                                      it.text || '...',
                                      it.status === 'failed' || it.status === 'stopped'
                                          ? span({
                                                className: 'tb-other-chat__status',
                                                item: ` (${it.status})`
                                            })
                                          : null
                                  ]
                              })
                          )
                        : div({
                              className: 'tb-other-chat__empty',
                              item: 'Ask the other library anything.'
                          })
                }),
                form({
                    className: 'tb-other-chat__composer',
                    onSubmit: e => {
                        e.preventDefault();
                        impl.send(model);
                    },
                    items: [
                        textarea({
                            value: impl.text ?? '',
                            placeholder: 'Message the other library...',
                            onChange: e => impl.setText(e.target.value),
                            onKeyDown: e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    impl.send(model);
                                }
                            }
                        }),
                        isShownRunning
                            ? htmlButton({
                                  type: 'button',
                                  item: 'Stop',
                                  onClick: () => model.stopThread(model.shownThreadId)
                              })
                            : htmlButton({type: 'submit', item: 'Send'})
                    ]
                })
            ]
        });
    }
});

// A plain HTML button - the other library does not use Hoist's.
const htmlButton = elementFactory('button');

class OtherChatViewModel extends HoistModel {
    @bindable accessor text: string = null;

    send(chatModel: OtherChatModel) {
        if (!this.text?.trim() || chatModel.isShownRunning) return;
        chatModel.sendAsync(this.text);
        this.setText(null);
    }

    setText(text: string) {
        this.text = text;
    }
}
