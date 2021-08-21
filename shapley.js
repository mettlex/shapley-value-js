"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shapley = exports.formCoalitions = exports.Game = void 0;
const immutable_1 = require("immutable");
const mathjs_1 = require("mathjs");
class Game {
    constructor(players, gainFunc) {
        this.shapley = (p) => shapley(this.players, this.gainFunc)(p);
        this.players = players;
        this.gainFunc = gainFunc;
    }
    *formCoalitions() {
        yield* formCoalitions(this.players)();
    }
}
exports.Game = Game;
function formCoalitions(players) {
    return function* () {
        const playersArr = players.toArray();
        const numPlayers = playersArr.length;
        for (let i = 0; i < 1 << numPlayers; i++) {
            let combination = immutable_1.Set();
            for (let j = 0; j < numPlayers; j++) {
                if ((i & (1 << j)) !== 0) {
                    combination = combination.add(playersArr[j]);
                }
            }
            yield combination;
        }
    };
}
exports.formCoalitions = formCoalitions;
function shapley(N_, v) {
    let N;
    if (!immutable_1.Set.isSet(N_)) {
        N = immutable_1.Set(N_);
    }
    else {
        N = N_;
    }
    return (p) => mathjs_1.divide(immutable_1.Seq.Indexed(formCoalitions(N)())
        .filterNot((coalition) => coalition.contains(p))
        .map((S) => mathjs_1.multiply(mathjs_1.multiply(mathjs_1.factorial(S.size), mathjs_1.factorial(mathjs_1.subtract(mathjs_1.subtract(N.size, S.size), 1))), mathjs_1.subtract(v(S.union(immutable_1.Set.of(p))), v(S))))
        .reduce((a, b) => mathjs_1.add(a, b), 0), mathjs_1.factorial(N.size));
}
exports.shapley = shapley;
