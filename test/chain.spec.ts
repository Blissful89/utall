import chain from '@src/chain'

describe('chain', () => {
  it('generates the correct attributes', () => {
    const chainable = chain()
    expect(chainable).toHaveProperty('next')
    expect(chainable).toHaveProperty('value')
  })
  it.todo('can chain operations')
})
