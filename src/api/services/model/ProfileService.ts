// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { validate, request } from '../../../core/api/Validate';
import { NotFoundException } from '../../exceptions/NotFoundException';
import { ProfileRepository } from '../../repositories/ProfileRepository';
import { Profile } from '../../models/Profile';
import { ProfileCreateRequest } from '../../requests/model/ProfileCreateRequest';
import { ProfileUpdateRequest } from '../../requests/model/ProfileUpdateRequest';
import { AddressService } from './AddressService';
import { CryptocurrencyAddressService } from './CryptocurrencyAddressService';
import { CoreRpcService } from '../CoreRpcService';
import { ShoppingCartService } from './ShoppingCartService';
import { AddressCreateRequest } from '../../requests/model/AddressCreateRequest';
import { CryptocurrencyAddressCreateRequest } from '../../requests/model/CryptocurrencyAddressCreateRequest';
import { CryptocurrencyAddressUpdateRequest } from '../../requests/model/CryptocurrencyAddressUpdateRequest';
import { SettingService } from './SettingService';
import { SettingValue } from '../../enums/SettingValue';
import { IdentityService } from './IdentityService';
import {MessageException} from '../../exceptions/MessageException';

export class ProfileService {

    public log: LoggerType;

    constructor(
        @inject(Types.Service) @named(Targets.Service.model.AddressService) public addressService: AddressService,
        @inject(Types.Service) @named(Targets.Service.model.CryptocurrencyAddressService) public cryptocurrencyAddressService: CryptocurrencyAddressService,
        @inject(Types.Service) @named(Targets.Service.model.ShoppingCartService) public shoppingCartService: ShoppingCartService,
        @inject(Types.Service) @named(Targets.Service.model.SettingService) public settingService: SettingService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) public identityService: IdentityService,
        @inject(Types.Service) @named(Targets.Service.CoreRpcService) public coreRpcService: CoreRpcService,
        @inject(Types.Repository) @named(Targets.Repository.ProfileRepository) public profileRepo: ProfileRepository,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async getDefault(withRelated: boolean = true): Promise<Profile> {

        const defaultProfileSettings: resources.Setting[] = await this.settingService.findAllByKey(SettingValue.APP_DEFAULT_PROFILE_ID)
            .then(value => value.toJSON());
        const defaultProfileSetting = defaultProfileSettings[0];
        // this.log.debug('getDefault(), defaultProfileSetting: ', JSON.stringify(defaultProfileSetting, null, 2));

        const profile = await this.findOne(+defaultProfileSetting.value, withRelated)
            .catch(reason => {
                this.log.error('reason: ', JSON.stringify(reason, null, 2));
                throw new MessageException(reason);
            });
        if (profile === null) {
            this.log.warn(`Default Profile was not found!`);
            throw new NotFoundException(defaultProfileSetting.value);
        }
        return profile;
    }

    public async findAll(): Promise<Bookshelf.Collection<Profile>> {
        return await this.profileRepo.findAll();
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<Profile> {
        const profile = await this.profileRepo.findOne(id, withRelated);
        if (profile === null) {
            this.log.warn(`Profile with the id=${id} was not found!`);
            throw new NotFoundException(id);
        }
        return profile;
    }

    public async findOneByName(name: string, withRelated: boolean = true): Promise<Profile> {
        const profile = await this.profileRepo.findOneByName(name, withRelated);
        if (profile === null) {
            this.log.warn(`Profile with the name=${name} was not found!`);
            throw new NotFoundException(name);
        }
        return profile;
    }

    @validate()
    public async create( @request(ProfileCreateRequest) data: ProfileCreateRequest): Promise<Profile> {
        const body: ProfileCreateRequest = JSON.parse(JSON.stringify(data));
        // this.log.debug('body: ', JSON.stringify(body, null, 2));

        // extract and remove related models from request
        const shippingAddresses = body.shippingAddresses || [];
        const cryptocurrencyAddresses = body.cryptocurrencyAddresses || [];
        const settings = body.settings || [];
        const identity = body.identity;
        delete body.shippingAddresses;
        delete body.cryptocurrencyAddresses;
        delete body.settings;
        delete body.identity;

        // If the request body was valid we will create the profile
        const profile = await this.profileRepo.create(body).then(value => value.toJSON());

        // then create related models
        for (const address of shippingAddresses) {
            address.profile_id = profile.id;
            await this.addressService.create(address);
        }

        for (const cryptoAddress of cryptocurrencyAddresses) {
            cryptoAddress.profile_id = profile.id;
            await this.cryptocurrencyAddressService.create(cryptoAddress);
        }

        for (const setting of settings) {
            setting.profile_id = profile.id;
            await this.settingService.create(setting);
        }

        if (!_.isEmpty(identity)) {
            identity.profile_id = profile.id;
            await this.identityService.create(identity);
        }

        // finally find and return the created profileId
        return await this.findOne(profile.id);
    }

    @validate()
    public async update(id: number, @request(ProfileUpdateRequest) data: any): Promise<Profile> {

        const body = JSON.parse(JSON.stringify(data));

        // find the existing one without related
        const profile = await this.findOne(id, false);

        // set new values
        profile.Name = body.name;

        // update profile
        const updatedProfile = await this.profileRepo.update(id, profile.toJSON());
        this.log.debug('updatedProfile: ', updatedProfile.toJSON());

        // remove existing addresses
        const addressesToDelete = profile.toJSON().ShippingAddresses || [];
        for (const address of addressesToDelete) {
            await this.addressService.destroy(address.id);
        }

        // update related data
        const shippingAddresses = body.shippingAddresses || [];

        // add new addresses
        for (const address of shippingAddresses) {
            address.profile_id = id;
            await this.addressService.create(address as AddressCreateRequest);
        }

        const cryptocurrencyAddresses = body.cryptocurrencyAddresses || [];
        for (const cryptoAddress of cryptocurrencyAddresses) {
            if (cryptoAddress.profile_id) {
                await this.cryptocurrencyAddressService.update(cryptoAddress.id, cryptoAddress as CryptocurrencyAddressUpdateRequest);
            } else {
                cryptoAddress.profile_id = id;
                await this.cryptocurrencyAddressService.create(cryptoAddress as CryptocurrencyAddressCreateRequest);
            }
        }

        // finally find and return the updated itemInformation
        const newProfile = await this.findOne(id);
        return newProfile;
    }

    public async destroy(id: number): Promise<void> {
        await this.profileRepo.destroy(id);
    }

}
