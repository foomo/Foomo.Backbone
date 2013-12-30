/// <reference path='../backbone.d.ts' />
/// <reference path='../underscore.d.ts' />
declare module Backbone {
    module Components {
        var mapToView: (view: Backbone.View, mappings: Mapping[]) => {};
        class EventBinding {
            public model: Backbone.Model;
            public event: string;
            public handler: (model: Backbone.Model, component: BaseComponent) => void;
            constructor(model: Backbone.Model, event: string, handler: (model: Backbone.Model, component: BaseComponent) => void);
        }
        class Mapping {
            public selector: string;
            public factory: (element: JQuery, view: Backbone.View) => BaseComponent;
            public eventBindings: EventBinding[];
            public behaviours: any[];
            constructor(selector: string, factory: (element: JQuery, view: Backbone.View) => BaseComponent, eventBindings: EventBinding[], behaviours?: any[]);
            public addBehaviour(behaviourFactory: (component: BaseComponent) => Behaviour): Mapping;
        }
        class Behaviour {
            public component: BaseComponent;
            constructor(component: BaseComponent);
        }
        class BaseComponent extends Backbone.View {
            public view: Backbone.View;
            public id: string;
            public attribute: string;
            public bidirectionalBinding: boolean;
            public behaviours: Behaviour[];
            public whenData: {
                event: string;
                model: Backbone.Model;
            };
            public getValue(): any;
            public getOwnValue(): any;
            public setValue(value: any): void;
            public when(event: string, model?: Backbone.Model): BaseComponent;
            public then(handler: (model: Backbone.Model, component: BaseComponent) => void): BaseComponent;
            public attachBinding(binding: EventBinding): BaseComponent;
            public bindModel(model: Backbone.Model, attribute: string): void;
            public handleChange(value: any): void;
            public attachBehaviour(factory: (comp: BaseComponent) => Behaviour): void;
        }
        class Display extends BaseComponent {
            public filter: (value: any) => string;
            static makeComp(): Display;
            static factory(element: JQuery, view: Backbone.View, filter?: (value: any) => string): Display;
            static componentFactory(componentClass: {
                makeComp: () => Display;
            }, element: JQuery, view: Backbone.View, filter?: (value: any) => string): Display;
            public setValue(value: string): void;
            public getValue(): string;
            public getOwnValue(): string;
            static map(selector: string): Mapping;
            static mapWithFilter(selector: string, filter: (value: any) => string): Mapping;
        }
        class DisplayHTML extends Display {
            static makeComp(): DisplayHTML;
            static factory(element: JQuery, view: Backbone.View, filter?: (value: any) => string): Display;
            static map(selector: string): Mapping;
            static mapWithFilter(selector: string, filter: (value: any) => string): Mapping;
            public setValue(value: string): void;
            public getValue(): string;
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
            public getValue(): any;
            public getOwnValue(): any[];
            public setValue(value: any[]): void;
            public addListener(listener: ListItemListener): void;
        }
    }
}
declare module Backbone.Components {
    module Behaviours {
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
                private chainAndMaybeAbort(abort, packages);
                public chainAndAbortAfterFirstInvalid(...packages: Package[]): boolean;
                public chain(...packages: Package[]): boolean;
            }
        }
        class FeedbackModel extends Backbone.Model {
            constructor(options?: any);
            public clearFeedback(attribute: string): void;
            public addFeedback(field: string, message: string, level?: string): void;
            public getFeedback(field: string): Feedback[];
        }
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
}
declare module Backbone.Components.Behaviours.Validation {
    module Validators {
        class EmptyValidator extends Validation.BaseValidator {
            static MESSAGES: {
                OK: string;
                MUST_NOT_BE_EMPTY: string;
            };
            static pack(...attributes: any[]): any;
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
            static pack(minLength: number, maxLength: number, ...attributes: any[]): any;
            static factory(minLength: any, maxLength: any): LengthValidator;
            public validate(model: Backbone.Model, attribute: string): Validation.Result;
        }
    }
}
declare module Backbone.Components {
    module Controls {
        class Input extends Components.BaseComponent {
            public element: JQuery;
            static factory(element: JQuery, view: Backbone.View): Input;
            static map(selector: any, bindings?: Components.EventBinding[]): Components.Mapping;
            public setValue(value: any): void;
            public getOwnValue(): any;
            public getValue(): any;
        }
        class Checkbox extends Input {
            public element: JQuery;
            private value;
            public setValue(value: any): void;
            public getOwnValue(): any;
            public getValue(): any;
        }
        class Select extends Components.BaseComponent {
            public element: JQuery;
            public options: any;
            static factory(element: JQuery, view: Backbone.View): Select;
            private static loadOptions(model, component, optionsAttribute);
            static map(selector: any, bindings?: Components.EventBinding[]): Components.Mapping;
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
}

