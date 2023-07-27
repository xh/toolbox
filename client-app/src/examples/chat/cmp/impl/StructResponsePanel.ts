import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {StructResponseModel} from './StructResponseModel';
import {placeholder} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

export const structResponsePanel = hoistCmp.factory({
    displayName: 'StructuredResponsePanel',
    model: creates(StructResponseModel),

    render({model, ...rest}) {
        return panel({
            title: model.title,
            compactHeader: true,
            item: model.shouldDisplay
                ? 'TODO'
                : placeholder(
                      Icon.grid(),
                      'Select a GPT response with structured data attached to view the results.'
                  ),
            modelConfig: {
                defaultSize: '30%',
                side: 'right'
            },
            ...rest
        });
    }
});
