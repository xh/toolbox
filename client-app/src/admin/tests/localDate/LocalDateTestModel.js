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
            category: 'constructor',
            title: 'Create from string',
            input: 'String "20190101"',
            expected: '20190101',
            testFn: () => {
                const ret = new LocalDate('20190101');
                return ret.value;
            }
        },
        {
            category: 'constructor',
            title: 'Create from date',
            input: 'new Date(2019, 0, 1)',
            expected: '20190101',
            testFn: () => {
                const d = new Date(2019, 0, 1),
                    ret = new LocalDate(d);
                return ret.value;
            }
        },
        {
            category: 'constructor',
            title: 'Create from moment',
            input: 'moment("20190101")',
            expected: '20190101',
            testFn: () => {
                const d = moment('20190101'),
                    ret = new LocalDate(d);
                return ret.value;
            }
        },
        {
            category: 'constructor',
            title: 'Create from LocalDate',
            input: 'new LocalDate("20190101")',
            expected: '20190101',
            testFn: () => {
                const d = new LocalDate('20190101'),
                    ret = new LocalDate(d);
                return ret.value;
            }
        },
        {
            category: 'constructor',
            title: 'Create with no params',
            input: 'new LocalDate()',
            expected: moment().format('YYYYMMDD'),
            testFn: () => {
                const ret = new LocalDate();
                return ret.value;
            },
            notes: 'Creating with no params uses the current date.'
        },
        {
            category: 'manipulate',
            title: 'Create using LocalDate.today()',
            input: 'LocalDate.today()',
            expected: moment().format('YYYYMMDD'),
            testFn: () => {
                const d = LocalDate.today();
                return d.value;
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
                const d = new LocalDate('20190101');
                return d.format('YYYY-MM-DD');
            }
        },
        {
            category: 'output',
            title: 'LocalDate.dayOfWeek()',
            input: '20190101',
            expected: 'Tuesday',
            testFn: () => {
                const d = new LocalDate('20190101');
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
                const d = new LocalDate('20190101'),
                    ret = d.add(1);
                return ret.value;
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.add(1, "month")',
            input: '20190101',
            expected: '20190201',
            testFn: () => {
                const d = new LocalDate('20190101'),
                    ret = d.add(1, 'month');
                return ret.value;
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.add(1, "hour")',
            input: '20190101',
            expected: '20190101',
            testFn: () => {
                const d = new LocalDate('20190101'),
                    ret = d.add(1, 'hour');
                return ret.value;
            },
            notes: 'Units smaller than "day" are ignored.'
        },
        {
            category: 'manipulate',
            title: 'LocalDate.subtract(1)',
            input: '20190101',
            expected: '20181231',
            testFn: () => {
                const d = new LocalDate('20190101'),
                    ret = d.subtract(1);
                return ret.value;
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.subtract(1, "month")',
            input: '20190101',
            expected: '20181201',
            testFn: () => {
                const d = new LocalDate('20190101'),
                    ret = d.subtract(1, 'month');
                return ret.value;
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.subtract(1, "hour")',
            input: '20190101',
            expected: '20190101',
            testFn: () => {
                const d = new LocalDate('20190101'),
                    ret = d.subtract(1, 'hour');
                return ret.value;
            },
            notes: 'Units smaller than "day" are ignored.'
        },
        {
            category: 'manipulate',
            title: 'LocalDate.startOf(1, "year")',
            input: '20190606',
            expected: '20190101',
            testFn: () => {
                const d = new LocalDate('20190606'),
                    ret = d.startOf('year');
                return ret.value;
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.startOf(1, "month")',
            input: '20190606',
            expected: '20190601',
            testFn: () => {
                const d = new LocalDate('20190606'),
                    ret = d.startOf('month');
                return ret.value;
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.endOf(1, "year")',
            input: '20190606',
            expected: '20191231',
            testFn: () => {
                const d = new LocalDate('20190606'),
                    ret = d.endOf('year');
                return ret.value;
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.endOf(1, "month")',
            input: '20190606',
            expected: '20190630',
            testFn: () => {
                const d = new LocalDate('20190606'),
                    ret = d.endOf('month');
                return ret.value;
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.nextBusinessDay() - Thurs',
            input: '20190808',
            expected: '20190809',
            testFn: () => {
                const d = new LocalDate('20190808'),
                    ret = d.nextBusinessDay();
                return ret.value;
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.nextBusinessDay() - Fri',
            input: '20190809',
            expected: '20190812',
            testFn: () => {
                const d = new LocalDate('20190809'),
                    ret = d.nextBusinessDay();
                return ret.value;
            },
            notes: 'nextBusinessDay() ignores weekends'
        },
        {
            category: 'manipulate',
            title: 'LocalDate.prevBusinessDay() - Tues',
            input: '20190813',
            expected: '20190812',
            testFn: () => {
                const d = new LocalDate('20190813'),
                    ret = d.prevBusinessDay();
                return ret.value;
            }
        },
        {
            category: 'manipulate',
            title: 'LocalDate.prevBusinessDay() - Mon',
            input: '20190812',
            expected: '20190809',
            testFn: () => {
                const d = new LocalDate('20190812'),
                    ret = d.prevBusinessDay();
                return ret.value;
            },
            notes: 'prevBusinessDay() ignores weekends'
        },

        //----------------
        // Query
        //----------------
        {
            category: 'query',
            title: 'LocalDate.equals(moment)',
            input: '(20190601).equals(20190101)',
            expected: 'false',
            testFn: () => {
                const d = new LocalDate('20190601'),
                    other = moment('20190101');
                return d.equals(other);
            },
            notes: 'Can compare to moments'
        },
        {
            category: 'query',
            title: 'LocalDate.isBefore(LocalDate)',
            input: '(20190601).isBefore(20190101)',
            expected: 'false',
            testFn: () => {
                const d = new LocalDate('20190601'),
                    other = new LocalDate('20190101');
                return d.isBefore(other);
            }
        },
        {
            category: 'query',
            title: 'LocalDate.isAfter(Date)',
            input: '(20190601).isAfter(20190101)',
            expected: 'true',
            testFn: () => {
                const d = new LocalDate('20190601'),
                    other = new Date(2019, 0, 1);
                return d.isAfter(other);
            },
            notes: 'Can compare to dates'
        },
        {
            category: 'query',
            title: 'LocalDate.diff(LocalDate)',
            input: '(20190601).diff(20190101)',
            expected: '13042800000',
            testFn: () => {
                const d = new LocalDate('20190601'),
                    other = new LocalDate('20190101');
                return d.diff(other);
            }
        },
        {
            category: 'query',
            title: 'LocalDate.diff(moment)',
            input: '(20190601).diff(20190101)',
            expected: '13042800000',
            testFn: () => {
                const d = new LocalDate('20190601'),
                    other = moment('20190101');
                return d.diff(other);
            },
            notes: 'Can compare to moments'
        },
        {
            category: 'query',
            title: 'LocalDate.diff(Date)',
            input: '(20190601).diff(20190101)',
            expected: '13042800000',
            testFn: () => {
                const d = new LocalDate('20190601'),
                    other = new Date(2019, 0, 1);
                return d.diff(other);
            },
            notes: 'Can compare to dates'
        }
    ];

}