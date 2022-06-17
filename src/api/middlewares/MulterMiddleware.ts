// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Request, Response, NextFunction } from 'express';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../core/Logger';
import { Types, Core } from '../../constants';
import * as multer from 'multer';
import { DataDir } from '../../core/helpers/DataDir';

export class MulterMiddleware implements interfaces.Middleware {

    public log: LoggerType;
    private upload: any;

    constructor(@inject(Types.Core) @named(Core.Logger) Logger: typeof LoggerType) {
        this.log = new Logger(__filename);

        // setup multer middleware
        // this.upload = multer({ dest: 'data/uploads/' });
        this.upload = multer({ dest: DataDir.getUploadsPath(), fileFilter: this.imageFilter });
    }

    public use = (req: Request, res: Response, next: NextFunction): void => {
        const multerMiddleware = this.upload.any();
        multerMiddleware(req, res, next);
    };

    /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
    public imageFilter = (req, file, cb) => {
        // accept image only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }

        cb(null, true);
    };
    /* eslint-enable @typescript-eslint/explicit-module-boundary-types */
}
