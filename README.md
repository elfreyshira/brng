# brng
Biased random number generator

#### Purpose
When you want a random number generator that selects a value
according to weighted proportions, and is biased towards values
that haven't been picked as much.
It's a fair RNG, but it's not blind.

#### Origins (warning, Settlers of Catan knowledge assumed)
In 2012, I played Settlers of Catan often. I would pick the perfect starting positions
that had the perfect numbers: 5s, 6s, 9s. Opponents would pick positions with 11s and 10s.
And once the game started, the dice would roll 10s and 11s and 12s and 3s, sometimes seemingly more
often than 5s and 9s. I got so annoyed that I wanted to create a simple algorithm that would
roll dice better. One that would actually land with the expected frequencies. After many shower
thoughts and mucking around, the algorithm was born.

---

# API
```
const roller = new Brng(config)

Constructor parameters:
  config {Object}
  config.originalProportions {Object} -- key-value mapping of weighted proportions.
    for example {mickeyd: 3, jackinthebox: 3, burgerking: 2, whataburger: 10}
  config.random {Function} -- function that returns random number 0 - 1. Defaults to Math.random
  config.keepHistory {Boolean} -- if true, keep the roll history
  config.repeatTolerance {Number} -- between 0 and 1. The lower the tolerance, the more
    likely Brng will re-roll if it's a repeat. Defaults to 1.

Public methods:
  roll() -- selects a random value; remembers previous rolls.
  flip(), pick(), select(), choose(), randomize() -- aliases of `roll()`
  reset() -- resets all history and resets previous rolls

Public readable values (if keepHistory === true):
  historyArray -- array of every single previous roll
  historyMapping -- hash of key to number of times rolled in total

Public static values for common default proportions:
  Brng.defaultProportions.one6SidedDie -- proportions for rolling 1 6-sided die
  Brng.defaultProportions.two6SidedDice -- proportions for rolling 2 6-sided dice
  Brng.defaultProportions.coin -- proportions for flipping 1 coin
```


# Example and usage

Install into your package.json
```
npm install --save brng
```

Import or require into your code
```
import Brng from 'brng'
var Brng = require('brng')
```

```
const twoCoinFlipper = new Brng({originalProportions: {headsHeads: 1, headsTails: 2, tailsTails: 1}})

const result = twoCoinFlipper.flip()
console.log(result) // 'tailsTails'

const result2 = twoCoinFlipper.flip()
console.log(result)
// 'headsTails'
```

```
const catanDiceRoller = new Brng({
  originalProportions: Brng.defaultProportions.two6SidedDice,
  random: FancyRandomLibrary.doRandom,
  keepHistory: true
})

catanDiceRoller.roll() // 7
catanDiceRoller.roll() // 4
catanDiceRoller.roll() // 12
catanDiceRoller.roll() // 7
catanDiceRoller.roll() // 6

console.log(catanDiceRoller.historyMapping)
// {2:0, 3:0, 4:1, 5:0, 6:1, 7:2, ... , 12:1}

console.log(catanDiceRoller.historyArray)
// [7, 4, 12, 7, 6]

catanDiceRoller.reset()

console.log(catanDiceRoller.historyMapping)
// {2:0, 3:0, 4:0, 5:0, 6:0, 7:0, ... , 12:0}

console.log(catanDiceRoller.historyArray)
// []
```

