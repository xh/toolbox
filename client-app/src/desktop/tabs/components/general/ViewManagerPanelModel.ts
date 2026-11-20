import type {ViewManagerConfig} from '@xh/hoist/cmp/viewmanager';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import {DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import type {ViewManagerProps} from '@xh/hoist/desktop/cmp/viewmanager';
import {Icon} from '@xh/hoist/icon';
import {bindable, computed, observableRef, runInAction} from '@xh/hoist/mobx';
import {fmtDemoConfig, raw} from '../../../common/Demo';
import {gridWidget} from '../../layout/widgets/GridWidget';
import {optionsWidget} from '../../layout/widgets/OptionsWidget';

export type ButtonTextOption = 'name' | 'fullPath' | 'type' | 'none';
export type StateButtonOption = 'whenDirty' | 'always' | 'never';

export class ViewManagerPanelModel extends HoistModel {
    // ViewManager component props.
    @bindable accessor buttonTextMode: ButtonTextOption = 'name';
    @bindable accessor showSaveButton: StateButtonOption = 'whenDirty';
    @bindable accessor showRevertButton: StateButtonOption = 'never';
    @bindable accessor buttonSide: 'left' | 'right' = 'right';

    // ViewManagerModel configs - fixed at construction, so changing one rebuilds the model.
    @bindable accessor typeDisplayName = 'Layout';
    @bindable accessor globalDisplayName = 'Global';
    @bindable accessor enableDefault = true;
    @bindable accessor enableAutoSave = true;

    @managed @observableRef accessor viewManagerModel: ViewManagerModel = null;
    @managed @observableRef accessor dashCanvasModel: DashCanvasModel = null;
    @managed rebuildTask = TaskObserver.trackLast();

    constructor() {
        super();
        this.addReaction({
            track: () => [
                this.typeDisplayName,
                this.globalDisplayName,
                this.enableDefault,
                this.enableAutoSave
            ],
            run: () => this.rebuildAsync(),
            debounce: 500
        });
        this.rebuildAsync();
    }

    /** The code a developer would write for the current options - only non-default values. */
    @computed
    get configText(): string {
        const modelConfig = fmtDemoConfig<ViewManagerConfig>('ViewManagerModel.createAsync', {
                type: 'toolboxViewManagerDemo',
                typeDisplayName: this.typeDisplayName || undefined,
                globalDisplayName:
                    this.globalDisplayName.toLowerCase() === 'global'
                        ? undefined
                        : this.globalDisplayName || undefined,
                enableDefault: this.enableDefault ? undefined : false,
                initialViewSpec: this.enableDefault ? undefined : raw('views => views[0]'),
                enableAutoSave: this.enableAutoSave ? undefined : false,
                enableSharing: false
            }),
            {buttonTextMode, showSaveButton, showRevertButton, buttonSide} = this,
            cmpConfig = fmtDemoConfig<ViewManagerProps>('viewManager', {
                model: raw('viewManagerModel'),
                buttonTextMode:
                    buttonTextMode === 'name'
                        ? undefined
                        : buttonTextMode === 'none'
                          ? null
                          : buttonTextMode,
                showSaveButton: showSaveButton === 'whenDirty' ? undefined : showSaveButton,
                showRevertButton: showRevertButton === 'never' ? undefined : showRevertButton,
                buttonSide: buttonSide === 'right' ? undefined : buttonSide
            });
        return `${modelConfig}\n\n${cmpConfig}`;
    }

    private async rebuildAsync() {
        const {typeDisplayName, globalDisplayName, enableDefault, enableAutoSave} = this,
            viewManagerModel = await ViewManagerModel.createAsync({
                type: 'toolboxViewManagerDemo',
                typeDisplayName: typeDisplayName || undefined,
                globalDisplayName: globalDisplayName || undefined,
                enableDefault,
                enableAutoSave,
                // Off so viewers cannot publish layouts to other viewers.
                enableSharing: false,
                initialViewSpec: enableDefault ? undefined : views => views[0]
            })
                .linkTo(this.rebuildTask)
                .catchDefault();

        if (!viewManagerModel) return;
        if (this.isDestroyed) {
            viewManagerModel.destroy();
            return;
        }

        runInAction(() => {
            XH.safeDestroy(this.dashCanvasModel, this.viewManagerModel);
            this.viewManagerModel = viewManagerModel;
            this.dashCanvasModel = createDashCanvasModel(viewManagerModel);
        });
    }
}

function createDashCanvasModel(viewManagerModel: ViewManagerModel): DashCanvasModel {
    return new DashCanvasModel({
        persistWith: {viewManagerModel},
        initialState,
        viewSpecs: [
            {
                id: 'options',
                title: 'Options',
                icon: Icon.settings(),
                content: optionsWidget,
                width: 6,
                height: 3,
                allowRename: false,
                hideMenuButton: true
            },
            {
                id: 'grid',
                title: 'Grid',
                icon: Icon.gridPanel(),
                unique: true,
                content: gridWidget,
                width: 12,
                height: 6
            }
        ]
    });
}

const initialState = [
    {
        layout: {x: 0, y: 0, w: 6, h: 3},
        viewSpecId: 'options',
        title: 'Options 1',
        state: {value: 'Live'}
    },
    {
        layout: {x: 6, y: 0, w: 6, h: 3},
        viewSpecId: 'options',
        title: 'Options 2',
        state: {value: 'Daily'}
    },
    {
        layout: {x: 0, y: 3, w: 12, h: 6},
        viewSpecId: 'grid'
    }
];
