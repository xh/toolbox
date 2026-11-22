import {XH} from '@xh/hoist/core';

/** Copy text to the clipboard, and say whether it worked. */
export async function copyTextAsync(text: string, what = 'Text') {
    try {
        await navigator.clipboard.writeText(text);
        XH.successToast(`${what} copied.`);
    } catch (e) {
        XH.handleException(e, {showAlert: false});
        XH.dangerToast(`Could not copy the ${what.toLowerCase()}.`);
    }
}

/** Copy a link to the clipboard, and say whether it worked. */
export function copyLinkAsync(link: string) {
    return copyTextAsync(link, 'Link');
}
