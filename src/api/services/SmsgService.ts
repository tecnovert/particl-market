// Copyright (c) 2017-2020, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../core/Logger';
import { Types, Core, Targets } from '../../constants';
import {CoreRpcService, RpcWalletInfo} from './CoreRpcService';
import { MarketplaceMessage } from '../messages/MarketplaceMessage';
import { SmsgSendResponse } from '../responses/SmsgSendResponse';
import { MessageException } from '../exceptions/MessageException';
import { CoreSmsgMessage } from '../messages/CoreSmsgMessage';
import {SmsgSendParams} from '../requests/action/SmsgSendParams';

export class SmsgService {

    public log: LoggerType;

    constructor(
        @inject(Types.Service) @named(Targets.Service.CoreRpcService) public coreRpcService: CoreRpcService,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    /**
     *
     * @param marketplaceMessage
     * @param sendParams
     */
    public async canAffordToSendMessage(marketplaceMessage: MarketplaceMessage, sendParams: SmsgSendParams): Promise<boolean> {
        const estimate: SmsgSendResponse = await this.estimateFee(marketplaceMessage, sendParams);
        const wallet: RpcWalletInfo = await this.coreRpcService.getWalletInfo();
        return (wallet.balance > estimate.fee! || wallet.blind_balance > estimate.fee! || wallet.anon_balance > estimate.fee!);
    }

    /**
     *
     * @param marketplaceMessage
     * @param sendParams
     */
    public async estimateFee(marketplaceMessage: MarketplaceMessage, sendParams: SmsgSendParams): Promise<SmsgSendResponse> {
        const estimateFee = sendParams.estimateFee;
        sendParams.estimateFee = true; // forcing estimation just in case someone calls this directly with incorrect params
        const smsgSendResponse = await this.sendMessage(marketplaceMessage, sendParams);
        sendParams.estimateFee = estimateFee;
        return smsgSendResponse;
    }

    /**
     *
     * @param marketplaceMessage
     * @param sendParams
     */
    public async sendMessage(marketplaceMessage: MarketplaceMessage, sendParams: SmsgSendParams): Promise<SmsgSendResponse> {
        return await this.smsgSend(sendParams.fromAddress, sendParams.toAddress, marketplaceMessage, sendParams.paidMessage,
            sendParams.daysRetention, sendParams.estimateFee);
    }

    /**
     * ﻿Adds a private key (as returned by dumpprivkey) to the smsg database.
     * The imported key can receive messages even if the wallet is locked.
     *
     * Arguments:
     * 1. "privkey"          (string, required) The private key (see dumpprivkey)
     * 2. "label"            (string, optional, default="") An optional label
     *
     * @param {string} privateKey
     * @param {string} label
     * @returns {Promise<boolean>}
     */
    public async smsgImportPrivKey(privateKey: string, label: string = 'default market'): Promise<boolean> {
        return await this.coreRpcService.call('smsgimportprivkey', [privateKey, label])
            .then(response => true)
            .catch(error => {
                this.log.error('smsgImportPrivKey failed: ', error);
                return false;
            });
    }

    /**
     * Decrypt and display all received messages.
     * Warning: clear will delete all messages.
     *
     * ﻿smsginbox [all|unread|clear] filter options
     *
     * @param {string} mode
     * @param {string} filter
     * @param {object} options
     * @returns {Promise<any>}
     */
    public async smsgInbox(mode: string = 'all',
                           filter: string = '',
                           options: object = {}): Promise<any> {
        const response = await this.coreRpcService.call('smsginbox', [mode, filter, options], false);
        // this.log.debug('got response:', response);
        return response;
    }

    /**
     * ﻿Send an encrypted message from address to another
     *
     * response:
     * {
     * "result": "Sent.",
     * "txid": "756be1d7b7ebcac344792bd2f050b75240ec7bc0c47d706adde8f87bec260c22",
     * "fee": 0.002554
     * }
     * {
     * "result": "Send failed.",
     * "error": "Message is too long, 5392 > 4096"
     * }
     *
     * @param {string} fromAddress
     * @param {string} toAddress
     * @param {MarketplaceMessage} message
     * @param {boolean} paidMessage
     * @param {number} daysRetention
     * @param {boolean} estimateFee
     * @returns {Promise<any>}
     */
    public async smsgSend(fromAddress: string,
                          toAddress: string,
                          message: MarketplaceMessage,
                          paidMessage: boolean = true,
                          daysRetention: number = parseInt(process.env.PAID_MESSAGE_RETENTION_DAYS, 10),
                          estimateFee: boolean = false): Promise<SmsgSendResponse> {

        this.log.debug('smsgSend, from: ' + fromAddress + ', to: ' + toAddress);
        const params: any[] = [
            fromAddress,
            toAddress,
            JSON.stringify(message),
            paidMessage,
            daysRetention,
            estimateFee
        ];
        const response: SmsgSendResponse = await this.coreRpcService.call('smsgsend', params);
        this.log.debug('smsgSend, response: ' + JSON.stringify(response, null, 2));
        if (response.error) {
            this.log.error('ERROR: ', JSON.stringify(response, null, 2));
            throw new MessageException('Failed to send message.');
        }
        return response;
    }


    /**
     * List and manage keys.
     * ﻿﻿[whitelist|all|wallet|recv <+/-> <address>|anon <+/-> <address>]
     *
     * response:
     * ﻿{
     * "wallet_keys": [
     * ],
     * "smsg_keys": [
     *   {
     *     "address": "pmktyVZshdMAQ6DPbbRXEFNGuzMbTMkqAA",
     *     "public_key": "MkRjwngPvzX17eF6sjadwjgfjHmn3E9wVheSTi1UjecUNxxZtBFyVJLiWCrMUrm4FbpFW3ehg5HaWfxFd3xQnRzj",
     *     "receive": "1",
     *     "anon": "1",
     *     "label": "default market"
     *   }
     * ],
     * "result": "1"
     * }
     *
     * @returns {Promise<any>}
     */
    public async smsgLocalKeys(): Promise<any> {
        const response = await this.coreRpcService.call('smsglocalkeys');
        // this.log.debug('smsgLocalKeys, response: ' + JSON.stringify(response, null, 2));
        return response;
    }

    /**
     * View smsg by msgid.
     *
     * Arguments:
     * 1. "msgid"              (string, required) The id of the message to view.
     * 2. options              (json, optional) Options object.
     * {
     *       "delete": bool                 (bool, optional) Delete msg if true.
     *       "setread": bool                (bool, optional) Set read status to value.
     *       "encoding": str                (string, optional, default="ascii") Display message data in encoding, values: "hex".
     * }
     *
     * Result:
     * {
     *  "msgid": "..."                    (string) The message identifier
     *  "version": "str"                  (string) The message version
     *  "location": "str"                 (string) inbox|outbox|sending
     *  "received": int                     (int) Time the message was received
     *  "to": "str"                       (string) Address the message was sent to
     *  "read": bool                        (bool) Read status
     *  "sent": int                         (int) Time the message was created
     *  "paid": bool                        (bool) Paid or free message
     *  "daysretention": int                (int) Number of days message will stay in the network for
     *  "expiration": int                   (int) Time the message will be dropped from the network
     *  "payloadsize": int                  (int) Size of user message
     *  "from": "str"                     (string) Address the message was sent from
     * }
     *
     * @returns {Promise<CoreSmsgMessage>}
     */
    public async smsg(msgId: string, remove: boolean = false, setRead: boolean = true): Promise<CoreSmsgMessage> {
        const response = await this.coreRpcService.call('smsg', [msgId, {
                delete: remove,
                setread: setRead,
                encoding: 'text'
            }
        ]);
        // this.log.debug('smsg, response: ' + JSON.stringify(response, null, 2));
        return response;
    }

    /**
     * ﻿Add address and matching public key to database.
     * ﻿smsgaddaddress <address> <pubkey>
     *
     * @param {string} address
     * @param {string} publicKey
     * @returns {Promise<boolean>}
     */
    public async smsgAddAddress(address: string, publicKey: string): Promise<boolean> {
        return await this.coreRpcService.call('smsgaddaddress', [address, publicKey])
            .then(response => {
                this.log.debug('smsgAddAddress, response: ' + JSON.stringify(response, null, 2));
                if (response.result === 'Public key added to db.'
                    || (response.result === 'Public key not added to db.' && response.reason === 'Public key exists in database')) {
                    return true;
                } else {
                    return false;
                }
            })
            .catch(error => {
                this.log.error('smsgAddAddress failed: ', error);
                return false;
            });
    }

    /**
     * Enable receiving messages on <address>.
     * Key for "address" must exist in the wallet.
     *
     * @param {string} address
     * @returns {Promise<boolean>}
     */
    public async smsgAddLocalAddress(address: string): Promise<boolean> {
        return await this.coreRpcService.call('smsgaddlocaladdress', [address])
            .then(response => {
                this.log.debug('smsgAddLocalAddress, response: ' + JSON.stringify(response, null, 2));
                if (response.result === 'Receiving messages enabled for address.'
                    || (response.result === 'Address not added.' && response.reason === 'Key exists in database')) {
                    return true;
                } else {
                    return false;
                }
            })
            .catch(error => {
                this.log.error('smsgAddLocalAddress failed: ', error);
                return false;
            });
    }

}
