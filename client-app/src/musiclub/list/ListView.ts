import {dataView} from '@xh/hoist/cmp/dataview';
import {filler} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/mobile/cmp/button';
import {buttonGroupInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {albumIcon, meetingIcon} from '../Icons';
import {ListModel} from './ListModel';
import './List.scss';

export const listView = hoistCmp.factory({
    displayName: 'ListView',
    className: 'mc-list',
    model: creates(ListModel),

    render({model, className}) {
        const {sort} = model;
        return panel({
            className,
            item: dataView(),
            bbar: [
                filler(),
                buttonGroupInput({
                    bind: 'dim',
                    outlined: true,
                    items: [
                        button({
                            icon: albumIcon(),
                            text: 'Year',
                            value: 'year',
                            width: 100
                        }),
                        button({
                            icon: meetingIcon(),
                            text: 'Year',
                            value: 'dateYear',
                            width: 100
                        })
                    ]
                }),
                button({
                    icon: sort == 'asc' ? Icon.chevronUp() : Icon.chevronDown({prefix: 'fal'}),
                    outlined: true,
                    onClick: () => model.toggleSort(),
                }),
                filler()
            ]
        });
    }
});
