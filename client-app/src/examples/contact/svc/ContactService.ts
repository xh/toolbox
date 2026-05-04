import {CallContext, HoistService, persist, XH} from '@xh/hoist/core';
import {action, observable, makeObservable} from '@xh/hoist/mobx';
import {without} from 'lodash';

import {PERSIST_APP} from '../AppModel';

/**
 * Service to manage fetching and updating contacts.
 * Favorites are persisted for each user using the Hoist preference system.
 */
export class ContactService extends HoistService {
    override spanPrefix = 'toolbox.client.contacts';

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

    async getContactsAsync(ctx?: CallContext) {
        return this.runOnOptional(ctx)
            .newSpan('getContacts')
            .fetchJson({url: 'contacts'})
            .tap(ret => {
                ret.forEach(it => {
                    it.isFavorite = this.userFaves.includes(it.id);
                    it.profilePicture = `../../public/contact-images/${
                        it.profilePicture ?? 'no-profile.png'
                    }`;
                });
            });
    }

    async updateContactAsync(id, update) {
        await this.rootSpan('update').run(ctx =>
            XH.fetchService.postJson({
                url: `contacts/update/${id}`,
                span: ctx.span,
                body: update,
                track: {
                    category: 'Contacts',
                    message: `Updated contact`,
                    data: {id, ...update},
                    logData: true
                }
            })
        );
    }

    @action
    toggleFavorite(id) {
        const {userFaves} = this,
            isFavorite = userFaves.includes(id);

        this.userFaves = isFavorite ? without(userFaves, id) : [...userFaves, id];
    }
}
