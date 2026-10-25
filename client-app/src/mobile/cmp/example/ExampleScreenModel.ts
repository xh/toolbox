import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';

export type ExampleSegment = 'info' | 'options' | 'resources';

/**
 * Transient view state for an {@link exampleScreen}: whether the pull-up sheet is expanded and which
 * of the Info / Options / Resources segments is showing. Created locally per example screen.
 */
export class ExampleScreenModel extends HoistModel {
    @bindable accessor isExpanded = false;
    @bindable accessor segment: ExampleSegment = 'info';
}
