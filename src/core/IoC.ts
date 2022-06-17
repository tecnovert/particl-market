// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

/**
 * IOC - CONTAINER
 * ----------------------------------------
 *
 * Bind every controller and service to the ioc container. All controllers
 * will then be bonded to the express structure with their defined routes.
 */

import * as glob from 'glob';
import * as path from 'path';
import { Container, decorate, injectable } from 'inversify';
import { Types, Core, Targets } from '../constants';
import { events, EventEmitter } from './api/events';
import { Logger } from './Logger';
import { IocConfig } from '../config/IocConfig';
import { Environment } from './helpers/Environment';

export class IoC {

    public container: Container;
    public libConfiguration: (container: Container) => Container;
    public customConfiguration: (container: Container) => Container;

    private log: Logger = new Logger(__filename);

    constructor() {
        this.container = new Container();
        const config = new IocConfig();
        config.configure(this);
    }

    public configure(configuration: (container: Container) => Container): void {
        this.customConfiguration = configuration;
    }

    public configureLib(configuration: (container: Container) => Container): void {
        this.libConfiguration = configuration;
    }

    public async bindModules(): Promise<void> {

        this.log.info('binding core');
        this.bindCore();

        if (this.libConfiguration) {
            this.container = this.libConfiguration(this.container);
        }

        this.log.info('binding models');
        await this.bindModels();
        this.log.info('binding repositories');
        await this.bindRepositories();
        this.log.info('binding services');
        await this.bindServices();
        this.log.info('binding commands');
        await this.bindCommands();
        this.log.info('binding factories');
        await this.bindFactories();
        this.log.info('binding message validators');
        await this.bindMessageValidators();
        this.log.info('binding message processors');
        await this.bindMessageProcessors();
        this.log.info('binding listeners');
        await this.bindListeners();

        if (!Environment.isTest()) {
            this.log.info('binding middlewares');
            await this.bindMiddlewares();
            this.log.info('binding controllers');
            await this.bindControllers();
        }

        if (this.customConfiguration) {
            this.container = this.customConfiguration(this.container);
        }
        this.log.info('binding done.');

    }

    private bindCore(): void {
        this.container.bind<typeof Logger>(Types.Core).toConstantValue(Logger).whenTargetNamed(Core.Logger);
        this.container.bind<EventEmitter>(Types.Core).toConstantValue(events).whenTargetNamed(Core.Events);
    }

    private bindModels(): Promise<void> {
        return this.bindFiles('/models/**/*.ts', Targets.Model, (name: any, value: any) => {
            decorate(injectable(), value);
            this.container
                .bind<any>(Types.Model)
                .toConstantValue(value)
                .whenTargetNamed(name);
        });
    }

    private bindRepositories(): Promise<void> {
        return this.bindFiles(
            '/repositories/**/*Repository.ts',
            Targets.Repository,
            (name: any, value: any) => this.bindFile(Types.Repository, name, value));
    }

    private bindServices(): Promise<void> {
        return this.bindFiles(
            '/services/**/*Service.ts',
            Targets.Service,
            (name: any, value: any) => this.bindFile(Types.Service, name, value));
    }

    private bindCommands(): Promise<void> {
        return this.bindFiles(
            '/commands/**/*Command.ts',
            Targets.Command,
            (name: any, value: any) => this.bindFile(Types.Command, name, value));
    }

    private bindFactories(): Promise<void> {
        return this.bindFiles(
            '/factories/**/*Factory.ts',
            Targets.Factory,
            (name: any, value: any) => this.bindFile(Types.Factory, name, value));
    }

    private bindMessageProcessors(): Promise<void> {
        return this.bindFiles(
            '/messageprocessors/**/*Processor.ts',
            Targets.MessageProcessor,
            (name: any, value: any) => this.bindFile(Types.MessageProcessor, name, value));
    }

    private bindMessageValidators(): Promise<void> {
        return this.bindFiles(
            '/messagevalidators/**/*Validator.ts',
            Targets.MessageValidator,
            (name: any, value: any) => this.bindFile(Types.MessageValidator, name, value));
    }

    private bindMiddlewares(): Promise<void> {
        return this.bindFiles(
            '/middlewares/**/*Middleware.ts',
            Targets.Middleware,
            (name: any, value: any) => this.bindFile(Types.Middleware, name, value));
    }

