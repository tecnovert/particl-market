// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import * as math from 'mathjs';
import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { RpcRequest } from '../../requests/RpcRequest';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { Commands } from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { SmsgSendResponse } from '../../responses/SmsgSendResponse';
import { MessageException } from '../../exceptions/MessageException';
import { MarketService } from '../../services/model/MarketService';
import { ListingItemTemplateService } from '../../services/model/ListingItemTemplateService';
import { SmsgSendParams } from '../../requests/action/SmsgSendParams';
import { CoreRpcService } from '../../services/CoreRpcService';
import { ModelNotFoundException } from '../../exceptions/ModelNotFoundException';
import { CryptocurrencyAddressService } from '../../services/model/CryptocurrencyAddressService';
import { ItemPriceService } from '../../services/model/ItemPriceService';
import { ProfileService } from '../../services/model/ProfileService';
import { IdentityService } from '../../services/model/IdentityService';
import { MarketAddActionService } from '../../services/action/MarketAddActionService';
import { MarketImageAddActionService } from '../../services/action/MarketImageAddActionService';
import { MarketAddRequest } from '../../requests/action/MarketAddRequest';
import { MarketImageAddRequest } from '../../requests/action/MarketImageAddRequest';
import { BooleanValidationRule, CommandParamValidationRules, EnumValidationRule, IdValidationRule, MessageRetentionValidationRule,
    ParamValidationRule, RingSizeValidationRule } from '../CommandParamValidation';
import { OutputType } from '@zasmilingidiot/omp-lib/dist/interfaces/crypto';
import { CoreMessageVersion } from '../../enums/CoreMessageVersion';
import { RpcUnspentOutput } from '@zasmilingidiot/omp-lib/dist/interfaces/rpc';
import { BigNumber } from 'mathjs';


export class MarketPostCommand extends BaseCommand implements RpcCommandInterface<SmsgSendResponse> {

