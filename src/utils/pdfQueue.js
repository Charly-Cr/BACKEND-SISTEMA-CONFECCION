const queue = [];
let processing = false;

const processQueue = async () => {
  if (processing || queue.length === 0) return;

  processing = true;

  const { job, resolve, reject } = queue.shift();

  try {
    const result = await job();
    resolve(result);
  } catch (error) {
    reject(error);
  }

  processing = false;

  // 🔁 sigue con el siguiente
  processQueue();
};

const addToQueue = (job) => {
  return new Promise((resolve, reject) => {
    queue.push({ job, resolve, reject });
    processQueue();
  });
};

module.exports = { addToQueue };