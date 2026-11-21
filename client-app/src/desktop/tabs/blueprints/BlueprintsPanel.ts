import {creates, hoistCmp} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import type {ReactElement} from 'react';
import {blueprintLibrary, blueprintWorkspace} from '../../../blueprints/BlueprintShell';
import {BlueprintShellModel} from '../../../blueprints/BlueprintShellModel';
import type {DesignerView} from '../../../blueprints/BlueprintShellModel';
import {wrapper, wrapperAction, wrapperOptionGroup} from '../../common/Wrapper';

/** The route that opens one blueprint in the tab, by its id. */
export const BLUEPRINT_ROUTE = 'default.blueprints.blueprint';

/** The Blueprints Designer: a library of blueprints, each built with the Architect. */
export const blueprintsPanel = hoistCmp.factory({
    displayName: 'BlueprintsPanel',
    model: creates(() => new BlueprintShellModel({route: BLUEPRINT_ROUTE})),

    render() {
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
                    children: [blueprintLibrary()]
                }),
                wrapperOptionGroup({
                    label: 'Reference',
                    icon: Icon.book(),
                    info: 'What blueprints are built from. Opens beside the Architect.',
                    children: [
                        viewButton({view: 'catalog', text: 'Data Catalog', icon: Icon.database()}),
                        viewButton({view: 'registry', text: 'Registry', icon: Icon.list()})
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
                mask: 'onLoad',
                item: blueprintWorkspace()
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
