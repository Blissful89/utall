type Func = (...args: any) => any | Promise<any>

/**
 * The base of a Monad
 */
class MonadBase<T> {
  value: T
  log

  constructor(value?: any, log?: any[] | null) {
    this.value = value
    this.log   = log
  }

  apply(func: Func, ...args: any) {
    this.value = func(this.value, ...args)
    return this.finish()
  }

  protected finish(skip = false) {
    if (!this.log || skip) return new MonadBase<T>(this.value, this.log)
    return new MonadBase<T>(this.value, [...this.log, this.value])
  }

  promise(func: Func, ...args: any) {
    return new PromisedMonad<T>(this, [[func, args]])
  }

  static all<T>(promisedMonads: PromisedMonad<any>[]) {
    return Promise.all<Monad<T>>(promisedMonads.map((monad) => monad.resolve()))
  }
}

/**
 * Maybe extension
 */
class Maybe<M> extends MonadBase<M> {
  private before

  constructor(value?: any, log?: any[] | null, before?: Func) {
    super(value, log)
    this.before = before
  }

  apply(func: Func, ...args: any): Maybe<M> {
    if (this.value === null) return this
    if (this.value === undefined) return this
    if (this.before && !this.before(this.value)) return this
    const { value, log } = super.apply(func, ...args)
    return new Maybe(value, log)
  }
}

/**
 * Either extension
 */
class Either<E> extends MonadBase<E> {
  apply(leftFunc: Func, rightFunc: Func, ...args: any): Either<E> {
    try {
      const { value, log } = super.apply(rightFunc, ...args)
      return new Either(value, log)
    } catch {
      const { value, log } = super.apply(leftFunc, ...args)
      return new Either(value, log)
    }
  }

  fold(maybe = false) {
    if (maybe) return new Maybe<E>(this.value, this.log)
    return new MonadBase<E>(this.value, this.log)
  }
}

/**
 * Promise extension
 */
class PromisedMonad<T> extends MonadBase<T> {
  private tasks

  constructor(maybe: MonadBase<T>, tasks: [Func, any][]) {
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

export default class Monad<T> extends MonadBase<T> {
  static Maybe = Maybe
  static Either = Either
}
