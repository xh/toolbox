import {HoistService, persist, XH} from '@xh/hoist/core';
import {action, observable, makeObservable} from '@xh/hoist/mobx';
import {without} from 'lodash';

export const PERSIST_APP = {prefKey: 'contactAppState'};

/**
 * Service to manage fetching and updating contacts.
 * Favorites are persisted for each user using the Hoist preference system.
 */
export class ContactService extends HoistService {
    static instance: ContactService;

    override persistWith = PERSIST_APP;

    /** ids of all contacts that the user has favorited. */
    @observable.ref
    @persist
    userFaves: string[] = [];

    constructor() {
        super();
        makeObservable(this);
    }

    async getContactsAsync() {
        const ret = await XH.fetchJson({url: 'contacts'});

        ret.forEach(it => {
            it.isFavorite = this.userFaves.includes(it.id);
            it.profilePicture = `../../public/contact-images/${
                it.profilePicture ?? 'no-profile.png'
            }`;
        });
        return ret;
    }

    async updateContactAsync(id, update) {
        await XH.fetchService.postJson({
            url: `contacts/update/${id}`,
            body: update,
            track: {
                category: 'Contacts',
                message: `Updated contact`,
                data: {id, ...update},
                logData: true
            }
        });
    }

    @action
    toggleFavorite(id) {
        const {userFaves} = this,
            isFavorite = userFaves.includes(id);

        XH.setPref(PERSIST_APP.prefKey, {
            ...(XH.getPref(PERSIST_APP.prefKey) ?? {}),
            userFaves: isFavorite ? without(userFaves, id) : [...userFaves, id]
        });

        this.userFaves = isFavorite ? without(userFaves, id) : [...userFaves, id];
    }
}
