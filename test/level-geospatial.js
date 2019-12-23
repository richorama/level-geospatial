require('should')
const level = require('level-test')()
const levelGeospatial = require('../lib/level-geospatial')
const { streamPromise } = require('./utils')
const getNewDb = () => {
  const db = level()
  const geo = levelGeospatial(db)
  return { db, geo }
}
const lat = 52.081959
const lon = 1.415904

describe('level-geospatial', () => {
  describe('put', () => {
    it('should put with a callback', done => {
      const { geo, db } = getNewDb()
      geo.put({ lat, lon }, 'somekey', 'somevalue', err => {
        if (err) return done(err)
        streamPromise(db.createReadStream())
        .then(results => {
          results.should.deepEqual([
            {
              key: `geos~1202020102220223130002~${lat}~${lon}~somekey`,
              value: 'somevalue'
            },
            {
              key: 'keys~somekey',
              value: `1202020102220223130002~${lat}~${lon}~somekey`
            }
          ])
          done()
        })
        .catch(done)
      })
    })
  })

  describe('get', () => {
    it('should get with a callback', done => {
      const { geo, db } = getNewDb()
      geo.put({ lat, lon }, 'somekey', 'somevalue', err => {
        if (err) return done(err)
        geo.get({ lat, lon }, 'somekey', (err, res) => {
          if (err) return done(err)
          res.should.deepEqual({
            quadKey: '1202020102220223130002',
            position: { lat, lon },
            id: 'somekey',
            value: 'somevalue'
          })
          done()
        })
      })
    })
  })

  describe('del', () => {
    it('should del with a callback', done => {
      const { geo, db } = getNewDb()
      geo.put({ lat, lon }, 'somekey', 'somevalue', err => {
        if (err) return done(err)
        geo.del('somekey', (err, res) => {
          if (err) return done(err)
          geo.getByKey('somekey', (err, res) => {
            err.name.should.equal('NotFoundError')
            done()
          })
        })
      })
    })
  })

  describe('getByKey', () => {
    it('should getByKey with a callback', done => {
      const { geo, db } = getNewDb()
      geo.put({ lat, lon }, 'somekey', 'somevalue', err => {
        if (err) return done(err)
        geo.getByKey('somekey', (err, res) => {
          if (err) return done(err)
          res.should.deepEqual({
            quadKey: '1202020102220223130002',
            position: { lat, lon },
            id: 'somekey',
            value: 'somevalue'
          })
          done()
        })
      })
    })
  })

  describe('search', () => {
    it('should return search results as a stream', done => {
      const { geo, db } = getNewDb()
      geo.put({ lat, lon }, 'somekey', 'somevalue', err => {
        if (err) return done(err)
        const searchData = { lat: Math.floor(lat), lon: Math.floor(lon) }
        const radius = 100000
        streamPromise(geo.search(searchData, radius))
        .then(res => {
          res.should.be.an.Array()
          res[0].should.deepEqual({
            quadKey: '1202020102220223130002',
            distance: 29903.681508047284,
            position: { lat, lon },
            id: 'somekey',
            value: 'somevalue'
          })
          done()
        })
        .catch(done)
      })
    })
  })
})
