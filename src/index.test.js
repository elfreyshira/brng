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

  describe('repeatTolerance', function () {

    function testNumberOfRepeats(repeatTolerance, sampleSize) {
      var professionChooser = new Brng({
        originalProportions: {tank: 3, support: 3, assassin: 3, special: 1},
        repeatTolerance: repeatTolerance, // defaults to 1
        random: seed('repeat')
      })

      const professionHistoryArray = _.times(sampleSize, () => professionChooser.choose())

      let numberOfRepeats = 0
      let previousProfession = null
      _.forEach(professionHistoryArray, (profession) => {
        if (previousProfession === profession) {
          numberOfRepeats++
        }
        previousProfession = profession
      })
      return numberOfRepeats
    }

    it('should not repeat if repeatTolerance === 0 (sample size 30)', function () {
      const numberOfRepeats = testNumberOfRepeats(0, 30)
      expect(numberOfRepeats).to.equal(0)
    })

    it('should most likely repeat if repeatTolerance === 1 (sample size 30)', function () {
      const numberOfRepeats = testNumberOfRepeats(1, 30)
      expect(numberOfRepeats).to.be.greaterThan(0)
    })

    it('repeats should be lower with lower repeat tolerance (sample size 200)', function () {
      const numberOfRepeats100 = testNumberOfRepeats(1, 200)
      const numberOfRepeats067 = testNumberOfRepeats(0.67, 200)
      const numberOfRepeats033 = testNumberOfRepeats(0.33, 200)
      const numberOfRepeats000 = testNumberOfRepeats(0, 200)

      expect(numberOfRepeats100).to.be.at.least(numberOfRepeats067)
      expect(numberOfRepeats067).to.be.at.least(numberOfRepeats033)
      expect(numberOfRepeats033).to.be.at.least(numberOfRepeats000)
    })

  })

})
