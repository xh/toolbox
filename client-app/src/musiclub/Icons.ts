import {library} from '@fortawesome/fontawesome-svg-core';
import {
    faAlbum,
    faTurntable,
    faListMusic,
    faUserMusic,
    faPeopleGroup
} from '@fortawesome/pro-light-svg-icons';
import {Icon} from '@xh/hoist/icon';

library.add(faAlbum, faTurntable, faListMusic, faUserMusic, faPeopleGroup);

const prefix = 'fal';
export const albumIcon = (opts = {}) => Icon.icon({iconName: 'album', prefix, ...opts});
export const artistIcon = (opts = {}) => Icon.icon({iconName: 'user-music', prefix, ...opts});
export const clubIcon = (opts = {}) => Icon.icon({iconName: 'turntable', prefix, ...opts});
export const locationIcon = (opts = {}) => Icon.location({prefix, ...opts});
export const meetingIcon = (opts = {}) => Icon.icon({iconName: 'people-group', prefix, ...opts});
export const trackIcon = (opts = {}) => Icon.icon({iconName: 'list-music', prefix, ...opts});
