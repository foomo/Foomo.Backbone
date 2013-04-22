
module Backbone.Components {

	export var mapToView = (view:Backbone.View, mappings:Mapping[]) => {
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
					_.each(mapping.eventBindings, function(eventBinding:Backbone.Components.EventBinding) {
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
	 * define a binding for an event, that will be processed by a handler
	 */
	export class EventBinding {
		constructor(
			public model: Backbone.Model,
			public event: string,
			public handler: (model:Backbone.Model, component:BaseComponent) => void
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
			public factory: (element:JQuery, view:Backbone.View) => BaseComponent,
			public eventBindings:Backbone.Components.EventBinding[],
			// dear typescript i want an array of closures
			public behaviours:any[] = []
		) {

		}

		/**
		 * add another behaviour / its factory
		 * @param behaviourFactory
		 * @returns {Backbone.Components.Mapping}
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
	export class BaseComponent extends Backbone.View {
		public view:Backbone.View;
		public id:string;
		public prop:string;
		public bidirectionalBinding:bool = true;

		public behaviours:Behaviour[] = [];

		private whenData:{
			event:string;
			model:Backbone.Model;
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
		 * @returns {Backbone.Components.BaseComponent}
		 */
		public when(event:string, model?:Backbone.Model) {
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
		 * @returns {Backbone.Components.BaseComponent}
		 */
		public then(handler:(model:Backbone.Model, component:BaseComponent) => void) {
			if(typeof this.whenData == 'object' && typeof this.whenData.event == 'string' && typeof this.whenData.model == 'object') {
				this.attachBinding(
					new Backbone.Components.EventBinding(
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
		 * @returns {Backbone.Components.BaseComponent}
		 */
		public attachBinding(binding:Backbone.Components.EventBinding) {
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
		public bindModel(model:Backbone.Model, attribute:string)
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
		public static factory(element:JQuery, view:Backbone.View, filter?: (value:any) => string):Display {
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
				(element:JQuery, view:Backbone.View):Display => {
					return Display.factory(element, view, filter);
				},
				[]
			);
		}
	}

	/*
	 export class List extends BaseComponent {
	 public static factory(element:JQuery, view:Backbone.View):List {

	 }
	 public static map(selectory, viewClass:any, ) {

	 }
	 }
	 */






}