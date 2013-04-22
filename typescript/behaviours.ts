///<reference path='./components.ts' />

module Backbone.Components.Behaviours {
	// import Components = Backbone.Components;
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
	export class FeedbackModel extends Backbone.Model {
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
	 * a behaviour that lets you render feedback to your UI
	 */
	export class ComponentFeedback extends Backbone.Components.Behaviour {
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

}