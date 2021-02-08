import { createElement } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { logger } from '@tolkam/lib-utils';
import IFactory, { IProps, ITarget, TComponent, TElementFactory } from './IFactory';
import { ATTR_CONTAINER_GROUP, PH_PROP } from '../constants';

export default class ReactDOMFactory implements IFactory {

    /**
     * @type {IOptions}
     */
    protected options: Partial<IOptions> = {
        noRoot: false,
        allowMultipleChildren: true,
    };

    /**
     * @type {TElementFactory}
     */
    protected elementFactory: TElementFactory;

    /**
     * @param {IOptions} options
     */
    public constructor(options: Partial<IOptions> = {}) {
        this.options = {
            ...this.options,
            ...options,
        };

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
    public inject(component: TComponent, props: IProps, target: ITarget) {
        const that = this;
        const o = that.options;

        render(that.elementFactory(component, props), target, () => {
            let children = Array.from(target.childNodes);

            // disallow multiple children
            if (!o.allowMultipleChildren && children.length > 1) {
                logger.error('Component "%s" should render a single root element', component.name);
                this.dispose(target);
                return;
            }

            // without root element
            // this works with react < v17
            if (o.noRoot) {
                // apply container group to each of the children
                // to be able to find components later after target is replaced
                const group = target.getAttribute(ATTR_CONTAINER_GROUP);
                if (group) {
                    children = children.map((child: Element, i) => {

                        // store placeholder to first child
                        // to be able to restore it during renderer unmount
                        if (i === 0) {
                            child[PH_PROP] = target[PH_PROP];
                        }

                        child.setAttribute(ATTR_CONTAINER_GROUP, group);

                        return child;
                    });
                }

                target.replaceWith(...children);
            }
        });
    }

    /**
     * @inheritDoc
     */
    public dispose(target: ITarget) {
        // set target to parent if component has no root element
        if (this.options.noRoot) {
            target = target.parentElement!;
        }

        unmountComponentAtNode(target);
    }
}

interface IOptions {
    // do not wrap with root element
    noRoot: boolean,

    // allow component to render multiple children without single parent
    allowMultipleChildren: boolean,
}
