import {GridModel} from '@xh/hoist/cmp/grid';
import {dateTimeCol, localDateCol} from '@xh/hoist/cmp/grid/columns/DatesTimes';
import {HoistModel, XH} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins/LoadSupport';
import {actionCol, calcActionColWidth} from '@xh/hoist/desktop/cmp/grid/columns/Actions';
import {fmtDate} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';

@HoistModel
@LoadSupport
export class ActivityWidgetModel {

    gridModel;

    @bindable repos = ['hoist-react', 'hoist-core', 'toolbox']

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
            groupBy: 'committedDay',
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
                    width: 120,
                    align: 'center',
                    pinned: true,
                    cellClass: v => `tb-activity-repo--${v}`
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
                return a == b ? 0 : (a < b ? 1 : -1);
            },
            groupRowRenderer: (params) => {
                const {value} = params,
                    ld = LocalDate.get(value);
                if (ld == LocalDate.today()) return 'Today';
                if (ld == LocalDate.yesterday()) return 'Yesterday';
                return ld ? fmtDate(ld, 'dddd, DD-MMM') : '???';
            }
        });

        this.addReaction({
            track: () => this.repos,
            run: () => this.loadAsync()
        });
    }

    async doLoadAsync() {
        const commits = await XH.gitHubService.getCommitsAsync(this.repos);
        this.gridModel.loadData(commits);
    }

}
