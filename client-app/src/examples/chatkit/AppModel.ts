import type {InitContext} from '@xh/hoist/core';
import {managed, persist} from '@xh/hoist/core';
import {themeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {bindable, computed} from '@xh/hoist/mobx';
import {BaseAppModel} from '../../BaseAppModel';
import {ChatKitDemoModel} from './ChatKitDemoModel';
import {approvalDemo} from './demos/approvalDemo';
import {attachmentsDemo} from './demos/attachmentsDemo';
import {errorsDemo} from './demos/errorsDemo';
import {genUiDemo} from './demos/genUiDemo';
import {liveDemo} from './demos/liveDemo';
import {reasoningDemo} from './demos/reasoningDemo';
import {richContentDemo} from './demos/richContentDemo';

/**
 * A showcase of `@xh/hoist-chat-kit`: a list of demo conversations, each a chat panel on its own
 * ChatModel. All but the last run on a ScriptedChatTransport, so they need no model or API key.
 */
export class AppModel extends BaseAppModel {
    static instance: AppModel;
    override persistWith = {localStorageKey: 'chatKitApp'};

    @managed navPanelModel: PanelModel;

    /** One model per demo, created up front so that each keeps its conversation. */
    @managed demoModels: ChatKitDemoModel[];

    @bindable @persist accessor activeDemoId: string = richContentDemo.id;

    @computed
    get activeDemoModel(): ChatKitDemoModel {
        const {demoModels, activeDemoId} = this;
        return demoModels.find(it => it.id === activeDemoId) ?? demoModels[0];
    }

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);

        this.navPanelModel = new PanelModel({
            side: 'left',
            defaultSize: 290,
            minSize: 220,
            resizable: true,
            collapsible: true,
            persistWith: {...this.persistWith, path: 'navPanel'}
        });

        this.demoModels = [
            richContentDemo,
            reasoningDemo,
            approvalDemo,
            genUiDemo,
            errorsDemo,
            attachmentsDemo,
            liveDemo
        ].map(it => new ChatKitDemoModel(it));
    }

    override getAppOptions() {
        return [themeAppOption()];
    }
}
