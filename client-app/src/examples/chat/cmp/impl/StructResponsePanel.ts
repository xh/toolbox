import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {StructResponseModel} from './StructResponseModel';
import {placeholder} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {grid} from '@xh/hoist/cmp/grid';

export const structResponsePanel = hoistCmp.factory({
    displayName: 'StructuredResponsePanel',
    model: creates(StructResponseModel),

    render({model, ...rest}) {
        const {title, shouldDisplay} = model;
        return panel({
            title,
            icon: title ? Icon.terminal() : null,
            compactHeader: true,
            item: shouldDisplay
                ? dataComponent()
                : placeholder(
                      Icon.grid(),
                      'Select a GPT response with structured data attached to view the results.'
                  ),
            modelConfig: {
                defaultSize: 450,
                side: 'right'
            },
            ...rest
        });
    }
});

const dataComponent = hoistCmp.factory<StructResponseModel>({
    render({model}) {
        const {gridModel} = model;
        if (gridModel) {
            return grid({model: gridModel, flex: 1, agOptions: {groupDefaultExpanded: 1}});
        }

        return placeholder('No structured data found.');
    }
});
