// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import * as resources from 'resources';
import * as _ from 'lodash';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { validate, request } from '../../../core/api/Validate';
import { NotFoundException } from '../../exceptions/NotFoundException';
import { ItemLocationRepository } from '../../repositories/ItemLocationRepository';
import { ItemLocation } from '../../models/ItemLocation';
import { ItemLocationCreateRequest } from '../../requests/model/ItemLocationCreateRequest';
import { ItemLocationUpdateRequest } from '../../requests/model/ItemLocationUpdateRequest';
import { LocationMarkerService } from './LocationMarkerService';

export class ItemLocationService {

    public log: LoggerType;

    constructor(
        @inject(Types.Service) @named(Targets.Service.model.LocationMarkerService) public locationMarkerService: LocationMarkerService,
        @inject(Types.Repository) @named(Targets.Repository.ItemLocationRepository) public itemLocationRepo: ItemLocationRepository,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<ItemLocation>> {
        return this.itemLocationRepo.findAll();
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<ItemLocation> {
        const itemLocation = await this.itemLocationRepo.findOne(id, withRelated);
        if (itemLocation === null) {
            this.log.warn(`ItemLocation with the id=${id} was not found!`);
            throw new NotFoundException(id);
        }
        return itemLocation;
    }

    @validate()
    public async create(@request(ItemLocationCreateRequest) data: ItemLocationCreateRequest): Promise<ItemLocation> {
        const body = JSON.parse(JSON.stringify(data));
        // this.log.debug('create(), body: ', JSON.stringify(body, null, 2));

        const locationMarker = body.locationMarker;
        delete body.locationMarker;

        const itemLocation: resources.ItemLocation = await this.itemLocationRepo.create(body).then(value => value.toJSON());

        if (!_.isEmpty(locationMarker)) {
            locationMarker.item_location_id = itemLocation.id;
            await this.locationMarkerService.create(locationMarker);
        }
        return await this.findOne(itemLocation.id);
    }

    @validate()
    public async update(id: number, @request(ItemLocationUpdateRequest) data: ItemLocationUpdateRequest): Promise<ItemLocation> {

        const body = JSON.parse(JSON.stringify(data));

        const locationMarker = body.locationMarker;
        delete body.locationMarker;

        // find the existing one without related
        const itemLocation = await this.findOne(id, false);

        // set new values
        itemLocation.Country = body.country;
        itemLocation.Address = body.address;
        itemLocation.Description = body.description;

        // update itemLocation record
        const updatedItemLocation = await this.itemLocationRepo.update(id, itemLocation.toJSON());

        // update related locationMarker
        const existingLocationMarker = updatedItemLocation.related('LocationMarker').toJSON();
        if (!_.isEmpty(locationMarker) && !_.isEmpty(existingLocationMarker)) {
            // we have new locationMarker and existingLocationMarker -> update with new data
            locationMarker.item_location_id = id;
            await this.locationMarkerService.update(existingLocationMarker.id, locationMarker);

        } else if (!_.isEmpty(locationMarker) && _.isEmpty(existingLocationMarker)) {
            // we have new locationMarker but no existingLocationMarker -> create new
            locationMarker.item_location_id = id;
            await this.locationMarkerService.create(locationMarker);

        } else if (_.isEmpty(locationMarker) && !_.isEmpty(existingLocationMarker)) {
            // we have no new locationMarker and existingLocationMarker -> remove existing
            await this.locationMarkerService.destroy(existingLocationMarker.id);
        }

        // finally find and return the updated itemLocation
        return await this.findOne(id);
    }

    public async destroy(id: number): Promise<void> {
        await this.itemLocationRepo.destroy(id);
    }

}
