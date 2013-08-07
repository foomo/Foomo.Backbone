///<reference path='./backbone.d.ts' />
///<reference path='./underscore.d.ts' />

module Backbone {
	export module Components {
		export var mapToView = (view:Backbone.View, mappings:Mapping[]) => {
			var comps = {};
			_.each(mappings, (mapping:Mapping) => {
				view.$(mapping.selector).each((index, candidateEl) => {
					var comp:BaseComponent = mapping.factory($(candidateEl), view);
					if(typeof comp == 'object') {
						if(comp.id) {
							comps[comp.id] = comp;
						}
						if(comp.attribute) {
							comp.bindModel(view.model, comp.attribute);
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
			public attribute:string;
			public bidirectionalBinding:boolean = true;

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
			public getOwnValue():any
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
					var modelValue = model.get(attribute);
					if(this.getOwnValue() != modelValue) {
						this.setValue(modelValue);
					}
				});
			}

			/**
			 * handle value change - in bidir mode, this writes back to the model
			 * in any case it fires a change event
			 * @param value
			 */
			public handleChange(value) {
				if(this.bidirectionalBinding && this.attribute) {
					this.view.model.set(this.attribute, value);
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
					comp.attribute = element.attr('data-model-attr');
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
			public getOwnValue():string
			{
				return this.getValue();
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
		export class ListItemListener {
			constructor(
				public event:string,
				public handler: (item:Backbone.View, event:any) => void,
				public context:any
			) {

			}
		}
		export class List extends BaseComponent {
			private element:JQuery;
			private viewClass:any;
			private itemListeners:ListItemListener[] = [];
			public itemViews = [];
			private ownValue:any[];
			public static factory(element:JQuery, view:Backbone.View, viewClass:any, attribute:string = ''):List {
				var comp = new List();
				comp.view = view;
				comp.element = element;
				if(attribute.length > 0) {
					comp.attribute = attribute;
				} else {
					comp.attribute = comp.element.attr('data-model-attr');
				}
				comp.id = comp.element.prop('id');
				comp.viewClass = viewClass;
				return comp;
			}
			public static map(selector:string,viewClass:any, attribute:string = ''):Mapping {
				return new Mapping(
					selector,
					(element:JQuery, view:Backbone.View):List => {
						return List.factory(element, view, viewClass, attribute);
					},
					[]
				);
			}
			public getValue() {
				return this.view.model.get(this.attribute);
			}

			public getOwnValue():any[]
			{
				return this.ownValue;
			}

			public setValue(value:any[]) {
				this.ownValue = value;
				this.element.empty();
				var that = this;
				var index = 0;
				this.itemViews = [];
				_.each(value, (item) => {
					if(typeof item != 'object') {
						item = {value: item, index: index};
					}
					var model = new that.viewClass.model(item);
					var listItem = new that.viewClass({model:model});
					that.itemViews.push(listItem);
					that.element.append(listItem.$el);
					_.each(that.itemListeners, (listener:ListItemListener) => {
						listItem.on(listener.event, listener.handler, listener.context);
					});
					index ++;
				});
			}

			/**
			 * the listeners will be actually attached, the next time the items are rerendered
			 * @param listener
			 */
			public addListener(listener:ListItemListener) {
				this.itemListeners.push(listener);
			}
		}
	}
}