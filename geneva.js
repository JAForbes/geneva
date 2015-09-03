var validateLeaf = function(config, name, value, model){
	return config.validations
		.reduce(function(errors, validator ){
			var passed = false;
			try {
				passed = validator.fn(value, name, config, model)
			} catch (e) {

			}

			if(!passed){
				errors.push(validator.message)
			}
			return errors

		},[])
}

var error = function( config, name, value, model ){
	return {
		name: config.name instanceof Function ? config.name(name) : config.name,
		errors: validateLeaf( config, name, value, model ),
		property: name
	}
}

var validate = function( config, model){
	var errors = {}
	var properties = Object.keys( config )
	var flattened = []

	properties.forEach(function(property){
		var target = model[property]

		if( !config[property].asValue && type(target) in complex_type){
			if( Array.isArray(target) ){
				errors[property] = target
					.map(function( val, i ){
						var e = error( config[property][i], i, val, model )
						flattened.push( e )
						return e
					})




			} else {
				errors[property] = Object.keys(target)
					.reduce(function(sub, sub_property){
						sub[sub_property] = error(
							config[property][sub_property],
							sub_property,
							target[sub_property],
							model
						)
						flattened.push( sub[sub_property] )
						return sub
					}, {})


			}

		} else {
			errors[property] = error( config[property], property, model[property], model)
			flattened.push( errors[property] )
		}

	})
	errors.all = flattened.filter( function(e){ return e.errors.length })
	return errors
}

var complex_type = { Object: 1, Array:1 }

var type = function(val){
	return ({}).toString.call(val).slice(8,-1)
}

var configure = function( info, model ){
	var config = {}
	var properties = Object.keys(info)
	properties.forEach(function( property ){
		var asValue = info[property].asValue

		if( !asValue && type(model[property]) in complex_type ){

			var container = model[property]

			if( Array.isArray(container)) {
				config[property] = []

				for(var i = 0; i < container.length; i++){
					config[property].push( info[property] )
				}

			} else {
				config[property] = {}

				Object.keys( container )
					.forEach(function( sub_property ){
						config[property][sub_property] = info[property]
					})
			}


		} else {

			config[property] = info[property]
		}
	})
	return config;
}

var geneva = {
	validate: validate,
	configure: configure
}

geneva.between = function(min,max){
	return {
		fn: function(value){
			return value > min && value < max
		},
		message: "should be between " + min + " and " + max
	}


}
geneva.required = function(){
	return {
		fn: function(value){
			return typeof value !== "undefined" && value != ""
		},
		message: "is required"
	}
}

geneva.nTruthy = function(n){
	return {
		fn: function( container ){
			var nTruthy =  (
				Array.isArray( container ) ?
					container.filter(Boolean)
				:
					Object.keys(container).filter( function(key) { return container[key] })
			).length

			return nTruthy >= n
		},
		message: "Please ensure at least "+n+" is selected"
	}
}


module.exports = geneva