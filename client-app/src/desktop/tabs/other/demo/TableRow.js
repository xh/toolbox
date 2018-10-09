import {tr, td, code} from '@xh/hoist/cmp/layout/index';
import {Icon} from '@xh/hoist/icon/index';
import {button} from '@xh/hoist/desktop/cmp/button/index';

export const tableRow = ({xhCode, description, onClick}) => {
    if (!onClick && xhCode) onClick = () => eval(xhCode);
    return (
        tr({
            className: 'demo-row',
            items: [
                td({
                    item: button({
                        icon: Icon.play(),
                        onClick: onClick
                    })
                }),
                td({
                    item: code(xhCode),
                    className: 'text-cell'
                }),
                td({
                    item: description,
                    className: 'text-cell'
                })
            ]
        })
    );
};