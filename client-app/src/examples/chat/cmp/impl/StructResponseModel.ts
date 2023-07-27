import {HoistModel, lookup, XH} from '@xh/hoist/core';
import {ChatModel} from '../ChatModel';
import {GptMessage} from '../../../../core/svc/ChatGptService';
import {GridModel} from '@xh/hoist/cmp/grid';
import {bindable} from '@xh/hoist/mobx';

export class StructResponseModel extends HoistModel {
    @lookup(ChatModel) chatModel: ChatModel;

    get selectedMsg(): GptMessage {
        return this.chatModel?.selectedMsg;
    }

    get shouldDisplay() {
        return this.selectedMsg?.function_call != null;
    }

    override onLinked() {
        this.addReaction({
            track: () => this.selectedMsg,
            run: () => this.onSelectedMsgChange(),
            fireImmediately: true
        });
    }

    @bindable title: string;
    @bindable.ref gridModel: GridModel;

    onSelectedMsgChange() {
        const {selectedMsg} = this;

        if (!selectedMsg) {
            this.title = 'Select a GPT response to view associated data';
            XH.safeDestroy(this.gridModel);
            this.gridModel = null;
        } else {
            this.title = 'Some generated title';
        }
    }
}
