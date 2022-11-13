import Monad from '@src/monad'

const sum            = (arr: number[]) => arr.reduce((result, i) => result + i, 0)
const add            = (a: number, b: number) => a + b
const addOne         = (i: number) => i + 1
const multiply       = (e: number, c: number) => e * c
const promisedAddOne = (e: any) => Promise.resolve(e + 1)
const returnPromise  = (e: any, a?: any) => Promise.resolve(a ? e + a : e)
const returnNull     = () => null

describe('Monad', () => {
  it('has no start value', () => {
    const monad = new Monad()

    expect(monad).toHaveProperty('value')
    expect(monad.value).toEqual(undefined)
  })

  it('can continue without start value', () => {
    const monad     = new Monad()
    monad.value     = 1
    const { value } = monad.apply(addOne)

    expect(value).toEqual(2)
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

  it('returns null', () => {
    const monad = new Monad(null, [])

    const { value, log } = monad
      .apply(sum)
      .apply(addOne)

    expect(value).toEqual(null)
    expect(log).toEqual([])
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
