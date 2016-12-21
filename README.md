# PromiseQueue
PromiseQueue is a basic class that allows you to limit concurrency of your async tasks.

```js
const tasks = [
  {
    url: 'https://api.service.com',
    data: { id: 1 },
  },
  {
    url: 'https://api.service.com',
    data: { id: 2 },
  }
];

function wrapTask(payload) {
  const request = new Request(
    payload.url,
    { method: 'POST', body: JSON.stringify(payload.data) }
  );
  return fetch(request);
}

const queue = new PromiseQueue(CONCURRENCY, wrapTask, tasks);
return queue.process().then((result) => {
  console.log('All done!');
  console.log(result);
});
```

npm install && npm run test
