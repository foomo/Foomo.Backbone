
module Backbone.Components {
	export module Controls {
		/**
		 * a simple input or textarea
		 */
		export class Input extends Backbone.Components.BaseComponent {
			public element:JQuery;
			public static factory(element:JQuery, view:Backbone.View<Backbone.Model>):Input {
				var comp:Input;
				var myInput;
                var tagName = element.prop('tagName');
				if(tagName == 'INPUT' || tagName == 'TEXTAREA') {
					myInput = element;
				} else {
					myInput = element.find('input');
                    if(myInput.length === 0) {
                        myInput = element.find('TEXTAREA');
                    }
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
					bindings,
                    [],
                    "Input component mapper"
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
			public static factory(element:JQuery, view:Backbone.View<Backbone.Model>):Select {
				var comp:Select;
				var selectElement = element.find('select');
				if(selectElement.length == 0 && element.prop("tagName") == 'SELECT') {
                    selectElement = element;
                }
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
				_.each<any>(model.get(optionsAttribute), (option) => {
                    var optionEl = $('<option></option>');
                    if("object" == typeof option && option.hasOwnProperty("value") && option.hasOwnProperty("label")) {
                        optionEl
                            .val(option.value)
                            .text(option.label)
                        ;
                    } else {
                        optionEl
                            .val(option)
                            .text(option)
                        ;
                    }
                    component.element.append(optionEl);
				});
			}

			/**
			 * use this one, if your dropdown has fixed values
			 * @param selector
			 * @param bindings
			 * @returns {Backbone.Components.Mapping}
			 */
			public static map(selector:any, bindings:Backbone.Components.EventBinding[] = []) {
				return new Mapping(
					selector,
					Select.factory,
					bindings,
                    [],
                    "Select component mapper"
				);
			}

			/**
			 * use this one, if the contents of your dropdown are to be bound to a model
			 * @param selector
			 * @param optionsModel
			 * @param optionsAttribute
			 * @returns {Backbone.Components.Mapping}
			 */
			public static mapWithOptionsFrom(selector:any, optionsAttribute:string, optionsModel:Backbone.Model) {
				return new Mapping(
					selector,
					Select.factory,
					[
						new Backbone.Components.EventBinding(
							optionsModel,
							'change:' + optionsAttribute,
							(model:Backbone.Model, component:Select) => {
								var oldValue = component.getValue();
								Select.loadOptions(model, component, optionsAttribute);
                                var newOptions = model.get(optionsAttribute);
                                var oldValueExists = false;
                                _.each<{value:string;}>(newOptions,(option) => {
                                    if(option.value == oldValue) {
                                        oldValueExists = true;
                                    }
                                });
                                if(oldValueExists) {
								    component.setValue(oldValue);
                                } else {
                                    if(newOptions.length > 0) {
                                        component.setValue(newOptions[0].value);
                                    }
                                }
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
					var compType = component.element.prop('type');
                    var tagName = component.element.prop('tagName');
					if(component.element && (tagName == 'INPUT' && (compType == 'text' || compType == 'password' || compType == 'email' || compType == 'tel' || compType == 'number')) || tagName == 'TEXTAREA') {
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
						console.warn('no type to change for this one', component);
					}
				}
			}

		}
	}
}
