import {hoistCmp, HoistModel} from '@xh/hoist/core';
import {picker} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';

/**
 * Contract for the host model backing a {@link repoFilterPicker}, implemented by both the Releases
 * and Commits widget models. Typing the shared picker against this interface lets it resolve either
 * widget's model from context with full type safety.
 */
export interface RepoFilterModel extends HoistModel {
    /** Bindable set of selected repo names to filter on. Empty means "all repos". */
    selectedRepos: string[];
    /** Full set of repo names available to filter on. */
    readonly repoOptions: string[];
}

/**
 * Compact multi-select `Picker` for filtering the GitHub feed widgets by repo, resolving its host
 * `RepoFilterModel` from context - shared by the Releases and Commits widgets. No selection means
 * "all repos".
 */
export const repoFilterPicker = hoistCmp.factory<RepoFilterModel>({
    displayName: 'RepoFilterPicker',
    render({model}) {
        return picker({
            bind: 'selectedRepos',
            options: model.repoOptions,
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
