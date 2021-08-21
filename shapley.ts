import { Seq, Set } from "immutable";
import {
  BigNumber,
  divide,
  factorial,
  Fraction,
  multiply,
  subtract,
  add,
} from "mathjs";

export type RealNumber = number | BigNumber | Fraction;

export class Game<P> {
  private readonly players: Set<P>;
  private readonly gainFunc: (S: Set<P>) => RealNumber;

  constructor(players: Set<P>, gainFunc: (S: Set<P>) => RealNumber) {
    this.players = players;
    this.gainFunc = gainFunc;
  }

  public shapley = (p: P) => shapley(this.players, this.gainFunc)(p);

  public *formCoalitions(): IterableIterator<Set<P>> {
    yield* formCoalitions(this.players)();
  }
}

export function formCoalitions<P>(players: Set<P>) {
  return function* () {
    const playersArr = players.toArray();
    const numPlayers = playersArr.length;

    for (let i = 0; i < 1 << numPlayers; i++) {
      let combination = Set<P>();

      for (let j = 0; j < numPlayers; j++) {
        if ((i & (1 << j)) !== 0) {
          combination = combination.add(playersArr[j]);
        }
      }

      yield combination;
    }
  };
}

export function shapley<P>(
  N_: Iterable<P> | Set<P>,
  v: (S: Set<P>) => RealNumber,
) {
  let N: Set<P>;

  if (!Set.isSet(N_)) {
    N = Set(N_);
  } else {
    N = N_;
  }

  return (p: P) =>
    divide(
      Seq.Indexed(formCoalitions(N)())
        .filterNot((coalition) => coalition.contains(p))
        .map((S) =>
          multiply(
            multiply(
              factorial(S.size),
              factorial(subtract(subtract(N.size, S.size), 1) as number),
            ),
            subtract(v(S.union(Set.of(p))), v(S)),
          ),
        )
        .reduce((a, b) => add(a, b) as number, 0),
      factorial(N.size),
    );
}
