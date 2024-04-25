import {random, reduce, sample, times, isEmpty} from 'lodash';
import {PlainObject} from '@xh/hoist/core';
import {logDebug} from '@xh/hoist/utils/js';

export class GridTestData {
    rows: PlainObject[] = [];
    summary: {day: number; id: string; mtd: number; ytd: number; volume: number} = null;
    data: any;

    clear() {
        this.rows = [];
        this.summary = null;
    }

    get isEmpty() {
        return isEmpty(this.rows);
    }

    generate({recordCount, idSeed, tree, numericId, showSummary, loadRootAsSummary}) {
        this.rows = [];
        let count = 0;

        while (count < recordCount) {
            let symbol = 'Symbol ' + count,
                trader = 'Trader ' + (count % (recordCount / 10));

            count++;
            const pos: PlainObject = {
                id: numericId ? count : `${idSeed}~${symbol}`,
                trader,
                symbol,
                day: random(-80000, 100000),
                mtd: random(-500000, 500000),
                ytd: random(-1000000, 2000000),
                volume: random(1000, 2000000)
            };

            if (tree) {
                const createChildrenFn = (parent, maxCount: number) => {
                    const childCount = random(0, maxCount),
                        maxT = childCount - 1;
                    let dayRem = parent.day,
                        mtdRem = parent.mtd,
                        ytdRem = parent.ytd,
                        volRem = parent.volume;

                    return times(childCount, t => {
                        trader = 'Trader ' + t;
                        count++;
                        const child: PlainObject = {
                            id: numericId ? count : `${parent.id}~${trader}`,
                            trader,
                            symbol,
                            day:
                                t < maxT
                                    ? random(Math.min(0, dayRem), Math.max(0, dayRem))
                                    : dayRem,
                            mtd:
                                t < maxT
                                    ? random(Math.min(0, mtdRem), Math.max(0, mtdRem))
                                    : mtdRem,
                            ytd:
                                t < maxT
                                    ? random(Math.min(0, ytdRem), Math.max(0, ytdRem))
                                    : ytdRem,
                            volume: t < maxT ? random(0, volRem) : volRem
                        };
                        dayRem -= child.day;
                        mtdRem -= child.mtd;
                        ytdRem -= child.ytd;
                        volRem -= child.volume;

                        const childCount = Math.floor(maxCount / 2);
                        if (childCount > 0) {
                            child.children = createChildrenFn(child, childCount);
                        }

                        return child;
                    });
                };
                pos.children = createChildrenFn(pos, 10);
            }

            this.rows.push(pos);
        }

        if (showSummary) {
            const summaryData = reduce(
                this.rows,
                (sum, val) => {
                    sum.day += val.day;
                    sum.mtd += val.mtd;
                    sum.ytd += val.ytd;
                    sum.volume += val.volume;
                    return sum;
                },
                {id: `${idSeed}~summaryRow`, day: 0, mtd: 0, ytd: 0, volume: 0}
            );
            if (tree && loadRootAsSummary) {
                this.data = [summaryData];
                this.summary = null;
            } else {
                this.summary = summaryData;
            }
        } else {
            this.summary = null;
        }

        logDebug(`Generated ${count} test records.`, this);
    }

    generateUpdates(count: number) {
        const ret = [];
        times(count, () => {
            const pos = sample(this.rows);
            ret.push({
                ...pos,
                day: random(-80000, 100000),
                volume: random(1000, 1200000)
            });
        });
        return ret;
    }

    applyUpdates(count: number) {
        times(count, () => {
            const pos = sample(this.rows);
            pos.day = random(-80000, 100000);
            pos.volume = random(1000, 1200000);
        });
    }
}
