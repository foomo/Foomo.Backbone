
module Backbone.Components {
	export module Behaviours {
		// import Components = Backbone.Components;
		/**
		 * give feedback to the state of a model, so that it can be rendered in the view
		 */
		export class Feedback {

			static LEVEL_NONE    = 'feedback-none';
			static LEVEL_OK      = 'feedback-ok';
			static LEVEL_INFO    = 'feedback-info';
			static LEVEL_WARNING = 'feedback-warning';
			static LEVEL_ERROR   = 'feedback-error';


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
			public static getLevelMap() {
				var levelMap = {};
				_.each(Feedback.getAllLevels(), (value, index) => {
					levelMap[value] = index;
				});
				return levelMap;
			}

		}

		export module Validation {
			export interface IValidatorFactory {
				() : BaseValidator;
			}
			export class Result {
				constructor(
					public valid:boolean = true,
					public message:string = '',
					public level:string = Feedback.LEVEL_OK
				) {

				}
			}
			export class BaseValidator {
				public validate(model:Backbone.Model, attribute:string):Result {
					return new Result(false, 'implement me', Feedback.LEVEL_ERROR);
				}
			}
			export var pack = function(factory:IValidatorFactory, ...attributes:string[]) {
				return Package.make.apply(null, arguments);
			}
			export class Package {
				constructor(
					public attributes:string[],
					public validatorFactory:IValidatorFactory
				) {}
				public static make(factory:IValidatorFactory, ...attributes:string[]) {
					return new Package(attributes, factory);
				}
			}
			export class Validator {
				constructor(
					public model:Backbone.Model,
					public feedbackModel:FeedbackModel
				) {

				}
				public static create(model:Backbone.Model, feedbackModel:FeedbackModel) {
					return new Validator(model, feedbackModel);
				}
                public chainAndAbortAfterFirstInvalid(abort:boolean, ...packages:Package[]): boolean {
                    var ret = true;
                    var feedbackAttributes = {};
                    var aborted = false;
                    _.each(packages, (package:Package) => {
                        var validator = package.validatorFactory();
                        _.each(package.attributes, (attribute:string) => {
                            if(!aborted) {
                                var result:Result = validator.validate(this.model, attribute);
                                if(!result.valid) {
                                    ret = false;
                                    aborted = true;
                                }
                                if(typeof feedbackAttributes[attribute] == 'undefined') {
                                    feedbackAttributes[attribute] = [];
                                }
                                feedbackAttributes[attribute].push(new Feedback(result.message, result.level));
                            }
                        });
                    });
                    this.feedbackModel.set(feedbackAttributes);
                    return ret;
                }
				public chain(...packages:Package[]):boolean {
					var ret = true;
					var feedbackAttributes = {};
					_.each(packages, (package:Package) => {
						var validator = package.validatorFactory();
						_.each(package.attributes, (attribute:string) => {
							var result:Result = validator.validate(this.model, attribute);
							if(!result.valid) {
								ret = false;
							}
							if(typeof feedbackAttributes[attribute] == 'undefined') {
								feedbackAttributes[attribute] = [];
							}
							feedbackAttributes[attribute].push(new Feedback(result.message, result.level));
						});
					});
					this.feedbackModel.set(feedbackAttributes);
					return ret;
				}
			}
		}


		/**
		 * a model, that holds feedback and can be bound in a view
		 */
		export class FeedbackModel extends Backbone.Model {
			constructor(
				options:any = {}
				) {
				super(options);
			}
			public clearFeedback(attribute:string) {
				this.set(attribute, []);
			}
			public addFeedback(
				field:string,
				message:string,
				level:string = Feedback.LEVEL_NONE
			) {
				var feedback = _.clone(this.get(field));
				if(!feedback) {
					feedback = [];
				}
				feedback.push(new Feedback(message, level));
				this.set(field, feedback);
			}
			public getFeedback(field:string):Feedback[] {
				return this.get(field);
			}
		}


		/**
		 * a behaviour that lets you render feedback to your UI
		 */
		export class ComponentFeedback extends Backbone.Components.Behaviour {

			public static FEEDBACK_CLASS = 'feedback';
			public static FEEDBACK_TEXT_CLASS = 'feedback-text';

			private template:string;
			private feedbackElement:JQuery;
			constructor(
				public component:Backbone.Components.BaseComponent,
				public feedbackModel:FeedbackModel
			) {
				super(component);
				this.feedbackElement = this.component.$('.' + ComponentFeedback.FEEDBACK_CLASS);
				if(this.component.attribute && this.feedbackElement) {
					if(this.feedbackElement.children().length == 1) {
						// we will be working with a template
						var firstChild:JQuery = $(this.feedbackElement.children()[0]);
						this.template = $.trim(this.feedbackElement.html());
						this.feedbackElement.empty();
					} else {
						// we will be making elements ourselves
						var tagName = 'div';
						switch(this.feedbackElement.prop('tagName')) {
							case 'UL':
							case 'OL':
								tagName = 'li';
								break;
						}
						this.template = '<' + tagName + ' class="' + ComponentFeedback.FEEDBACK_TEXT_CLASS + '"></' + tagName + '>';

					}
					this.feedbackModel.on('change:' + this.component.attribute, this.loadFeedback, this);
				} else {
					throw new Error('the given component has no prop - i can not give any feedback to it');
				}
			}
			public static getFactory(feedbackModel:FeedbackModel) {
				return (component:BaseComponent) => {
					try {
						var behaviour = new ComponentFeedback(component, feedbackModel);
						return behaviour;
					} catch(error) {
						console.log(error, error.toString());
						console.log('skipping this one');
					}
				};
			}
			private loadFeedback() {
				var feedback = this.feedbackModel.getFeedback(this.component.attribute);
				if(typeof feedback == "object") {
					this.feedbackElement.empty();
					var worstLevel = -1;
					var worstClass;
					var allLevels = Feedback.getAllLevels();
					var allLevelClasses = allLevels.join(" ");
					var levelMap = Feedback.getLevelMap();
					_.each(feedback, (entry:Feedback) => {
						if(levelMap[entry.level] > worstLevel) {
							worstLevel = levelMap[entry.level];
							worstClass = entry.level;
						}
						var feedbackElement = $(this.template)
							.removeClass(allLevelClasses)
							.addClass(entry.level)
						;
						if(feedbackElement.children().length == 0) {
							feedbackElement.text(entry.message);
						} else {
							feedbackElement.find('.' + ComponentFeedback.FEEDBACK_TEXT_CLASS).text(entry.message);
						}
						this.feedbackElement.append(feedbackElement);
					});
					this.component.$el.removeClass(allLevelClasses);
					if(worstLevel > -1) {
						this.component.$el.addClass(worstClass);
					}
				}
			}
		}

		export class ListItemEventHandler extends Backbone.Components.Behaviour {
			public component:List;
			constructor(component:List, event:string, callback:(data:any) => void) {
				super(component);
				var listItemListener:ListItemListener = new ListItemListener(
					event,
					callback,
					this.component
				);
				this.component.addListener(listItemListener);
			}
			public static getFactory(event:string, callback:(data:any) => void) {
				return (component:List) => {
					return new ListItemEventHandler(component, event, callback);
				};
			}
		}
	}
}