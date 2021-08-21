import jsc from "jsverify";
import * as math from "mathjs";
import { Seq, Set } from "immutable";
import { identity } from "lodash";
import { Game, shapley } from "./shapley";

const neSet = (arb: jsc.Arbitrary<any>) =>
  jsc.nearray(arb).smap(
    (arr: any[]) => Set(arr),
    (set: Set<{}>) => set.toArray(),
  );

const aCharCode = "a".charCodeAt(0);
const zCharCode = "z".charCodeAt(0);

const smallLetter: jsc.Arbitrary<string> = jsc.suchthat(jsc.asciichar, (ch) => {
  const charCode = ch.charCodeAt(0);
  return aCharCode <= charCode && charCode <= zCharCode;
});

const neSmallLetterStrings: jsc.Arbitrary<string> = jsc
  .nearray(smallLetter)
  .smap(
    (arr) => arr.join(""),
    (s) => s.split(""),
  );

const noop = () => 0;

describe("formCoalitions", () => {
  jsc.property(
    "yields 2^n elements",
    neSet(neSmallLetterStrings),
    (players: Set<string>) => {
      const game = new Game(players, noop);
      const coalitions = Seq.Indexed(game.formCoalitions());
      const size = coalitions.reduce((count, _) => count + 1, 0);
      return size === 1 << players.size; // bitwise 2^n
    },
  );

  jsc.property(
    "all coalitions are subsets of the set of players",
    neSet(neSmallLetterStrings),
    (players: Set<string>) => {
      const game = new Game(players, noop);
      return Seq.Indexed<typeof players>(game.formCoalitions()).every(
        (coalition) => coalition.isSubset(players),
      );
    },
  );

  jsc.property(
    "all coalitions are unique",
    neSet(neSmallLetterStrings),
    (players: Set<string>) => {
      const game = new Game(players, noop);
      return Set(game.formCoalitions()).size === 1 << players.size;
    },
  );
});

function charCodeTotal(s: string): number {
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    total += s.charCodeAt(i);
  }
  return total;
}

function charCodeGainFunc(coalition: Set<string>): number {
  return coalition.reduce((total, s) => charCodeTotal(s) + total, 0);
}

function lengthGainFunc(coalition: Set<string>): number {
  return coalition.reduce((total, s) => s.length + total, 0);
}

function addFuncs<T>(f: GainFunc<T>, g: GainFunc<T>): GainFunc<T> {
  return (s: Set<T>) => f(s) + g(s);
}

type GainFunc<T> = (_: Set<T>) => number;

describe("shapley", () => {
  jsc.property(
    "efficiency: the total gain is distributed",
    neSet(neSmallLetterStrings),
    jsc.constant(charCodeGainFunc),
    (N: Set<string>, v: GainFunc<string>) => {
      const game = new Game(N, v);
      const sumOfGains = N.toIndexedSeq()
        .map(game.shapley)
        .reduce((x, y) => math.add(x, y) as number, 0);
      const gainOfAll = v(N);
      return sumOfGains === gainOfAll;
    },
  );

  jsc.property(
    "symmetry: v(S U {i}) = v(S U {j}) -> ϕ(i, v) = ϕ(j, v)",
    jsc.suchthat(neSet(neSmallLetterStrings), (s) => s.size >= 2),
    jsc.constant(lengthGainFunc),
    (N: Set<string>, v: GainFunc<string>) => {
      const game = new Game(N, v);
      const pairs = N.toSetSeq()
        .flatMap((i) => N.map((j) => Set.of(i, j)))
        .filter((p) => p.size === 2);
      return pairs
        .map((pair) => {
          const [i, j] = pair.toArray();
          const subsets = Seq<Set<string>>(game.formCoalitions()).filterNot(
            (s) => s.contains(i) || s.contains(j),
          );
          return subsets
            .map((S) => {
              const shapleyI = game.shapley(i);
              const shapleyJ = game.shapley(j);
              const vSUnionI = v(S.union(Set.of(i)));
              const vSUnionJ = v(S.union(Set.of(j)));
              return (
                (vSUnionI === vSUnionJ && shapleyI === shapleyJ) ||
                (vSUnionI !== vSUnionJ && shapleyI !== shapleyJ)
              );
            })
            .every(identity);
        })
        .every(identity);
    },
  );

  jsc.property(
    "linearity: ϕi(v + w) = ϕi(v) + ϕi(w)",
    neSet(neSmallLetterStrings),
    jsc.constant(charCodeGainFunc),
    jsc.constant(lengthGainFunc),
    (N: Set<string>, v: GainFunc<string>, w: GainFunc<string>) =>
      N.every(
        (i) =>
          shapley(N, addFuncs(v, w))(i) ===
          math.add(shapley(N, v)(i), shapley(N, w)(i)),
      ),
  );

  jsc.property(
    "zero player (null player): v(S U {i}) = v(S) -> ϕi(v) = 0",
    neSet(jsc.oneof([neSmallLetterStrings, jsc.constant("")])),
    jsc.constant(lengthGainFunc),
    (N: Set<string>, v: GainFunc<string>) => {
      const game = new Game(N, v);
      return N.map((i) => {
        const subsets = Seq<Set<string>>(game.formCoalitions()).filterNot((s) =>
          s.contains(i),
        );
        return subsets
          .map((S) => {
            const vSUnionI = v(S.union(Set.of(i)));
            const vS = v(S);
            const shapleyI = game.shapley(i);
            return (
              (vSUnionI === vS && shapleyI === 0) ||
              (vSUnionI !== vS && shapleyI !== 0)
            );
          })
          .every(identity);
      }).every(identity);
    },
  );

  test("extra: accept Iterable<P> or Set<P> for N players", () => {
    expect(typeof shapley([1, 2, 3], () => 0)(1)).toBe("number");
  });
});
