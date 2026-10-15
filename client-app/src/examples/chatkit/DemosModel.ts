import {HoistModel, managed, persist} from '@xh/hoist/core';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {bindable, computed} from '@xh/hoist/mobx';
import {ChatKitDemoModel} from './ChatKitDemoModel';
import {approvalDemo} from './demos/approvalDemo';
import {attachmentsDemo} from './demos/attachmentsDemo';
import {errorsDemo} from './demos/errorsDemo';
import {genUiDemo} from './demos/genUiDemo';
import {liveDemo} from './demos/liveDemo';
import {reasoningDemo} from './demos/reasoningDemo';
import {timelineDemo} from './demos/timelineDemo';
import {richContentDemo} from './demos/richContentDemo';

/**
 * Model for the Demos tab: a list of demo conversations, each a chat panel on its own ChatModel.
 * All but the last run on a ScriptedChatTransport, so they need no model or API key.
 */
export class DemosModel extends HoistModel {
    override persistWith = {localStorageKey: 'chatKitApp'};

    @managed readonly navPanelModel = new PanelModel({
        side: 'left',
        defaultSize: 290,
        minSize: 220,
        resizable: true,
        collapsible: true,
        persistWith: {...this.persistWith, path: 'navPanel'}
    });

    /** One model per demo, created up front so that each keeps its conversation. */
    @managed readonly demoModels: ChatKitDemoModel[] = [
        richContentDemo,
        reasoningDemo,
        timelineDemo,
        approvalDemo,
        genUiDemo,
        errorsDemo,
        attachmentsDemo,
        liveDemo
    ].map(it => new ChatKitDemoModel(it));

    @bindable @persist accessor activeDemoId: string = richContentDemo.id;

    @computed
    get activeDemoModel(): ChatKitDemoModel {
        const {demoModels, activeDemoId} = this;
        return demoModels.find(it => it.id === activeDemoId) ?? demoModels[0];
    }
}
