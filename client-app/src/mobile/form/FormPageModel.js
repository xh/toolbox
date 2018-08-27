import {HoistModel, field} from '@xh/hoist/core';
import {ValidationSupport, required, lengthIs} from '@xh/hoist/validation';
import {movies} from '../../core/data';

@HoistModel()
@ValidationSupport
export class FormPageModel {

    @field(required, lengthIs({min: 8}))
    name = null;

    @field(required)
    movie = null;

    @field()
    notes = null;

    @field()
    searchQuery = null;

    movies = movies;
}