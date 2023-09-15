import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {p, vframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {fmtDate} from '@xh/hoist/format';

export const explodingPanel = hoistCmp.factory({
    model: creates(() => ErrorExampleModel),
    render({model, extraText, ...props}) {
        if (model.clicks === 3) throw XH.exception('Too many clicks!');
        return vframe({
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
            items: [
                p(
                    'If the button below is clicked too many times, this component will throw an exception during rendering.'
                ),
                p(extraText),
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
            ],
            ...props
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
