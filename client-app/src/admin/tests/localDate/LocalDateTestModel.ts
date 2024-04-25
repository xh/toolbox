import {HoistModel} from '@xh/hoist/core';
import {computed, observable, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import moment from 'moment';

export class LocalDateTestModel extends HoistModel {
    @computed
    get testResults() {
        return this.tests.map(test => {
            const {category, title, input, expected, notes} = test,
                output = test.testFn().toString(),
                result = expected == output;

            return {
                category,
                title,
                input,
                expected,
                output,
                result,
                notes
            };
        });
    }

    @observable.ref tests = [
        //----------------
        // Constructor
        //----------------
        {
            category: 'factory',
            title: 'Create from string',
            input: 'String "20190101"',
            expected: '2019-01-01',
            testFn: () => {
                const ret = LocalDate.get('20190101');
                return ret.valueOf();
            }
        },
        {
            category: 'factory',
            title: 'Create from date',
            input: 'new Date(2019, 0, 1)',
            expected: '2019-01-01',
            testFn: () => {
                const d = new Date(2019, 0, 1),
                    ret = LocalDate.from(d);
                return ret.valueOf();
            }
        },
        {
            category: 'factory',
            title: 'Create from moment',
            input: 'moment("20190101")',
            expected: '2019-01-01',
            testFn: () => {
                const d = moment('20190101'),
                    ret = LocalDate.from(d);
                return ret.valueOf();
            }
        },
        {
            category: 'factory',
            title: 'Create from LocalDate',
            input: 'LocalDate.get("20190101")',
            expected: '2019-01-01',
            testFn: () => {
                const d = LocalDate.get('20190101'),
                    ret = LocalDate.from(d);
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'Create using LocalDate.today()',
            input: 'LocalDate.today()',
            expected: moment().format('YYYY-MM-DD'),
            testFn: () => {
                const d = LocalDate.today();
                return d.valueOf();
            }
        },

        //----------------
        // Output
        //----------------
        {
            category: 'output',
            title: 'LocalDate.format("YYYY-MM-DD")',
            input: '20190101',
            expected: '2019-01-01',
            testFn: () => {
                const d = LocalDate.get('20190101');
                return d.format('YYYY-MM-DD');
            }
        },
        {
            category: 'output',
            title: 'LocalDate.dayOfWeek()',
            input: '20190101',
            expected: 'Tuesday',
            testFn: () => {
                const d = LocalDate.get('20190101');
                return d.dayOfWeek();
            }
        },

        //----------------
        // Manipulate
        //----------------
        {
            category: 'manipulate',
            title: 'LocalDate.add(1)',
            input: '20190101',
            expected: '2019-01-02',
            testFn: () => {
                const d = LocalDate.get('20190101'),
                    ret = d.add(1);
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.add(1, "month")',
            input: '20190101',
            expected: '2019-02-01',
            testFn: () => {
                const d = LocalDate.get('20190101'),
                    ret = d.add(1, 'month');
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.subtract(1)',
            input: '20190101',
            expected: '2018-12-31',
            testFn: () => {
                const d = LocalDate.get('20190101'),
                    ret = d.subtract(1);
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.subtract(1, "month")',
            input: '20190101',
            expected: '2018-12-01',
            testFn: () => {
                const d = LocalDate.get('20190101'),
                    ret = d.subtract(1, 'month');
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.startOf(1, "year")',
            input: '20190606',
            expected: '2019-01-01',
            testFn: () => {
                const d = LocalDate.get('20190606'),
                    ret = d.startOf('year');
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.startOf(1, "month")',
            input: '20190606',
            expected: '2019-06-01',
            testFn: () => {
                const d = LocalDate.get('20190606'),
                    ret = d.startOf('month');
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.endOf(1, "year")',
            input: '20190606',
            expected: '2019-12-31',
            testFn: () => {
                const d = LocalDate.get('20190606'),
                    ret = d.endOf('year');
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.endOf(1, "month")',
            input: '20190606',
            expected: '2019-06-30',
            testFn: () => {
                const d = LocalDate.get('20190606'),
                    ret = d.endOf('month');
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.nextWeekday() - Thurs',
            input: '20190808',
            expected: '2019-08-09',
            testFn: () => {
                const d = LocalDate.get('20190808'),
                    ret = d.nextWeekday();
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.nextWeekday() - Fri',
            input: '20190809',
            expected: '2019-08-12',
            testFn: () => {
                const d = LocalDate.get('20190809'),
                    ret = d.nextWeekday();
                return ret.valueOf();
            },
            notes: 'nextWeekday() ignores weekends'
        },
        {
            category: 'manipulate',
            title: 'LocalDate.previousWeekday() - Tues',
            input: '20190813',
            expected: '2019-08-12',
            testFn: () => {
                const d = LocalDate.get('20190813'),
                    ret = d.previousWeekday();
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.previousWeekday() - Mon',
            input: '20190812',
            expected: '2019-08-09',
            testFn: () => {
                const d = LocalDate.get('20190812'),
                    ret = d.previousWeekday();
                return ret.valueOf();
            },
            notes: 'previousWeekday() ignores weekends'
        },

        //----------------
        // Compare
        //----------------
        {
            category: 'compare',
            title: 'LocalDate == LocalDate',
            input: '(20190101) == (20190101)',
            expected: 'true',
            testFn: () => {
                const d = LocalDate.get('20190101'),
                    other = LocalDate.get('20190101');
                return d == other;
            }
        },
        {
            category: 'compare',
            title: 'LocalDate === LocalDate',
            input: '(20190101) === (20190101)',
            expected: 'true',
            testFn: () => {
                const d = LocalDate.get('20190101'),
                    other = LocalDate.get('20190101');
                return d === other;
            }
        },
        {
            category: 'compare',
            title: 'LocalDate < LocalDate',
            input: '(20190601) < (20190101)',
            expected: 'false',
            testFn: () => {
                const d = LocalDate.get('20190601'),
                    other = LocalDate.get('20190101');
                return d < other;
            }
        },
        {
            category: 'compare',
            title: 'LocalDate > LocalDate',
            input: '(20190601) > (20190101)',
            expected: 'true',
            testFn: () => {
                const d = LocalDate.get('20190601'),
                    other = LocalDate.get('20190101');
                return d > other;
            }
        }
    ];

    constructor() {
        super();
        makeObservable(this);
    }
}
