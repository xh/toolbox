import {GridModel} from '@xh/hoist/cmp/grid';
import {span, div, vbox, p} from '@xh/hoist/cmp/layout';
import {dateTimeCol, localDateCol} from '@xh/hoist/cmp/grid/columns/DatesTimes';
import {lookup, managed, HoistModel, XH} from '@xh/hoist/core';
import {DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {actionCol, calcActionColWidth} from '@xh/hoist/desktop/cmp/grid/columns/Actions';
import {fmtDate} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {head, uniq} from 'lodash';
import {Commit} from '../../../../../core/svc/GitHubService';
import {RepoFilterModel} from '../RepoFilterPicker';

export class ActivityWidgetModel extends HoistModel implements RepoFilterModel {
    @lookup(DashViewModel)
    private dashViewModel: DashViewModel;

    /** Repos to filter to - empty means show all. */
    @bindable.ref selectedRepos: string[] = [];

    @managed
    gridModel: GridModel;

    get groupBy() {
        return head(this.gridModel.groupBy);
    }

    /** Commits to display, filtered by any repo selection. */
    get commits(): Commit[] {
        const {selectedRepos} = this,
            all = XH.gitHubService.allCommits;
        return selectedRepos.length ? all.filter(it => selectedRepos.includes(it.repo)) : all;
    }

    get repoOptions(): string[] {
        return uniq(XH.gitHubService.allCommits.map(it => it.repo)).sort();
    }

    get commitCount(): number {
        return this.commits.length;
    }

    get monthCommitCount(): number {
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return this.commits.filter(it => it.committedDate.getTime() > cutoff).length;
    }

    constructor() {
        super();
        makeObservable(this);

        const openUrlAction = {
            text: 'Open on Github',
            tooltip: 'Open on Github',
            icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
            displayFn: ({record}) => ({disabled: !record?.data?.url}),
            actionFn: ({record}) => XH.openWindow(record.data.url, 'gitlink')
        };

        this.gridModel = new GridModel({
            emptyText: vbox([
                p('No commits found...'),
                p('Have you properly configured the gitHubAccessToken config?')
            ]),
            colChooserModel: true,
            filterModel: true,
            expandLevel: 1,
            sortBy: 'committedDate|desc',
            groupBy: 'committedDay',
            contextMenu: [openUrlAction, '-', ...GridModel.defaults.contextMenu],
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
                    filterable: true,
                    width: 140,
                    pinned: true,
                    align: 'right',
                    renderer: v =>
                        span({className: `tb-activity-repo tb-activity-repo--${v}`, item: v})
                },
                {
                    field: 'messageHeadline',
                    filterable: true,
                    flex: 1,
                    minWidth: 200,
                    tooltip: true
                },
                {
                    field: 'authorName',
                    filterable: true,
                    autosizeMaxWidth: 170,
                    width: 170
                },
                {
                    field: 'authorEmail',
                    filterable: true,
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
                    filterable: true,
                    headerName: Icon.file(),
                    hidden: true,
                    align: 'center',
                    width: 60
                },
                {
                    ...localDateCol,
                    field: 'committedDay',
                    filterable: true,
                    hidden: true
                },
                {
                    ...dateTimeCol,
                    field: 'committedDate',
                    filterable: true
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
                    const ld = value;
                    if (ld === LocalDate.today()) return 'Today';
                    if (ld === LocalDate.yesterday()) return 'Yesterday';
                    return ld ? fmtDate(ld, 'dddd, DD-MMM') : '???';
                } else {
                    return value;
                }
            }
        });

        this.addReaction({
            track: () => this.commits,
            run: () => this.loadAsync()
        });
    }

    override onLinked() {
        // Float a live summary of overall commit activity up into the hosting view's title via
        // DashViewModel.titleDetails - leading middot reads as a segment after the title.
        // Note we deliberately avoid an "all-time" total here - loaded history can be capped
        // via the gitHubMaxPagesPerLoad config, so only the recent window is reliably complete.
        this.addReaction({
            track: () => this.commitCount,
            run: () => {
                const {dashViewModel, commitCount, monthCommitCount} = this;
                if (dashViewModel && commitCount) {
                    dashViewModel.titleDetails = `· ${monthCommitCount.toLocaleString()} in the last 30 days`;
                }
            },
            fireImmediately: true
        });
    }

    override async doLoadAsync() {
        this.gridModel.loadData(this.commits);
    }

    private onRowDoubleClicked = params => {
        const rec = params.data;
        if (rec?.isRecord) XH.openWindow(rec.data.url, 'gitlink');
    };

    private setGroupBy(groupBy) {
        this.gridModel.setGroupBy(groupBy);
    }
}
