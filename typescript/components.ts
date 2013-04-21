


import _Backbone = Backbone;

module Foomo.Backbone.Components {

	export var populateView = (view:_Backbone.View, mappings:Mapping[]) => {
		var comps = {};
		_.each(mappings, (mapping:Mapping) => {
			view.$(mapping.selector).each((index, candidateEl) => {
				var comp:BaseComponent = mapping.factory($(candidateEl), view);
				if(typeof comp == 'object') {
					if(comp.id) {
						comps[comp.id] = comp;
					}
					if(comp.prop) {
						comp.bindModel(view.model, comp.prop);
					}
					_.each(mapping.bindings, function(binding:Binding) {
						comp.attachBinding(binding);
					});
					_.each(mapping.behaviours, function(behaviourFactory:(component:BaseComponent) => Behaviour) {
						comp.attachBehaviour(behaviourFactory);
					});
				}
			});
		});
		return comps;
	};


	export class Feedback {
		static LEVEL_NONE = 'feedback-none';
		static LEVEL_OK = 'feedback-ok';
		static LEVEL_INFO = 'feedback-info';
		static LEVEL_WARNING = 'feedback-warning';
		static LEVEL_ERROR = 'feedback-error';

		constructor(
			public message:string = '',
			public level:string = ''
			) {

		}
		public static getAllLevels() {
			return [
				Feedback.LEVEL_ERROR,
				Feedback.LEVEL_INFO,
				Feedback.LEVEL_NONE,
				Feedback.LEVEL_OK,
				Feedback.LEVEL_WARNING
			];
		}
	}
	export class FeedbackModel extends _Backbone.Model {
		constructor(
			options:any = {}
		) {
			super(options);
		}
		public giveFormFeedback(
			field:string,
			message:string,
			level:string = Feedback.LEVEL_NONE
			) {
			this.set(field, new Feedback(message, level));
		}
		public getFormFeedback(field:string):Feedback {
			return this.get(field);
		}
	}







	export class Binding {
		constructor(
			public model: _Backbone.Model,
			public event: string,
			public mediator: (model:_Backbone.Model, component:BaseComponent) => void
		) {
		}
	}

	export class Mapping {
		constructor(
			public selector:string,
			public factory: (element:JQuery, view:_Backbone.View) => BaseComponent,
			public bindings:Binding[],
			// i want an array of closures
			public behaviours:any[] = []
		) {

		}
		addBehaviour(behaviourFactory:(component:BaseComponent) => Behaviour) {
			this.behaviours.push(behaviourFactory);
			return this;
		}
	}
	export class Behaviour {
		constructor(public component:BaseComponent) {}
	}

	export class BaseComponent extends _Backbone.View {
		public view:_Backbone.View;
		public id:string;
		public prop:string;
		public bidirectionalBinding:bool = true;

		public behaviours:Behaviour[] = [];

		private whenData:{
			event:string;
			model:_Backbone.Model;
		};

		public val():any;
		public val(value:any):void;

		public val(value?:any):void {
			throw new Error('implement this');
		}

		public when(event:string, model?:_Backbone.Model) {
			if(typeof model == 'undefined') {
				model = this.view.model;
			}
			this.whenData = {
				event: event,
				model:model
			};
			return this;
		}

		public then(mediator:(model:_Backbone.Model, component:BaseComponent) => void) {
			if(typeof this.whenData == 'object' && typeof this.whenData.event == 'string' && typeof this.whenData.model == 'object') {
				this.attachBinding(
					new Binding(
						this.whenData.model,
						this.whenData.event,
						mediator
					)
				);
			} else {
				throw new Error('you need to call when first');
			}
			return this;
		}

		public attachBinding(binding:Binding) {
			binding.model.on(binding.event, (model) => {
				binding.mediator(binding.model, this);
			});
			return this;
		}

		public bindModel(model:_Backbone.Model, attribute:string)
		{
			console.log('binding', 'change:' + attribute);
			model.on('change:' + attribute, (model) => {
				console.log('change:' + attribute, model.get(attribute));
				this.val(model.get(attribute));
			});
		}

