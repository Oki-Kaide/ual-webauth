# UAL for WebAuth

This authenticator is meant to be used with [WebAuth](https://webauth.com), [Proton](https://github.com/ProtonProtocol/proton-web-sdk) and [Universal Authenticator Library](https://github.com/EOSIO/universal-authenticator-library). When used in combination with them, it gives developers the ability to request transaction signatures through Anchor using the common UAL API.

## Supported Environments

- The WebAuth Authenticator only supports both Desktop and Mobile environments

## Getting Started

`yarn add @proton/ual-webauth`

#### Dependencies

You must use one of the UAL renderers below.

React - `ual-reactjs-renderer`
PlainJS - `ual-plainjs-renderer`

#### Basic usage and configuration with React

```javascript
import { WebAuth } from '@proton/ual-webauth'
import { UALProvider, withUAL } from 'ual-reactjs-renderer'

const proton = {
  chainId: '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',
  rpcEndpoints: [{
    protocol: 'https',
    host: 'proton.eoscafeblock.com',
    port: '443',
  }]
}

const App = (props) => <div>{JSON.stringify(props.ual)}</div>
const AppWithUAL = withUAL(App)

const webauth = new WebAuth([proton], {
  transportOptions: {
    requestAccount: 'taskly'
  },
  selectorOptions: {
    appName: "Taskly"
  }
})

<UALProvider chains={[proton]} authenticators={[webauth]} appName='Taskly'>
  <AppWithUAL />
</UALProvider>
```

## License

[MIT](https://github.com/EOSIO/ual-anchor/blob/develop/LICENSE)
