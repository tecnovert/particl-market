// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

/**
 * SettingValue
 *
 */

export enum SettingValue {

    // APP LEVEL SETTINGS
    APP_DEFAULT_PROFILE_ID = 'APP_DEFAULT_PROFILE_ID',
    APP_DEFAULT_MARKETPLACE_NAME = 'APP_DEFAULT_MARKETPLACE_NAME',                  // used for default marketplace creation
    APP_DEFAULT_MARKETPLACE_PRIVATE_KEY = 'APP_DEFAULT_MARKETPLACE_PRIVATE_KEY',    // used for default marketplace creation
    APP_DEFAULT_MARKETPLACE_ADDRESS = 'APP_DEFAULT_MARKETPLACE_ADDRESS',

    // PROFILE LEVEL SETTINGS
    PROFILE_DEFAULT_MARKETPLACE_ID = 'PROFILE_DEFAULT_MARKETPLACE_ID',   // each Profile can have its own default Market

    SCRIPT_TASK_MIGRATION = 'SCRIPT_TASK_RUN'

    // MARKETPLACE LEVEL SETTINGS

}
