// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { RpcRequest } from '../../requests/RpcRequest';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { BaseCommand } from '../BaseCommand';
import { RpcCommandFactory } from '../../factories/RpcCommandFactory';
import { Commands } from '../CommandEnumType';
import { PriceTickerService } from '../../services/model/PriceTickerService';
import { MessageException } from '../../exceptions/MessageException';
import { PriceTicker } from '../../models/PriceTicker';

export class PriceTickerRootCommand extends BaseCommand implements RpcCommandInterface<Bookshelf.Collection<PriceTicker>> {

    public log: LoggerType;

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.PriceTickerService) private priceTickerService: PriceTickerService
    ) {
        super(Commands.PRICETICKER_ROOT);
        this.log = new Logger(__filename);
    }

    /**
     *
     * data.params[]:
     * [0] currency
     * [...n] currency
     *
     * example: [ETH, BTC, XRP]
     *
     * @param data
     * @param rpcCommandFactory
     * @returns {Promise<Bookshelf.Collection<PriceTicker>>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest, rpcCommandFactory: RpcCommandFactory): Promise<Bookshelf.Collection<PriceTicker>> {
        if (data.params.length > 0) {
            // convert params to uppercase
            const currencies: string[] = [];
            for (const param of data.params) {
                currencies.push(param.toUpperCase());
            }
            const returnData: any = await this.priceTickerService.getPriceTickers(currencies);
            return returnData;
        } else {
            throw new MessageException('Currency can\'t be blank');
        }
    }

    public async validate(data: RpcRequest): Promise<RpcRequest> {
        return data;
    }

    public usage(): string {
        return this.getName() + ' <currency> [currencies...]  -  ' + this.description();
    }

    public help(): string {
        return this.usage() + '\n'
            + '    <currency>               - Currency. ';
    }

    public description(): string {
        return 'Commands for managing PriceTicker.';
    }

    public example(): any {
        return 'priceticker PART BTC';
    }

}
