import {hbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';

/**
 * One version select per documentation source (Hoist React, Hoist Core), listing the versions the
 * Hoist Docs service holds. Switching reloads that source's docs. Hidden while each source has a
 * single version.
 */
export const docVersionPicker = hoistCmp.factory({
    displayName: 'DocVersionPicker',

    render() {
        const {docService} = XH,
            sources = docService.sourceNames.filter(
                s => docService.sourceInfo[s]?.versions?.length > 1
            );
        if (!sources.length) return null;

        return hbox({
            gap: 6,
            items: sources.map(source => {
                const info = docService.sourceInfo[source];
                return select({
                    key: source,
                    width: 200,
                    enableFilter: false,
                    value: info.version,
                    options: info.versions.map(v => ({value: v, label: `${info.label} ${v}`})),
                    onChange: v => docService.setVersionAsync(source, v)
                });
            })
        });
    }
});
