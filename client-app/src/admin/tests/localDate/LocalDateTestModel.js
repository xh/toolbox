import {HoistModel} from '@xh/hoist/core';
import {computed, observable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import moment from 'moment';

@HoistModel
export class LocalDateTestModel {

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
            expected: '20190101',
            testFn: () => {
                const ret = LocalDate.create('20190101');
                return ret.valueOf();
            }
        },
        {
            category: 'factory',
            title: 'Create from date',
            input: 'new Date(2019, 0, 1)',
            expected: '20190101',
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
            expected: '20190101',
            testFn: () => {
                const d = moment('20190101'),
                    ret = LocalDate.from(d);
                return ret.valueOf();
            }
        },
        {
            category: 'factory',
            title: 'Create from LocalDate',
            input: 'LocalDate.create("20190101")',
            expected: '20190101',
            testFn: () => {
                const d = LocalDate.create('20190101'),
                    ret = LocalDate.from(d);
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'Create using LocalDate.today()',
            input: 'LocalDate.today()',
            expected: moment().format('YYYYMMDD'),
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
                const d = LocalDate.create('20190101');
                return d.format('YYYY-MM-DD');
            }
        },
        {
            category: 'output',
            title: 'LocalDate.dayOfWeek()',
            input: '20190101',
            expected: 'Tuesday',
            testFn: () => {
                const d = LocalDate.create('20190101');
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
            expected: '20190102',
            testFn: () => {
                const d = LocalDate.create('20190101'),
                    ret = d.add(1);
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.add(1, "month")',
            input: '20190101',
            expected: '20190201',
            testFn: () => {
                const d = LocalDate.create('20190101'),
                    ret = d.add(1, 'month');
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.subtract(1)',
            input: '20190101',
            expected: '20181231',
            testFn: () => {
                const d = LocalDate.create('20190101'),
                    ret = d.subtract(1);
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.subtract(1, "month")',
            input: '20190101',
            expected: '20181201',
            testFn: () => {
                const d = LocalDate.create('20190101'),
                    ret = d.subtract(1, 'month');
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.startOf(1, "year")',
            input: '20190606',
            expected: '20190101',
            testFn: () => {
                const d = LocalDate.create('20190606'),
                    ret = d.startOf('year');
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.startOf(1, "month")',
            input: '20190606',
            expected: '20190601',
            testFn: () => {
                const d = LocalDate.create('20190606'),
                    ret = d.startOf('month');
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.endOf(1, "year")',
            input: '20190606',
            expected: '20191231',
            testFn: () => {
                const d = LocalDate.create('20190606'),
                    ret = d.endOf('year');
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.endOf(1, "month")',
            input: '20190606',
            expected: '20190630',
            testFn: () => {
                const d = LocalDate.create('20190606'),
                    ret = d.endOf('month');
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.nextBusinessDay() - Thurs',
            input: '20190808',
            expected: '20190809',
            testFn: () => {
                const d = LocalDate.create('20190808'),
                    ret = d.nextBusinessDay();
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.nextBusinessDay() - Fri',
            input: '20190809',
            expected: '20190812',
            testFn: () => {
                const d = LocalDate.create('20190809'),
                    ret = d.nextBusinessDay();
                return ret.valueOf();
            },
            notes: 'nextBusinessDay() ignores weekends'
        },
        {
            category: 'manipulate',
            title: 'LocalDate.previousBusinessDay() - Tues',
            input: '20190813',
            expected: '20190812',
            testFn: () => {
                const d = LocalDate.create('20190813'),
                    ret = d.previousBusinessDay();
                return ret.valueOf();
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.previousBusinessDay() - Mon',
            input: '20190812',
            expected: '20190809',
            testFn: () => {
                const d = LocalDate.create('20190812'),
                    ret = d.previousBusinessDay();
                return ret.valueOf();
            },
            notes: 'previousBusinessDay() ignores weekends'
        },

        //----------------
        // Query
        //----------------
        {
            category: 'query',
            title: 'LocalDate < LocalDate)',
            input: '(20190601) < (20190101)',
            expected: 'false',
            testFn: () => {
                const d = LocalDate.create('20190601'),
                    other = LocalDate.create('20190101');
                return d < other;
            }
        }
    ];

}