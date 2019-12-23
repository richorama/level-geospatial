module.exports = {
  streamPromise: stream => new Promise((resolve, reject) => {
    const results = []
    return stream
    .on('data', results.push.bind(results))
    .on('end', () => resolve(results))
    .on('error', reject)
  })
}
