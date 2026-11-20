import {grid} from '@xh/hoist/cmp/grid';
import {filler, span} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import type {InspectorModel} from './InspectorModel';

interface InspectorHistoryProps extends HoistProps {
    inspector: InspectorModel;
}

/** The open blueprint's edits, newest first, with undo and redo. */
export const inspectorHistory = hoistCmp.factory<InspectorHistoryProps>({
    displayName: 'InspectorHistory',
    model: false,

    render({inspector}) {
        const {blueprintModel} = inspector.panelModel,
            {applyError} = inspector;
        return panel({
            tbar: [
                button({
                    text: 'Undo',
                    icon: Icon.undo(),
                    disabled: !blueprintModel.canUndo,
                    tooltip: blueprintModel.canUndo
                        ? `Undo: ${blueprintModel.undoDescription ?? 'Edit'}`
                        : null,
                    onClick: () => inspector.undo()
                }),
                button({
                    text: 'Redo',
                    icon: Icon.redo(),
                    disabled: !blueprintModel.canRedo,
                    tooltip: blueprintModel.canRedo
                        ? `Redo: ${blueprintModel.redoDescription ?? 'Edit'}`
                        : null,
                    onClick: () => inspector.redo()
                }),
                filler(),
                applyError ? span({className: 'xh-intent-danger', item: applyError}) : null
            ],
            item: grid({model: inspector.historyGridModel})
        });
    }
});
