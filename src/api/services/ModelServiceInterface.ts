// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

export interface ModelServiceInterface<T> {
    findOne(id: number, withRelated: boolean): Promise<T>;
}
