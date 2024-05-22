import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {GridModel} from '@xh/hoist/cmp/grid';
import {span, div, vbox, p, code} from '@xh/hoist/cmp/layout';
import {dateTimeCol, localDateCol} from '@xh/hoist/cmp/grid/columns/DatesTimes';
import {managed, HoistModel, XH} from '@xh/hoist/core';
import {actionCol, calcActionColWidth} from '@xh/hoist/desktop/cmp/grid/columns/Actions';
import {fmtDate} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {head} from 'lodash';

export class ActivityWidgetModel extends HoistModel {
    @managed
    gridModel: GridModel;

    @managed
    filterChooserModel: FilterChooserModel;

    get groupBy() {
        return head(this.gridModel.groupBy);
    }

    constructor() {
        super();

        const openUrlAction = {
            text: 'Open on Github',
            tooltip: 'Open on Github',
            icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
            displayFn: ({record}) => ({disabled: !record?.data?.url}),
            actionFn: ({record}) => window.open(record.data.url)
        };

        this.gridModel = new GridModel({
            emptyText: vbox([
                p('No commits found...'),
                p(['Have you properly configured the ', code('gitHubAccessToken'), ' config?'])
            ]),
            colChooserModel: true,
            sortBy: 'committedDate|desc',
            groupBy: 'committedDay',
            contextMenu: [openUrlAction, '-', ...GridModel.defaultContextMenu],
            store: {
                fields: [
                    {name: 'repo', type: 'string'},
                    {name: 'abbreviatedOid', displayName: 'Hash', type: 'string'},
                    {name: 'messageHeadline', displayName: 'Subject', type: 'string'},
                    {name: 'authorName', displayName: 'Author', type: 'string'},
                    {name: 'authorEmail', displayName: 'Author Email', type: 'string'},
                    {name: 'committedDate', displayName: 'Commit Time', type: 'date'},
                    {name: 'committedDay', displayName: 'Commit Day', type: 'localDate'},
                    {name: 'changedFiles', displayName: 'Change File Count', type: 'int'},
                    {name: 'additions', displayName: 'Lines Added', type: 'int'},
                    {name: 'deletions', displayName: 'Lines Deleted', type: 'int'},
                    {name: 'isRelease', displayName: 'Release?', type: 'bool'},
                    {name: 'url', type: 'string'}
                ]
            },
            onRowDoubleClicked: this.onRowDoubleClicked,
            columns: [
                {
                    field: 'abbreviatedOid',
                    width: 100,
                    pinned: true,
                    hidden: true
                },
                {
                    field: 'repo',
                    width: 140,
                    pinned: true,
                    align: 'right',
                    renderer: v =>
                        span({className: `tb-activity-repo tb-activity-repo--${v}`, item: v})
                },
                {
                    field: 'messageHeadline',
                    flex: 1,
                    minWidth: 200,
                    tooltip: true
                },
                {
                    field: 'authorName',
                    autosizeMaxWidth: 170,
                    width: 170
                },
                {
                    field: 'authorEmail',
                    hidden: true,
                    width: 170
                },
                {
                    colId: 'changedLines',
                    headerName: 'Δ Lines',
                    width: 120,
                    align: 'center',
                    rendererIsComplex: true,
                    renderer: (v, {record}) => {
                        const {additions, deletions} = record.data;
                        return div({
                            className: 'tb-activity-deltas',
                            items: [
                                div({
                                    className: 'tb-activity-deltas--additions',
                                    item: `+${additions}`
                                }),
                                div({className: 'tb-activity-deltas--sep', item: '|'}),
                                div({
                                    className: 'tb-activity-deltas--deletions',
                                    item: `-${deletions}`
                                })
                            ]
                        });
                    }
                },
                {
                    field: 'changedFiles',
                    headerName: Icon.file(),
                    align: 'center',
                    width: 60
                },
                {
                    ...localDateCol,
                    field: 'committedDay',
                    hidden: true
                },
                {
                    ...dateTimeCol,
                    field: 'committedDate'
                },
                {
                    ...actionCol,
                    width: calcActionColWidth(1),
                    actionsShowOnHoverOnly: true,
                    actions: [openUrlAction]
                }
            ],
            rowClassFn: rec => (rec?.data?.isRelease ? 'tb-activity--release' : null),
            showGroupRowCounts: false,
            groupSortFn: (a, b, groupBy) => {
                return a === b ? 0 : groupBy === 'committedDay' ? (a < b ? 1 : -1) : a < b ? -1 : 1;
            },
            groupRowRenderer: params => {
                const {value} = params;

                if (this.groupBy === 'committedDay') {
                    const ld = LocalDate.get(value);
                    if (ld === LocalDate.today()) return 'Today';
                    if (ld === LocalDate.yesterday()) return 'Yesterday';
                    return ld ? fmtDate(ld, 'dddd, DD-MMM') : '???';
                } else {
                    return value;
                }
            }
        });

        this.filterChooserModel = new FilterChooserModel({
            bind: this.gridModel.store,
            fieldSpecs: [
                'repo',
                'authorName',
                'authorEmail',
                'committedDay',
                'changedFiles',
                'isRelease',
                {
                    field: 'messageHeadline',
                    enableValues: false
                }
            ]
        });

        this.addReaction({
            track: () => XH.gitHubService.allCommits,
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync() {
        this.gridModel.loadData(XH.gitHubService.allCommits);
    }

    private onRowDoubleClicked = params => {
        const rec = params.data;
        if (rec?.isRecord) window.open(rec.data.url);
    };

    private setGroupBy(groupBy) {
        this.gridModel.setGroupBy(groupBy);
    }
}
