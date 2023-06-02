import {HoistModel, LoadSpec, managed, PlainObject, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {random, sample} from 'lodash';
import {createRef} from 'react';
import {PERSIST_APP} from './AppModel';
import {LocationDialogModel} from './LocationDialogModel';
import {cities} from "../../core/data/Cities";
import moment from "moment";

export class WeatherPanelModel extends HoistModel {
    override persistWith = PERSIST_APP;

    @managed
    locationDialogModel = new LocationDialogModel(this);

    @bindable
    isFahrenheit = false

    panelRef = createRef<HTMLElement>();

    locations = []

    @observable
    timestamp = Date.now();

    @observable.ref
    forecasts = []

    openAddForm() {
        this.locationDialogModel.openAddForm()
    };

    deleteForecast(locationName){
        this.deleteLocationAsync(locationName)
    };

    setTimeStamp(){
        moment().subtract(randVal(), randUnit()).valueOf();
    }

    constructor() {
        super();
        makeObservable(this);
        this.locations = XH.locationService.getWeatherLocationsPref().map(it => it);
        this.isFahrenheit = XH.locationService.getTempSettingPref();
    }

    async imageIsValid(url){
        try {await fetch(url).then(r => r.json()).then(r => {
            r.title !== 'Bad Request'
        }) }
        catch(err){
            return true
        }
    }

    getCoordinates(locationName: string): PlainObject {
        const city = cities.find(c => c.label === locationName);
        return city ? {lat: city.value.lat, lng: city.value.lng} : null
    }

    async fetchForecast(coordinates: PlainObject): Promise<PlainObject> {
        const forecast = await XH.fetchJson({
            url: 'weather',
            params: coordinates
        });

        if (forecast) {
            if (!(await this.imageIsValid(forecast.icon))) forecast.icon = null;
        }
        return forecast
    }

    async getTile(locationName): Promise<PlainObject>{
        const coords = this.getCoordinates(locationName);
        const forecast = await this.fetchForecast(coords);
        if (!forecast) return null;
        return {
            locationName: locationName,
            lat: coords.lat,
            lng: coords.lng,
            temperature: forecast.temperature,
            shortForecast: forecast.shortForecast,
            icon: forecast.icon
        };
    }

    override async doLoadAsync(loadSpec:LoadSpec){
        let tiles = this.locations.map(it => this.getTile(it))
        this.forecasts = await Promise.all(tiles)
        this.timestamp = Date.now()
    }

    @action
    async addLocationAsync(location) {
        let locationValid = await this.getTile(location)
        if(locationValid) {
            this.locations.push(location)
            await this.loadAsync()
            await XH.locationService.addToPrefs(location);
            this.info(`Location added: '${location}'`);
        }else{
            this.info("No data available for this location at the moment.")
        }
    }
    @action
    async deleteLocationAsync(location) {
        XH.locationService.deleteFromPrefs([location]);
        this.locations.splice(this.locations.indexOf(location), 1)
        await this.loadAsync()
        this.info(`Location removed: '${location}'`);
    }
    private info(message) {
        XH.toast({message, containerRef: this.panelRef.current});
    }
}

const randUnit = () => sample(['y', 'M', 'd', 'h', 'm', 's', 'ms'] as const);
const randVal = () => random(1, 10);