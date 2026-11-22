import type {BlueprintEdit, BlueprintModel, BlueprintOp} from '@xh/hoist-chat-kit/blueprint';
import type {ChatModel, ChatToolCallPart, ChatToolSpec} from '@xh/hoist-chat-kit/core';
import {div, filler, hbox, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';
import {editTarget, originals, undoneVersions} from './historyTimeline';

export interface EditCardState {
    /** True if the edit is in the blueprint's history, as made since it last opened. */
    found: boolean;
    undone: boolean;
    canUndo: boolean;
    /** Why the edit cannot be undone from its card, or null. */
    reason: string;
}

/**
 * What an Architect edit's card may do. Its edit is matched in the history by version, author and
 * description, as versions start again when a blueprint reopens. Only the latest edit can be undone.
 *
 * @param undoAllowed - false in run mode, or while the Architect's turn runs.
 */
export function editCardState(
    history: (BlueprintEdit & {version: number})[],
    version: number,
    description: string,
    undoAllowed: boolean
): EditCardState {
    const entry = history.find(
            it =>
                it.version === version &&
                it.author === 'architect' &&
                (it.description ?? null) === (description ?? null)
        ),
        undone = !!entry && undoneVersions(history).has(version),
        ret = (canUndo: boolean, reason: string) => ({found: !!entry, undone, canUndo, reason});
    if (!entry) return ret(false, 'Made before the blueprint last opened.');
    if (undone) return ret(false, null);
    if (!undoAllowed) {
        return ret(false, 'Undo needs design mode, and waits for the Architect to finish.');
    }
    const last = history.at(-1);
    if (last !== entry && originals(history)((last as {version: number}).version) !== version) {
        return ret(false, 'Undo the later edits first, from the bar or History.');
    }
    return ret(true, null);
}

/**
 * The Architect's tools, with each applied `edit_blueprint` call shown in the reply as a card: what
 * the edit did, Show to select what it touched, and Undo.
 */
export function withEditCards(
    tools: ChatToolSpec[],
    blueprintModel: BlueprintModel,
    onShow: (ops: BlueprintOp[]) => void
): ChatToolSpec[] {
    return tools.map(spec =>
        spec.name === 'edit_blueprint'
            ? {
                  ...spec,
                  display: 'inline',
                  renderer: (part, ctx) =>
                      editCard({part, chatModel: ctx.chatModel, blueprintModel, onShow})
              }
            : spec
    );
}

interface EditCardProps extends HoistProps {
    part: ChatToolCallPart;
    chatModel: ChatModel;
    blueprintModel: BlueprintModel;
    onShow: (ops: BlueprintOp[]) => void;
}

const editCard = hoistCmp.factory<EditCardProps>({
    displayName: 'ArchitectEditCard',
    model: false,

    render({part, chatModel, blueprintModel, onShow}) {
        const {state, input, output} = part;
        if (state !== 'output-available' || !output?.applied) return null;
        const description = input?.description ?? null,
            ops = (input?.ops ?? []) as BlueprintOp[],
            warnings = output.warnings?.length ?? 0,
            card = editCardState(
                blueprintModel.history,
                output.version,
                description,
                blueprintModel.canUndo && !chatModel?.isBusy
            );
        return div({
            className: classNames('tb-edit-card', card.undone && 'tb-edit-card--undone'),
            items: [
                hbox({
                    className: 'tb-edit-card__head',
                    items: [
                        Icon.edit(),
                        span({
                            className: 'tb-edit-card__desc',
                            item: description ?? 'Edited the blueprint'
                        }),
                        card.undone ? span({className: 'tb-edit-card__note', item: 'Undone'}) : null
                    ]
                }),
                hbox({
                    className: 'tb-edit-card__bar',
                    items: [
                        span({
                            className: 'tb-edit-card__note',
                            item: `${ops.length} change${ops.length === 1 ? '' : 's'}${warnings ? `, ${warnings} warning${warnings === 1 ? '' : 's'}` : ''}`
                        }),
                        filler(),
                        button({
                            text: 'Show',
                            icon: Icon.crosshairs(),
                            minimal: true,
                            omit: !card.found || card.undone || !editTarget(ops),
                            onClick: () => onShow(ops)
                        }),
                        button({
                            text: 'Undo',
                            icon: Icon.undo(),
                            minimal: true,
                            omit: card.undone,
                            disabled: !card.canUndo,
                            tooltip: card.reason,
                            onClick: () => {
                                const error = blueprintModel
                                    .undo()
                                    .issues.find(it => it.severity === 'error');
                                if (error) XH.dangerToast(error.message);
                            }
                        })
                    ]
                })
            ]
        });
    }
});
