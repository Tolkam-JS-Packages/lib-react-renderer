import { ComponentType, ReactElement } from 'react';
interface IFactory {

    /**
     * Injects component into DOM
     *
     * @param {TComponent} component
     * @param {IProps} props
     * @param {ITarget} target
     */
    inject: (component: TComponent, props: IProps, target: ITarget) => void,

    /**
     * Disposes target
     *
     * @param {ITarget} target
     */
    dispose: (target: ITarget) => void,

    /**
     * Sets custom element factory
     * (useful to wrap component with provider)
     *
     * @param {TElementFactory} factory
     */
    useElementFactory: (factory: TElementFactory) => void,
}

type TComponent = ComponentType;

interface IProps {
    [k: string]: any;
}

interface ITarget extends Element {
}

type TElementFactory = (component: TComponent, props: IProps) => ReactElement;

export default IFactory;

export { TElementFactory, TComponent, IProps, ITarget };
