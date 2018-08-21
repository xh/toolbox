import {HoistModel, ValidationModel} from '@xh/hoist/core';
import {observable, action} from '@xh/hoist/mobx';
import {movies} from '../../core/data';

@HoistModel()
export class FormPageModel {
    validationModel = new ValidationModel({
        constraints: {
            name: {
                presence: true,
                length: 8
            },
            movie: {
                presence: true
            },
            notes: {
                presence: true,
                length: {
                    minimum: 10,
                    maximum: 30
                }
            },
            searchQuery: {
                presence: true
            }
        },
        model: this
    });

    @observable name = null;
    @observable movie = null;
    @observable notes = null;
    @observable searchQuery = null;

    movies = movies;

    @action
    setName(name) {
        this.name = name;
    }

    @action
    setMovie(movie) {
        this.movie = movie;
    }

    @action
    setNotes(notes) {
        this.notes = notes;
    }

    @action
    setSearchQuery(query) {
        this.searchQuery = query;
    }

}