    private bindControllers(): Promise<void> {
        return this.bindFiles(
            '/controllers/**/*Controller.ts',
            Targets.Controller,
            () => null);
    }

    private bindListeners(): Promise<void> {
        return this.bindFiles('/listeners/**/*Listener.ts', Targets.Listener, (name: any, value: any) => {

            decorate(injectable(), value);
            this.container
                .bind<any>(Types.Listener)
                .to(value)
                .inSingletonScope()
                .whenTargetNamed(name);

            // this.log.info('name: ', name);
            const listener: interfaces.Listener = this.container.getNamed<any>(Types.Listener, name);
            events.on(value.Event, (...args) => listener.act(...args));
        });
    }

    private bindFile(type: any, name: string, value: any): void {
        decorate(injectable(), value);
        this.container
            .bind<any>(type)
            .to(value)
            .inSingletonScope()
            .whenTargetNamed(name);
    }

    private bindFiles(filePath: string, target: any, callback: (name: any, value: any) => void): Promise<void> {
        return new Promise<void>((resolve) => {
            this.getFiles(filePath, (files: string[]) => {
                // this.log.info('bindFiles, filePath:', filePath);
                // this.log.info('bindFiles, files:', files);
                files.forEach((file: any) => {
                    let fileExport;
                    let fileClass;
                    let fileTarget;
                    const isRecursive = file.name.indexOf('.') > 0;
                    try {
                        fileExport = require(`${file.filePath}`);
                    } catch (e: any) {
                        this.log.warn(e.message);
                        return;
                    }
                    if (fileExport === undefined) {
                        this.log.warn(`Could not find the file ${file.name}!`);
                        return;
                    }
                    if (isRecursive) {
                        fileClass = this.getClassOfFileExport(file.name, fileExport);
                        fileTarget = this.getTargetOfFile(file.name, target);

                    } else {
                        fileClass = fileExport[file.name];
                        fileTarget = target && target[file.name];
                    }

                    if (fileClass === undefined) {
                        this.log.warn(`Name of the file '${file.name}' does not match to the class name!`);
                        return;
                    }

                    if (fileTarget === undefined) {
                        this.log.warn(`Please define your '${file.name}' class is in the target constants.`);
                        return;
                    }

                    callback(fileTarget, fileClass);
                });
                resolve();
            });
        });
    }

    private getClassOfFileExport(name: string, fileExport: any): any {
        const fileParts = name.split('.');
        let fileClass = fileExport;
        fileParts.forEach((part) => {
            if (fileClass.hasOwnProperty(part)) {
                fileClass = fileClass[part];
            }
        });
        return fileClass;
    }

    private getTargetOfFile(name: string, target: any): any {
        const fileParts = name.split('.');
        let fileTarget = target;
        fileParts.forEach((part) => {
            fileTarget = fileTarget[part];
        });
        return fileTarget;
    }

    private getBasePath(): string {
        const baseFolder = __dirname.indexOf(`${path.sep}src${path.sep}`) >= 0 || __dirname.indexOf(`${path.sep}test${path.sep}`) >= 0
            ? `${path.sep}src${path.sep}`
            : `${path.sep}dist${path.sep}`;
        const baseRoot = __dirname.substring(0, __dirname.indexOf(baseFolder)); // path.normalize(__dirname + '/../../..')
        // this.log.info('baseFolder: ', baseFolder);
        // this.log.info('baseRoot: ', baseFolder);
        return path.join(baseRoot, baseFolder, 'api');
    }

    private getFiles(filePath: string, done: (files: any[]) => void): void {
        const isTypeScript = __dirname.indexOf(`${path.sep}src${path.sep}`) >= 0 || __dirname.indexOf(`${path.sep}test${path.sep}`) >= 0;
        if (!isTypeScript) {
            filePath = filePath.replace('.ts', '.js');
        }

        const pattern = this.getBasePath() + filePath;
        glob(pattern, (err: any, files: string[]) => {
            if (err) {
                this.log.warn(`Could not read the folder ${filePath}!`);
                return;
            }
            done(files.map((p: string) => this.parseFilePath(p)));
        });
    }

    private parseFilePath(filePath: string): any {
        const p = filePath.substring(this.getBasePath().length + 1);
        const dir = p.split('/')[0];
        const file = p.substr(dir.length + 1);
        const name = file.replace('/', '.').substring(0, file.length - 3);
        return {
            filePath,
            dir,
            file,
            name
        };
    }

}
