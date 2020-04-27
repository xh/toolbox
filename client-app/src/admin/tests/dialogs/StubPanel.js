
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
                    title: 'Left 10',
                    disabled: isMaximized,
                    onClick: () => dialogModel.setPosition({x: rPosition.x -10})
                }),
                button({
                    icon: Icon.arrowRight(),
                    title: 'Right 10',
                    disabled: isMaximized,
                    onClick: () => dialogModel.setPosition({x: rPosition.x + 10})
                }),
                button({
                    icon: Icon.arrowUp(),
                    title: 'Up 10',
                    disabled: isMaximized,
                    onClick: () => dialogModel.setPosition({y: rPosition.y -10})
                }),
                button({
                    icon: Icon.arrowDown(),
                    title: 'Down 10',
                    disabled: isMaximized,
                    onClick: () => dialogModel.setPosition({y: rPosition.y + 10})
                }),
                button({
                    icon: isOpen ? Icon.close() : Icon.openExternal(),
                    title: isOpen ? 'Close' : 'Open',
                    onClick: () => isOpen ? dialogModel.close() : dialogModel.open()
                }),
                filler(),
                `rend: (${rPosition?.x ?? ''}, ${rPosition?.y ?? ''}, ${rSize?.width ?? ''},  ${rSize?.height ?? ''})`
            ),
            toolbar(
                button({
                    icon: Icon.arrowsLeftRight(),
                    title: 'Grow Width',
                    disabled: isMaximized,
                    onClick: () => dialogModel.setSize({width: rSize.width + 10})
                }),
                button({
                    icon: Icon.arrowsUpDown(),
                    title: 'Grow Height',
                    disabled: isMaximized,
                    onClick: () => dialogModel.setSize({height: rSize.height + 10})
                }),
                button({
                    icon: isMaximized ? Icon.collapse() : Icon.expand(),
                    title: isMaximized ? 'Restore' : 'Maximize',
                    onClick: () => dialogModel.toggleMaximized()
                }),
                button({
                    icon: Icon.delete(),
                    title: 'Destroy',
                    onClick: () => parentModel.removeStub(model)
                }),
                filler(),
                `spec: (${position.x ?? ''}, ${position.y ?? ''}, ${size.width ?? ''},  ${size.height ?? ''})`
            ),
            vspacer(5)
        );
    }
});