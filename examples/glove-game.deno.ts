import { shapley, RealNumber } from "https://deno.land/x/shapley@1.0.4/mod.ts";

// player 1, 2 & 3
const N = [1, 2, 3];

const v = (S: Iterable<number>): RealNumber => {
  const A = Array.from(S);

  // players 1 and 2 have right-hand gloves and
  // player 3 has a left-hand glove
  const first = [1, 3];
  const second = [2, 3];
  const third = [1, 2, 3];

  const U = [first, second, third];

  let val = 0;

  for (const col of U) {
    if (!col.find((el) => !A.includes(el))) {
      val = 1;
      break;
    }
  }

  return val;
};

const svP1 = shapley(N, v)(1);
const svP2 = shapley(N, v)(2);
const svP3 = shapley(N, v)(3);

console.log(svP1 === 1 / 6, svP2 === 1 / 6, svP3 === 2 / 3);
