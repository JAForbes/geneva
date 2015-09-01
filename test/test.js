var G = require("..")
var assert = require("assert")

function model(){
	return {
		a: 100,
		b: 3,
		rates: {
			proving: 4,
			trenching: 2,
			boring: undefined
		},
		array: [ 1, 2, 3 ]
	}
}

function configure(){
	return G.configure({
		a: { name: "A", validations: [G.between(1,10)] },
		b: { name: function(prop){ return "B"+prop }, validations: [G.required()] },
		rates: { name: "Rates", validations: [ G.required(), G.between(1,10)] },
		array: { name: "Array", validations: [G.between(1,10)]}
	}, model() )
}

describe("Configure", function(){
	it("traverses named nested properties and creates a config object for each sub property", function(){
		var config = configure()

		assert.equal( config.rates.proving.validations.length , 2)
		assert.equal( config.rates.trenching.validations.length , 2)
	})
	it("traverses named arrays and creates a corresponding config object with the same shape", function(){
		var config = configure()
		assert.equal( config.array.length , 3)
		assert.equal( config.array[0].validations.length , 1)
	})
	it("identifies when a property is a leaf, and only creates one sub config object", function(){
		var config = configure()

		assert.equal( config.a.validations.length , 1)
	})
	it("accepts a string as a name in the property config", function(){
		var config = configure()

		assert.equal( config.a.name, "A")
	})
	it("accepts a function as a name in the property config", function(){
		var config = configure()

		assert( config.b.name instanceof Function )
	})
})

describe("Validate", function(){
	it("creates an error tree with the same structure as the model", function(){
		var config = configure()
		var m = model()

		var errors = G.validate( config, m )

		assert.equal(errors.a.errors.length, 1)
		assert.equal(errors.array[0].errors.length, 1)
		assert.equal(errors.rates.boring.errors.length, 2)
	})
	it("creates multiple errors per failed property", function(){
		var config = configure()
		var m = model()

		var errors = G.validate( config, m )

		assert.equal(errors.rates.boring.errors.length, 2)
	})
	it("creates a generated name if the config used a name function", function(){
		var config = configure()
		var m = model()

		var errors = G.validate( config, m )

		assert.equal(errors.b.name, "Bb")
	})
	it("creates a flat list of errors", function(){
		var config = configure()
		var m = model()

		var error = G.validate( config, m)
		console.log(JSON.stringify(error,null,2))
		assert.equal(error.all.length, 3)
	})
})