///<reference path='./components.ts' />


module Backbone.Components {
	export module Controls {

		/**
		 * a simple input
		 */
		export class Input extends Backbone.Components.BaseComponent {
			public element:JQuery;
			public static factory(element:JQuery, view:Backbone.View):Input {
				var comp:Input;
				var myInput;
				if(element.prop('tagName') == 'INPUT') {
					myInput = element;
				} else {
					myInput = element.find('input');
				}
				if(myInput.length == 1) {
					switch(myInput.prop('type')) {
						case 'checkbox':
							comp = new Checkbox();
							break;
						case 'radio':

						default:
							comp = new Input;
					}
					comp.element = myInput;
					comp.attribute = comp.element.prop('name');
					comp.id = element.prop('id');
					comp.view = view;
					comp.setElement(element);
					comp.element.on('change', (event:JQueryEventObject) => {
						comp.handleChange(comp.getValue());
					});
				}
				return comp;
			}
			public static map(selector, bindings:Backbone.Components.EventBinding[] = []) {
				return new Mapping(
					selector,
					Input.factory,
					bindings
				);
			}
			public setValue(value:any)
			{
				this.element.val(value);
			}
			public getOwnValue():any
			{
				return this.getValue();
			}
			public getValue():any {
				return this.element.val();
			}
		}

		/**
		 * a checkbox
		 */
		export class Checkbox extends Input {
			public element:JQuery;
			private value:any;
			public setValue(value:any)
			{
				this.value = value;
				if(typeof this.value == 'object') {
					this.element.val(this.value.value);
					this.element.prop('checked', this.value.checked);
				} else {
					this.element.prop('checked', this.value);
				}
			}
			public getOwnValue():any
			{
				return this.getValue();
			}
			public getValue():any {
				if(typeof this.value == 'object') {
					this.value = {
						value: this.element.val(),
						checked: this.element.prop('checked')
					}
				} else {
					this.value = this.element.prop('checked');
				}
				return this.value;
			}
		}


		/**
		 * a dropdown
		 */
		export class Select extends Backbone.Components.BaseComponent {
			public element:JQuery;
			public options:any = {};
			public static factory(element:JQuery, view:Backbone.View):Select {
				var comp:Select;
				var selectElement = element.find('select');
				if(selectElement.length == 1) {
					comp = new Select;
					comp.element = selectElement;
					comp.attribute = comp.element.prop('name');
					comp.id = element.prop('id');
					comp.view = view;
					comp.setElement(element);
					comp.element.on('change', () => {
						comp.handleChange(comp.getValue());
					});
				}
				return comp;
			}
			private static loadOptions(model:Backbone.Model, component:Select, optionsAttribute:string)
			{
				component.element.find('option').remove();
				_.each(model.get(optionsAttribute), (option) => {
					component.element.append(
						$('<option></option>')
							.val(option.value)
							.text(option.label)
					);
				});
			}

			/**
			 * use this one, if your dropdown has fixed values
			 * @param selector
			 * @param bindings
			 * @returns {Backbone.Components.Mapping}
			 */
			public static map(selector, bindings:Backbone.Components.EventBinding[] = []) {
				return new Mapping(
					selector,
					Select.factory,
					bindings
				);
			}

			/**
			 * use this one, if the contents of your dropdown are to be bound to a model
			 * @param selector
			 * @param optionsModel
			 * @param optionsAttribute
			 * @returns {Backbone.Components.Mapping}
			 */
			public static mapWithOptionsFrom(selector:string, optionsAttribute:string, optionsModel:Backbone.Model) {
				return new Mapping(
					selector,
					Select.factory,
					[
						new Backbone.Components.EventBinding(
							optionsModel,
							'change:' + optionsAttribute,
							(model:Backbone.Model, component:Select) => {
								var oldValue = component.getValue();
								Select.loadOptions(model, component, optionsAttribute)
								component.setValue(oldValue);
							}
						)
					]
				);
			}
			public getOwnValue():any
			{
				return this.getValue();
			}

			public setValue(value:any)
			{
				this.element.val(value);
			}
			public getValue():any
			{
				return this.element.val();
			}
		}
		export module Behaviours {
			import Controls = Backbone.Components.Controls;
			export class TypeToChange extends Backbone.Components.Behaviour {
				constructor(component:Controls.Input) {
					super(component);
					if(component.element && component.element.prop('tagName') == 'INPUT' && component.element.prop('type') == 'text') {
						component.element.keyup((event) => {
							component.handleChange(component.getValue());
						});
					} else {
						throw new Error('can not attach to');
					}
				}
				public static factory(component:Controls.Input) {
					try {
						var behaviour = new TypeToChange(component);
						return behaviour;
					} catch(error) {
						// nope
					}
				}
			}

		}
	}
}