    constructor(
        // tslint:disable:max-line-length
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.CoreRpcService) public coreRpcService: CoreRpcService,
        @inject(Types.Service) @named(Targets.Service.action.MarketAddActionService) public marketAddActionService: MarketAddActionService,
        @inject(Types.Service) @named(Targets.Service.action.MarketImageAddActionService) public marketImageAddActionService: MarketImageAddActionService,
        @inject(Types.Service) @named(Targets.Service.model.MarketService) public marketService: MarketService,
        @inject(Types.Service) @named(Targets.Service.model.ItemPriceService) public itemPriceService: ItemPriceService,
        @inject(Types.Service) @named(Targets.Service.model.CryptocurrencyAddressService) public cryptocurrencyAddressService: CryptocurrencyAddressService,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemTemplateService) public listingItemTemplateService: ListingItemTemplateService,
        @inject(Types.Service) @named(Targets.Service.model.ProfileService) public profileService: ProfileService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) public identityService: IdentityService
        // tslint:enable:max-line-length
    ) {
        super(Commands.MARKET_POST);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
                new IdValidationRule('marketId', true, this.marketService),
                new IdValidationRule('fromIdentityId', true, this.identityService),
                new MessageRetentionValidationRule('daysRetention', true),
                new BooleanValidationRule('estimateFee', false, false),
                {
                    // todo:
                    name: 'toMarketIdOrAddress',
                    required: false,
                    type: undefined
                },
                new BooleanValidationRule('usePaidImageMessages', false, false),
                new EnumValidationRule('feeType', false, 'OutputType',
                    [OutputType.ANON, OutputType.PART] as string[], OutputType.PART),
                new RingSizeValidationRule('ringSize', false, 12)
            ] as ParamValidationRule[]
        } as CommandParamValidationRules;
    }

    /**
     * posts a ListingItem to the network based on ListingItemTemplate
     *
     * data.params[]:
     *  [0]: promotedMarket: resources.Market
     *  [1]: daysRetention
     *  [2]: estimateFee
     *  [3]: fromDetails: { walletName: string; publishAddress: string; }
     *  [4]: toAddress: string
     *  [5]: paidImageMessages: boolean
     *  [6]: anonFee: boolean
     *  [7]: ringSize: number
     *
     * @param data
     * @returns {Promise<ListingItemTemplate>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<SmsgSendResponse> {

        const promotedMarket: resources.Market = data.params[0];
        const daysRetention: number = data.params[1];
        const estimateFee: boolean = data.params[2];
        const fromDetails: { walletName: string; publishAddress: string; } = data.params[3];
        const toAddress: string = data.params[4];
        const paidImageMessages: boolean = data.params[5];
        const anonFee: boolean = data.params[6];
        const ringSize: number = data.params[7];

        const wallet = fromDetails.walletName;
        const fromAddress = fromDetails.publishAddress;

        const marketAddRequest = {
            sendParams: {
                wallet,
                fromAddress,
                toAddress,
                daysRetention,
                estimateFee,
                anonFee,
                ringSize
            } as SmsgSendParams,
            market: promotedMarket
        } as MarketAddRequest;

        // this.log.debug('execute(), posting market: ', JSON.stringify(promotedMarket, null, 2));

        // first post the Market
        const smsgSendResponse: SmsgSendResponse = await this.marketAddActionService.post(marketAddRequest);

        // then post the Image related to the Market
        const imageSmsgSendResponse: SmsgSendResponse | undefined = await this.postMarketImage(promotedMarket, marketAddRequest, paidImageMessages);
        smsgSendResponse.childResults = imageSmsgSendResponse ? [imageSmsgSendResponse] : undefined;

        // then create the response, add totalFees and availableUtxos
        const unspentUtxos: RpcUnspentOutput[] = await this.coreRpcService.listUnspent(marketAddRequest.sendParams.wallet,
            anonFee ? OutputType.ANON : OutputType.PART);
        smsgSendResponse.availableUtxos = unspentUtxos.length;
        let minRequiredUtxos = 1;

        if (!_.isNil(smsgSendResponse.childResults)) {
            let childSum: BigNumber = math.bignumber(0);
            for (const childResult of smsgSendResponse.childResults) {
                childSum = math.add(childSum, math.bignumber(childResult.fee ? childResult.fee : 0));
            }
            smsgSendResponse.totalFees = +math.format(math.add(childSum, math.bignumber(smsgSendResponse.fee ? smsgSendResponse.fee : 0)), {precision: 8});
            minRequiredUtxos = minRequiredUtxos + (paidImageMessages ? smsgSendResponse.childResults.length : 0);
        } else {
            smsgSendResponse.totalFees = 0;
        }

        if (smsgSendResponse.availableUtxos < minRequiredUtxos) {
            smsgSendResponse.error = 'Not enough utxos.';
        }

        return smsgSendResponse;
    }

    /**
     * data.params[]:
     *  [0]: promotedMarketId
     *  [1]: fromIdentityId
     *  [2]: daysRetention
     *  [3]: estimateFee, optional, default: false
     *  [4]: toMarketIdOrAddress, optional, to which Markets address or to which address the message is sent to.
     *       if number: toMarketId, if string: toAddress, default: the default broadcast/receive address
     *  [5]: paidImageMessages (optional, default: false)
     *  [6]: feeType (optional, default: PART)
     *  [7]: ringSize (optional, default: 12)
     *
     * Promotes a Market.
     *
     * @param {RpcRequest} data
     * @returns {Promise<RpcRequest>}
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {
        await super.validate(data); // validates the basic search params, see: BaseSearchCommand.validateSearchParams()

        const promotedMarket: resources.Market = data.params[0];
        const fromIdentity: resources.Identity = data.params[1];
        const daysRetention = data.params[2];
        const estimateFee = data.params[3];
        const toMarketIdOrAddress: number | string = data.params[4];
        const paidImageMessages: boolean = data.params[5];
        const feeType: OutputType = data.params[6];
        const ringSize: number = data.params[7];

        let toAddress: string | undefined;

        const fromDetails: { walletName: string; publishAddress: string; } = {
            walletName: fromIdentity.wallet,
            publishAddress: fromIdentity.address
        };

        if (_.isNil(toMarketIdOrAddress)) {
            // toMarketIdOrAddress === undefined:
            //  -> send from default Market publishAddress to default Market receiveAddress.
            toAddress = this.marketService.DEFAULT_BROADCAST_ADDRESS;
            fromDetails.publishAddress = toAddress;

        } else {
            if (typeof toMarketIdOrAddress === 'number') {
                // toMarketIdOrAddress === number
                //  -> send from identity's address to the indicated market's receiveAddress.
                toAddress = await this.marketService.findOne(toMarketIdOrAddress)
                    .then(value => value.toJSON() as resources.Market)
                    .then(market => market.receiveAddress)
                    .catch(reason => {
                        throw new ModelNotFoundException('Market');
                    });
            } else if (typeof toMarketIdOrAddress === 'string') {
                // toMarketIdOrAddress === string:
                //  -> send from fromIdentity.address to the indicated address.
                toAddress = toMarketIdOrAddress;
            }
        }

        if (!toAddress) {
            throw new MessageException('Invalid parameters.');
        }

        data.params[0] = promotedMarket;
        data.params[1] = daysRetention;
        data.params[2] = estimateFee;
        data.params[3] = fromDetails;
        data.params[4] = toAddress;
        data.params[5] = paidImageMessages;
        data.params[6] = feeType === OutputType.ANON;
        data.params[7] = ringSize;

        return data;
    }

    public usage(): string {
        // tslint:disable:max-line-length
        return this.getName() + ' <promotedMarketId> <fromIdentityId> [daysRetention] [estimateFee] [toMarketIdOrAddress] [usePaidImageMessages] [feeType] [ringSize]';
        // tslint:enable:max-line-length
    }

    public help(): string {
        return this.usage() + ' -  ' + this.description() + ' \n'
            + '    <promotedMarketId>           - number, The ID of the Market that we want to post. \n'
            + '    <fromIdentityId>             - number, id of the Identity to use for posting.\n'
            + '    <daysRetention>              - [optional] number, days the market will be retained by network.\n'
            + '    <estimateFee>                - [optional] boolean, estimate the fee, don\'t post. \n'
            + '    <toMarketIdOrAddress>        - [optional] number|string, the Market Id to post to or address to post the message to.\n'
            + '    <usePaidImageMessages>       - [optional] boolean, send Images as paid messages. \n'
            + '    <feeType>                    - [optional] OutputType, default: PART. OutputType used to pay for the message fee.\n'
            + '    <ringSize>                   - [optional] number, default: 12. Ring size used if anon used for fee.\n';
    }

    public description(): string {
        return 'Post the Market to the Marketplace browser.';
    }

    public example(): string {
        return 'market ' + this.getName() + ' 1 7';
    }

    /**
     * Post MarketImage
     *
     * @param promotedMarket
     * @param marketAddRequest
     * @param usePaid
     */
    private async postMarketImage(promotedMarket: resources.Market, marketAddRequest: MarketAddRequest,
                                  usePaid: boolean = false): Promise<SmsgSendResponse | undefined> {

        if (!_.isEmpty(promotedMarket.Image)) {

            const image = marketAddRequest.market.Image;
            const cleanedImageDatas = image.ImageDatas ? image.ImageDatas.map(d => ({ ...d, dataId: '' })) : image.ImageDatas;
            image.ImageDatas = cleanedImageDatas;

            // then prepare the ListingItemImageAddRequest for sending the images
            const imageAddRequest = {
                sendParams: marketAddRequest.sendParams,
                market: marketAddRequest.market,
                image,
                withData: true
            } as MarketImageAddRequest;

            // optionally use paid messages
            imageAddRequest.sendParams.messageType = usePaid ? CoreMessageVersion.PAID : undefined;

            return await this.marketImageAddActionService.post(imageAddRequest);
        } else {
            return undefined;
        }
    }
}
