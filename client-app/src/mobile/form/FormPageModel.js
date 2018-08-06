import {HoistModel} from '@xh/hoist/core';
import {observable, action} from '@xh/hoist/mobx';
import {movies} from '../../core/data';

@HoistModel()
export class FormPageModel {
    @observable name = null;
    @observable movie = null;
    @observable notes = null;

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

}