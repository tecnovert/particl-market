// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

export enum ActionMessageObjects {

    RESENT_MSGID = 'resent.msgid',      // added to resent messages

    ORDER_HASH = 'order.hash',                      // MPA_BID
    BID_ON_MARKET = 'market.address',               // MPA_BID
    TXID_LOCK = 'txid.lock',                        // MPA_LOCK
    SHIPPING_MEMO = 'shipping.memo',                // MPA_SHIP
    TXID_RELEASE = 'txid.release',                  // MPA_RELEASE
    RELEASE_MEMO = 'release.memo',                  // MPA_RELEASE
    TXID_REFUND = 'txid.refund',                    // MPA_REFUND
    REFUND_MEMO = 'refund.memo',                    // MPA_REFUND
    COMPLETE_MEMO = 'complete.memo',                // MPA_COMPLETE
    TXID_COMPLETE = 'txid.complete',                // MPA_COMPLETE
    BID_REJECT_REASON = 'reject.reason'             // MPA_REJECT

}
