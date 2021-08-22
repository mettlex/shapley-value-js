A TypeScript/JavaScript library for calculating [Shapley Value](https://wikipedia.org/wiki/Shapley_value)

## Deno
```js
import { shapley, RealNumber } from "https://deno.land/x/shapley@1.0.4/mod.ts";
```
## Node.js
```sh
npm install shapley
```

## Usage

```js
const shapleyValueForP = shapley(N, v)(p)
// N = set of players
// v = value function
// p = current player
```
For examples, please check [examples](./examples/) folder.

### Acknowledgement

This library is mostly based on the previous work in [Taxi Sharing Fare App](https://github.com/zalbia/Taxi-Sharing-Fare-App) repository.