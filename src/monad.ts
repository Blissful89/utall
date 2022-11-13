type Func = (...args: any) => any | Promise<any>

class Monad<T> {
  value: T
  log

  /**
   * Monad with promise functionality
   *
   * - `.value` current state
   * - `.log` log of pipeline steps. Use by adding empty array as second parameter
   * - `.apply(func, ...args)` to apply function to value. Accepts extra arguments
   * - `.promise(func, ...args)` adds promise to the stack. Converts Monad to PromisedMonad
   * - `.resolve()` resolves PromisedMonad back to Monad. Returns a Promise
   * - `.all(promisedMonads)` static. resolves multiple PromisedMonads in parallel
   */
  constructor(value?: any, log?: any[]) {
    this.value = value
    this.log   = log
  }

  apply(func: Func, ...args: any) {
    if (this.value === null) return this

    this.value = func(this.value, ...args)
    return this.finish()
  }

  protected finish(skip = false) {
    if (!this.log || skip) return new Monad<T>(this.value, this.log)
    return new Monad<T>(this.value, [...this.log, this.value])
  }

  promise(func: Func, ...args: any) {
    return new PromisedMonad<T>(this, [[func, args]])
  }

  static all<T>(promisedMonads: PromisedMonad<any>[]) {
    return Promise.all<Monad<T>>(promisedMonads.map((monad) => monad.resolve()))
  }
}

class PromisedMonad<T> extends Monad<T> {
  private tasks

  constructor(maybe: Monad<T>, tasks: [Func, any][]) {
    super(maybe.value, maybe.log)
    this.tasks = tasks
  }

  promise(func: Func, ...args: any) {
    this.tasks.push([func, args])
    return this
  }

  async resolve() {
    for await (const [func, args] of this.tasks) {
      this.value = await func(this.value, ...args)
      this.log?.push(this.value)
    }

    return this.finish(true)
  }
}

export default Monad
