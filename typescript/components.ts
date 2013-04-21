


import _Backbone = Backbone;

module Foomo.Backbone.Components {

	export var mapToView = (view:_Backbone.View, mappings:Mapping[]) => {
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
					_.each(mapping.eventBindings, function(eventBinding:Foomo.Backbone.Components.EventBinding) {
						comp.attachBinding(eventBinding);
					});
					_.each(mapping.behaviours, function(behaviourFactory:(component:BaseComponent) => Behaviour) {
						comp.attachBehaviour(behaviourFactory);
					});
				}
			});
		});
		return comps;
	};


	/**
	 * give feedback to the state of a model, so that it can be rendered in the view
	 */
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
				Feedback.LEVEL_NONE,
				Feedback.LEVEL_OK,
				Feedback.LEVEL_INFO,
				Feedback.LEVEL_WARNING,
				Feedback.LEVEL_ERROR
			];
		}
	}

	/**
	 * a model, that holds feedback and can be bound in a view
	 */
	export class FeedbackModel extends _Backbone.Model {
		constructor(
			options:any = {}
		) {
			super(options);
		}
		public giveFeedback(
			field:string,
			message:string,
			level:string = Feedback.LEVEL_NONE
			) {
			this.set(field, new Feedback(message, level));
		}
		public getFeedback(field:string):Feedback {
			return this.get(field);
		}
	}


	/**
	 * define a binding for an event, that will be processed by a handler
	 */
	export class EventBinding {
		constructor(
			public model: _Backbone.Model,
			public event: string,
			public handler: (model:_Backbone.Model, component:BaseComponent) => void
		) {
		}
	}

	/**
	 * describe the mapping of components into the dom with support for events and behaviours,
	 * that will be attached to the created components
	 */
	export class Mapping {
		constructor(
			public selector:string,
			public factory: (element:JQuery, view:_Backbone.View) => BaseComponent,
			public eventBindings:Foomo.Backbone.Components.EventBinding[],
			// dear typescript i want an array of closures
			public behaviours:any[] = []
		) {

		}

		/**
		 * add another behaviour / its factory
		 * @param behaviourFactory
		 * @returns {Foomo.Backbone.Components.Mapping}
		 */
		addBehaviour(behaviourFactory:(component:BaseComponent) => Behaviour) {
			this.behaviours.push(behaviourFactory);
			return this;
		}
	}

	/**
	 * a behaviour can be pretty much anything - thus its definition is very
	 */
	export class Behaviour {
		constructor(public component:BaseComponent) {}
	}

	/**
	 * the mother of all components
	 */
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
		/**
		 * implement this in your component
		 */
		public getValue():any
		{
			throw new Error('implement this');
		}
		/**
		 * implement this in your component
		 */
		public setValue(value:any)
		{
			throw new Error('implement this');
		}

		/**
		 * start an event binding | or many
		 * @param event
		 * @param model
		 * @returns {Foomo.Backbone.Components.BaseComponent}
		 */
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

		/**
		 * add a handler to the started event binding - you can do this multiple times
		 * @param handler
		 * @returns {Foomo.Backbone.Components.BaseComponent}
		 */
		public then(handler:(model:_Backbone.Model, component:BaseComponent) => void) {
			if(typeof this.whenData == 'object' && typeof this.whenData.event == 'string' && typeof this.whenData.model == 'object') {
				this.attachBinding(
					new Foomo.Backbone.Components.EventBinding(
						this.whenData.model,
						this.whenData.event,
						handler
					)
				);
			} else {
				throw new Error('you need to call when first');
			}
			return this;
		}

		/**
		 * direct / less readable way to attach an event binding
		 * @param binding
		 * @returns {Foomo.Backbone.Components.BaseComponent}
		 */
		public attachBinding(binding:Foomo.Backbone.Components.EventBinding) {
			binding.model.on(binding.event, (model) => {
				binding.handler(binding.model, this);
			});
			return this;
		}

		/**
		 * bind a model
		 * @param model
		 * @param attribute
		 */
		public bindModel(model:_Backbone.Model, attribute:string)
		{
			model.on('change:' + attribute, (model) => {
				this.setValue(model.get(attribute));
			});
		}

		/**
		 * handle value change - in bidir mode, this writes back to the model
		 * in any case it fires a change event
		 * @param value
		 */
		public handleChange(value) {
			if(this.bidirectionalBinding && this.prop) {
				this.view.model.set(this.prop, value);
			}
			this.trigger('change', this);
		}

		/**
		 * attach a behaviour
		 *
		 * @param factory
		 */
		public attachBehaviour(factory:(comp:BaseComponent) => Behaviour) {
			var behaviour = factory(this);
			if(typeof behaviour == 'object') {
				this.behaviours.push(behaviour);
			}
		}
	}

	/**
	 * displays an attribute of a model, deriving the attr from its data-... html attribute
	 */
	export class Display extends BaseComponent {
		public filter = (value:any) => { return '' + value };
		public static factory(element:JQuery, view:_Backbone.View, filter?: (value:any) => string):Display {
			var comp:Display;
			var myInput = element;
			if(myInput.length == 1) {
				comp = new Display();
				comp.id = element.prop('id');
				comp.prop = element.attr('data-model-attr');
				comp.view = view;
				comp.setElement(element);
				if(filter) {
					comp.filter = filter;
				}
			}
			return comp;
		}
		public setValue(value:string) {
			this.$el.text(this.filter(value));
		}
		public getValue():string {
			return this.$el.text();
		}
		public static map(selector:string) {
			return new Mapping(
				selector,
				Display.factory,
				[]
			);
		}
		public static mapWithFilter(selector:string, filter:(value:any) => string)
		{
			return new Mapping(
				selector,
				(element:JQuery, view:_Backbone.View):Display => {
					return Display.factory(element, view, filter);
				},
				[]
			);
		}
	}

	/**
	 * a behaviour that lets you render feedback to your UI
	 */
	export class ComponentFeedback extends Behaviour {
		public static FEEBACK_CLASS = 'feedback';
		constructor(
			public component:BaseComponent,
			public feedbackModel:FeedbackModel
		) {
			super(component);
			if(this.component.prop) {
				this.feedbackModel.on('change:' + this.component.prop, this.loadFeedback, this);
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
		private loadFeedback() {
			var feedback = this.feedbackModel.getFeedback(this.component.prop);
			if(typeof feedback == "object") {
				this.component.$('.' + ComponentFeedback.FEEBACK_CLASS)
					.text(feedback.message)
					.removeClass(Feedback.getAllLevels().join(" "))
					.addClass(feedback.level)
				;
			}
		}
	}

	/**
	 * a simple input
	 */
	export class Input extends BaseComponent {
		public element:JQuery;
		public static factory(element:JQuery, view:_Backbone.View):Input {
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
					default:
						comp = new Input;
				}
				comp.element = myInput;
				comp.prop = comp.element.prop('name');
				comp.id = element.prop('id');
				comp.view = view;
				comp.setElement(element);
				comp.element.on('change', (event:JQueryEventObject) => {
					comp.handleChange(comp.getValue());
				});
			}
			return comp;
		}
		public static map(selector, bindings:Foomo.Backbone.Components.EventBinding[] = []) {
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
					comp.handleChange(comp.getValue());
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

		/**
		 * use this one, if your dropdown has fixed values
		 * @param selector
		 * @param bindings
		 * @returns {Foomo.Backbone.Components.Mapping}
		 */
		public static map(selector, bindings:Foomo.Backbone.Components.EventBinding[] = []) {
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
		 * @returns {Foomo.Backbone.Components.Mapping}
		 */
		public static mapWithOptionsFrom(selector:string, optionsModel:_Backbone.Model, optionsAttribute:string) {
			return new Mapping(
				selector,
				Select.factory,
				[
					new Foomo.Backbone.Components.EventBinding(
						optionsModel,
						'change:' + optionsAttribute,
						(model:_Backbone.Model, component:Select) => {
							Select.loadOptions(model, component, optionsAttribute)
						}
					)
				]
			);
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
}