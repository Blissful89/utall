import Monad from '@src/monad'

const sum            = (arr: number[]) => arr.reduce((result, i) => result + i, 0)
const add            = (a: number, b: number) => a + b
const addOne         = (i: number) => i + 1
const multiply       = (e: number, c: number) => e * c
const promisedAddOne = (e: any) => Promise.resolve(e + 1)
const returnPromise  = (e: any, a?: any) => Promise.resolve(a ? e + a : e)
const returnNull     = () => null
const throwsError    = (e: any) => { throw new Error(e) }
const isNumber       = (e: any) => typeof e === 'number'

describe('Monad', () => {
  it('has no start value', () => {
    const monad = new Monad()

    expect(monad).toHaveProperty('value')
    expect(monad.value).toEqual(undefined)
  })

  it('can operate a bound function', () => {
    const monad = new Monad([1, 2, 3])

    const { value } = monad.apply(sum)

    expect(value).toEqual(6)
  })

  it('can chain operations', () => {
    const monad = new Monad([1, 2, 3])

    const { value } = monad
      .apply(sum)
      .apply(addOne)

    expect(value).toEqual(7)
  })

  it('can log outputs', () => {
    const monad = new Monad([1, 2, 3], [])

    const { log } = monad
      .apply(sum)
      .apply(addOne)

    expect(log).toEqual([6, 7])
  })

  it('throws an errors when needed', () => {
    const monad = new Monad(null, [])

    let error
    try {
      monad.apply(sum)
    } catch (e) {
      error = e
    }

    expect(error).toBeTruthy()
  })

  it('returns log when function returns null', () => {
    const monad = new Monad([1, 2, 3], [])

    const { value, log } = monad
      .apply(sum)
      .apply(addOne)
      .apply(returnNull)

    expect(value).toEqual(null)
    expect(log).toEqual([6, 7, null])
  })

  it('can resolve a promise', async () => {
    const monad = new Monad([1, 2, 3])

    const { value } = await monad
      .apply(sum)
      .promise(returnPromise)
      .resolve()

    expect(value).toEqual(6)
  })

  it('can serialize promises', async () => {
    const monad = new Monad([1, 2, 3])

    const { value } = await monad
      .apply(sum)
      .promise(returnPromise)
      .promise(returnPromise)
      .resolve()

    expect(value).toEqual(6)
  })

  it('accepts new arguments', () => {
    const monad = new Monad([1, 2, 3])

    const { value } = monad
      .apply(sum)
      .apply(add, 5)
      .apply(addOne)

    expect(value).toEqual(12)
  })

  it('accepts new arguments for promises', async () => {
    const monad = new Monad([1, 2, 3], [])

    const { value, log } = await monad
      .apply(sum)
      .promise(returnPromise, 4)
      .promise(returnPromise, 4)
      .resolve()

    expect(value).toEqual(14)
    expect(log).toEqual([6, 10, 14])
  })

  it('can combine monads', () => {
    const monadOne = new Monad(1, []).apply(multiply, 2)
    const monadTwo = new Monad(1).apply(multiply, 2)

    const { value, log } = monadOne.apply(multiply, monadTwo.value)

    expect(value).toEqual(4)
    expect(log).toEqual([2, 4])
    expect(monadTwo.value).toEqual(2)
    expect(monadTwo.log).toEqual(undefined)
  })

  it('can combine promised monads in parallel', async () => {
    const monadOne = new Monad(1, [])
      .promise(promisedAddOne)
      .promise(promisedAddOne)

    const monadTwo = new Monad(10, [])
      .promise(promisedAddOne)
      .promise(promisedAddOne)

    const [
      { value: value1, log: log1 },
      { value: value2, log: log2 },
    ] = await Monad.all<number>([monadOne, monadTwo])

    expect(value1).toEqual(3)
    expect(value2).toEqual(12)
    expect(log1).toEqual([2, 3])
    expect(log2).toEqual([11, 12])
  })
})

describe('Monad.Maybe', () => {
  it('does not run without value', () => {
    const watcher1 = jest.fn(addOne)
    const watcher2 = jest.fn(addOne)
    const watcher3 = jest.fn(addOne)

    const maybe1 = new Monad.Maybe().apply(watcher1)
    const maybe2 = new Monad.Maybe(null).apply(watcher2)
    const maybe3 = new Monad.Maybe(false).apply(watcher3)

    expect(watcher1).not.toHaveBeenCalled()
    expect(watcher2).not.toHaveBeenCalled()
    expect(watcher3).toHaveBeenCalled()
    expect(maybe1.value).toEqual(undefined)
    expect(maybe2.value).toEqual(null)
    expect(maybe3.value).toEqual(1)
  })

  it('halts when value is null', () => {
    const { value, log } = new Monad.Maybe(5, [])
      .apply(addOne)
      .apply(addOne)
      .apply(returnNull)
      .apply(addOne)

    expect(value).toEqual(null)
    expect(log).toEqual([6, 7, null])
  })

  it('can handle before function', () => {
    const jestFn         = jest.fn(addOne)
    const { value, log } = new Monad.Maybe(5, [], isNumber)
      .apply(addOne)
      .apply((e) => `${e}`)
      .apply(jestFn)

    expect(jestFn).not.toHaveBeenCalled()
    expect(log).toEqual([6, '6'])
    expect(value).toEqual('6')
  })

  it('can use custom before logic', () => {
    const { value } = new Monad.Maybe('5', null, isNumber).apply(addOne)

    expect(value).toEqual('5')
  })
})

describe('Monad.Either', () => {
  it('runs right function first', () => {
    const { value } = new Monad.Either(3).apply(addOne, add, 2)

    expect(value).toEqual(5)
  })

  it('falls back to left function without error', () => {
    const { value } = new Monad.Either(3).apply(addOne, throwsError)

    expect(value).toEqual(4)
  })

  it('throws an error when both left and right functions fail', () => {
    const either = new Monad.Either(1)

    let error
    try {
      either.apply(throwsError, throwsError)
    } catch (e) {
      error = e
    }

    expect(error).toBeTruthy()
  })

  it('can chain eithers', () => {
    const { value } = new Monad.Either(1)
      .apply(addOne, addOne)
      .apply(addOne, add, 2)

    expect(value).toEqual(4)
  })

  it('can fold back', () => {
    const maybe  = new Monad.Either(1).apply(addOne, addOne).fold(true)
    const monad1 = new Monad.Either(1).apply(addOne, addOne).fold(false)
    const monad2 = new Monad.Either(1).apply(addOne, addOne).fold()

    expect(maybe.value).toEqual(2)
    expect(monad1.value).toEqual(2)
    expect(monad2.value).toEqual(2)
  })
})
