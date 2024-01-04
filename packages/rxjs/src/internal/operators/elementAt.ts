import { ArgumentOutOfRangeError } from '../util/ArgumentOutOfRangeError.js';
import { Observable, operate } from '../Observable.js';
import type { OperatorFunction } from '../types.js';
import { take } from './take.js';

/**
 * Emits the single value at the specified `index` in a sequence of emissions
 * from the source Observable.
 *
 * <span class="informal">Emits only the i-th value, then completes.</span>
 *
 * ![](elementAt.png)
 *
 * `elementAt` returns an Observable that emits the item at the specified
 * `index` in the source Observable, or a default value if that `index` is out
 * of range and the `default` argument is provided. If the `default` argument is
 * not given and the `index` is out of range, the output Observable will emit an
 * `ArgumentOutOfRangeError` error.
 *
 * ## Example
 *
 * Emit only the third click event
 *
 * ```ts
 * import { fromEvent, elementAt } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(elementAt(2));
 * result.subscribe(x => console.log(x));
 *
 * // Results in:
 * // click 1 = nothing
 * // click 2 = nothing
 * // click 3 = MouseEvent object logged to console
 * ```
 *
 * @see {@link first}
 * @see {@link last}
 * @see {@link skip}
 * @see {@link single}
 * @see {@link take}
 *
 * @throws {ArgumentOutOfRangeError} When using `elementAt(i)`, it delivers an
 * `ArgumentOutOfRangeError` to the Observer's `error` callback if `i < 0` or the
 * Observable has completed before emitting the i-th `next` notification.
 *
 * @param index Is the number `i` for the i-th source emission that has happened
 * since the subscription, starting from the number `0`.
 * @param defaultValue The default value returned for missing indices.
 * @return A function that returns an Observable that emits a single item, if
 * it is found. Otherwise, it will emit the default value if given. If not, it
 * emits an error.
 */
export function elementAt<T, D = T>(index: number, defaultValue?: D): OperatorFunction<T, T | D> {
  if (index < 0) {
    throw new ArgumentOutOfRangeError();
  }
  const hasDefaultValue = arguments.length >= 2;
  return (source: Observable<T>) =>
    new Observable((destination) => {
      let i = 0;
      const operatorSubscriber = operate<T, T | D>({
        destination,
        next: (value) => {
          if (i++ === index) {
            // We want to unsubscribe from the source as soon as we know
            // we can. This will prevent reentrancy issues if calling
            // `destination.next()` happens to emit another value from source.
            operatorSubscriber.unsubscribe();
            destination.next(value);
            destination.complete();
          }
        },
        complete: () => {
          if (!hasDefaultValue) {
            destination.error(new ArgumentOutOfRangeError());
          } else {
            destination.next(defaultValue!);
            destination.complete();
          }
        },
      });
      source.subscribe(operatorSubscriber);
    });
}