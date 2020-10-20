import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {GridModel} from '@xh/hoist/cmp/grid';
import {dateTimeCol, localDateCol} from '@xh/hoist/cmp/grid/columns/DatesTimes';
import {HoistModel, LoadSupport, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {actionCol, calcActionColWidth} from '@xh/hoist/desktop/cmp/grid/columns/Actions';
import {fmtDate} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {LocalDate} from '@xh/hoist/utils/datetime';

@HoistModel
@LoadSupport
export class ActivityWidgetModel {

    /** @member {GridModel} */
    gridModel;
    /** @member {FilterChooserModel} */
    filterChooserModel;

    @bindable groupBy = 'committedDay';

    constructor() {
        const openUrlAction = {
            text: 'Open on Github',
            tooltip: 'Open on Github',
            icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
            displayFn: ({record}) => ({disabled: !record?.data?.url}),
            actionFn: ({record}) => window.open(record.data.url)
        };

        this.gridModel = new GridModel({
            colChooserModel: true,
            sortBy: 'committedDate|desc',
            contextMenu: [
                openUrlAction,
                '-',
                ...GridModel.defaultContextMenu
            ],
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
                    renderer: v => {
                        return `<span class="tb-activity-repo tb-activity-repo--${v}">${v}</span>`;
                    }
                },
                {
                    field: 'messageHeadline',
                    flex: 1,
                    minWidth: 200
                },
                {
                    field: 'authorName',
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
                        return `
                            <div class="tb-activity-deltas">
                                <div class="tb-activity-deltas--additions">+${additions}</div>
                                <div class="tb-activity-deltas--sep">|</div>
                                <div class="tb-activity-deltas--deletions">-${deletions}</div>
                            </div>
                        `;
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
            rowClassFn: (rec) => rec?.data?.isRelease ? 'tb-activity--release' : '',
            showGroupRowCounts: false,
            groupSortFn: (a, b) => {
                return a == b ? 0 :
                    this.groupBy == 'committedDay' ? (a < b ? 1 : -1) : (a < b ? -1 : 1);
            },
            groupRowRenderer: (params) => {
                const {value} = params;

                if (this.groupBy == 'committedDay') {
                    const ld = LocalDate.get(value);
                    if (ld == LocalDate.today()) return 'Today';
                    if (ld == LocalDate.yesterday()) return 'Yesterday';
                    return ld ? fmtDate(ld, 'dddd, DD-MMM') : '???';
                } else {
                    return value;
                }
            }
        });

        this.filterChooserModel = new FilterChooserModel({
            sourceStore: this.gridModel.store,
            targetStore: this.gridModel.store,
            fieldSpecs: [
                'repo', 'authorName', 'authorEmail', 'committedDay', 'changedFiles', 'isRelease'
            ]
        });

        this.addReaction({
            track: () => this.groupBy,
            run: (groupBy) => this.gridModel.setGroupBy(groupBy),
            fireImmediately: true
        });

        this.addReaction({
            track: () => XH.gitHubService.allCommits,
            run: () => this.loadAsync()
        });
    }

    async doLoadAsync() {
        this.gridModel.loadData(XH.gitHubService.allCommits);
    }

    onRowDoubleClicked = (params) => {
        const rec = params.data;
        if (rec?.isRecord) window.open(rec.data.url);
    };

}
