import {hoistCmp} from '@xh/hoist/core';
import {picker} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';

/**
 * Compact multi-select `Picker` for filtering the GitHub feed widgets by repo. Expects to resolve
 * a host model with a bindable `selectedRepos: string[]` and a `repoOptions: string[]` getter -
 * shared by the Releases and Commits widgets. No selection means "all repos".
 */
export const repoFilterPicker = hoistCmp.factory({
    displayName: 'RepoFilterPicker',
    render({model}) {
        return picker({
            bind: 'selectedRepos',
            options: (model as any).repoOptions,
            enableMulti: true,
            enableClear: true,
            enableSelectAll: true,
            displayNoun: 'repo',
            placeholder: 'All repos',
            buttonProps: {icon: Icon.icon({iconName: 'github', prefix: 'fab'})},
            width: 180
        });
    }
});
