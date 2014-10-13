/// <reference path='../backbone.d.ts' />
/// <reference path='../underscore.d.ts' />
declare module Backbone.Components {
    class BundleLoader {
        private static sanitizePathname(pathname);
        static load(bundle: any, callback: (bundle: any) => void): void;
    }
}
declare module Backbone {
    module Components {
        var mapToView: (view: View<Model>, mappings: Mapping[], verbose?: boolean) => {};
        class EventBinding {
            model: Model;
            event: string;
            handler: (model: Model, component: BaseComponent) => void;
            constructor(model: Model, event: string, handler: (model: Model, component: BaseComponent) => void);
            toString(): string;
        }
        class Mapping {
            selector: string;
            factory: (element: JQuery, view: View<Model>) => BaseComponent;
            eventBindings: EventBinding[];
            behaviours: any[];
            description: string;
            constructor(selector: string, factory: (element: JQuery, view: View<Model>) => BaseComponent, eventBindings: EventBinding[], behaviours?: any[], description?: string);
            toString(): string;
            addBehaviour(behaviourFactory: (component: BaseComponent) => Behaviour): Mapping;
        }
        class Behaviour {
            component: BaseComponent;
            constructor(component: BaseComponent);
        }
        class BaseComponent extends View<Model> {
            view: View<Model>;
            id: string;
            attribute: string;
            bidirectionalBinding: boolean;
            behaviours: Behaviour[];
            whenData: {
                event: string;
                model: Model;
            };
            toString(): string;
            getValue(): any;
            getOwnValue(): any;
            setValue(value: any): void;
            when(event: string, model?: Model): BaseComponent;
            then(handler: (model: Model, component: BaseComponent) => void): BaseComponent;
            attachBinding(binding: EventBinding): BaseComponent;
            bindModel(model: Model, attribute: string): void;
            handleChange(value: any): void;
            attachBehaviour(factory: (comp: BaseComponent) => Behaviour): void;
        }
        class Display extends BaseComponent {
            filter: (value: any) => string;
            static makeComp(): Display;
            static factory(element: JQuery, view: View<Model>, filter?: (value: any) => string): Display;
            static componentFactory(componentClass: {
                makeComp: () => Display;
            }, element: JQuery, view: View<Model>, filter?: (value: any) => string): Display;
            setValue(value: string): void;
            getValue(): string;
            getOwnValue(): string;
            static map(selector: string): Mapping;
            static mapWithFilter(selector: string, filter: (value: any) => string): Mapping;
        }
        class DisplayHTML extends Display {
            static makeComp(): DisplayHTML;
            static factory(element: JQuery, view: View<Model>, filter?: (value: any) => string): Display;
            static map(selector: string): Mapping;
            static mapWithFilter(selector: string, filter: (value: any) => string): Mapping;
            setValue(value: string): void;
            getValue(): string;
        }
        class ListItemListener {
            event: string;
            handler: (item: View<Model>, event: any) => void;
            context: any;
            constructor(event: string, handler: (item: View<Model>, event: any) => void, context: any);
        }
        class List extends BaseComponent {
            private element;
            private viewClass;
            private itemListeners;
            itemViews: any[];
            private ownValue;
            static factory(element: JQuery, view: View<Model>, viewClass: any, attribute?: string): List;
            static map(selector: string, viewClass: any, attribute?: string): Mapping;
            getValue(): any;
            getOwnValue(): any[];
            setValue(value: any[]): void;
            addListener(listener: ListItemListener): void;
        }
    }
}
declare module Backbone.Components {
    module Behaviours {
        class Feedback {
            message: string;
            level: string;
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
                valid: boolean;
                message: string;
                level: string;
                constructor(valid?: boolean, message?: string, level?: string);
            }
            class BaseValidator {
                validate(model: Model, attribute: string): Result;
            }
            var pack: (factory: IValidatorFactory, ...attributes: string[]) => any;
            class Package {
                attributes: string[];
                validatorFactory: IValidatorFactory;
                constructor(attributes: string[], validatorFactory: IValidatorFactory);
                static make(factory: IValidatorFactory, ...attributes: string[]): Package;
            }
            class Validator {
                model: Model;
                feedbackModel: FeedbackModel;
                constructor(model: Model, feedbackModel: FeedbackModel);
                static create(model: Model, feedbackModel: FeedbackModel): Validator;
                private chainAndMaybeAbort(abort, packages);
                chainAndAbortAfterFirstInvalid(...packages: Package[]): boolean;
                chain(...packages: Package[]): boolean;
            }
        }
        class FeedbackModel extends Model {
            constructor(options?: any);
            clearFeedback(attribute: string): void;
            addFeedback(field: string, message: string, level?: string): void;
            getFeedback(field: string): Feedback[];
        }
        class ComponentFeedback extends Behaviour {
            component: BaseComponent;
            feedbackModel: FeedbackModel;
            static FEEDBACK_CLASS: string;
            static FEEDBACK_TEXT_CLASS: string;
            private template;
            private feedbackElement;
            constructor(component: BaseComponent, feedbackModel: FeedbackModel);
            static getFactory(feedbackModel: FeedbackModel): (component: BaseComponent) => ComponentFeedback;
            private loadFeedback();
        }
        class ListItemEventHandler extends Behaviour {
            component: List;
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
            validate(model: Model, attribute: string): Result;
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
            validate(model: Model, attribute: string): Result;
        }
    }
}
declare module Backbone.Components {
    module Controls {
        class Input extends BaseComponent {
            element: JQuery;
            static factory(element: JQuery, view: View<Model>): Input;
            static map(selector: any, bindings?: EventBinding[]): Mapping;
            setValue(value: any): void;
            getOwnValue(): any;
            getValue(): any;
        }
        class Checkbox extends Input {
            element: JQuery;
            private value;
            setValue(value: any): void;
            getOwnValue(): any;
            getValue(): any;
        }
        class Select extends BaseComponent {
            element: JQuery;
            options: any;
            static factory(element: JQuery, view: View<Model>): Select;
            private static loadOptions(model, component, optionsAttribute);
            static map(selector: any, bindings?: EventBinding[]): Mapping;
            static mapWithOptionsFrom(selector: string, optionsAttribute: string, optionsModel: Model): Mapping;
            getOwnValue(): any;
            setValue(value: any): void;
            getValue(): any;
        }
        module Behaviours {
            import Controls = Backbone.Components.Controls;
            class TypeToChange extends Behaviour {
                constructor(component: Controls.Input);
                static factory(component: Controls.Input): TypeToChange;
            }
        }
    }
}

