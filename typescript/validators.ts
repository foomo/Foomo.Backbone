module Backbone.Components.Behaviours.Validation {
	export module Validators {
		export class EmptyValidator extends Validation.BaseValidator {
			public static MESSAGES = {
				OK : 'ok',
				MUST_NOT_BE_EMPTY: 'must not be empty'
			};
			public static pack(...attributes:any[])	{
				attributes.unshift(EmptyValidator.factory);
				return Behaviours.Validation.pack.apply(null, attributes);
			}
			public static factory() {
				return new EmptyValidator();
			}
			validate(model:Backbone.Model, attribute:string) {
				var value = model.get(attribute);
				var valid = value && value.length > 0;
				return new Validation.Result(
					valid,
					valid?EmptyValidator.MESSAGES.OK:EmptyValidator.MESSAGES.MUST_NOT_BE_EMPTY,
					valid?Behaviours.Feedback.LEVEL_OK:Behaviours.Feedback.LEVEL_ERROR
				);
			}
		}

		export class LengthValidator extends Validation.BaseValidator {
			private minLength:number;
			private maxLength:number;
			public static pack(minLength:number, maxLength:number,...attributes:any[])
			{
				attributes.unshift(() => {
					return LengthValidator.factory(minLength, maxLength);
				});
				return Behaviours.Validation.pack.apply(null, attributes);
			}
			public static factory(minLength, maxLength) {
				var validator = new LengthValidator();
				validator.minLength = minLength;
				validator.maxLength = maxLength;
				return validator;
			}
			validate(model:Backbone.Model, attribute:string) {
				var value = model.get(attribute);
				var valid = value && value.length >= this.minLength && value.length <= this.maxLength;
				return new Behaviours.Validation.Result(
					valid,
					valid?'ok':'wrong length',
					valid?Behaviours.Feedback.LEVEL_INFO:Behaviours.Feedback.LEVEL_ERROR
				);
			}
		}
	}
}