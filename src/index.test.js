var expect = require('chai').expect
var seed = require('seed-random')
var _ = require('lodash')

var Brng = require('../index.js').default

describe('Brng', function() {
  it('should flip a coin pretty well', function () {
    var roller = new Brng(Brng.defaultProportions.coin, {random: seed('coin')})

    var actualFlipResults = _.times(10, () => roller.roll())

    var expectedFlipResults = ['heads', 'tails', 'heads', 'tails', 'heads', 'tails',
      'heads', 'heads', 'tails', 'tails']

    expect(actualFlipResults).to.deep.equal(expectedFlipResults)
  })

  it('should roll two 6-sided dice pretty well', function () {
    var roller = new Brng(Brng.defaultProportions.two6SidedDice, {random: seed('two6SidedDice')})

    var actualRollResults = _.times(36, () => roller.roll())

    var expectedRollResults = ['10', '5', '6', '3', '7', '7', '6', '9', '4', '9', '8',
      '8', '9', '4', '11', '3', '8', '7', '12', '2', '6', '8', '7', '7', '5', '7',
      '11', '10', '10', '5', '6', '4', '8', '5', '9', '8']

    expect(actualRollResults).to.deep.equal(expectedRollResults)
  })

  it('should keep roll history', function () {
    var roller = new Brng({tank: 3, assassin: 3, support: 3, special: 1}, {
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
    var roller = new Brng({a: 1, b: 2, c: 3, d: 4})
    var historyMapping = {a: 0, b: 0, c: 0, d: 0}
    var sampleSize = 300

    for (var i = 0; i < sampleSize; i++) {
      var chosenLetter = roller.roll()
      historyMapping[chosenLetter] = historyMapping[chosenLetter] + 1
    }

    expect(historyMapping.a).to.be.closeTo(sampleSize*.1, sampleSize*0.01)
    expect(historyMapping.b).to.be.closeTo(sampleSize*.2, sampleSize*0.01)
    expect(historyMapping.c).to.be.closeTo(sampleSize*.3, sampleSize*0.01)
    expect(historyMapping.d).to.be.closeTo(sampleSize*.4, sampleSize*0.01)
  })

  it('should be 100% accurate with bias=4 even with small sample sizes', function () {
    var roller = new Brng({a: 1, b: 2, c: 3, d: 4}, {bias: 4})
    var historyMapping = {a: 0, b: 0, c: 0, d: 0}
    var sampleSize = 10

    for (var i = 0; i < sampleSize; i++) {
      var chosenLetter = roller.roll()
      historyMapping[chosenLetter] = historyMapping[chosenLetter] + 1
    }

    expect(historyMapping.a).to.equal(sampleSize*.1)
    expect(historyMapping.b).to.equal(sampleSize*.2)
    expect(historyMapping.c).to.equal(sampleSize*.3)
    expect(historyMapping.d).to.equal(sampleSize*.4)
  })

  it('should have working aliases for roll()', function () {
    var roller = new Brng({goat: 2, sheep: 5, dragon: 10}, {keepHistory: true})

    roller.roll()
    roller.flip()
    roller.pick()
    roller.select()
    roller.choose()
    roller.randomize()

    expect(roller.historyArray.length).to.equal(6)
  })

  describe('roll(value)', function() {
    it('should roll the given value, ignoring previous rolls', function () {
      var roller = new Brng({anemoia: 10, mechalane: 7, ares: 5}, {keepHistory: true})

      roller.roll()
      roller.roll()
      var thirdChosen = roller.roll('anemoia')
      var fourthChosen = roller.roll('mechalane')
      var fifthChosen = roller.roll('ares')
      var sixthChosen = roller.roll('ares')

      expect(thirdChosen).to.equal('anemoia')
      expect(fourthChosen).to.equal('mechalane')
      expect(fifthChosen).to.equal('ares')
      expect(sixthChosen).to.equal('ares')
    })

    it('should shiftProportions correctly', function () {
      var roller = new Brng({anemoia: 10, mechalane: 7, ares: 5}, {bias: 4})

      roller.roll('anemoia')
      expect(roller.proportions).to.not.deep.equal(roller.originalProportions)

      roller.roll('anemoia')
      roller.roll('anemoia')
      roller.roll('anemoia')
      roller.roll('anemoia')
      roller.roll('anemoia')

      expect(roller.roll()).to.not.equal('anemoia')
      expect(roller.roll()).to.not.equal('anemoia')
    })

    it('should update historyArray and historyMapping correctly', function () {
      var roller = new Brng({anemoia: 10, mechalane: 7, ares: 5}, {keepHistory: true})
      roller.roll('anemoia')
      roller.roll('mechalane')
      roller.roll('ares')
      roller.roll('anemoia')
      roller.roll('anemoia')

      expect(roller.historyArray).to.deep.equal(
        ['anemoia', 'mechalane', 'ares', 'anemoia', 'anemoia']
      )
      expect(roller.historyMapping).to.deep.equal({
        anemoia: 3,
        mechalane: 1,
        ares: 1
      })
    })

    it('should ignore repeatTolerance', function() {
      var roller = new Brng({anemoia: 10, mechalane: 7, ares: 5}, {repeatTolerance: 0})
      roller.roll()
      roller.roll()
      var thirdChosen = roller.roll('anemoia')
      var fourthChosen = roller.roll('anemoia')
      var fifthChosen = roller.roll('anemoia')
      
      expect(thirdChosen).to.equal('anemoia')
      expect(fourthChosen).to.equal('anemoia')
      expect(fifthChosen).to.equal('anemoia')
    })

    it('should throw error when giving a value that is not in originalProportions', function () {
      var roller = new Brng({anemoia: 10, mechalane: 7, ares: 5}, {repeatTolerance: 0})
      roller.roll()
      var badFn = function () { roller.roll('badKey') }
      expect(badFn).to.throw('badKey')
    })
  })

  describe('undo', function() {
    it('should throw error WITHOUT {keepHistory: true}', function () {
      var roller = new Brng({a: 1, b: 2, c: 3, d: 4}, {keepHistory: null})

      roller.roll();
      roller.roll();
      roller.roll();

      var badFn = function () { roller.undo() }

      expect(badFn).to.throw()
    })

    it('should not throw error WITH {keepHistory: true}', function () {
      var roller = new Brng({a: 1, b: 2, c: 3, d: 4}, {keepHistory: true})

      roller.roll();
      roller.roll();
      roller.roll();

      var badFn = function () { roller.undo() }

      expect(badFn).to.not.throw()
    })

    it('should update the historyArray correctly', function () {
      var roller = new Brng({a: 1, b: 2, c: 3, d: 4}, {keepHistory: true})

      // roll 20 times
      _.times(10, function () {roller.roll()})

      var previousHistoryArray = _.cloneDeep(roller.historyArray)
      roller.roll()
      expect(previousHistoryArray).to.not.deep.equal(roller.historyArray)

      roller.undo()
      expect(previousHistoryArray).to.deep.equal(roller.historyArray)
      
    })

    it('should update the historyMapping correctly', function () {
      var roller = new Brng({a: 1, b: 2, c: 3, d: 4}, {keepHistory: true})

      // roll 20 times
      _.times(10, function () {roller.roll()})

      var previousHistoryMapping = _.cloneDeep(roller.historyMapping)
      roller.roll()
      expect(previousHistoryMapping).to.not.deep.equal(roller.historyMapping)
      roller.undo()
      expect(previousHistoryMapping).to.deep.equal(roller.historyMapping)
      
    })

    it('should update the proportions correctly', function () {
      var roller = new Brng({a: 1, b: 2, c: 3, d: 4}, {keepHistory: true})

      var roundProportions = function roundProportions (proportions) {
        return _.map(proportions, function (value) {
          return _.round(value, 3)
        })
      }

      // test it 3 times, just in case
      _.times(3, function () {

        _.times(6, function () {roller.roll()})
        var previousProportions = _.cloneDeep(roller.proportions)

        roller.roll()
        expect(
          roundProportions(previousProportions)).to.not.deep.equal(
          roundProportions(roller.proportions)
        )

        roller.undo()
        expect(
          roundProportions(previousProportions)).to.deep.equal(
          roundProportions(roller.proportions)
        )

      })
      
    })

    it('should return the previous choice correctly', function () {
      var roller = new Brng({a: 1, b: 2, c: 3, d: 4}, {keepHistory: true})

      // roll 20 times
      _.times(10, function () {roller.roll()})

      // do this multiple times in case it rolls the same thing
      _.times(6, function () {
        var previousChoice = roller.roll()
        var undoReturn = roller.undo()
        expect(previousChoice).to.deep.equal(undoReturn)
      })

    })

  })
  
  describe('repeatTolerance', function () {

    function testNumberOfRepeats(repeatTolerance, sampleSize) {
      var professionChooser = new Brng({tank: 3, support: 3, assassin: 3, special: 1}, {
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

  describe('exclude', function () {
    
    it('should be accepted by the roll function', function () {
      const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3, coconut: 4})
      
      function testFunction () {
        fruitPicker.roll({exclude: ['coconut']})
      }
      expect(testFunction).to.not.throw()
    })

    it('should exclude any values given', function () {
      const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3, coconut: 4})
      
      fruitPicker.roll()

      expect(fruitPicker.roll({exclude:['coconut']})).to.not.equal('coconut')
      expect(fruitPicker.roll({exclude:['mango']})).to.not.equal('mango')
      expect(fruitPicker.roll({exclude:['orange']})).to.not.equal('orange')
      expect(fruitPicker.roll({exclude:['apple']})).to.not.equal('apple')

      expect(fruitPicker.roll({exclude:['apple', 'orange']})).to.not.be.oneOf(['apple', 'orange'])
      expect(fruitPicker.roll({exclude:['orange', 'mango']})).to.not.be.oneOf(['orange', 'mango'])
      expect(fruitPicker.roll({exclude:['mango', 'coconut']})).to.not.be.oneOf(['mango', 'coconut'])
      expect(fruitPicker.roll({exclude:['coconut', 'apple']})).to.not.be.oneOf(['coconut', 'apple'])
      
      expect(fruitPicker.roll({exclude:['coconut']})).to.not.equal('coconut')
      expect(fruitPicker.roll({exclude:['mango']})).to.not.equal('mango')
      expect(fruitPicker.roll({exclude:['orange']})).to.not.equal('orange')
      expect(fruitPicker.roll({exclude:['apple']})).to.not.equal('apple')

    })

    it('should pick something EVEN IF the remaining proportions sum up to a negative value', function () {
      const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3})
      
      fruitPicker.roll('apple')
      fruitPicker.roll('orange')
      fruitPicker.roll('orange')

      expect(() => fruitPicker.roll({exclude: ['mango']})).to.not.throw()
      expect(fruitPicker.roll({exclude:['mango']})).to.be.oneOf(['apple', 'orange'])
      expect(fruitPicker.roll({exclude:['mango']})).to.be.oneOf(['apple', 'orange'])
    })

    it('should throw error when the `exclude` array leaves no other options', function () {
      const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3})

      fruitPicker.roll()
      fruitPicker.roll()

      expect(() => fruitPicker.roll({exclude:['apple', 'orange', 'mango']})).to.throw('available options')
    })

  })

  describe('only', function () {
    
    it('should be accepted by the roll function', function () {
      const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3, coconut: 4})
      
      function testFunction () {
        fruitPicker.roll({only: ['apple', 'orange', 'mango']})
      }
      expect(testFunction).to.not.throw()
    })

    it('should ONLY pick the given values', function () {
      const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3, coconut: 4})
      
      fruitPicker.roll()

      expect(fruitPicker.roll({only:['apple', 'orange']})).to.be.oneOf(['apple', 'orange'])
      expect(fruitPicker.roll({only:['mango', 'coconut']})).to.be.oneOf(['mango', 'coconut'])
      expect(fruitPicker.roll({only:['apple', 'mango']})).to.be.oneOf(['apple', 'mango'])
      expect(fruitPicker.roll({only:['orange', 'coconut']})).to.be.oneOf(['orange', 'coconut'])

      expect(fruitPicker.roll({only:['apple', 'orange']})).to.be.oneOf(['apple', 'orange'])
      expect(fruitPicker.roll({only:['mango', 'coconut']})).to.be.oneOf(['mango', 'coconut'])
      expect(fruitPicker.roll({only:['apple', 'mango']})).to.be.oneOf(['apple', 'mango'])
      expect(fruitPicker.roll({only:['orange', 'coconut']})).to.be.oneOf(['orange', 'coconut'])
    })

    it('should pick something EVEN IF the possible proportions sum up to a negative value', function () {
      const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3})

      fruitPicker.roll('apple')
      fruitPicker.roll('orange')
      fruitPicker.roll('orange')

      expect(() => fruitPicker.roll({only: ['apple', 'orange']})).to.not.throw()
      expect(fruitPicker.roll({only:['apple', 'orange']})).to.be.oneOf(['apple', 'orange'])
      expect(fruitPicker.roll({only:['apple', 'orange']})).to.be.oneOf(['apple', 'orange'])
    })

    it('should throw error when the `only` array is empty', function () {
      const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3})

      fruitPicker.roll()
      fruitPicker.roll()

      expect(() => fruitPicker.roll({only: []})).to.throw('available options')
    })

  })

  describe.skip('pause and unpause', function () {
    describe('pause(key)', function () {
      it('should not throw Error, even if given a non-existent key', function () {
        const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3, coconut: 4})
        fruitPicker.roll()

        expect(() => {fruitPicker.pause('coconut')}).to.not.throw()
        expect(() => {fruitPicker.pause('fake_key')}).to.not.throw()
      })
      it('should correctly pause the key', function () {
        const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3, coconut: 4})
        fruitPicker.roll()

        fruitPicker.pause('coconut')

        const fruitsArray = []
        _.times(10, () => fruitsArray.push(fruitPicker.roll()) )
        expect(fruitsArray).to.not.include('coconut')
      })
    })
    describe('unpause(key)', function () {
      it('should not throw Error, even if given a non-existent key', function () {
        const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3, coconut: 4})
        fruitPicker.roll()

        expect(() => {fruitPicker.unpause('coconut')}).to.not.throw()
        expect(() => {fruitPicker.unpause('fake_key')}).to.not.throw()
      })
      it('should correctly unpause the key', function () {
        const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3, coconut: 4})
        fruitPicker.roll()

        fruitPicker.pause('coconut')

        const fruitsArray = []
        _.times(5, () => fruitsArray.push(fruitPicker.roll()) )
        expect(fruitsArray).to.not.include('coconut')

        fruitPicker.unpause('coconut')
        const fruitsArray2 = []
        _.times(10, () => fruitsArray2.push(fruitPicker.roll()) )
        expect(fruitsArray2).to.include('coconut')

      })
    })
  })

  describe('updateProportions', function () {
    it('should fully replace the originalProportions', function () {
      const fruitPicker = new Brng(
        {apple: 1, orange: 2, mango: 3, coconut: 4},
        {keepHistory: true, bias: 2}
      )
      fruitPicker.roll()
      fruitPicker.roll()

      fruitPicker.updateProportions({lychee: 2.5, peach: 3.5, banana: 4.5})

      const fruitsArray = []
      _.times(40, () => fruitsArray.push(fruitPicker.roll()) )

      expect(fruitsArray).to.include('lychee')
      expect(fruitsArray).to.include('peach')
      expect(fruitsArray).to.include('banana')

      expect(fruitsArray).to.not.include('apple')
      expect(fruitsArray).to.not.include('orange')
      expect(fruitsArray).to.not.include('mango')
      expect(fruitsArray).to.not.include('coconut')
    })
    it('should also replace old proportion value', function () {
      const fruitPicker = new Brng(
        {apple: 1, orange: 2, mango: 3, coconut: 4},
        {keepHistory: true, bias: 2}
      )
      fruitPicker.roll()
      fruitPicker.roll()

      fruitPicker.updateProportions({lychee: 2.5, apple: 5})

      _.times(40, () => fruitPicker.roll())

      const appleCount = fruitPicker.historyMapping.apple
      const lycheeCount = fruitPicker.historyMapping.lychee
      
      expect(appleCount).to.be.greaterThan(lycheeCount)

    })
    it('should work together with {only: [...]}', function () {
      const fruitPicker = new Brng(
        {apple: 1, orange: 2, mango: 3, coconut: 4},
        {keepHistory: true, bias: 2}
      )
      fruitPicker.roll({exclude: ['coconut']})
      fruitPicker.roll({exclude: ['coconut']})
      fruitPicker.roll({exclude: ['coconut']})

      fruitPicker.updateProportions({lychee: 2.5, apple: 5})

      _.times(100, () => fruitPicker.roll({only: ['lychee', 'apple', 'coconut']}))

      const appleCount = fruitPicker.historyMapping.apple
      const lycheeCount = fruitPicker.historyMapping.lychee
      const coconutCount = fruitPicker.historyMapping.coconut
      
      expect(appleCount).to.be.greaterThan(lycheeCount)
      expect(coconutCount).to.equal(0)
    })
  })

  describe('add and remove', function () {
    describe('add', function () {
      it('should add the key with the given proportion', function () {
        const fruitPicker = new Brng(
          {apple: 1, orange: 2, mango: 3, coconut: 4},
          {keepHistory: true, bias: 2}
        )
        fruitPicker.roll()

        fruitPicker.add({lychee: 2.5, peach: 3.5})
        fruitPicker.add({banana: 4.5})

        const fruitsArray = []
        _.times(40, () => fruitsArray.push(fruitPicker.roll()) )

        expect(fruitsArray).to.include('lychee')
        expect(fruitsArray).to.include('peach')
        expect(fruitsArray).to.include('banana')
      })
    })
    
    describe('remove', function () {
      it('should do nothing if given a non-existent key', function () {
        const fruitPicker = new Brng({apple: 1, orange: 2, mango: 3, coconut: 4})
        fruitPicker.roll()

        expect(() => fruitPicker.remove('fake_key')).to.not.throw()
      })
      it('should correctly remove the key', function () {
        const fruitPicker = new Brng(
          {apple: 1, orange: 2, mango: 3, coconut: 4},
          {keepHistory: true, bias: 2}
        )
        fruitPicker.roll()

        fruitPicker.remove('coconut')
        const fruitsArray = []
        _.times(10, () => fruitsArray.push(fruitPicker.roll()) )
        expect(fruitsArray).to.not.include('coconut')

      })
    })

  })

  describe('weight', function () {
    it('should change the proportion more with heavier weight', function () {
      var roller = new Brng({apple: 3, mango: 3, coconut: 3}, {random: seed('heavyWeight'), bias: 1})

      roller.setBias(2)
      roller.roll()

      expect(roller.proportions).to.deep.equal({apple: -1, mango: 5, coconut: 5})
    })

    it('should change the proportion less with lower weight', function () {
      var roller = new Brng({apple: 3, mango: 3, coconut: 3}, {random: seed('heavyWeight'), bias: 1})

      roller.setBias(0.5)
      roller.roll()

      expect(roller.proportions).to.deep.equal({apple: 2, mango: 3.5, coconut: 3.5})
    })

  })

  describe('Brng.random', () => {
    it('should work to replace Math.random', () => {

      Brng.random = seed('brngrandom')
      const fruitPicker = new Brng(
        {apple: 1, orange: 2, mango: 3, coconut: 4},
        {keepHistory: true}
      )

      _.times(6, () => fruitPicker.roll())
      expect(fruitPicker.historyArray).to.deep.equal(
        [ 'coconut', 'orange', 'coconut', 'orange', 'coconut', 'mango' ])

      Brng.resetRandom()
    })

    describe('config.random', () => {
      it('should override any Brng.random set', () => {
        Brng.random = seed('brngrandom')
        const fruitPicker = new Brng(
          {apple: 1, orange: 2, mango: 3, coconut: 4},
          {keepHistory: true, random: seed('randomoverride')}
        )

        _.times(6, () => fruitPicker.roll())
        expect(fruitPicker.historyArray).to.deep.equal(
          [ 'orange', 'coconut', 'coconut', 'mango', 'mango', 'orange' ])

        Brng.resetRandom()
      })
    })
  })

})
