import {createRef} from 'react';

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
      const {rootNode} = XH.routerModel.router,
          groupedRoutes = this.getRoutesAsGroupedOptions(rootNode),
          unNested = groupedRoutes[0].options[0].options;

      return unNested;
  }

  forwardToTopic(val) {
      if (val) XH.navigate(val);
      this.blur();
      wait(100).then(() => this.focus());
  }

  getRoutesAsGroupedOptions(node, value = '') {
      const option = {
              label: node.name,
              value: value + node.name
          },
          ret = [];

      if (node.children?.length) {
          option.options = [];
      }

      node.children.forEach(child => {
          const value = option.value ? option.value + '.' : '';
          this.getRoutesAsGroupedOptions(child, value)
              .forEach(it => {
                  option.options.push(it);
              });
      });

      ret.push(option);
      return ret;
  }

  focus() {
    this.selectRef.current?.reactSelectRef?.current?.focus();
  }

  blur() {
    this.selectRef.current?.reactSelectRef?.current?.blur();
  }

}
