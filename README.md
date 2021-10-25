# tolkam/lib-react-renderer

Renders react components into existing DOM.

## Usage

````tsx
import { ReactDOMFactory, Container, Renderer } from '@tolkam/lib-react-renderer';

const componentFactory = new ReactDOMFactory();
const componentsContainer = new Container(componentFactory);
const renderer = new Renderer(componentsContainer);

// register components
componentsContainer.register('MyComponent', () => {
    return <div>Hello, World!</div>;
});

// somewhere in html put "<div data-rr="MyComponent"></div>"

// mount registered components
renderer.mount(document.body);
````

## Documentation

The code is rather self-explanatory and API is intended to be as simple as possible. Please, read the sources/Docblock if you have any questions. See [Usage](#usage) for quick start.

## License

Proprietary / Unlicensed 🤷
