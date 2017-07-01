var expect = require('chai').expect
var seed = require('seed-random')
var _ = require('lodash')

var Brng = require('../')

describe('Brng', function() {
  it('should flip a coin pretty well', function () {
    var roller = new Brng({
      originalProportions: Brng.defaultProportions.coin,
      random: seed('coin')
    })

    var actualFlipResults = _.times(10, () => roller.roll())

    var expectedFlipResults = ['heads', 'tails', 'heads', 'tails', 'heads', 'tails',
      'heads', 'heads', 'tails', 'tails']

    expect(actualFlipResults).to.deep.equal(expectedFlipResults)
  })

  it('should roll two 6-sided dice pretty well', function () {
    var roller = new Brng({
      originalProportions: Brng.defaultProportions.two6SidedDice,
      random: seed('two6SidedDice')
    })

    var actualRollResults = _.times(36, () => roller.roll())

    var expectedRollResults = ['10', '5', '6', '3', '7', '7', '6', '9', '4', '9', '8',
      '8', '9', '4', '11', '3', '8', '7', '12', '2', '6', '8', '7', '7', '5', '7',
      '11', '10', '10', '5', '6', '4', '8', '5', '9', '8']

    expect(actualRollResults).to.deep.equal(expectedRollResults)
  })

  it('should keep roll history', function () {
    var roller = new Brng({
      originalProportions: {tank: 3, assassin: 3, support: 3, special: 1},
      random: seed('hit'),
      keepHistory: true
    })

    _.times(12, () => roller.roll())

    var expectedHistoryArray = ['assassin', 'support', 'support', 'special',
      'assassin', 'tank', 'support', 'assassin', 'tank', 'support', 'special', 'tank']

    var expectedHistoryMapping = {
      assassin: 3,
      support: 4,
      tank: 3,
      special: 2
    }

    expect(roller.historyArray).to.deep.equal(expectedHistoryArray)
    expect(roller.historyMapping).to.deep.equal(expectedHistoryMapping)

  })

  it('should be 99% accurate over large sample sizes', function () {
    var roller = new Brng({
      originalProportions: {a: 1, b: 2, c: 3, d: 4}
    })
    var historyMapping = {a: 0, b: 0, c: 0, d: 0}
    var sampleSize = 300
    for (var i = 0; i < sampleSize; i++) {
      var chosenLetter = roller.roll()
      historyMapping[chosenLetter] = historyMapping[chosenLetter] + 1
    }
    // console.log(historyMapping)
    expect(historyMapping.a).to.be.closeTo(sampleSize*.1, sampleSize*0.01)
    expect(historyMapping.b).to.be.closeTo(sampleSize*.2, sampleSize*0.01)
    expect(historyMapping.c).to.be.closeTo(sampleSize*.3, sampleSize*0.01)
    expect(historyMapping.d).to.be.closeTo(sampleSize*.4, sampleSize*0.01)
  })

  it('should have working aliases for roll()', function () {
    var roller = new Brng({
      originalProportions: {goat: 2, sheep: 5, dragon: 10},
      keepHistory: true
    })

    roller.roll()
    roller.flip()
    roller.pick()
    roller.select()
    roller.choose()
    roller.randomize()

    expect(roller.historyArray.length).to.equal(6)
  })

})
