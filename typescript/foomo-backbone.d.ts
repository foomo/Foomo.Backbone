declare module Backbone.Components {
    var mapToView: (view: Backbone.View, mappings: Mapping[]) => {};
    /**
    * define a binding for an event, that will be processed by a handler
    */
    class EventBinding {
        public model: Backbone.Model;
        public event: string;
        public handler: (model: Backbone.Model, component: BaseComponent) => void;
        constructor(model: Backbone.Model, event: string, handler: (model: Backbone.Model, component: BaseComponent) => void);
    }
    /**
    * describe the mapping of components into the dom with support for events and behaviours,
    * that will be attached to the created components
    */
    class Mapping {
        public selector: string;
        public factory: (element: JQuery, view: Backbone.View) => BaseComponent;
        public eventBindings: EventBinding[];
        public behaviours: any[];
        constructor(selector: string, factory: (element: JQuery, view: Backbone.View) => BaseComponent, eventBindings: EventBinding[], behaviours?: any[]);
        /**
        * add another behaviour / its factory
        * @param behaviourFactory
        * @returns {Backbone.Components.Mapping}
        */
        public addBehaviour(behaviourFactory: (component: BaseComponent) => Behaviour): Mapping;
    }
    /**
    * a behaviour can be pretty much anything - thus its definition is very
    */
    class Behaviour {
        public component: BaseComponent;
        constructor(component: BaseComponent);
    }
    /**
    * the mother of all components
    */
    class BaseComponent extends Backbone.View {
        public view: Backbone.View;
        public id: string;
        public attribute: string;
        public bidirectionalBinding: boolean;
        public behaviours: Behaviour[];
        private whenData;
        /**
        * implement this in your component
        */
        public getValue(): any;
        public getOwnValue(): any;
        /**
        * implement this in your component
        */
        public setValue(value: any): void;
        /**
        * start an event binding | or many
        * @param event
        * @param model
        * @returns {Backbone.Components.BaseComponent}
        */
        public when(event: string, model?: Backbone.Model): BaseComponent;
        /**
        * add a handler to the started event binding - you can do this multiple times
        * @param handler
        * @returns {Backbone.Components.BaseComponent}
        */
        public then(handler: (model: Backbone.Model, component: BaseComponent) => void): BaseComponent;
        /**
        * direct / less readable way to attach an event binding
        * @param binding
        * @returns {Backbone.Components.BaseComponent}
        */
        public attachBinding(binding: EventBinding): BaseComponent;
        /**
        * bind a model
        * @param model
        * @param attribute
        */
        public bindModel(model: Backbone.Model, attribute: string): void;
        /**
        * handle value change - in bidir mode, this writes back to the model
        * in any case it fires a change event
        * @param value
        */
        public handleChange(value): void;
        /**
        * attach a behaviour
        *
        * @param factory
        */
        public attachBehaviour(factory: (comp: BaseComponent) => Behaviour): void;
    }
    /**
    * displays an attribute of a model, deriving the attr from its data-... html attribute
    */
    class Display extends BaseComponent {
        public filter: (value: any) => string;
        static factory(element: JQuery, view: Backbone.View, filter?: (value: any) => string): Display;
        public setValue(value: string): void;
        public getValue(): string;
        public getOwnValue(): string;
        static map(selector: string): Mapping;
        static mapWithFilter(selector: string, filter: (value: any) => string): Mapping;
    }
    class ListItemListener {
        public event: string;
        public handler: (item: Backbone.View, event: any) => void;
        public context: any;
        constructor(event: string, handler: (item: Backbone.View, event: any) => void, context: any);
    }
    class List extends BaseComponent {
        private element;
        private viewClass;
        private itemListeners;
        public itemViews: any[];
        private ownValue;
        static factory(element: JQuery, view: Backbone.View, viewClass: any, attribute?: string): List;
        static map(selector: string, viewClass: any, attribute?: string): Mapping;
        public getValue();
        public getOwnValue(): any[];
        public setValue(value: any[]): void;
        /**
        * the listeners will be actually attached, the next time the items are rerendered
        * @param listener
        */
        public addListener(listener: ListItemListener): void;
    }
}
declare module Backbone.Components.Behaviours {
    /**
    * give feedback to the state of a model, so that it can be rendered in the view
    */
    class Feedback {
        public message: string;
        public level: string;
        static LEVEL_NONE: string;
        static LEVEL_OK: string;
        static LEVEL_INFO: string;
        static LEVEL_WARNING: string;
        static LEVEL_ERROR: string;
        constructor(message?: string, level?: string);
        static getAllLevels(): string[];
        static getLevelMap(): {};
    }
    module Validation {
        interface IValidatorFactory {
            (): BaseValidator;
        }
        class Result {
            public valid: boolean;
            public message: string;
            public level: string;
            constructor(valid?: boolean, message?: string, level?: string);
        }
        class BaseValidator {
            public validate(model: Backbone.Model, attribute: string): Result;
        }
        var pack: (factory: IValidatorFactory, ...attributes: string[]) => any;
        class Package {
            public attributes: string[];
            public validatorFactory: IValidatorFactory;
            constructor(attributes: string[], validatorFactory: IValidatorFactory);
            static make(factory: IValidatorFactory, ...attributes: string[]): Package;
        }
        class Validator {
            public model: Backbone.Model;
            public feedbackModel: FeedbackModel;
            constructor(model: Backbone.Model, feedbackModel: FeedbackModel);
            static create(model: Backbone.Model, feedbackModel: FeedbackModel): Validator;
            public chain(...packages: Package[]): boolean;
        }
    }
    /**
    * a model, that holds feedback and can be bound in a view
    */
    class FeedbackModel extends Backbone.Model {
        constructor(options?: any);
        public clearFeedback(attribute: string): void;
        public addFeedback(field: string, message: string, level?: string): void;
        public getFeedback(field: string): Feedback[];
    }
    /**
    * a behaviour that lets you render feedback to your UI
    */
    class ComponentFeedback extends Components.Behaviour {
        public component: Components.BaseComponent;
        public feedbackModel: FeedbackModel;
        static FEEDBACK_CLASS: string;
        static FEEDBACK_TEXT_CLASS: string;
        private template;
        private feedbackElement;
        constructor(component: Components.BaseComponent, feedbackModel: FeedbackModel);
        static getFactory(feedbackModel: FeedbackModel): (component: Components.BaseComponent) => ComponentFeedback;
        private loadFeedback();
    }
    class ListItemEventHandler extends Components.Behaviour {
        public component: Components.List;
        constructor(component: Components.List, event: string, callback: (data: any) => void);
        static getFactory(event: string, callback: (data: any) => void): (component: Components.List) => ListItemEventHandler;
    }
}
declare module Backbone.Components.Controls {
    /**
    * a simple input
    */
    class Input extends Components.BaseComponent {
        public element: JQuery;
        static factory(element: JQuery, view: Backbone.View): Input;
        static map(selector, bindings?: Components.EventBinding[]): Components.Mapping;
        public setValue(value: any): void;
        public getOwnValue(): any;
        public getValue(): any;
    }
    /**
    * a checkbox
    */
    class Checkbox extends Input {
        public element: JQuery;
        private value;
        public setValue(value: any): void;
        public getOwnValue(): any;
        public getValue(): any;
    }
    /**
    * a dropdown
    */
    class Select extends Components.BaseComponent {
        public element: JQuery;
        public options: any;
        static factory(element: JQuery, view: Backbone.View): Select;
        private static loadOptions(model, component, optionsAttribute);
        /**
        * use this one, if your dropdown has fixed values
        * @param selector
        * @param bindings
        * @returns {Backbone.Components.Mapping}
        */
        static map(selector, bindings?: Components.EventBinding[]): Components.Mapping;
        /**
        * use this one, if the contents of your dropdown are to be bound to a model
        * @param selector
        * @param optionsModel
        * @param optionsAttribute
        * @returns {Backbone.Components.Mapping}
        */
        static mapWithOptionsFrom(selector: string, optionsAttribute: string, optionsModel: Backbone.Model): Components.Mapping;
        public getOwnValue(): any;
        public setValue(value: any): void;
        public getValue(): any;
    }
    module Behaviours {
        class TypeToChange extends Components.Behaviour {
            constructor(component: Input);
            static factory(component: Input): TypeToChange;
        }
    }
}
declare module Backbone.Components.Behaviours.Validation.Validators {
    class EmptyValidator extends Validation.BaseValidator {
        static MESSAGES: {
            OK: string;
            MUST_NOT_BE_EMPTY: string;
        };
        static pack(...attributes: any[]);
        static factory(): EmptyValidator;
        public validate(model: Backbone.Model, attribute: string): Validation.Result;
    }
    class LengthValidator extends Validation.BaseValidator {
        static MESSAGES: {
            OK: string;
            WRONG_LENGTH: string;
        };
        private minLength;
        private maxLength;
        static pack(minLength: number, maxLength: number, ...attributes: any[]);
        static factory(minLength, maxLength): LengthValidator;
        public validate(model: Backbone.Model, attribute: string): Validation.Result;
    }
}
