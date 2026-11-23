/** What the publish control and its popover show, from the draft's issues. */
export interface PublishState {
    /** True if the draft may not publish: it has errors or unfinished widgets. */
    disabled: boolean;
    /** Why it may not publish, or null. */
    tooltip: string;
    /** The unfinished widgets to finish first, with each one's message, or null. */
    finish: {text: string; messages: string[]};
    /** The plain warnings a user may publish over, as one line, or null. */
    warning: string;
}

interface Issue {
    code?: string;
    severity: string;
    message: string;
}

/**
 * The publish control's state. Errors block it, and so do unfinished widgets, whose issues are
 * warnings but never count among the warnings a user may publish over.
 *
 * @param unfinished - the ids of unfinished widgets, as the document model lists them.
 */
export function publishState(issues: Issue[], unfinished: string[]): PublishState {
    const errors = issues.filter(it => it.severity === 'error').length,
        warnings = issues.filter(it => it.severity === 'warning' && !isIncomplete(it)),
        names = unfinished.join(', ');
    return {
        disabled: errors > 0 || unfinished.length > 0,
        tooltip: errors
            ? `Fix ${plural(errors, 'error')} to publish`
            : unfinished.length
              ? `Finish ${names} to publish`
              : null,
        finish: unfinished.length
            ? {
                  text: `Finish ${names} before you publish.`,
                  messages: issues.filter(isIncomplete).map(it => it.message)
              }
            : null,
        warning:
            !unfinished.length && warnings.length
                ? `${plural(warnings.length, 'warning')}: ${warnings[0].message}${
                      warnings.length > 1 ? ` And ${warnings.length - 1} more.` : ''
                  } Publish anyway, or fix ${warnings.length > 1 ? 'them' : 'it'} first.`
                : null
    };
}

/** True for an issue that marks a widget unfinished. */
export function isIncomplete(issue: {code?: string}): boolean {
    return issue.code === 'config.incomplete';
}

/** A count and its noun, as `1 warning` or `2 warnings`. */
export function plural(n: number, noun: string): string {
    return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/**
 * The confirmation for republishing a version. A draft with unpublished changes keeps them, while
 * one with none follows the rollback to the version.
 */
export function rollbackMessage(version: number, next: number, draftHasChanges: boolean): string {
    return [
        `Publish v${version} again, as v${next}, noted "Rolled back to v${version}"?`,
        'Readers move to it when they next open the blueprint.',
        draftHasChanges ? 'Your draft stays as it is.' : `Your draft will match v${version}.`
    ].join(' ');
}
