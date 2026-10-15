import {chatAssistantButton, chatAssistantContainer} from '@xh/hoist-chat-kit/desktop/cmp/assist';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {box, filler} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {GridHelperModel} from './GridHelperModel';

/**
 * A grid with a component helper: the kit's `chatAssistantButton` last in the panel's header,
 * and its `chatAssistantContainer` around the panel's content. The helper docks beside the grid
 * when the panel is 740 px or wider, and opens as a popover from the button when it is narrower.
 */
export const gridHelperPanel = hoistCmp.factory({
    displayName: 'GridHelperPanel',
    model: creates(GridHelperModel),

    render({model}) {
        const {gridModel, assistantModel} = model;
        return box({
            className: 'tb-chatkit__helper',
            item: panel({
                title: 'Positions · Macro Book',
                icon: Icon.gridPanel(),
                headerItems: [chatAssistantButton({model: assistantModel})],
                item: chatAssistantContainer({
                    model: assistantModel,
                    items: [
                        toolbar(
                            gridCountLabel({unit: 'position'}),
                            filler(),
                            colChooserButton(),
                            exportButton()
                        ),
                        grid({model: gridModel})
                    ]
                })
            })
        });
    }
});
