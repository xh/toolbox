import {TabContainerModel} from '@xh/hoist/cmp/tab';
import type {InitContext} from '@xh/hoist/core';
import {managed} from '@xh/hoist/core';
import {themeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {Icon} from '@xh/hoist/icon';
import {BaseAppModel} from '../../BaseAppModel';
import {demosPanel} from './DemosPanel';
import {guideAssistantPanel} from './guide/GuideAssistantPanel';

/**
 * A showcase of `@xh/hoist-chat-kit`, in two tabs: demo conversations, each a chat panel of its
 * own, and the guideline assistant, a full chat workspace over a server-owned backend.
 */
export class AppModel extends BaseAppModel {
    static instance: AppModel;
    override persistWith = {localStorageKey: 'chatKitApp'};

    @managed tabModel: TabContainerModel;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);

        this.tabModel = new TabContainerModel({
            tabs: [
                {id: 'demos', title: 'Demos', icon: Icon.list(), content: demosPanel},
                {
                    id: 'guide',
                    title: 'Guideline Assistant',
                    icon: Icon.book(),
                    content: guideAssistantPanel
                }
            ],
            persistWith: {...this.persistWith, path: 'tabs'}
        });
    }

    override getAppOptions() {
        return [themeAppOption()];
    }
}
