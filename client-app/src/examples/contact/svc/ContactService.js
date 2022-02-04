import {HoistService, XH} from '@xh/hoist/core';
import {pull} from 'lodash';
import {action} from '@xh/hoist/mobx';

/**
 * Service to manage fetching and updating contacts.
 * Favorites are persisted for each user using the Hoist preference system.
 */
export class ContactService extends HoistService {

    /** @member {string[]} - ids of all contacts that the user has favorited. */
    userFaves = [...XH.getPref('favoriteContacts')];

    async getContactsAsync() {
        const ret = await XH.fetchJson({url: 'contacts'});
        ret.forEach(it => {
            it.isFavorite = this.userFaves.includes(it.id);
            it.profilePicture = `../../public/contact-images/${(it.profilePicture ?? 'no-profile.png')}`;
        });
        return ret;
    }

    async updateContactAsync(id, update) {
        await XH.fetchService.postJson({
            url: `contacts/update/${id}`,
            body: update
        });
    }

    @action
    toggleFavorite(id) {
        const {userFaves} = this,
            isFavorite = userFaves.includes(id);

        if (isFavorite) {
            pull(userFaves, id);
        } else {
            userFaves.push(id);
        }

        XH.setPref('favoriteContacts', userFaves);
    }
}
