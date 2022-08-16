import chain from '@src/chain'

const sum    = (arr: number[]) => arr.reduce((result, i) => result + i, 0)
const add    = (a: number, b: number) => a + b
const addOne = (i: number) => i + 1

describe('chain', () => {
  it('generates the correct attributes', () => {
    const chainable = chain()
    expect(chainable).toHaveProperty('next')
    expect(chainable).toHaveProperty('value')
  })

  it('can chain operations', () => {
    const input     = 0
    const chainable = chain(input)

    const { value } = chainable.next(addOne).next(addOne)
    expect(value).toEqual(2)
  })

  it('can accept different inputs combined with chaining', () => {
    const inputs    = [1, 1, 1]
    const chainable = chain(inputs)

    const { value } = chainable.next(sum).next(addOne).next(addOne)
    expect(value).toEqual(5)
  })

  it('can accept multiple inputs combined with chaining', () => {
    const chainable = chain(5, 6)

    const { value } = chainable.next(add).next(addOne)
    expect(value).toEqual(12)
  })
})
