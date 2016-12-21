/**
 * PromiseQueue is a basic class that allows you to limit concurrency of your async tasks.
 *
 * @example
 *
 * const tasks = [
 *    {
 *      url: 'https://api.service.com',
 *      data: { id: 1 },
 *    },
 *    {
 *      url: 'https://api.service.com',
 *      data: { id: 2 },
 *    }
 *  ];
 *
 *  function wrapTask(payload) {
 *    const request = new Request(
 *      payload.url,
 *      { method: 'POST', body: JSON.stringify(payload.data) }
 *    );
 *    return fetch(request);
 *  }
 *
 *  const queue = new PromiseQueue(CONCURRENCY, wrapTask, tasks);
 *  return queue.process().then((result) => {
 *    console.log('All done!');
 *    console.log(result);
 *  });
 */

export default class PromiseQueue {
  /**
   * [tasks description]
   * @param {number} concurrency Limit of how many tasks can be concurrently processed.
   * @param {Function} wrapper Function to use for converting payload into a Promise.
   *                           Due to the fact that promise starts to execute right after
   *                           it was created we should store data payload instead and only
   *                           create an actual promise when we are ready to process it.
   *                           wrapper :: Object -> Promise
   * @param {Array} tasks Array of payload data.
   */
  constructor(concurrency, wrapper, tasks = []) {
    this.concurrency = concurrency;
    this.tasks = tasks;
    this.wrapper = wrapper;

    this.result = [];
    this.inProgress = false;
  }

  /**
   * Enqueues a task payload.
   * @param  {Object} task Task payload.
   * @return {number}      New queue size.
   */
  enqueue = (task) => {
    this.tasks.push(task);
    return this.tasks.length;
  }

  /**
   * Starts processing of the tasks in queue.
   *
   * @return {Promise | boolean} Returns promise to be fullfilled when all tasks are done.
   *                             If called while job is still in progress returns false.
   */
  process = () => {
    // we want runner function to be private
    const runner = () => {
      if (!this.tasks.length) {
        this.inProgress = false;

        return Promise.resolve(this.result);
      }

      const batch = this.tasks.splice(0, this.concurrency);
      const results = this.result;

      return Promise.all(batch.map(this.wrapper))
        .then(result => results.push(...result))
        .then(runner);
    };

    if (!this.inProgress) {
      this.inProgress = true;
      this.result = [];
      return runner();
    }

    return false;
  }
}
