import { createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import IFactory, { IProps, ITarget, TComponent, TElementFactory } from './IFactory';
import { ROOT_PROP } from '../constants';

export default class ReactDOMFactory implements IFactory {

    /**
     * @type {TElementFactory}
     */
    protected elementFactory: TElementFactory;

    public constructor() {
        this.elementFactory = (component, props) => createElement(component, props);
    }

    /**
     * @inheritDoc
     */
    public useElementFactory(factory: TElementFactory) {
        this.elementFactory = factory;
    }

    /**
     * @inheritDoc
     */
    public inject(component: TComponent, props: IProps, target: ITarget): Root {
        let root = target[ROOT_PROP];
        if(root === undefined) {
            root = createRoot(target);
            target[ROOT_PROP] = root;
        }

        root.render(this.elementFactory(component, props));

        return root;
    }

    /**
     * @inheritDoc
     */
    public dispose(target: ITarget): void {
        if(target[ROOT_PROP]) {
            target[ROOT_PROP].unmount();
        }
    }
}
