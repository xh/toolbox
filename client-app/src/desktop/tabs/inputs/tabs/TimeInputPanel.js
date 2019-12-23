import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {TimeInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {hoistCmp} from '@xh/hoist/core';
import {inputTestPanel} from '../InputTestPanel';

export const TimeInputPanel = hoistCmp({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        description:
            [
            ],
        componentName: 'TimeInput',
        props: {
            /** Initial time the TimePicker will display. This should not be set if value is set. */
            defaultValue: {value: null, type: T.Date},

            /**
             * The latest time the user can select. The year, month, and day parts of the Date object
             * are ignored. While the maxTime will be later than the minTime in the basic case, it is
             * also allowed to be earlier than the minTime. This is useful, for example, to express a
             * time range that extends before and after midnight. If the maxTime and minTime are equal,
             * then the valid time range is constrained to only that one value.
             */
            maxTime: {value: null, type: T.Date},

            /**
             * The earliest time the user can select. The year, month, and day parts of the Date object
             * are ignored. While the minTime will be earlier than the maxTime in the basic case, it
             * is also allowed to be later than the maxTime. This is useful, for example, to express
             * a time range that extends before and after midnight. If the maxTime and minTime are
             * equal, then the valid time range is constrained to only that one value.
             */
            mintime: {value: null, type: T.Date},

            /** Whether all the text in each input should be selected on focus. */
            selectOnFocus: {value: false, type: T.Boolean},

            /** Whether to show arrows buttons for changing the time. */
            showArrowButtons: {value: false, type: T.Boolean},

            precision: {
                value: 'precisions.MINUTE',
                type: T.Enum,
                enumName: 'precisions',
                options: precisions
            }
        },
        scope: {
            TimeInput,
            Icon,
            precisions
        }
    });
}

const precisions = {
    MILLISECOND: 'MILLISECOND',
    MINUTE: 'MINUTE',
    SECOND: 'SECOND'
};