
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
            {isOpen, position, size, isMaximized, renderedPosition: rPosition, renderedSize: rSize} = dialogModel;
        return vbox(
            toolbar(
                button({
                    icon: Icon.arrowLeft(),
                    disabled: isMaximized,
                    onClick: () => dialogModel.setPosition({x: rPosition.x -10})
                }),
                button({
                    icon: Icon.arrowRight(),
                    disabled: isMaximized,
                    onClick: () => dialogModel.setPosition({x: rPosition.x + 10})
                }),
                button({
                    icon: Icon.arrowUp(),
                    disabled: isMaximized,
                    onClick: () => dialogModel.setPosition({y: rPosition.y -10})
                }),
                button({
                    icon: Icon.arrowDown(),
                    disabled: isMaximized,
                    onClick: () => dialogModel.setPosition({y: rPosition.y + 10})
                }),
                button({
                    icon: isOpen ? Icon.close() : Icon.openExternal(),
                    onClick: () => isOpen ? dialogModel.close() : dialogModel.open()
                }),
                filler(),
                `rend: (${rPosition?.x ?? ''}, ${rPosition?.y ?? ''}, ${rSize?.width ?? ''},  ${rSize?.height ?? ''})`
            ),
            toolbar(
                button({
                    icon: Icon.arrowsLeftRight(),
                    disabled: isMaximized,
                    onClick: () => dialogModel.setSize({width: rSize.width + 10})
                }),
                button({
                    icon: Icon.arrowsUpDown(),
                    disabled: isMaximized,
                    onClick: () => dialogModel.setSize({height: rSize.height + 10})
                }),
                button({
                    icon: isMaximized ? Icon.collapse() : Icon.expand(),
                    onClick: () => dialogModel.toggleMaximized()
                }),
                button({
                    icon: Icon.delete(),
                    onClick: () => parentModel.removeStub(model)
                }),
                filler(),
                `spec: (${position.x ?? ''}, ${position.y ?? ''}, ${size.width ?? ''},  ${size.height ?? ''})`
            ),
            vspacer(5)
        );
    }
});