// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * from 'jest';
import { ImageProcessing } from '../../../src/core/helpers/ImageProcessing';
import { ImageTriplet } from '../../../src/core/helpers/ImageTriplet';
import * as Jimp from 'jimp';
import * as piexif from 'piexifjs';
import { ImageVersions } from '../../../src/core/helpers/ImageVersionEnumType';
import { CoreMessageVersion } from '../../../src/api/enums/CoreMessageVersion';
import { MessageVersions } from '../../../src/api/messages/MessageVersions';
import { MPAction } from '@zasmilingidiot/omp-lib/dist/interfaces/omp-enums';
import { Logger as LoggerType } from '../../../src/core/Logger';
import * as dotenv from 'dotenv';

describe('ImageProcessing', () => {

    const log: LoggerType = new LoggerType(__filename);

    beforeAll(async () => {
        dotenv.config({ path: '.env.test' });
    });


    test('Test data should have metadata before processing', async () => {
        expect.assertions(0);
        const rawImage = ImageProcessing.PIEXIF_JPEG_START_STR + ImageProcessing.milkcatSmall;
        try {
            const processedImage: ImageTriplet = piexif.remove(rawImage);
        } catch ( ex ) {
            expect(ex).not.toBe('Exif not found.');
            expect(false).toBe(true);
        }
    });

    test('convertToJPEG() should complain of invalid format', async () => {
        expect.assertions(1);
        await ImageProcessing.convertToJPEG(ImageProcessing.milkcatBroken).catch(e =>
            expect(e).toEqual('unknown JPEG marker 0')
        );
    });

    test('convertToJPEG() should resize tall(er than wide, by the ratio in the static bounds) image to reach MAX height', async () => {
        expect.assertions(8);
        const rawImage = ImageProcessing.milkcatTall;

        const toVersions = [ImageVersions.LARGE, ImageVersions.MEDIUM, ImageVersions.THUMBNAIL];
        const originalData: string = await ImageProcessing.convertToJPEG(rawImage);
        const resizedDatas: Map<string, string> = await ImageProcessing.resizeImageData(originalData, toVersions);

        // medium
        const mediumData = resizedDatas.get(ImageVersions.MEDIUM.propName) || '';
        expect(mediumData).not.toEqual(null);
        expect(mediumData).not.toEqual('');

        let dataBuffer = Buffer.from(mediumData, 'base64');
        let imageBuffer = await Jimp.read(dataBuffer);

        expect(imageBuffer.bitmap.height).toBe(ImageVersions.MEDIUM.imageHeight);
        expect(imageBuffer.bitmap.width).toBeLessThanOrEqual(ImageVersions.MEDIUM.imageWidth);

        // thumb
        const thumbData = resizedDatas.get(ImageVersions.THUMBNAIL.propName) || '';
        expect(mediumData).not.toEqual(null);
        expect(mediumData).not.toEqual('');

        dataBuffer = Buffer.from(thumbData, 'base64');
        imageBuffer = await Jimp.read(dataBuffer);

        expect(imageBuffer.bitmap.height).toBe(ImageVersions.THUMBNAIL.imageHeight);
        expect(imageBuffer.bitmap.width).toBeLessThanOrEqual(ImageVersions.THUMBNAIL.imageWidth);

    });

    test('resizeImageData() should resize wide(er than tall, by the ratio in the static bounds) image to reach MAX width', async () => {
        expect.assertions(12);
        const rawImage = ImageProcessing.milkcatWide;

        const toVersions = [ImageVersions.LARGE, ImageVersions.MEDIUM, ImageVersions.THUMBNAIL];
        const originalData: string = await ImageProcessing.convertToJPEG(rawImage);
        const resizedDatas: Map<string, string> = await ImageProcessing.resizeImageData(originalData, toVersions);

        // TODO: create separate tests
        // large
        const largeData = resizedDatas.get(ImageVersions.LARGE.propName) || '';
        expect(largeData).not.toEqual(null);
        expect(largeData).not.toEqual('');

        let dataBuffer = Buffer.from(largeData, 'base64');
        let imageBuffer = await Jimp.read(dataBuffer);

        const dataBufferOriginal = Buffer.from(rawImage, 'base64');
        const imageBufferOriginal = await Jimp.read(dataBufferOriginal);

        expect(imageBuffer.bitmap.width).toBe(ImageVersions.LARGE.imageWidth);
        expect(imageBuffer.bitmap.height).toBe(ImageVersions.LARGE.imageHeight);

        // medium
        const mediumData = resizedDatas.get(ImageVersions.MEDIUM.propName) || '';
        expect(mediumData).not.toEqual(null);
        expect(mediumData).not.toEqual('');

        dataBuffer = Buffer.from(mediumData, 'base64');
        imageBuffer = await Jimp.read(dataBuffer);

        expect(imageBuffer.bitmap.width).toBe(ImageVersions.MEDIUM.imageWidth);
        expect(imageBuffer.bitmap.height).toBeLessThanOrEqual(ImageVersions.MEDIUM.imageHeight);

        // thumb
        const thumbData = resizedDatas.get(ImageVersions.THUMBNAIL.propName) || '';
        expect(mediumData).not.toEqual(null);
        expect(mediumData).not.toEqual('');

        dataBuffer = Buffer.from(thumbData, 'base64');
        imageBuffer = await Jimp.read(dataBuffer);

        expect(imageBuffer.bitmap.width).toBe(ImageVersions.THUMBNAIL.imageWidth);
        expect(imageBuffer.bitmap.height).toBeLessThanOrEqual(ImageVersions.THUMBNAIL.imageHeight);

    });


    test('resizeImageToVersion() should resize tall(er than wide, by the ratio in the static bounds) image to thumbnail size', async () => {
        expect.assertions(3);
        const rawImage = ImageProcessing.milkcatTall;
        const resizedImage = await ImageProcessing.resizeImageToVersion(rawImage, ImageVersions.THUMBNAIL);

        expect(resizedImage).not.toEqual(null);

        const dataBuffer = Buffer.from(resizedImage, 'base64');
        const imageBuffer = await Jimp.read(dataBuffer);

        expect(imageBuffer.bitmap.height).toBe(ImageVersions.THUMBNAIL.imageHeight);
        expect(imageBuffer.bitmap.width).toBeLessThanOrEqual(ImageVersions.THUMBNAIL.imageWidth);
    });


    test('resizeImageToVersion() should resize wide(er than tall, by the ratio in the static bounds) image to thumbnail size', async () => {
        expect.assertions(3);
        const rawImage = ImageProcessing.milkcatWide;
        const resizedImage = await ImageProcessing.resizeImageToVersion(rawImage, ImageVersions.THUMBNAIL);

        expect(resizedImage).not.toEqual(null);

        const dataBuffer = Buffer.from(resizedImage, 'base64');
        const imageBuffer = await Jimp.read(dataBuffer);

        expect(imageBuffer.bitmap.width).toBe(ImageVersions.THUMBNAIL.imageWidth);
        expect(imageBuffer.bitmap.height).toBeLessThanOrEqual(ImageVersions.THUMBNAIL.imageHeight);
    });

});
