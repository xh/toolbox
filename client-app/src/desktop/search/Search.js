import {createRef} from 'react';
import {createFilter} from 'react-select';
import {XH, HoistModel, hoistCmp, creates} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';
import {bindable} from '@xh/hoist/mobx';
import {getLayoutProps} from '@xh/hoist/utils/react';
import {useHotkeys} from '@xh/hoist/desktop/hooks';
import {Icon} from '@xh/hoist/icon';
import {wait} from '@xh/hoist/promise';

export const search = hoistCmp.factory({
    model: creates(() => new Model()),
    render({model, ...props}) {
        const {globalSearchOptions, selectRef} = model;

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
                filterFn: createFilter,
                onChange: (val) => model.forwardToTopic(val)
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

@HoistModel
class Model {
  
  @bindable
  globalSearchSelection;

  selectRef = createRef();

  get globalSearchOptions() {
      return XH.getConf('searchOptions');
  }

  get selectElem() {
      return this.selectRef.current?.reactSelectRef?.current;
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
    this.selectElem?.focus();
  }

  blur() {
    this.selectElem?.blur();
  }

}
