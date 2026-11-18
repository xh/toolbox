import type {ReactElement} from 'react';
import './Popups.scss';

/** Shared props for the API trigger buttons across the Messages, Toast and Banners demos. */
export function popBtn(icon: ReactElement) {
    return {
        className: 'tbox-popups__button',
        icon,
        minimal: false
    };
}
