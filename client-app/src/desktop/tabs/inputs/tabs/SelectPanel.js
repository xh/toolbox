import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {Select} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {hoistCmp} from '@xh/hoist/core';

import {inputTestPanel} from '../InputTestPanel';

export const SelectPanel = hoistCmp({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        componentName: 'Select',
        props: {
            autoFocus: {
                value: null,
                type: T.Boolean,
                description: 'True to focus the control on render.'
            },
            createMessageFn: {
                value: null,
                type: T.Function,
                description:
                    'Function to return a "create a new option" string prompt. Requires `allowCreate` true. \n' +
                    'Passed current query input.'
            },
            enableClear: {
                value: null,
                type: T.Boolean,
                description: 'True to show a "clear" button at the right of the control.  Defaults to false.'
            },
            enableCreate: {
                value: null,
                type: T.Boolean,
                description: 'True to accept and commit input values not present in options or returned by a query.'
            },
            enableFilter: {
                value: null,
                type: T.Boolean,
                description:
                    'True (default) to enable type-to-search keyboard input. False to disable keyboard input, ' +
                    'showing the dropdown menu on click.'
            },
            enableMulti: {
                value: null,
                type: T.Boolean,
                description: 'True to allow entry/selection of multiple values - "tag picker" style.'
            },
            hideSelectedOptionCheck: {
                value: null,
                type: T.Boolean,
                description: 'True to suppress the default check icon rendered for the currently selected option.'
            },
            labelField: {
                value: null,
                type: T.String,
                description: 'Field on provided options for sourcing each option\'s display text (default `label`).'
            },
            loadingMessageFn: {
                value: null,
                type: T.Function,
                description: 'Function to return loading message during an async query. Passed current query input.'
            },
            menuPlacement: {
                value: null,
                type: T.Enum,
                enumName: JSON.stringify(positions),
                options: positions,
                description: 'Placement of the dropdown menu relative to the input control.'
            },
            noOptionsMessageFn: {
                value: null,
                type: T.Function,
                description: 'Function to return message indicating no options loaded. Passed current query input.'
            },
            openMenuOnFocus: {
                value: null,
                type: T.Boolean,
                description: 'True to auto-open the dropdown menu on input focus.'
            },
            optionRenderer: {
                value: null,
                type: T.Function,
                description:
                    'Function to render options in the dropdown list. Called for each oTion object (which ' +
                    'will contain at minimum a value and label field, as well as any other fields present in ' +
                    'the source objects). Returns a React.node.'
            },
            options: {
                value:
                    `['No high school','Some high school','High school','Some college','Associate\\'s degree','Bachelor\\'s degree','Graduate degree']`,
                type: T.Array,
                description:
                    'Preset list of options for selection. Objects must contain a `value` property; a `label` ' +
                    'property will be used for the default display of each option. Other types will be taken ' +
                    'as their value directly and displayed via PT.string().  See also `queryFn` to  supply ' +
                    'options via an async query (i.e. from the server) instead of up-front in this prop.'
            },
            placeholder: {
                value: null,
                type: T.String,
                description: 'Text to display when control is empty.'
            },
            queryBuffer: {
                value: null,
                type: T.Number,
                description: 'Delay (in ms) to buffer calls to the async queryFn. Defaults to 300.'
            },
            queryFn: {
                value: null,
                type: T.Function,
                description:
                    'Async function to return a list of oTions for a given query string input.\n' +
                    'Replaces the `options` prop - use one or the other.'
            },
            rsOptions: {
                value: null,
                type: T.Object,
                description:
                    'Escape-hatch props passed directly to react-select. Use with care - not all props ' +
                    'in the react-select API are guaranteed to be supported by this Hoist component, ' +
                    'and providing them directly can interfere with the implementation of this class.'
            },
            selectOnFocus: {
                value: null,
                type: T.Boolean,
                description: 'True to select contents when control receives focus.'
            },
            valueField: {
                value: null,
                type: T.String,
                description: 'Field on provided options for sourcing each option\'s value (default `value`).'
            }
        },
        scope: {
            Select,
            Icon
        }
    });
}

const positions = {
    auto: 'auto',
    top: 'top',
    bottom: 'bottom'
};