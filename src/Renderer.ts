import { isJson, objectPath } from '@tolkam/lib-utils';
import Container from './Container';
import ContainerDefinition from './ContainerDefinition';
import RendererError from './RendererError';
import { ATTR_CLASS, ATTR_COMPONENT, ATTR_CONTAINER_GROUP, ATTR_PROP, ATTR_PROP_REF, ATTR_PROPS, ATTR_TAG, PH_PROP } from './constants';

const WIN = window;
const DOC = WIN ? WIN.document : null;
const BODY = DOC ? DOC.body : null;

/**
 * Renders React components into existing DOM
 *
 * Inspired by react-habitat package
 * @see https://github.com/DeloitteDigitalAPAC/react-habitat
 */
export default class Renderer {

    /**
     * @type {IOptions}
     */
    protected options: IOptions = {
        selector: ATTR_COMPONENT,
    };

    /**
     * @param {Container} container
     * @param {IOptions} options
     */
    public constructor(protected container: Container, options: Partial<IOptions> = {}) {
        this.options = {...this.options, ...options};

        if (!BODY) {
            throw new RendererError('Document body not found');
        }
    }

    /**
     * Gets the container
     *
     * @return {Container}
     */
    public getContainer() {
        if (!this.container) {
            throw new RendererError('Instance is destroyed');
        }

        return this.container;
    }

    /**
     * Mounts components to placeholders
     *
     * @param {Element|void} target
     * @param {TLifecycleCallback} onMount
     */
    public mount(target?: Element, onMount?: TLifecycleCallback) {
        const that = this;
        target = target || BODY!;

        const placeholders = target.querySelectorAll(`[${that.options.selector}]`);

        if (!placeholders.length) {
            onMount && onMount();
        }

        that.apply(placeholders, onMount);
    }

    /**
     * Performs components unmount and attempts to restore placeholders
     *
     * @param {Element|void} target
     * @param {TLifecycleCallback} onUnmount
     */
    public unmount(target?: Element, onUnmount?: TLifecycleCallback) {
        target = target || BODY!;
        const that = this;
        const container = that.getContainer();

        const mounted = target.querySelectorAll(`[${ATTR_CONTAINER_GROUP}="${container.id}"]`);

        mounted.forEach((containerEl) => {

            // unmount react component
            container.factory.dispose(containerEl);

            // restore placeholder
            try {
                if (containerEl[PH_PROP]) {
                    containerEl.parentNode!.insertBefore(containerEl[PH_PROP], containerEl);
                }
            } finally {
                containerEl.remove();
            }
        });

        onUnmount && onUnmount();
    }

    /**
     * Destroys the instance
     *
     */
    public destroy() {
        this.unmount();
        (this.container as any) = null;
    }

    /**
     * Renders components into placeholders
     *
     * @param {NodeList} nodes
     * @param {Function} cb
     */
    protected apply(nodes: NodeListOf<Element>, cb?: () => any) {
        const that = this;
        const o = that.options;
        const container = that.getContainer();
        const queue: any = [];

        // queue each component rendering
        nodes.forEach((node) => {
            const name = node.getAttribute(o.selector) as string;

            const promise = container.get(name).then((result) => {
                const {component, definition} = result;
                const containerEl = that.createRootElement(node, container.id, definition);

                container.factory.inject(
                    component,
                    that.getProps(node, definition),
                    containerEl,
                );

            }).catch(handleAsyncError);

            queue.push(promise);
        });

        // resolve queue
        Promise.all(queue)
            .catch(handleAsyncError)
            .finally(() => {
                // handle errors that may occur in done callback
                try {
                    cb && cb();
                } catch (e) {
                    handleAsyncError(e);
                }
            });
    }

    /**
     * Gets component props from the placeholder
     *
     * @param {Element} placeholder
     * @param {ContainerDefinition} definition
     *
     * @return {object}
     */
    protected getProps(placeholder: Element, definition: ContainerDefinition) {
        const props: any = {};
        const attrs = placeholder.attributes;
        const jsonParse = JSON.parse.bind(JSON);

        for (const i in attrs) {
            const attr = attrs[i];
            const {name, value} = attr;
            let currentKey, parsed;

            if (name == null) {
                continue;
            }

            // single prop
            if (name.indexOf(ATTR_PROP) === 0) {
                currentKey = ATTR_PROP;
                parsed = isJson(value) ? jsonParse(value) : value;

                // global object reference
            } else if (name.indexOf(ATTR_PROP_REF) === 0) {
                currentKey = ATTR_PROP_REF;
                parsed = WIN ? objectPath(WIN, value) : undefined;

                // json
            } else if (name === ATTR_PROPS) {
                Object.assign(props, jsonParse(value));
            }

            if (currentKey) {
                props[propName(currentKey, name)] = parsed;
            }
        }

        // placeholder contents as children
        if (!props.hasOwnProperty('children')) {
            props.children = placeholder.innerHTML;
        }

        return {...definition.getDefaultProps(), ...props};
    }

    /**
     * Creates root element for the rendered component
     *
     * @param {Element} placeholder
     * @param {string} groupId Id of the group element should belong to
     * @param {ContainerDefinition} definition
     *
     * @return {HTMLElement|null}
     */
    protected createRootElement(placeholder: Element, groupId: string, definition: ContainerDefinition) {
        const o = definition.getOptions();

        if (!DOC) {
            throw new RendererError('Invalid document');
        }

        const tagName = placeholder.getAttribute(ATTR_TAG) || o.tag || 'div';
        const className = placeholder.getAttribute(ATTR_CLASS) || o.className || null;

        const element = DOC.createElement(tagName);

        // add class
        className && (element.className = className);

        // store container group id
        element.setAttribute(ATTR_CONTAINER_GROUP, groupId);

        // insert element
        placeholder.after(element);

        // remove placeholder and store it on element
        element[PH_PROP] = placeholder.parentNode!.removeChild(placeholder);

        return element;
    }
}

/**
 * Gets camelCased property name from attribute name
 *
 * @param {string} prefix
 * @param {string} str
 *
 * @return {string}
 */
function propName(prefix: string, str: string): string {
    return str
        .replace(new RegExp('^' + prefix), '')
        .replace(/-([a-z])/g, (v) => v[1].toUpperCase());
}

/**
 * Handles async errors
 *
 * @param {unknown} error
 *
 * @return {void}
 */
function handleAsyncError(error: unknown) {
    setTimeout(() => {
        throw error;
    });
}

type TLifecycleCallback = () => any;

interface IOptions {
    selector: string;
}

export { IOptions };
