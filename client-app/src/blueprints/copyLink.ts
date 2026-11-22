import {XH} from '@xh/hoist/core';

/** Copy a link to the clipboard, and say whether it worked. */
export async function copyLinkAsync(link: string) {
    try {
        await navigator.clipboard.writeText(link);
        XH.successToast('Link copied.');
    } catch (e) {
        XH.handleException(e, {showAlert: false});
        XH.dangerToast('Could not copy the link.');
    }
}
