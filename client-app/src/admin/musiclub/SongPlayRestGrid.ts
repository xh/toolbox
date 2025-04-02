import {AppModel} from '@xh/hoist/admin/AppModel';
import {ColumnRenderer} from '@xh/hoist/cmp/grid';
import {creates, hoistCmp, HoistModel, LoadSpec, managed, PlainObject, XH} from '@xh/hoist/core';
import {RecordActionSpec} from '@xh/hoist/data';
import {textArea} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {
    addAction,
    deleteAction,
    editAction,
    restGrid,
    RestGridModel,
    viewAction
} from '@xh/hoist/desktop/cmp/rest';
import {RestField} from '@xh/hoist/desktop/cmp/rest/data/RestField';
import {Icon} from '@xh/hoist/icon';
import {MINUTES} from '@xh/hoist/utils/datetime';

export const songPlayRestGrid = hoistCmp.factory({
    model: creates(() => SongPlayRestGridModel),
    render() {
        return panel({
            item: restGrid(),
            mask: 'onLoad'
        });
    }
});

class SongPlayRestGridModel extends HoistModel {
    @managed gridModel: RestGridModel;

    constructor() {
        super();
        this.gridModel = new RestGridModel({
            readonly: AppModel.readonly,
            enableExport: true,
            selModel: 'multiple',
            store: {
                url: 'rest/musiclubSongPlay',
                reloadLookupsOnLoad: true,
                fields: [
                    {name: 'slug', type: 'string', required: true},
                    {name: 'meeting', lookupName: 'meetings', type: 'number'},
                    {name: 'member', type: 'string'},
                    {name: 'title', type: 'string'},
                    {name: 'artist', displayName: 'Artist (orig)', type: 'string'},
                    {
                        name: 'artistMbId',
                        displayName: 'Artist (MB)',
                        lookupName: 'artists',
                        type: 'string'
                    },
                    {name: 'album', type: 'string'},
                    {name: 'bonus', type: 'bool', defaultValue: false},
                    {name: 'notes', type: 'string'}
                ]
            },
            unit: 'play',
            sortBy: 'slug',
            columns: [
                {field: 'slug', align: 'right', width: 80},
                {field: 'meeting', renderer: lookupRenderer},
                {field: 'member'},
                {field: 'title', autosizeMaxWidth: 350},
                {field: 'artist', autosizeMaxWidth: 350},
                {
                    field: 'artistMbId',
                    autosizeMaxWidth: 350,
                    renderer: lookupRenderer
                },
                {field: 'album', autosizeMaxWidth: 350},
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
                {field: 'artistMbId'},
                {field: 'album'},
                {field: 'bonus'},
                {field: 'notes', formField: {item: textArea({height: 150})}}
            ],
            emptyText: 'No plays found...',
            toolbarActions: [addAction, editAction, deleteAction, this.enhanceArtistAction],
            menuActions: [
                addAction,
                editAction,
                viewAction,
                deleteAction,
                '-',
                this.enhanceArtistAction
            ]
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        await this.gridModel.loadAsync(loadSpec);
    }

    enhanceArtistAction: RecordActionSpec = {
        icon: Icon.magic(),
        text: 'Enhance Artist',
        disabled: AppModel.readonly,
        recordsRequired: true,
        actionFn: ({selectedRecords}) => {
            this.enhanceArtist(selectedRecords.map(it => it.id as number));
        }
    };

    async enhanceArtist(ids: number[]) {
        try {
            const results = await XH.postJson({
                url: 'musiclubSongPlay/enhanceArtists',
                body: {ids},
                timeout: 5 * MINUTES
            }).linkTo({
                observer: this.loadModel,
                message: 'Enhancing artist...'
            });

            console.log(results);
            await this.refreshAsync();
        } catch (e) {
            XH.handleException(e);
        }
    }
}

const lookupRenderer: ColumnRenderer = (v, {record, column}) => {
    const field = record.store.getField(column.field) as RestField,
        lookup = field.lookup as PlainObject[];
    return v ? (lookup.find(it => it.value === v)?.label ?? v) : v;
};
