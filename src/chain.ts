const chain = (value?: any, ...values: any[]) => ({
  value,
  next(func: (...args: any[]) => any) {
    this.value = func(value, ...values)
    return chain(this.value)
  },
})

export default chain
