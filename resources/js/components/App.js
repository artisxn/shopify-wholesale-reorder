import React, { Component } from 'react';
import {AppProvider, Page, Card, Button} from '@shopify/polaris';
import ReactDOM from 'react-dom';

let apiKey = document.head.querySelector('meta[name="shopify-api-key"]').content;
let shopOrigin = document.head.querySelector('meta[name="shopify-shop-origin"]').content;
let forceRedirect = true;
if(document.head.querySelector('meta[name="app-debug"]') !== null && document.head.querySelector('meta[name="app-debug"]').content !== 'true')
    forceRedirect = false;

class App extends Component {
    render() {
        return (
            <AppProvider
                apiKey={apiKey}
                shopOrigin={shopOrigin}
                forceRedirect={forceRedirect}
            >
                <Page title="Example app">
                    <Card sectioned>
                        <Button onClick={() => alert('Button clicked!')}>Example button</Button>
                    </Card>
                </Page>
            </AppProvider>
        );
    }

}

ReactDOM.render( <App />, document.getElementById('app') );