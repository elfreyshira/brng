import mapValues from 'lodash/mapValues'
import constant from 'lodash/constant'
import cloneDeep from 'lodash/cloneDeep'
import sum from 'lodash/sum'
import values from 'lodash/values'
import keys from 'lodash/keys'
import reduce from 'lodash/reduce'
import forEach from 'lodash/forEach'
import isNumber from 'lodash/isNumber'
import clamp from 'lodash/clamp'

const _ = {mapValues, forEach, constant, cloneDeep, sum, values, keys, reduce, isNumber, clamp}

/**
 * const roller = new Brng(config)
 *
 * Constructor parameters:
 *  originalProportions [REQUIRED] {Object[String/Number:Number]} -- key-value mapping of
 *    weighted proportions. For example {mickeyd: 3, jackinthebox: 3, burgerking: 2, whataburger: 10}
 *  config {Object}
 *  config.random {Function} -- function that returns random number 0 - 1. Defaults to Math.random
 *  config.keepHistory {Boolean} -- if true, keep the roll history
 *  config.bias {Number} -- between 0 and 4. The higher the bias, the more it
 *    favors values less chosen. If 0, it's basically a normal RNG. Defaults to 1.
 *  config.repeatTolerance {Number} -- between 0 and 1. The lower the tolerance, the more
 *    likely Brng will re-roll if it's a repeat. If 0, it'll never repeat. Defaults to 1.
 *
 * Public methods:
 *  roll() -- selects a random value; remembers previous rolls.
 *  flip(), pick(), select(), choose(), randomize() -- aliases of `roll()`
 *  reset() -- resets all history and resets previous rolls
 *
 * Public readable values (if keepHistory === true):
 *  historyArray -- array of every single previous roll
 *  historyMapping -- hash of key to number of times rolled in total
 *
 * Public static values for common default proportions:
 *  Brng.defaultProportions.one6SidedDie -- proportions for rolling 1 6-sided die
 *  Brng.defaultProportions.two6SidedDice -- proportions for rolling 2 6-sided dice
 *  Brng.defaultProportions.coin -- proportions for flipping 1 coin
 */
class Brng {

  static defaultProportions = {
    one6SidedDie: {1:1, 2:1, 3:1, 4:1, 5:1, 6:1},
    two6SidedDice: {2:1, 3:2, 4:3, 5:4, 6:5, 7:6, 8:5, 9:4, 10:3, 11:2, 12:1},
    coin: {heads: 1, tails: 1}
  }

  constructor (originalProportions, config = {}) {
    this.keepHistory = !!config.keepHistory
    if (this.keepHistory) {
      this.historyMapping = _.mapValues(originalProportions, _.constant(0))
      this.historyArray = []
    }

    this.previousRoll = null
    this.repeatTolerance = _.isNumber(config.repeatTolerance) ? _.clamp(config.repeatTolerance, 0, 1) : 1
    this.random = config.random || Math.random
    this.originalProportions = _.cloneDeep(originalProportions)
    this.proportions = _.cloneDeep(originalProportions)

    const sumTotal = _.sum(_.values(originalProportions))
    this.originalProbabilities = _.mapValues(originalProportions, (number) => number / sumTotal)
    this.possibleKeys = _.keys(originalProportions)

    const baseValueToRedistribute = _.reduce(originalProportions, (sum, proportionValue, keyId) => {
      return sum + (proportionValue * this.originalProbabilities[keyId])
    }, 0)
    const biasMultiplier = _.isNumber(config.bias) ? _.clamp(config.bias, 0, 4) : 1
    this.valueToRedistribute = baseValueToRedistribute * biasMultiplier
  }

  // The first step of the algorithm: given a weighted proportion map, randomly select a value
  chooseKeyFromProportions () {
    const sumTotal = _.sum(_.values(this.proportions))

    const rawRoll = this.random() * sumTotal
    let currentSum = 0

    for (let i = 0; i < this.possibleKeys.length; i++) {
      const chosenKey = this.possibleKeys[i]
      const proportionValue = this.proportions[chosenKey]
      currentSum += proportionValue
      if (currentSum > rawRoll) {
        return chosenKey
      }
    }

    console.warn('Code should not reach here.')
  }

  // The second step of the algorithm: given the selected value, shift the proportion map around that value
  // WARNING: method writes to this.proportions
  shiftProportions (keyChosen) {
    this.proportions[keyChosen] = this.proportions[keyChosen] - this.valueToRedistribute
    _.forEach(this.possibleKeys, (otherKey) => {
      this.proportions[otherKey] = this.proportions[otherKey] +
        (this.valueToRedistribute * this.originalProbabilities[otherKey])
    })
  }

  // the reverse of shiftProportions() for undo
  // WARNING: method writes to this.proportions
  reverseShiftProportions (keyChosen) {
    this.proportions[keyChosen] = this.proportions[keyChosen] + this.valueToRedistribute
    _.forEach(this.possibleKeys, (otherKey) => {
      this.proportions[otherKey] = this.proportions[otherKey] -
        (this.valueToRedistribute * this.originalProbabilities[otherKey])
    })
  }

  passCriteria (keyChosen) {
    if (this.previousRoll === keyChosen && this.repeatTolerance < 1) {
      return this.random() < this.repeatTolerance
    }
    else {
      return true
    }
  }

  rollSideEffects (keyChosen) {
    this.previousRoll = keyChosen
    if (this.keepHistory) {
      this.historyMapping[keyChosen] = this.historyMapping[keyChosen] + 1
      this.historyArray.push(keyChosen)
    }
    return keyChosen
  }

  roll () {
    const keyChosen = this.chooseKeyFromProportions()
    if (!this.passCriteria(keyChosen)) {
      return this.roll()
    }
    this.shiftProportions(keyChosen)
    this.rollSideEffects(keyChosen)
    return keyChosen
  }
  flip = this.roll
  pick = this.roll
  select = this.roll
  choose = this.roll
  randomize = this.roll

  undo () {
    if (!this.keepHistory) { // throw if there's no keepHistory
      throw new Error('To undo, set `{keepHistory: true}`.')
    }
    const previousChoice = this.historyArray.pop() // ! writes to historyArray
    this.historyMapping[previousChoice] = this.historyMapping[previousChoice] - 1

    this.reverseShiftProportions(previousChoice)

    return previousChoice
  }

  reset () {
    this.proportions = _.cloneDeep(this.originalProportions)
    if (this.keepHistory) {
      this.historyMapping = _.mapValues(this.originalProportions, _.constant(0))
      this.historyArray = []
    }
  }
}

export default Brng
