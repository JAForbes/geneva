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
		array: [ 1, 2, 3 ],
		valid_container: {
			CBD: true,
			Suburban: false,
			Rural: false
		},
		invalid_container: {
			CBD: false,
			Suburban: false,
			Rural: false
		},
		watched: 2,
		watcher: undefined
	}
}

//hacky theoretical validator for cross referencing
var corresponding = {
	fn: function(value, name, config, model){
		if( typeof model.watched != "undefined"){
			return value
		}
	},
	message: "You must specify watcher because you specified watched"
}

function configure(){
	return G.configure({
		a: { owner: "A", validations: [G.between(1,10)] },
		b: { owner: function(prop){ return "B"+prop }, validations: [G.required()] },
		rates: { owner: "Rates", validations: [ G.required(), G.between(1,10)] },
		array: { owner: "Array", validations: [G.between(1,10)]},
		valid_container: { owner: "Valid Container", validations: [G.nTruthy(1)], asGroup: true },
		invalid_container: { owner: "Invalid Container", validations: [G.nTruthy(1)], asGroup: true },
		watcher: { owner: "Watcher proving", validations: [corresponding] }
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

		assert.equal( config.a.owner, "A")
	})
	it("accepts a function as a name in the property config", function(){
		var config = configure()

		assert( config.b.owner instanceof Function )
	})
	it("can optionally treat a container (Array, Object) as a single value", function(){
		var config = configure()
		assert( config.valid_container.asGroup )
	})
})

describe("Validate", function(){
	it("creates an error tree with the same structure as the model", function(){
		var config = configure()
		var m = model()

		var errors = G.validate( config, m )

		assert.equal(errors.a.messages.length, 1)
		assert.equal(errors.array[0].messages.length, 1)
		assert.equal(errors.rates.boring.messages.length, 2)
	})
	it("creates multiple errors per failed property", function(){
		var config = configure()
		var m = model()

		var errors = G.validate( config, m )

		assert.equal(errors.rates.boring.messages.length, 2)
	})
	it("creates a generated name if the config used a name function", function(){
		var config = configure()
		var m = model()

		var errors = G.validate( config, m )

		assert.equal(errors.b.owner, "Bb")
	})
	it("creates a flat list of errors", function(){
		var config = configure()
		var m = model()

		var errors = G.validate( config, m)
		assert(errors.all.length)
	})
	it("can validate a container as a single value", function(){
		var config = configure()
		var m = model()

		var errors = G.validate( config, m)

		assert.equal(
			errors.valid_container.messages.length, 0
		)
		assert.equal(
			errors.invalid_container.messages.length, 1
		)
	})
	it("passes in several parameters to allow for complex cross referencing", function(){
		var config = configure()
		var m = model()

		var errors = G.validate( config, m)
		assert.equal( errors.watcher.messages.length, 1)
	})
})