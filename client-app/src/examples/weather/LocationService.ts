import {HoistService, XH} from '@xh/hoist/core';
import {LocalDate} from '@xh/hoist/utils/datetime';
import _ from 'lodash';
import {difference, differenceBy, pullAll, pullAllWith, update} from 'lodash';

/**
 * Service to manage fetching, updating and persisting locations.
 * Locations are persisted for each user using the Hoist preference system.
 */
export class LocationService extends HoistService {
    static instance: LocationService;

    getWeatherLocationsPref(): string[] {
        return XH.getPref('weatherLocations').locations;
    }

    getTempSettingPref(): boolean {
        return XH.getPref('weatherLocations').isFahrenheit;
    }

    toggleTempSettingPref(){
        this.saveToPreference(!this.getTempSettingPref(), this.getWeatherLocationsPref());
    }

    addToPrefs(location: string) {
        let curr = this.getWeatherLocationsPref(),
            updated = [...curr, location];
        this.saveToPreference(this.getTempSettingPref(), updated);
    }

    deleteFromPrefs(locations: string[]) {
        let curr = this.getWeatherLocationsPref();
        let updated = _.difference(curr, locations)
        this.saveToPreference(this.getTempSettingPref(), updated);
    }

    //------------------
    // Implementation
    //------------------
    private saveToPreference(isFahrenheit: boolean, locations: string[]) {
        XH.setPref(
            'weatherLocations',
            {isFahrenheit: isFahrenheit,
            locations: locations}
        );
    }
}
