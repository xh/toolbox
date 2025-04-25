import {AppModel} from '@xh/hoist/admin/AppModel';
import {hoistCmp} from '@xh/hoist/core';
import {
    addAction,
    deleteAction,
    editAction,
    restGrid,
    RestGridConfig,
    viewAction
} from '@xh/hoist/desktop/cmp/rest';

export const mbEntityRestGrid = hoistCmp.factory(() =>
    restGrid({modelConfig: {...modelSpec, readonly: AppModel.readonly}})
);

const modelSpec: RestGridConfig = {
    enableExport: true,
    store: {
        url: 'rest/musiclubEntity',
        fields: [
            {name: 'type', type: 'string', required: true},
            {name: 'name', type: 'string'},
            {name: 'mbId', type: 'string', displayName: 'MusicBrainz ID'},
            {name: 'mbJson', type: 'json', displayName: 'MusicBrainz Data'}
        ]
    },
    unit: 'entity',
    sortBy: ['type', 'name'],
    columns: [
        {field: 'type'},
        {field: 'name', autosizeMaxWidth: 500},
        {field: 'mbId'},
        {field: 'mbJson', autosizable: false, width: 300}
    ],
    editors: [{field: 'type'}, {field: 'name'}, {field: 'mbId'}, {field: 'mbJson'}],
    emptyText: 'No entities found...',
    menuActions: [addAction, editAction, viewAction, deleteAction],
    actionWarning: {
        del: 'Deleting this entity might break references to it from plays. Continue anyway?'
    }
};
