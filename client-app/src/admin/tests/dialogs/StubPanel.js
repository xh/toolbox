
import {filler} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, useContextModel} from '@xh/hoist/core';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {DialogsPanelModel} from './DialogsPanelModel';
import {StubModel} from './StubModel';

export const stubPanel = hoistCmp.factory({
    model: uses(StubModel),
    render({model}) {
        const parentModel = useContextModel(DialogsPanelModel),
            {dialogModel} = model,
            {isOpen} = dialogModel;
        return toolbar(
            model.xhId,
            filler(),
            button({
                text: isOpen ? 'Close' : 'Open',
                onClick: () => isOpen ? dialogModel.close() : dialogModel.open()
            }),
            button({
                text: 'Destroy',
                onClick: () => parentModel.removeStub(model)
            })
        );
    }
});