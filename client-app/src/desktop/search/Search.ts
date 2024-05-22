import {createRef} from 'react';
import {createFilter} from 'react-select';
import {isEmpty} from 'lodash';
import {XH, HoistModel, hoistCmp, creates, PlainObject} from '@xh/hoist/core';
import {HoistInputModel} from '@xh/hoist/cmp/input';
import {select} from '@xh/hoist/desktop/cmp/input';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {getLayoutProps} from '@xh/hoist/utils/react';
import {useHotkeys} from '@xh/hoist/desktop/hooks';
import {Icon} from '@xh/hoist/icon';
import {wait} from '@xh/hoist/promise';

export const search = hoistCmp.factory({
    model: creates(() => new Model()),
    render({model, ...props}) {
        const {globalSearchOptions, selectRef} = model;

        if (isEmpty(globalSearchOptions)) return null;

        return useHotkeys(
            select({
                ref: selectRef,
                ...getLayoutProps(props),
                leftIcon: Icon.search(),
                bind: 'globalSearchSelection',
                options: globalSearchOptions,
                placeholder: 'Search for a component...(s)',
                hideDropdownIndicator: true,
                enableClear: true,
                valueField: 'route',
                filterFn: createFilter(null),
                onChange: val => model.forwardToTopic(val)
            }),
            [
                {
                    global: true,
                    combo: 's',
                    label: 'Go to search',
                    onKeyUp: () => model.focus()
                }
            ]
        );
    }
});

class Model extends HoistModel {
    @bindable
    globalSearchSelection;

    selectRef = createRef<HoistInputModel>();

    get globalSearchOptions(): PlainObject[] {
        return XH.getConf('searchOptions', []);
    }

    constructor() {
        super();
        makeObservable(this);
    }

    forwardToTopic(val) {
        if (val) {
            if (val.startsWith('launch.')) {
                this.openExternal(val);
            } else {
                XH.navigate(val.split('|')[0]);
            }

            XH.track({
                category: 'Global Search',
                message: 'Selected result',
                data: {topic: val}
            });
        }

        // keeps focus on select box to facilate typing a new query
        this.blur();
        wait(100).then(() => this.focus());
    }

    openExternal(val) {
        const path = val.replace('launch.examples.', '');
        window.open(`/${path}`);
    }

    focus() {
        this.selectRef?.current.focus();
    }

    blur() {
        this.selectRef?.current.blur();
    }
}
