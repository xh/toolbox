import {XH} from '@xh/hoist/core';

/**
 * True if the user may use the LLM chat demos: a member of `TOOLBOX_LLM_USER`, or any user while
 * the `llmOpenToAllUsers` config is true. Mirrors the server's `LlmService.canUse`, which enforces
 * it on every model call. Both check the authenticated user, so an admin impersonating someone
 * keeps their own access.
 */
export function canUseLlm(): boolean {
    return (
        XH.getConf('llmOpenToAllUsers', false) ||
        !!XH.identityService.authUser?.hasRole('TOOLBOX_LLM_USER')
    );
}

/** Shown in place of an LLM chat for a user without access. */
export const LLM_NO_ACCESS_MSG =
    'The AI assistant is not enabled for your account. Contact XH to request access.';
