
import {filler, vspacer, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, useContextModel} from '@xh/hoist/core';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';

import {DialogsPanelModel} from './DialogsPanelModel';
import {StubModel} from './StubModel';

export const stubPanel = hoistCmp.factory({
    model: uses(StubModel),
    render({model}) {
        const parentModel = useContextModel(DialogsPanelModel),
            {dialogModel} = model,
            {isOpen, position, size, isMaximized} = dialogModel;
        return vbox(
            toolbar(model.xhId,
                filler(),
                `(${position.x ?? ''}, ${position.y ?? ''}, ${size.width ?? ''},  ${size.height ?? ''})`),
            toolbar(
                filler(),
                button({
                    icon: isMaximized ? Icon.collapse() : Icon.expand(),
                    onClick: () => dialogModel.toggleMaximized()
                }),
                button({
                    text: isOpen ? 'Close' : 'Open',
                    onClick: () => isOpen ? dialogModel.close() : dialogModel.open()
                }),
                button({
                    text: 'Destroy',
                    onClick: () => parentModel.removeStub(model)
                })
            ),
            vspacer(5)
        );
    }
});