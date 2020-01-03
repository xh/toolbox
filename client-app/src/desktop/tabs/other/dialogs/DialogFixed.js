// import {FocusStyleManager} from '@blueprintjs/core';
import {HoistModel, hoistCmp} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';

import {dialog} from '@xh/hoist/desktop/cmp/dialog';

import {formPanel} from './forms/FormPanel';

export const dialogFixed = hoistCmp.factory({

    render({model}) {

        const onCloseClick = () => {
            model.setIsOpen(false);
        };

        return dialog({
            isOpen: model.isOpen,
            close: onCloseClick,
            canEscapeKeyClose: true,
            width: 870,
            height: 550,
            item: formPanel({onCloseClick})
        });
    }
});

@HoistModel
export class DialogFixedModel {
    @bindable isOpen = false;
}