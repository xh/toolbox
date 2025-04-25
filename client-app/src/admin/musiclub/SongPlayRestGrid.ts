import {AppModel} from '@xh/hoist/admin/AppModel';
import {ColumnRenderer, ColumnSpec} from '@xh/hoist/cmp/grid';
import {a} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, LoadSpec, managed, PlainObject, XH} from '@xh/hoist/core';
import {RecordActionSpec, Store} from '@xh/hoist/data';
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
import {kebabCase} from 'lodash';

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

        const lookupCol: Partial<ColumnSpec> = {renderer: lookupRenderer, rendererIsComplex: true},
            mbCol: Partial<ColumnSpec> = {renderer: mbRenderer, rendererIsComplex: true};

        this.gridModel = new RestGridModel({
            readonly: AppModel.readonly,
            enableExport: true,
            selModel: 'multiple',
            store: {
                url: 'rest/musiclubSongPlay',
                reloadLookupsOnLoad: true,
                processRawData: raw => {
                    return {
                        ...raw,
                        artistMb: this.lookupVal(raw, 'artistMbId'),
                        releaseGroupMb: this.lookupVal(raw, 'releaseGroupMbId'),
                        releaseMb: this.lookupVal(raw, 'releaseMbId'),
                        recordingMb: this.lookupVal(raw, 'recordingMbId')
                    };
                },
                fields: [
                    {name: 'slug', type: 'string', required: true},
                    {name: 'meeting', lookupName: 'meetings', type: 'number'},
                    {name: 'member', type: 'string'},
                    {name: 'artist', displayName: 'Artist (orig)', type: 'string'},
                    {name: 'artistMb', displayName: 'Artist (MB)', type: 'string'},
                    {
                        name: 'artistMbId',
                        displayName: 'Artist (MB)',
                        lookupName: 'artists',
                        enableCreate: true,
                        type: 'string'
                    },
                    {name: 'album', displayName: 'Album (orig)', type: 'string'},
                    {name: 'releaseGroupMb', displayName: 'Release Group (MB)', type: 'string'},

                    {
                        name: 'releaseGroupMbId',
                        displayName: 'Release Group (MB)',
                        lookupName: 'releaseGroups',
                        type: 'string'
                    },
                    {name: 'releaseMb', displayName: 'Release (MB)', type: 'string'},
                    {
                        name: 'releaseMbId',
                        displayName: 'Release (MB)',
                        lookupName: 'releases',
                        enableCreate: true,
                        type: 'string'
                    },
                    {name: 'title', displayName: 'Title (orig)', type: 'string'},
                    {name: 'recordingMb', displayName: 'Recording (MB)', type: 'string'},
                    {
                        name: 'recordingMbId',
                        displayName: 'Title (MB)',
                        lookupName: 'recordings',
                        type: 'string'
                    },
                    {name: 'bonus', type: 'bool', defaultValue: false},
                    {name: 'notes', type: 'string'}
                ]
            },
            unit: 'play',
            sortBy: 'slug',
            filterModel: true,
            colDefaults: {autosizeMaxWidth: 350, filterable: true},
            columns: [
                {field: 'slug', align: 'right', width: 80},
                {field: 'meeting', ...lookupCol},
                {field: 'member'},
                {
                    field: 'bonus',
                    align: 'center',
                    renderer: v => (v ? Icon.checkCircle({intent: 'success'}) : '')
                },
                {field: 'artist'},
                {field: 'artistMb', ...mbCol},
                {field: 'album'},
                {field: 'releaseGroupMb', ...mbCol},
                {field: 'releaseMb', ...mbCol},
                {field: 'title'},
                {field: 'recordingMb', ...mbCol},
                {field: 'notes'}
            ],
            editors: [
                {field: 'slug'},
                {field: 'meeting'},
                {field: 'member'},
                {field: 'bonus'},
                {field: 'artist'},
                {field: 'artistMbId'},
                {field: 'album'},
                {field: 'releaseGroupMbId'},
                {field: 'releaseMbId'},
                {field: 'title'},
                {field: 'recordingMbId'},
                {field: 'notes', formField: {item: textArea({height: 150})}}
            ],
            emptyText: 'No plays found...',
            toolbarActions: [
                addAction,
                editAction,
                deleteAction,
                this.enhancePlayAction,
                this.reEnhancePlayAction
            ],
            menuActions: [
                addAction,
                editAction,
                viewAction,
                deleteAction,
                '-',
                this.enhancePlayAction,
                this.reEnhancePlayAction
            ]
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        await this.gridModel.loadAsync(loadSpec);
    }

    enhancePlayAction: RecordActionSpec = {
        icon: Icon.magic(),
        text: 'Enhance',
        disabled: AppModel.readonly,
        recordsRequired: true,
        actionFn: ({selectedRecords}) => {
            this.enhancePlays(
                selectedRecords.map(it => it.id as number),
                false
            );
        }
    };

    reEnhancePlayAction: RecordActionSpec = {
        icon: Icon.magic(),
        text: 'Enhance (replace all existing MB IDs)',
        disabled: AppModel.readonly,
        recordsRequired: true,
        actionFn: ({selectedRecords}) => {
            this.enhancePlays(
                selectedRecords.map(it => it.id as number),
                true
            );
        }
    };

    async enhancePlays(ids: number[], ignoreCurrent: boolean) {
        try {
            const results = await XH.postJson({
                url: 'musiclubSongPlay/enhancePlays',
                body: {ids, ignoreCurrent},
                timeout: 5 * MINUTES
            }).linkTo({
                observer: this.loadModel,
                message: 'Enhancing plays...'
            });

            console.log(results);
            await this.refreshAsync();
        } catch (e) {
            XH.handleException(e);
        }
    }

    lookupVal(raw: PlainObject, fName: string) {
        const field = this.gridModel.store.getField(fName) as RestField,
            lookup = field.lookup as PlainObject[],
            v = raw[fName];
        return v ? (lookup.find(it => it.value === v)?.label ?? v) : v;
    }
}

const lookupRenderer: ColumnRenderer = (v, {record, column}) => {
    return lookupVal(v, column.field, record.store);
};

const mbRenderer: ColumnRenderer = (mbName, {record, column}) => {
    if (!mbName) return null;

    const fName = column.field,
        idfName = `${fName}Id`,
        id = record.data[idfName],
        // Convert field name to musicbrainz entity type - remove trailing `Mb` and convert to kebab-case
        // eg `artistMb` to `artist`, or `releaseGroupMb` to `release-group`
        mbType = kebabCase(fName.replace(/Mb$/, '')),
        mbUrl = `https://musicbrainz.org/${mbType}/${id}`;

    return a({
        item: mbName,
        href: mbUrl,
        target: '_blank'
    });
};

const lookupVal = (v, fName: string, store: Store) => {
    const field = store.getField(fName) as RestField,
        lookup = field.lookup as PlainObject[];
    return v ? (lookup.find(it => it.value === v)?.label ?? v) : v;
};
