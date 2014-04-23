/// <reference path='../backbone.d.ts' />
/// <reference path='../underscore.d.ts' />
declare module Backbone.Components {
    class BundleLoader {
        static load(bundle: any, callback: (bundle: any) => void): void;
    }
}
declare module Backbone {
    module Components {
        var mapToView: (view: View, mappings: Mapping[], verbose?: boolean) => {};
        class EventBinding {
            public model: Model;
            public event: string;
            public handler: (model: Model, component: BaseComponent) => void;
            constructor(model: Model, event: string, handler: (model: Model, component: BaseComponent) => void);
            public toString(): string;
        }
        class Mapping {
            public selector: string;
            public factory: (element: JQuery, view: View) => BaseComponent;
            public eventBindings: EventBinding[];
            public behaviours: any[];
            public description: string;
            constructor(selector: string, factory: (element: JQuery, view: View) => BaseComponent, eventBindings: EventBinding[], behaviours?: any[], description?: string);
            public toString(): string;
            public addBehaviour(behaviourFactory: (component: BaseComponent) => Behaviour): Mapping;
        }
        class Behaviour {
            public component: BaseComponent;
            constructor(component: BaseComponent);
        }
        class BaseComponent extends View {
            public view: View;
            public id: string;
            public attribute: string;
            public bidirectionalBinding: boolean;
            public behaviours: Behaviour[];
            public whenData: {
                event: string;
                model: Model;
            };
            public toString(): string;
            public getValue(): any;
            public getOwnValue(): any;
            public setValue(value: any): void;
            public when(event: string, model?: Model): BaseComponent;
            public then(handler: (model: Model, component: BaseComponent) => void): BaseComponent;
            public attachBinding(binding: EventBinding): BaseComponent;
            public bindModel(model: Model, attribute: string): void;
            public handleChange(value: any): void;
            public attachBehaviour(factory: (comp: BaseComponent) => Behaviour): void;
        }
        class Display extends BaseComponent {
            public filter: (value: any) => string;
            static makeComp(): Display;
            static factory(element: JQuery, view: View, filter?: (value: any) => string): Display;
            static componentFactory(componentClass: {
                makeComp: () => Display;
            }, element: JQuery, view: View, filter?: (value: any) => string): Display;
            public setValue(value: string): void;
            public getValue(): string;
            public getOwnValue(): string;
            static map(selector: string): Mapping;
            static mapWithFilter(selector: string, filter: (value: any) => string): Mapping;
        }
        class DisplayHTML extends Display {
            static makeComp(): DisplayHTML;
            static factory(element: JQuery, view: View, filter?: (value: any) => string): Display;
            static map(selector: string): Mapping;
            static mapWithFilter(selector: string, filter: (value: any) => string): Mapping;
            public setValue(value: string): void;
            public getValue(): string;
        }
        class ListItemListener {
            public event: string;
            public handler: (item: View, event: any) => void;
            public context: any;
            constructor(event: string, handler: (item: View, event: any) => void, context: any);
        }
        class List extends BaseComponent {
            private element;
            private viewClass;
            private itemListeners;
            public itemViews: any[];
            private ownValue;
            static factory(element: JQuery, view: View, viewClass: any, attribute?: string): List;
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
                public validate(model: Model, attribute: string): Result;
            }
            var pack: (factory: IValidatorFactory, ...attributes: string[]) => any;
            class Package {
                public attributes: string[];
                public validatorFactory: IValidatorFactory;
                constructor(attributes: string[], validatorFactory: IValidatorFactory);
                static make(factory: IValidatorFactory, ...attributes: string[]): Package;
            }
            class Validator {
                public model: Model;
                public feedbackModel: FeedbackModel;
                constructor(model: Model, feedbackModel: FeedbackModel);
                static create(model: Model, feedbackModel: FeedbackModel): Validator;
                private chainAndMaybeAbort(abort, packages);
                public chainAndAbortAfterFirstInvalid(...packages: Package[]): boolean;
                public chain(...packages: Package[]): boolean;
            }
        }
        class FeedbackModel extends Model {
            constructor(options?: any);
            public clearFeedback(attribute: string): void;
            public addFeedback(field: string, message: string, level?: string): void;
            public getFeedback(field: string): Feedback[];
        }
        class ComponentFeedback extends Behaviour {
            public component: BaseComponent;
            public feedbackModel: FeedbackModel;
            static FEEDBACK_CLASS: string;
            static FEEDBACK_TEXT_CLASS: string;
            private template;
            private feedbackElement;
            constructor(component: BaseComponent, feedbackModel: FeedbackModel);
            static getFactory(feedbackModel: FeedbackModel): (component: BaseComponent) => ComponentFeedback;
            private loadFeedback();
        }
        class ListItemEventHandler extends Behaviour {
            public component: List;
            constructor(component: List, event: string, callback: (data: any) => void);
            static getFactory(event: string, callback: (data: any) => void): (component: List) => ListItemEventHandler;
        }
    }
}
declare module Backbone.Components.Behaviours.Validation {
    module Validators {
        class EmptyValidator extends BaseValidator {
            static MESSAGES: {
                OK: string;
                MUST_NOT_BE_EMPTY: string;
            };
            static pack(...attributes: any[]): any;
            static factory(): EmptyValidator;
            public validate(model: Model, attribute: string): Result;
        }
        class LengthValidator extends BaseValidator {
            static MESSAGES: {
                OK: string;
                WRONG_LENGTH: string;
            };
            private minLength;
            private maxLength;
            static pack(minLength: number, maxLength: number, ...attributes: any[]): any;
            static factory(minLength: any, maxLength: any): LengthValidator;
            public validate(model: Model, attribute: string): Result;
        }
    }
}
declare module Backbone.Components {
    module Controls {
        class Input extends BaseComponent {
            public element: JQuery;
            static factory(element: JQuery, view: View): Input;
            static map(selector: any, bindings?: EventBinding[]): Mapping;
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
        class Select extends BaseComponent {
            public element: JQuery;
            public options: any;
            static factory(element: JQuery, view: View): Select;
            private static loadOptions(model, component, optionsAttribute);
            static map(selector: any, bindings?: EventBinding[]): Mapping;
            static mapWithOptionsFrom(selector: string, optionsAttribute: string, optionsModel: Model): Mapping;
            public getOwnValue(): any;
            public setValue(value: any): void;
            public getValue(): any;
        }
        module Behaviours {
            class TypeToChange extends Behaviour {
                constructor(component: Input);
                static factory(component: Input): TypeToChange;
            }
        }
    }
}

