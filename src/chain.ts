interface Chain {
  value: any
  next: (func: (...args: any[]) => any) => Chain
}

const chain = (value?: any, ...values: any[]): Chain => ({
  value,
  next(func: (...args: any[]) => any) {
    this.value = func(value, ...values)
    return chain(this.value)
  },
})

export default chain
