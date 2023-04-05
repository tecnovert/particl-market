// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { ShippingCountries } from '../../../src/core/helpers/ShippingCountries';
import { getDataSet, reduce } from 'iso3166-2-db';

const data = {
    countryCodeList: reduce(getDataSet(), 'en'),
    countryList: ShippingCountries.countryList,
    invalidCountryCodes: ['ASDF', 'A', 'ASD', '1', '11', 'Z1', 'Z11'],
    // Countries that never or no longer exist, lost their independence, or have changed their name.
    invalidCountries: ['Cobrastan', 'Ottoman Empire', 'Rhodesia', 'Czechoslovakia', 'Tibet', 'Yugoslavia', 'Burma'],
    questionableCountryCodes: ['EU'],
    questionableCountries: ['Europe', 'Asia']
}

describe('ShippingCountries', () => {
    test('isValidCountryCode() should return true for all country codes', () => {
        // Check valid country codes
        for ( const countryCode in data.countryCodeList ) {
            if ( countryCode ) {
                // Check country code is correct
                expect(ShippingCountries.isValidCountryCode(countryCode)).toBe(true);
                // Check country from country code is correct
                expect(ShippingCountries.isValidCountry(ShippingCountries.getCountry(countryCode))).toBe(true);
            }
        }
    });

    test('isValidCountry() should return true for all country names', () => {
        // Check valid contry names
        for ( const country in data.countryList ) {
            if (country) {
                // Check country name is valid
                expect(ShippingCountries.isValidCountry(country)).toBe(true);
                // Check country code from country name is valid
                expect(ShippingCountries.isValidCountryCode(ShippingCountries.getCountryCode(country))).toBe(true);
            }
        }
    });

    test('isValidCountryCode() should return false for fake country codes', () => {
        for ( const countryCode in data.invalidCountryCodes ) {
            if ( countryCode ) {
                expect(ShippingCountries.isValidCountryCode(countryCode)).toBe(false);
            }
        }
    });

    test('isValidCountry() should return true for all countries', () => {
        for ( const countryCode in data.countryCodeList ) {
            if ( countryCode ) {
                expect(ShippingCountries.isValidCountry(data.countryCodeList[countryCode].name)).toBe(true);
            }
        }
    });

    test('isValidCountry() should return false for invalid countries', () => {
        for ( const country in data.invalidCountries ) {
            if ( country ) {
                expect(ShippingCountries.isValidCountry(country)).toBe(false);
            }
        }
    });

    test('isValidCountryCode() should return false for questionable country codes', () => {
        for ( const countryCode in data.questionableCountryCodes ) {
            if ( countryCode ) {
                expect(ShippingCountries.isValidCountryCode(countryCode)).toBe(false);
            }
        }
    });

    test('isValidCountry() should return false for questionable countries', () => {
        for ( const country in data.questionableCountries ) {
            if ( country ) {
                expect(ShippingCountries.isValidCountry(country)).toBe(false);
            }
        }
    });
});
