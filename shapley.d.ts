import { Set } from "immutable";
import { BigNumber, Fraction } from "mathjs";
export declare type RealNumber = number | BigNumber | Fraction;
export declare class Game<P> {
    private readonly players;
    private readonly gainFunc;
    constructor(players: Set<P>, gainFunc: (S: Set<P>) => RealNumber);
    shapley: (p: P) => number;
    formCoalitions(): IterableIterator<Set<P>>;
}
export declare function formCoalitions<P>(players: Set<P>): () => Generator<Set<P>, void, unknown>;
export declare function shapley<P>(N_: Iterable<P> | Set<P>, v: (S: Set<P>) => RealNumber): (p: P) => number;
