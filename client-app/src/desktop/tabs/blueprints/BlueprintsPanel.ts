import {creates, hoistCmp, HoistModel, persist, XH} from '@xh/hoist/core';
import type {HoistProps, PersistOptions} from '@xh/hoist/core';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, observableRef, runInAction} from '@xh/hoist/mobx';
import {find} from 'lodash';
import type {ReactElement} from 'react';
import {blueprintLibrary, blueprintWorkspace} from '../../../blueprints/BlueprintShell';
import {BlueprintShellModel} from '../../../blueprints/BlueprintShellModel';
import type {DesignerView} from '../../../blueprints/BlueprintShellModel';
import {BLUEPRINT_TYPES, PORTFOLIO_TYPE} from '../../../blueprints/blueprintTypes';
import type {BlueprintTypeSpec} from '../../../blueprints/blueprintTypes';
import {wrapper, wrapperAction, wrapperOptionGroup} from '../../common/Wrapper';

/** A blueprint type's route under the tab, such as `weather` for `toolbox.weather`. */
export function typeRouteName(type: BlueprintTypeSpec): string {
    return type.name.split('.').pop();
}

/** The type of blueprint the tab shows, and its shell, rebuilt when the type changes. */
class BlueprintsTabModel extends HoistModel {
    override persistWith: PersistOptions = {localStorageKey: 'blueprintsDesigner'};

    @bindable @persist accessor typeName: string = PORTFOLIO_TYPE.name;
    @observableRef accessor shellModel: BlueprintShellModel = null;

    constructor() {
        super();
        const linked = BLUEPRINT_TYPES.find(it =>
            XH.routerState?.name?.startsWith(`default.blueprints.${typeRouteName(it)}`)
        );
        if (linked) this.typeName = linked.name;
        this.addReaction({
            track: () => this.typeName,
            run: name => this.openType(find(BLUEPRINT_TYPES, {name}) ?? PORTFOLIO_TYPE),
            fireImmediately: true
        });
    }

    override destroy() {
        XH.safeDestroy(this.shellModel);
        super.destroy();
    }

    private openType(type: BlueprintTypeSpec) {
        XH.safeDestroy(this.shellModel);
        const shellModel = new BlueprintShellModel({
            type,
            route: `default.blueprints.${typeRouteName(type)}.blueprint`
        });
        runInAction(() => (this.shellModel = shellModel));
        shellModel.loadAsync();
    }
}

/** The Blueprints Designer: a library of blueprints, each built with the Architect. */
export const blueprintsPanel = hoistCmp.factory({
    displayName: 'BlueprintsPanel',
    model: creates(BlueprintsTabModel),

    render({model}) {
        const {shellModel} = model;
        return wrapper({
            title: 'Designer',
            icon: Icon.layout(),
            description: [
                'A blueprint describes a dashboard as JSON. Pick one, or start a new one, and ask',
                'the Architect to build or change it. Your own blueprints open as drafts, which save',
                'as you work, and are private until you share them. Others you share with see only',
                'your published versions: they run the latest, and may copy it to make it their own.',
                'Each blueprint keeps its own conversation with the Architect, in this browser.'
            ],
            optionsLabel: null,
            options: [
                wrapperOptionGroup({
                    label: 'Blueprints',
                    icon: Icon.layout(),
                    children: [
                        buttonGroupInput({
                            bind: 'typeName',
                            width: '100%',
                            items: BLUEPRINT_TYPES.map(it =>
                                button({value: it.name, text: it.label, flex: 1})
                            )
                        }),
                        blueprintLibrary({model: shellModel, key: shellModel.xhId})
                    ]
                }),
                wrapperOptionGroup({
                    label: 'Reference',
                    icon: Icon.book(),
                    info: 'What blueprints are built from. Opens beside the Architect.',
                    children: [
                        viewButton({
                            model: shellModel,
                            view: 'catalog',
                            text: 'Data Catalog',
                            icon: Icon.database()
                        }),
                        viewButton({
                            model: shellModel,
                            view: 'registry',
                            text: 'Registry',
                            icon: Icon.list()
                        })
                    ]
                })
            ],
            links: [
                {
                    url: '$TB/client-app/src/blueprints/BlueprintShellModel.ts',
                    notes: 'The library, and the models that open a blueprint.'
                },
                {
                    url: '$TB/client-app/src/blueprints/repository/JsonBlobBlueprintRepository.ts',
                    notes: 'Where blueprints persist, on Hoist JsonBlobs.'
                },
                {
                    url: '$TB/client-app/src/blueprints/architectChat.ts',
                    notes: "The Architect's chat."
                },
                {url: '$CK/blueprint/README.md', text: 'Blueprints'}
            ],
            item: panel({
                flex: 1,
                width: '100%',
                mask: shellModel.loadObserver,
                item: blueprintWorkspace({model: shellModel, key: shellModel.xhId})
            })
        });
    }
});

interface ViewButtonProps extends HoistProps<BlueprintShellModel> {
    view: DesignerView;
    text: string;
    icon: ReactElement;
}

const viewButton = hoistCmp.factory<ViewButtonProps>(({model, view, text, icon}) =>
    wrapperAction({
        text,
        icon,
        active: model.view === view,
        disabled: !model.blueprintModel,
        onClick: () => model.toggleView(view)
    })
);
