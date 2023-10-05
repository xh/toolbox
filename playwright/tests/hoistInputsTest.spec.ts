import {test} from '../fixtures/toolbox';
import * as moment from 'moment';

test('Hoist Inputs Test', async ({page, tb}) => {
    // Navigate to page we are testing.
    await tb.click('toplevel-tab-switcher-forms');
    await tb.click('forms-tab-switcher-inputs');

    // Check commit on change for the page
    await tb.check('inputs-panel-commit-radio');

    // Fill text input
    await tb.fill('hoist-inputs-textInput1', 'ryan');
    await tb.fill('hoist-inputs-textInput2', 'ryan@xh.io');
    await tb.fill('hoist-inputs-textInput3', 'ryanlee@xh.io');

    // Check if text inputs are filled
    await tb.expectText('inputs-panel-textInput1', 'ryan');
    await tb.expectText('inputs-panel-textInput2', 'ryan@xh.io');
    await tb.expectText('inputs-panel-textInput3', 'ryanlee@xh.io');

    // Click on clear button for test input 2 and check it is cleared
    await tb.click('hoist-inputs-textInput2-input-clear-btn');
    await tb.expectText('inputs-panel-textInput2', 'null');

    // Fill text Area and check if filled
    await tb.fill('hoist-inputs-textArea-input', 'Text Area');
    await tb.expectText('inputs-panel-textArea', 'Text Area');

    // Fill Json input and check if filled
    await tb.fill('hoist-inputs-jsonInput-input', '{"isFilled": true}');
    await tb.expectText('inputs-panel-jsonInput', '{"isFilled": true}');

    // Fill number input and check filled with shorthand units and scale working
    await tb.fill('hoist-inputs-numberInput1', '4000');
    await tb.fill('hoist-inputs-numberInput2', '4k');
    await tb.fill('hoist-inputs-numberInput3', '4');
    await tb.expectText('inputs-panel-numberInput1', '4000');
    await tb.expectText('inputs-panel-numberInput2', '4000');
    await tb.expectText('inputs-panel-numberInput3', '0.04');

    const today = moment().format('YYYY-MM-DD');
    // Type date into date input and check
    await tb.fill('hoist-inputs-dateInput1-input', today);
    await tb.expectText('inputs-panel-dateInput1', `${today} 12:00am`);

    //open select and click on option then check option is applied
    await tb.select('hoist-inputs-select2-input', 'Alabama');
    await tb.expectText('inputs-panel-select2', 'AL');

    await tb.filterThenClickSelectOption({
        testId: 'hoist-inputs-select3-input',
        filterText: 's',
        asyncOptionUrl: '/customer'
    });
    await tb.expectText('inputs-panel-select2', 'AL');

    // Check checkbox and check Checkbox is checked

    await tb.toggle('hoist-inputs-checkbox-input');
    await tb.expectText('inputs-panel-checkbox', 'true');
    await tb.uncheck('hoist-inputs-checkbox-input');
    await tb.expectText('inputs-panel-checkbox', 'false');

    // Check switch input and check switch is enabled
    await tb.toggle('hoist-inputs-switch-input');
    await tb.expectText('inputs-panel-switch', 'true');

    // Click on button 3 in button group and check it is clicked
    await tb.get('hoist-inputs-buttonGroupInput').getByText('Button 3').click();
    await tb.expectText('inputs-panel-buttonGroupInput', 'button3');

    // Check on of the radio inputs and check it is selected.
    await tb.check('hoist-inputs-radioInput-input-Steak');
    await tb.expectText('inputs-panel-radioInput', 'Steak');
});
