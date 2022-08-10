const chain = (value?: any, ...values: any[]) => ({
  value,
  next(func: any) {
    this.value = func(value, ...values)
    return chain(this.value)
  },
})

export default chain
