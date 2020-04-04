import * as React from 'react';
import { ComponentType } from 'react';
import IFactory from './factory/IFactory';
import ContainerDefinition, { TResolver } from './ContainerDefinition';
import ContainerError from './ContainerError';

/**
 * Generates sequential ids
 */
const idGenerator = (() => {
    let nextId = 0;
    return function generateId() {
        return (++nextId).toString();
    };
})();

export default class Container {

    /**
     * Container id
     */
    public readonly id: string;

    /**
     * Components registrations
     */
    protected definitions: IDefinitions = {};

    /**
     * @param {IFactory} factory
     */
    public constructor(public readonly factory: IFactory) {
        this.id = idGenerator();
    }

    /**
     * Registers component
     *
     * @param {string} name
     * @param {React.Component} component
     */
    public register(name: string, component: ComponentType<any>) {
        this.registerAsync(name, () => Promise.resolve(component));

        return this;
    }

    /**
     * Registers async component
     *
     * @param {string} name
     * @param {TResolver} resolver
     */
    public registerAsync(name: string, resolver: TResolver) {
        const definitions = this.definitions;

        if (definitions[name]) {
            throw new ContainerError(`Component "${name}" is already registered`);
        }

        definitions[name] = new ContainerDefinition(resolver).as(name);

        return this;
    }

    /**
     * Registers bulk components
     *
     * @param {object} obj
     */
    public registerBulk(obj: { [name: string]: ComponentType<any> }) {
        for (const name in obj) {
            this.register(name, obj[name]);
        }
    }

    /**
     * Registers bulk async components
     *
     * @param {object} obj
     */
    public registerBulkAsync(obj: { [name: string]: TResolver }) {
        for (const name in obj) {
            this.registerAsync(name, obj[name]);
        }
    }

    /**
     * Resolves component
     *
     * @param {string} name
     *
     * @return {Promise}
     */
    public get(name: string): Promise<IResult> {
        return new Promise<IResult>((resolve, reject) => {
            const definition = this.definitions[name];
            const resolver = definition ? definition.getResolver() : null;

            if (!resolver) {
                reject(new ContainerError(`No component "${name}" registered`));
                return;
            }

            resolver()
                .then((component) => {
                    // check if esModule default export returned
                    if ((component as any).__esModule && (component as any).default) {
                        component = (component as any).default;
                    }

                    // set display name for debugging
                    component.displayName = name;

                    resolve({component, definition});

                }).catch(reject);
        });
    }

    /**
     * Gets items count
     *
     * @return {number}
     */
    public count() {
        return Object.keys(this.definitions).length;
    }
}

interface IDefinitions {
    [name: string]: ContainerDefinition;
}

interface IResult {
    component: ComponentType;
    definition: ContainerDefinition;
}
