# [🔙](../README.md) Monad

## Constructor
```javascript
const simple = new Monad(value)
const { value, logs } = new Monad<T>(value, []) // Value of type T
```

## Usage
Monad is class based. It can be initiated with a contructor
> For debugging and error handling the log array can be added to the constructor. 
> This will impact the performance of the `Monad`.

### Apply
Applies a function to the current value and returns a new `Monad`.

### Promise / resolve
Promise adds a promise to the stack and returns a `PromisedMonad`.
Resolve resolves all tasks in the `PromisedMonad` and returns back the `Promise<Monad>`.


>Functions [apply](#apply) and [promise](#promise--resolve) accept extra arguments. This allows for the combination of different monads (see [example](#examples))

### All
A static function to resolve multiple `PromisedMonads` in parallel (Promise.all)

## Examples

1. Simple pipeline
```typescript
const addOne = (e: number) => e + 1

const monad = new Monad(1)
monad.apply(addOne)

console.log(monad.value) // 2
```

2. With deconstructing
```typescript
const addOne = (e: number) => e + 1

const { value, log } = new Monad(1, [])
  .apply(addOne)
  .apply(addOne)

console.log(value) // 3
console.log(log)   // [2,3]
```

3. With new arguments
```typescript
const addOne = (e: number) => e + 1
const multiply = (e: number, c: number) => e * c

const { value, log } = new Monad(2, [])
  .apply(addOne)
  .apply(multiply, 2)
  .apply(multiply, 2)

console.log(value) // 12
console.log(log)   // [3,6,12]
```

4. With Promises
```typescript
const addOne = (e: number) => e + 1
const promisedAddOne = (e) => Promise.resolve(e + 1)

const { value, log } = new Monad(1, [])
  .apply(addOne)
  .promise(promisedAddOne)
  .promise(promisedAddOne)
  .resolve()

console.log(value) // 4
console.log(log)   // [2,3,4]
```

5. Combined monads
```typescript
const multiply = (e: number, c: number) => e * c

const monadOne = new Monad(1, []).apply(multiply, 2)
const monadTwo = new Monad(1).apply(multiply, 2)

const { value, log } = monadOne.apply(multiply, monadTwo.value)

console.log(value)          // 4
console.log(log)            // [2,4]
console.log(monadTwo.value) // 2
console.log(monadTwo.log)   // undefined
```

6. Combined promised monads (top level await for simplicity)
```typescript
const promisedAddOne = (e) => Promise.resolve(e + 1)

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

console.log(value1) // 3
console.log(value2) // 12
console.log(log1)   // [2,3]
console.log(log2)   // [11,12]
```