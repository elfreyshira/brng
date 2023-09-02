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
import has from 'lodash/has'
import isUndefined from 'lodash/isUndefined'
import isObject from 'lodash/isObject'
import isArray from 'lodash/isArray'
import includes from 'lodash/includes'
import pick from 'lodash/pick'
import without from 'lodash/without'
import isEmpty from 'lodash/isEmpty'
import max from 'lodash/max'
import findKey from 'lodash/findKey'
import omit from 'lodash/omit'

const _ = {mapValues, forEach, constant, cloneDeep,
  sum, values, keys, reduce, isNumber, clamp, has,
  isUndefined, isObject, isArray, includes, pick,
  without, isEmpty, max, findKey, omit}

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
 *  roll(value) -- force select the value from your original proportions. Ignores all criteria.
 *  roll({exclude: [value1, value2]}) -- select a value that excludes any values in the array
 *  roll({only: [value1, value2]}) -- select one of the values only within the given array
 * 
 *  flip(), pick(), select(), choose(), randomize() -- aliases of `roll()`
 *  reset() -- resets all history and resets previous rolls
 *  undo () -- undo the previous roll. must have `config.keepHistory === true`
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

    this.biasMultiplier = _.isNumber(config.bias) ? _.clamp(config.bias, 0, 4) : 1

    this.previousRoll = null
    this.repeatTolerance = _.isNumber(config.repeatTolerance) ? _.clamp(config.repeatTolerance, 0, 1) : 1
    this.random = config.random || Math.random

    this.#setupFromOriginalProportions(originalProportions)

    // set up for the rest of the time
    this.proportions = _.cloneDeep(originalProportions)
  }

  #setValueToRedistribute (biasMultiplier) {
    const baseValueToRedistribute = _.reduce(this.originalProportions, (sum, proportionValue, keyId) => {
      return sum + (proportionValue * this.originalProbabilities[keyId])
    }, 0)
    this.valueToRedistribute = baseValueToRedistribute * biasMultiplier
  }

  #setupFromOriginalProportions (originalProportions) {
    this.originalProportions = _.cloneDeep(originalProportions)

    this.possibleKeys = _.keys(originalProportions)

    const sumTotal = _.sum(_.values(originalProportions))
    this.originalProbabilities = _.mapValues(originalProportions, (number) => number / sumTotal)

    this.#setValueToRedistribute(this.biasMultiplier)
  }

  // The first step of the algorithm: given a weighted proportion map, randomly select a value
  chooseKeyFromProportions (config = {}) { // optional config
    
    let availableKeys = this.possibleKeys
    if (_.isArray(config.only)) {
      availableKeys = config.only
    }
    if (_.isArray(config.exclude)) {
      availableKeys = _.without(availableKeys, ...config.exclude)
    }

    if (_.isEmpty(availableKeys)) {
      throw new Error('The values given in `only` or `exclude` gave no available options.')
    }

    const availableProportions = _.pick(this.proportions, availableKeys)
    const valuesOfAvailableOptions = _.values(availableProportions)
    const sumTotal = _.sum(valuesOfAvailableOptions)
    
    // RETURNS the key with the highest proportion if the sum total is negative
    if (sumTotal <= 0) {
      const highestProportion = _.max(valuesOfAvailableOptions)
      const chosenKey = _.findKey(availableProportions, (val) => val === highestProportion)
      return chosenKey
    }

    // ELSE if everything is normal, proceed as normal
    const rawRoll = this.random() * sumTotal
    let currentSum = 0

    for (let i = 0; i < availableKeys.length; i++) {
      const chosenKey = availableKeys[i]
      const proportionValue = this.proportions[chosenKey]
      currentSum += proportionValue
      if (currentSum > rawRoll) {
        return chosenKey
      }
    }

    throw new Error('Something is wrong. Code should not reach here.')
  }

  // The second step of the algorithm: given the selected value, shift the proportion map around that value
  // WARNING: method writes to this.proportions
  #shiftProportions (keyChosen) {
    this.proportions[keyChosen] = this.proportions[keyChosen] - this.valueToRedistribute
    _.forEach(this.possibleKeys, (otherKey) => {
      this.proportions[otherKey] = this.proportions[otherKey] +
        (this.valueToRedistribute * this.originalProbabilities[otherKey])
    })
  }

  // the reverse of shiftProportions() for undo
  // WARNING: method writes to this.proportions
  #reverseShiftProportions (keyChosen) {
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

  #rollSideEffects (keyChosen) {
    this.previousRoll = keyChosen
    if (this.keepHistory) {
      this.historyMapping[keyChosen] = this.historyMapping[keyChosen]
        ? this.historyMapping[keyChosen] + 1 : 1
      this.historyArray.push(keyChosen)
    }
    return keyChosen
  }

  roll (/* value or config */) { // optional
    const keyFromArgs = arguments[0]
    const keyIsAvailable = _.has(this.originalProportions, keyFromArgs)
    let keyChosen
    
    if (!_.isUndefined(keyFromArgs) && keyIsAvailable) { // this.roll(value) is called
      keyChosen = keyFromArgs
    }
    else if (!_.isUndefined(keyFromArgs) && !keyIsAvailable && !_.isObject(keyFromArgs)) {
      // this.roll(value) is called incorectly
      throw new Error('The value ' + keyFromArgs + ' is not in your originalProportions.')
    }
    else { // the normal this.roll() with a possible config
      const config = arguments[0]
      keyChosen = this.chooseKeyFromProportions(config)

      if (!this.passCriteria(keyChosen)) {
        return this.roll()
      }
    }
    this.#shiftProportions(keyChosen)
    this.#rollSideEffects(keyChosen)
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

    this.#reverseShiftProportions(previousChoice)

    return previousChoice
  }

  reset () {
    this.proportions = _.cloneDeep(this.originalProportions)
    if (this.keepHistory) {
      this.historyMapping = _.mapValues(this.originalProportions, _.constant(0))
      this.historyArray = []
    }
  }

  // roll() won't call the paused key anymore, and the proportions won't be affected
  pause(key) {

  }

  unpause(key) {
    
  }

  updateProportions (newProportions) {
    _.forEach(newProportions, (proportionWeight, key) => {
      if (!_.has(this.proportions, key)) {
        this.proportions[key] = proportionWeight
      }
    })

    this.#setupFromOriginalProportions(_.cloneDeep(newProportions))
  }

  // add the key to the possible proportinos
  add (newProportions) {
    const originalProportions = _.cloneDeep(this.originalProportions)
    _.forEach(newProportions, (proportionWeight, key) => {
      originalProportions[key] = proportionWeight
      if (!_.has(this.proportions, key)) {
        this.proportions[key] = proportionWeight
      }
    })

    this.#setupFromOriginalProportions(originalProportions)
  }

  remove (keyToRemove) {
    const newOriginalProportions = _.omit(this.originalProportions, keyToRemove)
    this.#setupFromOriginalProportions(newOriginalProportions)
  }

  setBias (bias) {
    this.#setValueToRedistribute(bias)
  }
}

export default Brng
