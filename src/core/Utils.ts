// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE


export const getOsEnv = (key: string): string => {
    if (typeof process.env[key] === 'undefined') {
        throw new Error(`Environment variable ${key} is not set.`);
    }
    return process.env[key] as string;
};

export const getOsEnvOptional = (key: string): string | undefined => process.env[key];


export const getOsEnvArray = (key: string, delimiter: string = ','): string[] =>
    (typeof process.env[key] === 'string') && (process.env[key] as string).split(delimiter) || [];


export const toNumber = (value: string): number => parseInt(value, 10);


export const toFloat = (value: string): number => parseFloat(value);


export const toBool = (value: string): boolean => value === 'true';


export const clone = (original: any): any => JSON.parse(JSON.stringify(original));

/*
export function toBigNumber(value: number): BigNumber {
    const BN = BigNumber.clone({
        DECIMAL_PLACES: 10,
        ROUNDING_MODE: BigNumber.ROUND_DOWN
    });
    return new BN(value, 10);
}

export function bnToNumber(value: BigNumber): number {
    return value.decimalPlaces(8, BigNumber.ROUND_DOWN).toNumber();
}

export function bnToString(value: BigNumber): string {
    return value.toFixed(8, BigNumber.ROUND_DOWN);
}
*/
