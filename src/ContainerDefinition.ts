import { ComponentType } from 'react';

export default class ContainerDefinition {

    protected name: string | null = null;

    protected options: IOptions = {};

    protected defaultProps: IProps = {};

    /**
     * @param {TResolver} resolver
     */
    public constructor(protected resolver: TResolver) {
    }

    /**
     * Sets component alias
     *
     * @param {string} name
     *
     * @return {ContainerDefinition}
     */
    public as(name: string) {
        this.name = name;
        return this;
    }

    /**
     * Sets default props
     *
     * @param {IProps} props
     *
     * @return {ContainerDefinition}
     */
    public withDefaultProps(props: IProps) {
        this.defaultProps = props;
        return this;
    }

    /**
     * Sets options
     *
     * @param {IOptions} options
     *
     * @return {ContainerDefinition}
     */
    public withOptions(options: IOptions) {
        this.options = options;
        return this;
    }

    /**
     * @return {TResolver}
     */
    public getResolver() {
        return this.resolver;
    }

    /**
     * @return {string}
     */
    public getName() {
        return this.name;
    }

    /**
     * @return {IOptions}
     */
    public getOptions() {
        return this.options;
    }

    /**
     * @return {IProps}
     */
    public getDefaultProps() {
        return this.defaultProps;
    }
}

type TResolver = () => Promise<ComponentType | any>; // unable to constrain the return type of import()

interface IProps {
    [k: string]: any;
}

interface IOptions {
    // html tag name to use
    tag?: string;

    // container class name
    className?: string;
}

export { TResolver, IOptions };
