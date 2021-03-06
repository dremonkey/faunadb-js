/*
To run this:
  cd examples
  npm install
  node faunadb-test.js
*/

'use strict'

var
  inherits = require('babel-runtime/helpers/inherits').default,
  Client = require('faunadb/lib/Client'),
  errors = require('faunadb/lib/errors'),
    NotFound = errors.NotFound,
  Model = require('faunadb/lib/model/Model'),
  builtin = require('faunadb/lib/model/Builtin'),
    Class = builtin.Class, Database = builtin.Database, Key = builtin.Key,
  objects = require('faunadb/lib/objects'),
    Ref = objects.Ref,
  query = require('faunadb/lib/query')

var rootClient = new Client({
  secret: {
    // Use your faunadb.com login here
    user: '',
    pass: ''
  }
})

function testPing() {
  return rootClient.ping().then(function(response) {
    console.log(response)
  })
}

function createDBAndGetClient() {
  var dbName = 'prydain'
  var dbRef = new Ref('databases', 'prydain')

  return rootClient.delete(dbRef)
  .then(function() {
    console.log('Deleted old db.')
  }).catch(function(error) {
    if (error instanceof NotFound)
      console.log('No old db to delete.')
    else
      throw error
  }).then(function() {
    return Database.create(rootClient, {name: dbName})
  }).then(function() {
    return Key.create(rootClient, {database: dbRef, role: 'server'})
  }).then(function(key) {
    return new Client({secret: {user: key.secret}})
  })
}

function testQuery(client) {
  return client.query(query.add(1, 1)).then(function(response) {
    console.log('1 + 1 is', response)
  })
}

function testModel(client) {
  function MyModel() {
    Model.prototype.constructor.apply(this, arguments)
  }
  inherits(MyModel, Model)
  MyModel.setup('my_model', {
    color: {}
  })

  return Class.createForModel(client, MyModel)
  .then(function() {
    return MyModel.create(client, {color: 'green'})
  }).then(function(instance) {
    console.log(instance.toString())
  })
}

function promiseDone(promise) {
  promise.catch(function(error) {
    console.log(error.stack)
  })
}

function test() {
  return testPing()
  .then(createDBAndGetClient)
  .then(function(client) {
    return testQuery(client)
    .then(function() {
      return testModel(client)
    })
  })
}

promiseDone(test())
