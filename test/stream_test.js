import {assert} from 'chai'
import AsyncStream from '../src/AsyncStream'
import PageStream from '../src/PageStream'
import * as query from '../src/query'
import {client} from './util'

const countToFour = () =>
  AsyncStream.fromIterable([0, 1, 2, 3, 4])

describe('stream', () => {
  it('stream', async function() {
    assert.deepEqual(await countToFour().all(), [0, 1, 2, 3, 4])
  })

  it('map', async function() {
    assert.deepEqual(await countToFour().map(n => n * 2).all(), [0, 2, 4, 6, 8])
  })

  it('filter', async function() {
    assert.deepEqual(await countToFour().filter(n => n % 2 === 0).all(), [0, 2, 4])
  })

  it('takeWhile', async function() {
    assert.deepEqual(await countToFour().takeWhile(n => n < 3).all(), [0, 1, 2])
  })

  it('flatten', async function() {
    assert.deepEqual(
      await AsyncStream.fromIterable([[0, 1], [], [2, 3, 4]]).flatten().all(),
      [0, 1, 2, 3, 4])
  })

  it('flatMap', async function() {
    assert.deepEqual(
      await AsyncStream.fromIterable([0, 1, 2]).flatMap(n => [n, n]).all(),
      [0, 0, 1, 1, 2, 2])
  })

  it('page stream', async function() {
    const classRef = (await client.post('classes', {name: 'gadgets'})).ref
    const indexRef = (await client.post('indexes', {
      name: 'gadgets_by_n',
      source: classRef,
      path: 'data.n',
      active: true
    })).ref

    async function create(n) {
      const q = query.create(classRef, query.quote({data: {n}}))
      return (await client.query(q)).ref
    }

    const a = await create(0)
    await create(1)
    const b = await create(0), c = await create(0), d = await create(0)

    const gadgetsSet = query.match(0, indexRef)

    const stream = new PageStream(client, gadgetsSet, {pageSize: 2})

    assert.deepEqual(await stream.all(), [[a, b], [c, d]])

    assert.deepEqual(
      await PageStream.elements(client, gadgetsSet, {pageSize: 2}).all(),
      [a, b, c, d])

    // Test mapLambda
    const mapStream = PageStream.elements(client, gadgetsSet, {
      pageSize: 2,
      mapLambda: a => query.select(['data', 'n'], query.get(a))
    })
    assert.deepEqual(await mapStream.all(), [0, 0, 0, 0])
  })
})