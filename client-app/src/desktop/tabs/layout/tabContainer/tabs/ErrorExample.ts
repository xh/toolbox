import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {p, vframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {fmtDate} from '@xh/hoist/format';

export const errorExample = hoistCmp.factory({
    model: creates(() => ErrorExampleModel),
    render({model}) {
        if (model.clicks === 3) throw XH.exception('Too many clicks!');
        return vframe({
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
            items: [
                p(
                    'If the button below is clicked too many times, this tab can crash in an unhandled way.'
                ),
                p(
                    'Fortunately, Hoist tabs are automatically wrapped in an ErrorBoundary, so the entire app will not crash - ' +
                        'only this tab, which will have its contents replaced by a managed error message.'
                ),
                button({
                    text: 'Click me a few times...',
                    icon: Icon.skull(),
                    intent: 'danger',
                    minimal: false,
                    margin: '20 0',
                    onClick: () => model.clicks++
                }),
                p(`You have clicked me ${model.clicks} times...`),
                p(`I was last (re)mounted at ${fmtDate(model.mounted, {fmt: 'hh:mm:ss'})}`)
            ]
        });
    }
});

class ErrorExampleModel extends HoistModel {
    @bindable clicks = 0;
    mounted = null;

    constructor() {
        super();
        this.mounted = new Date();
    }
}