		public handleChange(value) {
			if(this.bidirectionalBinding && this.prop) {
				this.view.model.set(this.prop, value);
			} else {
				this.trigger('change', value);
			}
		}
		public attachBehaviour(factory:(comp:BaseComponent) => Behaviour) {
			var behaviour = factory(this);
			if(typeof behaviour == 'object') {
				this.behaviours.push(behaviour);
			}
		}
	}

	export class Display extends BaseComponent {
		public static factory(element:JQuery, view:_Backbone.View):Display {
			var comp:Display;
			var myInput = element;
			if(myInput.length == 1) {
				comp = new Display();
				comp.id = element.prop('id');
				comp.prop = element.attr('data-model-prop');
				comp.view = view;
				comp.setElement(element);
			}
			return comp;
		}
		public val(value?:any):any {
			if(typeof value == 'undefined') {
				return this.$el.text();
			} else {
				this.$el.text(value);
			}
		}
		public static map(selector:string) {
			return new Mapping(
				selector,
				Display.factory,
				[]
			);
		}
	}

	export class ComponentFeedback extends Behaviour {
		constructor(
			public component:BaseComponent,
			public feedbackModel:FeedbackModel
		) {
			super(component);
			if(this.component.prop) {
				this.feedbackModel.on('change:' + this.component.prop, this.loadFormFeedback, this);
			} else {
				console.log(component);
				throw new Error('the given component has no prop - i can not give any feedback to it');
			}
		}
		public static getFactory(feedbackModel:FeedbackModel) {
			return (component:BaseComponent) => {
				try {
					var behaviour = new ComponentFeedback(component, feedbackModel);
					return behaviour;
				} catch(error) {
					console.log('skipping this one');
				}
			};
		}
		private loadFormFeedback() {
			var feedback = this.feedbackModel.getFormFeedback(this.component.prop);
			if(typeof feedback == "object") {
				this.component.$('.form-feedback')
					.text(feedback.message)
					.removeClass(Feedback.getAllLevels().join(" "))
					.addClass(feedback.level)
				;
			}
		}
	}

	export class TextInput extends BaseComponent {
		public element:JQuery;
		public static factory(element:JQuery, view:_Backbone.View):TextInput {
			var comp:TextInput;
			var myInput = element.find('input');
			if(myInput.length == 1) {
				comp = new TextInput();
				comp.element = myInput;
				comp.prop = comp.element.prop('name');
				comp.id = element.prop('id');
				comp.view = view;
				comp.setElement(element);
				comp.element.on('change', (event:JQueryEventObject) => {
					comp.handleChange(comp.val());
				});
			}
			return comp;
		}
		public static map(selector, bindings:Binding[] = []) {
			return new Mapping(
				selector,
				TextInput.factory,
				bindings
			);
		}

		public val(value:string): void;
		public val():string;

		public val(value?:string) {
			if(typeof value == 'string') {
				this.element.val(value);
			} else {
				return this.element.val();
			}
		}

	}

	export class Select extends BaseComponent {
		public element:JQuery;
		public options:any = {};
		public static factory(element:JQuery, view:_Backbone.View):Select {
			var comp:Select;
			var selectElement = element.find('select');
			if(selectElement.length == 1) {
				comp = new Select;
				comp.element = selectElement;
				comp.prop = comp.element.prop('name');
				comp.id = element.prop('id');
				comp.view = view;
				comp.setElement(element);
				comp.element.on('change', () => {
					comp.handleChange(comp.val());
				});
			}
			return comp;
		}
		private static loadOptions(model:_Backbone.Model, component:Components.Select, optionsAttribute:string)
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
		public static map(selector, bindings:Binding[] = []) {
			return new Mapping(
				selector,
				Select.factory,
				bindings
			);
		}
		public static mapWithOptionsFrom(selector:string, optionsModel:_Backbone.Model, optionsAttribute:string) {
			return new Mapping(
				selector,
				Select.factory,
				[
					new Binding(
						optionsModel,
						'change:' + optionsAttribute,
						(model:_Backbone.Model, component:Select) => {
							Select.loadOptions(model, component, optionsAttribute)
						}
					)
				]
			);
		}
		public val(value?:string) {
			if(typeof value == 'string') {
				this.element.val(value);
			} else {
				return this.element.val();
			}
		}
	}

}