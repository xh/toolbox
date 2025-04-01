import {AppModel} from '@xh/hoist/admin/AppModel';
import {hoistCmp} from '@xh/hoist/core';
import {textArea} from '@xh/hoist/desktop/cmp/input';
import {
    addAction,
    cloneAction,
    deleteAction,
    editAction,
    restGrid,
    RestGridConfig,
    viewAction
} from '@xh/hoist/desktop/cmp/rest';
import {Icon} from '@xh/hoist/icon';

export const songPlayRestGrid = hoistCmp.factory(() =>
    restGrid({modelConfig: {...modelSpec, readonly: AppModel.readonly}})
);

const modelSpec: RestGridConfig = {
    enableExport: true,
    store: {
        url: 'rest/musiclubSongPlay',
        reloadLookupsOnLoad: true,
        fields: [
            {name: 'slug', type: 'string', required: true},
            {name: 'meeting', lookupName: 'meetings', type: 'number'},
            {name: 'member', type: 'string'},
            {name: 'title', type: 'string'},
            {name: 'artist', type: 'string'},
            {name: 'album', type: 'string'},
            {name: 'bonus', type: 'bool', defaultValue: false},
            {name: 'notes', type: 'string'}
        ]
    },
    unit: 'play',
    sortBy: 'slug',
    columns: [
        {field: 'slug', align: 'right', width: 80},
        {field: 'meeting'},
        {field: 'member'},
        {field: 'title', autosizeMaxWidth: 200},
        {field: 'artist', autosizeMaxWidth: 200},
        {field: 'album', autosizeMaxWidth: 200},
        {
            field: 'bonus',
            align: 'center',
            renderer: v => (v ? Icon.checkCircle({intent: 'success'}) : '')
        },
        {field: 'notes', autosizeMaxWidth: 300}
    ],
    editors: [
        {field: 'slug'},
        {field: 'meeting'},
        {field: 'member'},
        {field: 'title'},
        {field: 'artist'},
        {field: 'album'},
        {field: 'bonus'},
        {field: 'notes', formField: {item: textArea({height: 150})}}
    ],
    emptyText: 'No phases found - try adding one...',
    menuActions: [addAction, editAction, viewAction, deleteAction, cloneAction],
    actionWarning: {
        del: 'Warning: Deleting this phase will also delete all projects associated with it. Continue anyway?'
    },
    prepareCloneFn: ({record, clone}) => (clone.name = `${clone.name}_CLONE`)
};
