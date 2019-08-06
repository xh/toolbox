import {HoistModel} from '@xh/hoist/core';
import {computed, observable} from '@xh/hoist/mobx';
import {CalendarDate} from '@xh/hoist/utils/datetime';
import moment from 'moment';

@HoistModel
export class CalendarDateTestModel {

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
                const ret = new CalendarDate('20190101');
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
                    ret = new CalendarDate(d);
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
                    ret = new CalendarDate(d);
                return ret.value;
            }
        },
        {
            category: 'constructor',
            title: 'Create from CalendarDate',
            input: 'new CalendarDate("20190101")',
            expected: '20190101',
            testFn: () => {
                const d = new CalendarDate('20190101'),
                    ret = new CalendarDate(d);
                return ret.value;
            }
        },
        {
            category: 'constructor',
            title: 'Create with no params',
            input: 'new CalendarDate()',
            expected: moment().format('YYYYMMDD'),
            testFn: () => {
                const ret = new CalendarDate();
                return ret.value;
            },
            notes: 'Creating with no params uses the current date.'
        },

        //----------------
        // Manipulate
        //----------------
        {
            category: 'manipulate',
            title: 'CalendarDate.today()',
            input: '20190101, today()',
            expected: moment().format('YYYYMMDD'),
            testFn: () => {
                const d = new CalendarDate('20190101');
                d.today();
                return d.value;
            }
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.set("year", 2000)',
            input: '20190101',
            expected: '20000101',
            testFn: () => {
                const d = new CalendarDate('20190101');
                d.set('year', 2000);
                return d.value;
            }
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.set("month", 5)',
            input: '20190101',
            expected: '20190601',
            testFn: () => {
                const d = new CalendarDate('20190101');
                d.set('month', 5);
                return d.value;
            }
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.set("date", 13)',
            input: '20190101',
            expected: '20190113',
            testFn: () => {
                const d = new CalendarDate('20190101');
                d.set('date', 13);
                return d.value;
            }
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.add(1)',
            input: '20190101',
            expected: '20190102',
            testFn: () => {
                const d = new CalendarDate('20190101');
                d.add(1);
                return d.value;
            }
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.add(1, "month")',
            input: '20190101',
            expected: '20190201',
            testFn: () => {
                const d = new CalendarDate('20190101');
                d.add(1, 'month');
                return d.value;
            }
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.add(1, "hour")',
            input: '20190101',
            expected: '20190101',
            testFn: () => {
                const d = new CalendarDate('20190101');
                d.add(1, 'hour');
                return d.value;
            },
            notes: 'Units smaller than "day" are ignored.'
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.subtract(1)',
            input: '20190101',
            expected: '20181231',
            testFn: () => {
                const d = new CalendarDate('20190101');
                d.subtract(1);
                return d.value;
            }
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.subtract(1, "month")',
            input: '20190101',
            expected: '20181201',
            testFn: () => {
                const d = new CalendarDate('20190101');
                d.subtract(1, 'month');
                return d.value;
            }
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.subtract(1, "hour")',
            input: '20190101',
            expected: '20190101',
            testFn: () => {
                const d = new CalendarDate('20190101');
                d.subtract(1, 'hour');
                return d.value;
            },
            notes: 'Units smaller than "day" are ignored.'
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.startOf(1, "year")',
            input: '20190606',
            expected: '20190101',
            testFn: () => {
                const d = new CalendarDate('20190606');
                d.startOf('year');
                return d.value;
            }
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.startOf(1, "month")',
            input: '20190606',
            expected: '20190601',
            testFn: () => {
                const d = new CalendarDate('20190606');
                d.startOf('month');
                return d.value;
            }
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.endOf(1, "year")',
            input: '20190606',
            expected: '20191231',
            testFn: () => {
                const d = new CalendarDate('20190606');
                d.endOf('year');
                return d.value;
            }
        },
        {
            category: 'manipulate',
            title: 'CalendarDate.endOf(1, "month")',
            input: '20190606',
            expected: '20190630',
            testFn: () => {
                const d = new CalendarDate('20190606');
                d.endOf('month');
                return d.value;
            }
        },

        //----------------
        // Query
        //----------------
        {
            category: 'query',
            title: 'CalendarDate.get("year")',
            input: '20190101',
            expected: '2019',
            testFn: () => {
                const d = new CalendarDate('20190101');
                return d.get('year');
            }
        },
        {
            category: 'query',
            title: 'CalendarDate.get("month")',
            input: '20190101',
            expected: '0',
            testFn: () => {
                const d = new CalendarDate('20190101');
                return d.get('month');
            }
        },
        {
            category: 'query',
            title: 'CalendarDate.get("date")',
            input: '20190101',
            expected: '1',
            testFn: () => {
                const d = new CalendarDate('20190101');
                return d.get('date');
            }
        },
        {
            category: 'query',
            title: 'CalendarDate.get("hour")',
            input: '20190101',
            expected: '0',
            testFn: () => {
                const d = new CalendarDate('20190101');
                return d.get('hour');
            }
        },
        {
            category: 'query',
            title: 'CalendarDate.diff(CalendarDate)',
            input: '(20190601).diff(20190101)',
            expected: '13042800000',
            testFn: () => {
                const d = new CalendarDate('20190601'),
                    other = new CalendarDate('20190101');
                return d.diff(other);
            }
        },
        {
            category: 'query',
            title: 'CalendarDate.diff(moment)',
            input: '(20190601).diff(20190101)',
            expected: '13042800000',
            testFn: () => {
                const d = new CalendarDate('20190601'),
                    other = moment('20190101');
                return d.diff(other);
            },
            notes: 'Can compare to moments'
        },
        {
            category: 'query',
            title: 'CalendarDate.diff(Date)',
            input: '(20190601).diff(20190101)',
            expected: '13042800000',
            testFn: () => {
                const d = new CalendarDate('20190601'),
                    other = new Date(2019, 0, 1);
                return d.diff(other);
            },
            notes: 'Can compare to dates'
        },
        {
            category: 'query',
            title: 'CalendarDate.isBefore(CalendarDate)',
            input: '(20190601).isBefore(20190101)',
            expected: 'false',
            testFn: () => {
                const d = new CalendarDate('20190601'),
                    other = new CalendarDate('20190101');
                return d.isBefore(other);
            }
        },
        {
            category: 'query',
            title: 'CalendarDate.isSame(moment)',
            input: '(20190601).isSame(20190101)',
            expected: 'false',
            testFn: () => {
                const d = new CalendarDate('20190601'),
                    other = moment('20190101');
                return d.isSame(other);
            },
            notes: 'Can compare to moments'
        },
        {
            category: 'query',
            title: 'CalendarDate.isAfter(Date)',
            input: '(20190601).isAfter(20190101)',
            expected: 'true',
            testFn: () => {
                const d = new CalendarDate('20190601'),
                    other = new Date(2019, 0, 1);
                return d.isAfter(other);
            },
            notes: 'Can compare to dates'
        }
    ];

}