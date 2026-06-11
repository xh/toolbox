import {hoistCmp} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';

/**
 * Compact multi-select for filtering the GitHub feed widgets by repo. Expects to resolve a host
 * model with a bindable `selectedRepos: string[]` and a `repoOptions: string[]` getter - shared
 * by the Releases and Commits widgets. No selection means "all repos".
 */
export const repoFilterSelect = hoistCmp.factory({
    displayName: 'RepoFilterSelect',
    render({model}) {
        return select({
            bind: 'selectedRepos',
            options: (model as any).repoOptions,
            enableMulti: true,
            enableClear: true,
            placeholder: 'All repos',
            width: 220
        });
    }
});
