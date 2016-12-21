import 'babel-polyfill';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import PromiseQueue from '../';

chai.use(chaiAsPromised);

/* global describe it beforeEach */

describe('PromiseQueue', () => {
  const CONCURRENCY = 3;
  const TASK_COUNT = 20;

  let tasks = [];
  let concurrencyMonitor = 0;
  let maxConcurrency = 0;

  function concurrencySetter(decrease = false) {
    const current = decrease ? (concurrencyMonitor -= 1) : (concurrencyMonitor += 1);

    if (current > maxConcurrency) {
      maxConcurrency = current;
    }
  }

  function promiseFactory(taskId) {
    return { taskId };
  }

  function testWrapperConcurrency(payload) {
    return new Promise((resolve) => {
      concurrencySetter();
      setTimeout(() => {
        concurrencySetter(true);
        resolve({ payload, done: true });
      }, 10);
    });
  }

  function testRejectWrapper(payload) {
    return Promise.reject(payload);
  }

  function testWrapper(payload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ payload, done: true });
      }, 10);
    });
  }

  beforeEach(() => {
    tasks = [];

    for (let i = 0; i < TASK_COUNT; i += 1) {
      tasks.push(promiseFactory(`Job #${i}`));
    }
  });

  describe('#process', () => {
    it('should process all the tasks', () => {
      const queue = new PromiseQueue(CONCURRENCY, testWrapper, tasks);
      return expect(queue.process()).to.eventually.have.length(TASK_COUNT);
    });

    it('should resolve after all tasks is done', () => {
      const queue = new PromiseQueue(CONCURRENCY, testWrapper, tasks);
      return expect(queue.process()).to.be.fulfilled;
    });

    it('should correctly process duplicate call', () => {
      const queue = new PromiseQueue(CONCURRENCY, testWrapper, tasks);
      queue.process();
      expect(queue.process()).to.be.false; // eslint-disable-line
    });

    it('should maintain specified concurrency', () => {
      const queue = new PromiseQueue(CONCURRENCY, testWrapperConcurrency, tasks);
      return queue.process().then(() => {
        expect(maxConcurrency).to.equal(CONCURRENCY);
      });
    });

    it('should pass rejection', () => {
      const additionalPromise = promiseFactory('new one');

      const queue = new PromiseQueue(CONCURRENCY, testWrapper, tasks);
      const expectation = expect(queue.process()).to.be.rejected;
      queue.wrapper = testRejectWrapper;
      queue.enqueue(additionalPromise);

      return expectation;
    });
  });

  describe('#enqueue', () => {
    it('should allow enqueue additional tasks', () => {
      const additionalPromise = promiseFactory('new one');

      const queue = new PromiseQueue(CONCURRENCY, testWrapper, tasks);
      const expectation = expect(queue.process()).to.eventually.have.length(TASK_COUNT + 1);
      queue.enqueue(additionalPromise);

      return expectation;
    });

    it('should return new size of queue', () => {
      const additionalPromise = promiseFactory('new one');

      const queue = new PromiseQueue(CONCURRENCY, testWrapper, tasks);
      queue.enqueue(additionalPromise);
      queue.enqueue(additionalPromise);
      expect(queue.enqueue(additionalPromise)).to.equal(TASK_COUNT + 3);
    });
  });
});
