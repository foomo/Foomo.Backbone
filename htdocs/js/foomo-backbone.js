var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Backbone;
(function (Backbone) {
    (function (Components) {
        Components.mapToView = function (view, mappings) {
            var comps = {};
            _.each(mappings, function (mapping) {
                view.$(mapping.selector).each(function (index, candidateEl) {
                    var comp = mapping.factory($(candidateEl), view);
                    if (typeof comp == 'object') {
                        if (comp.id) {
                            comps[comp.id] = comp;
                        }
                        if (comp.attribute) {
                            comp.bindModel(view.model, comp.attribute);
                        }
                        _.each(mapping.eventBindings, function (eventBinding) {
                            comp.attachBinding(eventBinding);
                        });
                        _.each(mapping.behaviours, function (behaviourFactory) {
                            comp.attachBehaviour(behaviourFactory);
                        });
                    }
                });
            });
            return comps;
        };

        var EventBinding = (function () {
            function EventBinding(model, event, handler) {
                this.model = model;
                this.event = event;
                this.handler = handler;
            }
            return EventBinding;
        })();
        Components.EventBinding = EventBinding;

        var Mapping = (function () {
            function Mapping(selector, factory, eventBindings, behaviours) {
                if (typeof behaviours === "undefined") { behaviours = []; }
                this.selector = selector;
                this.factory = factory;
                this.eventBindings = eventBindings;
                this.behaviours = behaviours;
            }
            Mapping.prototype.addBehaviour = function (behaviourFactory) {
                this.behaviours.push(behaviourFactory);
                return this;
            };
            return Mapping;
        })();
        Components.Mapping = Mapping;

        var Behaviour = (function () {
            function Behaviour(component) {
                this.component = component;
            }
            return Behaviour;
        })();
        Components.Behaviour = Behaviour;

        var BaseComponent = (function (_super) {
            __extends(BaseComponent, _super);
            function BaseComponent() {
                _super.apply(this, arguments);
                this.bidirectionalBinding = true;
                this.behaviours = [];
            }
            BaseComponent.prototype.getValue = function () {
                throw new Error('implement this');
            };
            BaseComponent.prototype.getOwnValue = function () {
                throw new Error('implement this');
            };

            BaseComponent.prototype.setValue = function (value) {
                throw new Error('implement this');
            };

            BaseComponent.prototype.when = function (event, model) {
                if (typeof model == 'undefined') {
                    model = this.view.model;
                }
                this.whenData = {
                    event: event,
                    model: model
                };
                return this;
            };

            BaseComponent.prototype.then = function (handler) {
                if (typeof this.whenData == 'object' && typeof this.whenData.event == 'string' && typeof this.whenData.model == 'object') {
                    this.attachBinding(new Backbone.Components.EventBinding(this.whenData.model, this.whenData.event, handler));
                } else {
                    throw new Error('you need to call when first');
                }
                return this;
            };

            BaseComponent.prototype.attachBinding = function (binding) {
                var _this = this;
                binding.model.on(binding.event, function (model) {
                    binding.handler(binding.model, _this);
                });
                return this;
            };

            BaseComponent.prototype.bindModel = function (model, attribute) {
                var _this = this;
                model.on('change:' + attribute, function (model) {
                    var modelValue = model.get(attribute);
                    if (_this.getOwnValue() != modelValue) {
                        _this.setValue(modelValue);
                    }
                });
            };

            BaseComponent.prototype.handleChange = function (value) {
                if (this.bidirectionalBinding && this.attribute) {
                    this.view.model.set(this.attribute, value);
                }
                this.trigger('change', this);
            };

            BaseComponent.prototype.attachBehaviour = function (factory) {
                var behaviour = factory(this);
                if (typeof behaviour == 'object') {
                    this.behaviours.push(behaviour);
                }
            };
            return BaseComponent;
        })(Backbone.View);
        Components.BaseComponent = BaseComponent;

        var Display = (function (_super) {
            __extends(Display, _super);
            function Display() {
                _super.apply(this, arguments);
                this.filter = function (value) {
                    return '' + value;
                };
            }
            Display.factory = function (element, view, filter) {
                var comp;
                var myInput = element;
                if (myInput.length == 1) {
                    comp = new Display();
                    comp.id = element.prop('id');
                    comp.attribute = element.attr('data-model-attr');
                    comp.view = view;
                    comp.setElement(element);
                    if (filter) {
                        comp.filter = filter;
                    }
                }
                return comp;
            };
            Display.prototype.setValue = function (value) {
                this.$el.text(this.filter(value));
            };
            Display.prototype.getValue = function () {
                return this.$el.text();
            };
            Display.prototype.getOwnValue = function () {
                return this.getValue();
            };
            Display.map = function (selector) {
                return new Mapping(selector, Display.factory, []);
            };
            Display.mapWithFilter = function (selector, filter) {
                return new Mapping(selector, function (element, view) {
                    return Display.factory(element, view, filter);
                }, []);
            };
            return Display;
        })(BaseComponent);
        Components.Display = Display;
        var ListItemListener = (function () {
            function ListItemListener(event, handler, context) {
                this.event = event;
                this.handler = handler;
                this.context = context;
            }
            return ListItemListener;
        })();
        Components.ListItemListener = ListItemListener;
        var List = (function (_super) {
            __extends(List, _super);
            function List() {
                _super.apply(this, arguments);
                this.itemListeners = [];
                this.itemViews = [];
            }
            List.factory = function (element, view, viewClass, attribute) {
                if (typeof attribute === "undefined") { attribute = ''; }
                var comp = new List();
                comp.view = view;
                comp.element = element;
                if (attribute.length > 0) {
                    comp.attribute = attribute;
                } else {
                    comp.attribute = comp.element.attr('data-model-attr');
                }
                comp.id = comp.element.prop('id');
                comp.viewClass = viewClass;
                return comp;
            };
            List.map = function (selector, viewClass, attribute) {
                if (typeof attribute === "undefined") { attribute = ''; }
                return new Mapping(selector, function (element, view) {
                    return List.factory(element, view, viewClass, attribute);
                }, []);
            };
            List.prototype.getValue = function () {
                return this.view.model.get(this.attribute);
            };

            List.prototype.getOwnValue = function () {
                return this.ownValue;
            };

            List.prototype.setValue = function (value) {
                this.ownValue = value;
                this.element.empty();
                var that = this;
                var index = 0;
                this.itemViews = [];
                _.each(value, function (item) {
                    if (typeof item != 'object') {
                        item = { value: item, index: index };
                    }
                    var model = new that.viewClass.model(item);
                    var listItem = new that.viewClass({ model: model });
                    that.itemViews.push(listItem);
                    that.element.append(listItem.$el);
                    _.each(that.itemListeners, function (listener) {
                        listItem.on(listener.event, listener.handler, listener.context);
                    });
                    index++;
                });
            };

            List.prototype.addListener = function (listener) {
                this.itemListeners.push(listener);
            };
            return List;
        })(BaseComponent);
        Components.List = List;
    })(Backbone.Components || (Backbone.Components = {}));
    var Components = Backbone.Components;
})(Backbone || (Backbone = {}));
var Backbone;
(function (Backbone) {
    (function (Components) {
        (function (Behaviours) {
            var Feedback = (function () {
                function Feedback(message, level) {
                    if (typeof message === "undefined") { message = ''; }
                    if (typeof level === "undefined") { level = ''; }
                    this.message = message;
                    this.level = level;
                }
                Feedback.getAllLevels = function () {
                    return [
                        Feedback.LEVEL_NONE,
                        Feedback.LEVEL_OK,
                        Feedback.LEVEL_INFO,
                        Feedback.LEVEL_WARNING,
                        Feedback.LEVEL_ERROR
                    ];
                };
                Feedback.getLevelMap = function () {
                    var levelMap = {};
                    _.each(Feedback.getAllLevels(), function (value, index) {
                        levelMap[value] = index;
                    });
                    return levelMap;
                };
                Feedback.LEVEL_NONE = 'feedback-none';
                Feedback.LEVEL_OK = 'feedback-ok';
                Feedback.LEVEL_INFO = 'feedback-info';
                Feedback.LEVEL_WARNING = 'feedback-warning';
                Feedback.LEVEL_ERROR = 'feedback-error';
                return Feedback;
            })();
            Behaviours.Feedback = Feedback;

            (function (Validation) {
                var Result = (function () {
                    function Result(valid, message, level) {
                        if (typeof valid === "undefined") { valid = true; }
                        if (typeof message === "undefined") { message = ''; }
                        if (typeof level === "undefined") { level = Behaviours.Feedback.LEVEL_OK; }
                        this.valid = valid;
                        this.message = message;
                        this.level = level;
                    }
                    return Result;
                })();
                Validation.Result = Result;
                var BaseValidator = (function () {
                    function BaseValidator() {
                    }
                    BaseValidator.prototype.validate = function (model, attribute) {
                        return new Result(false, 'implement me', Behaviours.Feedback.LEVEL_ERROR);
                    };
                    return BaseValidator;
                })();
                Validation.BaseValidator = BaseValidator;
                Validation.pack = function (factory) {
                    var attributes = [];
                    for (var _i = 0; _i < (arguments.length - 1); _i++) {
                        attributes[_i] = arguments[_i + 1];
                    }
                    return Package.make.apply(null, arguments);
                };
                var Package = (function () {
                    function Package(attributes, validatorFactory) {
                        this.attributes = attributes;
                        this.validatorFactory = validatorFactory;
                    }
                    Package.make = function (factory) {
                        var attributes = [];
                        for (var _i = 0; _i < (arguments.length - 1); _i++) {
                            attributes[_i] = arguments[_i + 1];
                        }
                        return new Package(attributes, factory);
                    };
                    return Package;
                })();
                Validation.Package = Package;
                var Validator = (function () {
                    function Validator(model, feedbackModel) {
                        this.model = model;
                        this.feedbackModel = feedbackModel;
                    }
                    Validator.create = function (model, feedbackModel) {
                        return new Validator(model, feedbackModel);
                    };
                    Validator.prototype.chain = function () {
                        var packages = [];
                        for (var _i = 0; _i < (arguments.length - 0); _i++) {
                            packages[_i] = arguments[_i + 0];
                        }
                        var _this = this;
                        var ret = true;
                        var feedbackAttributes = {};
                        _.each(packages, function (package) {
                            var validator = package.validatorFactory();
                            _.each(package.attributes, function (attribute) {
                                var result = validator.validate(_this.model, attribute);
                                if (!result.valid) {
                                    ret = false;
                                }
                                if (typeof feedbackAttributes[attribute] == 'undefined') {
                                    feedbackAttributes[attribute] = [];
                                }
                                feedbackAttributes[attribute].push(new Behaviours.Feedback(result.message, result.level));
                            });
                        });
                        this.feedbackModel.set(feedbackAttributes);
                        return ret;
                    };
                    return Validator;
                })();
                Validation.Validator = Validator;
            })(Behaviours.Validation || (Behaviours.Validation = {}));
            var Validation = Behaviours.Validation;

            var FeedbackModel = (function (_super) {
                __extends(FeedbackModel, _super);
                function FeedbackModel(options) {
                    if (typeof options === "undefined") { options = {}; }
                    _super.call(this, options);
                }
                FeedbackModel.prototype.clearFeedback = function (attribute) {
                    this.set(attribute, []);
                };
                FeedbackModel.prototype.addFeedback = function (field, message, level) {
                    if (typeof level === "undefined") { level = Feedback.LEVEL_NONE; }
                    var feedback = _.clone(this.get(field));
                    if (!feedback) {
                        feedback = [];
                    }
                    feedback.push(new Feedback(message, level));
                    this.set(field, feedback);
                };
                FeedbackModel.prototype.getFeedback = function (field) {
                    return this.get(field);
                };
                return FeedbackModel;
            })(Backbone.Model);
            Behaviours.FeedbackModel = FeedbackModel;

            var ComponentFeedback = (function (_super) {
                __extends(ComponentFeedback, _super);
                function ComponentFeedback(component, feedbackModel) {
                    _super.call(this, component);
                    this.component = component;
                    this.feedbackModel = feedbackModel;
                    this.feedbackElement = this.component.$('.' + ComponentFeedback.FEEDBACK_CLASS);
                    if (this.component.attribute && this.feedbackElement) {
                        if (this.feedbackElement.children().length == 1) {
                            var firstChild = $(this.feedbackElement.children()[0]);
                            this.template = $.trim(this.feedbackElement.html());
                            this.feedbackElement.empty();
                        } else {
                            var tagName = 'div';
                            switch (this.feedbackElement.prop('tagName')) {
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
                ComponentFeedback.getFactory = function (feedbackModel) {
                    return function (component) {
                        try  {
                            var behaviour = new ComponentFeedback(component, feedbackModel);
                            return behaviour;
                        } catch (error) {
                            console.log(error, error.toString());
                            console.log('skipping this one');
                        }
                    };
                };
                ComponentFeedback.prototype.loadFeedback = function () {
                    var _this = this;
                    var feedback = this.feedbackModel.getFeedback(this.component.attribute);
                    if (typeof feedback == "object") {
                        this.feedbackElement.empty();
                        var worstLevel = -1;
                        var worstClass;
                        var allLevels = Feedback.getAllLevels();
                        var allLevelClasses = allLevels.join(" ");
                        var levelMap = Feedback.getLevelMap();
                        _.each(feedback, function (entry) {
                            if (levelMap[entry.level] > worstLevel) {
                                worstLevel = levelMap[entry.level];
                                worstClass = entry.level;
                            }
                            var feedbackElement = $(_this.template).removeClass(allLevelClasses).addClass(entry.level);
                            if (feedbackElement.children().length == 0) {
                                feedbackElement.text(entry.message);
                            } else {
                                feedbackElement.find('.' + ComponentFeedback.FEEDBACK_TEXT_CLASS).text(entry.message);
                            }
                            _this.feedbackElement.append(feedbackElement);
                        });
                        this.component.$el.removeClass(allLevelClasses);
                        if (worstLevel > -1) {
                            this.component.$el.addClass(worstClass);
                        }
                    }
                };
                ComponentFeedback.FEEDBACK_CLASS = 'feedback';
                ComponentFeedback.FEEDBACK_TEXT_CLASS = 'feedback-text';
                return ComponentFeedback;
            })(Backbone.Components.Behaviour);
            Behaviours.ComponentFeedback = ComponentFeedback;

            var ListItemEventHandler = (function (_super) {
                __extends(ListItemEventHandler, _super);
                function ListItemEventHandler(component, event, callback) {
                    _super.call(this, component);
                    var listItemListener = new Components.ListItemListener(event, callback, this.component);
                    this.component.addListener(listItemListener);
                }
                ListItemEventHandler.getFactory = function (event, callback) {
                    return function (component) {
                        return new ListItemEventHandler(component, event, callback);
                    };
                };
                return ListItemEventHandler;
            })(Backbone.Components.Behaviour);
            Behaviours.ListItemEventHandler = ListItemEventHandler;
        })(Components.Behaviours || (Components.Behaviours = {}));
        var Behaviours = Components.Behaviours;
    })(Backbone.Components || (Backbone.Components = {}));
    var Components = Backbone.Components;
})(Backbone || (Backbone = {}));
var Backbone;
(function (Backbone) {
    (function (Components) {
        (function (Controls) {
            var Input = (function (_super) {
                __extends(Input, _super);
                function Input() {
                    _super.apply(this, arguments);
                }
                Input.factory = function (element, view) {
                    var comp;
                    var myInput;
                    if (element.prop('tagName') == 'INPUT') {
                        myInput = element;
                    } else {
                        myInput = element.find('input');
                    }
                    if (myInput.length == 1) {
                        switch (myInput.prop('type')) {
                            case 'checkbox':
                                comp = new Checkbox();
                                break;
                            case 'radio':

                            default:
                                comp = new Input();
                        }
                        comp.element = myInput;
                        comp.attribute = comp.element.prop('name');
                        comp.id = element.prop('id');
                        comp.view = view;
                        comp.setElement(element);
                        comp.element.on('change', function (event) {
                            comp.handleChange(comp.getValue());
                        });
                    }
                    return comp;
                };
                Input.map = function (selector, bindings) {
                    if (typeof bindings === "undefined") { bindings = []; }
                    return new Components.Mapping(selector, Input.factory, bindings);
                };
                Input.prototype.setValue = function (value) {
                    this.element.val(value);
                };
                Input.prototype.getOwnValue = function () {
                    return this.getValue();
                };
                Input.prototype.getValue = function () {
                    return this.element.val();
                };
                return Input;
            })(Backbone.Components.BaseComponent);
            Controls.Input = Input;

            var Checkbox = (function (_super) {
                __extends(Checkbox, _super);
                function Checkbox() {
                    _super.apply(this, arguments);
                }
                Checkbox.prototype.setValue = function (value) {
                    this.value = value;
                    if (typeof this.value == 'object') {
                        this.element.val(this.value.value);
                        this.element.prop('checked', this.value.checked);
                    } else {
                        this.element.prop('checked', this.value);
                    }
                };
                Checkbox.prototype.getOwnValue = function () {
                    return this.getValue();
                };
                Checkbox.prototype.getValue = function () {
                    if (typeof this.value == 'object') {
                        this.value = {
                            value: this.element.val(),
                            checked: this.element.prop('checked')
                        };
                    } else {
                        this.value = this.element.prop('checked');
                    }
                    return this.value;
                };
                return Checkbox;
            })(Input);
            Controls.Checkbox = Checkbox;

            var Select = (function (_super) {
                __extends(Select, _super);
                function Select() {
                    _super.apply(this, arguments);
                    this.options = {};
                }
                Select.factory = function (element, view) {
                    var comp;
                    var selectElement = element.find('select');
                    if (selectElement.length == 1) {
                        comp = new Select();
                        comp.element = selectElement;
                        comp.attribute = comp.element.prop('name');
                        comp.id = element.prop('id');
                        comp.view = view;
                        comp.setElement(element);
                        comp.element.on('change', function () {
                            comp.handleChange(comp.getValue());
                        });
                    }
                    return comp;
                };
                Select.loadOptions = function (model, component, optionsAttribute) {
                    component.element.find('option').remove();
                    _.each(model.get(optionsAttribute), function (option) {
                        component.element.append($('<option></option>').val(option.value).text(option.label));
                    });
                };

                Select.map = function (selector, bindings) {
                    if (typeof bindings === "undefined") { bindings = []; }
                    return new Components.Mapping(selector, Select.factory, bindings);
                };

                Select.mapWithOptionsFrom = function (selector, optionsAttribute, optionsModel) {
                    return new Components.Mapping(selector, Select.factory, [
                        new Backbone.Components.EventBinding(optionsModel, 'change:' + optionsAttribute, function (model, component) {
                            var oldValue = component.getValue();
                            Select.loadOptions(model, component, optionsAttribute);
                            component.setValue(oldValue);
                        })
                    ]);
                };
                Select.prototype.getOwnValue = function () {
                    return this.getValue();
                };

                Select.prototype.setValue = function (value) {
                    this.element.val(value);
                };
                Select.prototype.getValue = function () {
                    return this.element.val();
                };
                return Select;
            })(Backbone.Components.BaseComponent);
            Controls.Select = Select;
            (function (Behaviours) {
                var Controls = Backbone.Components.Controls;
                var TypeToChange = (function (_super) {
                    __extends(TypeToChange, _super);
                    function TypeToChange(component) {
                        _super.call(this, component);
                        var compType = component.element.prop('type');
                        if (component.element && component.element.prop('tagName') == 'INPUT' && (compType == 'text' || compType == 'password')) {
                            component.element.keyup(function (event) {
                                component.handleChange(component.getValue());
                            });
                        } else {
                            throw new Error('can not attach to');
                        }
                    }
                    TypeToChange.factory = function (component) {
                        try  {
                            var behaviour = new TypeToChange(component);
                            return behaviour;
                        } catch (error) {
                            console.warn('no type to change for this one', component);
                        }
                    };
                    return TypeToChange;
                })(Backbone.Components.Behaviour);
                Behaviours.TypeToChange = TypeToChange;
            })(Controls.Behaviours || (Controls.Behaviours = {}));
            var Behaviours = Controls.Behaviours;
        })(Components.Controls || (Components.Controls = {}));
        var Controls = Components.Controls;
    })(Backbone.Components || (Backbone.Components = {}));
    var Components = Backbone.Components;
})(Backbone || (Backbone = {}));
var Backbone;
(function (Backbone) {
    (function (Components) {
        (function (Behaviours) {
            (function (Validation) {
                (function (Validators) {
                    var EmptyValidator = (function (_super) {
                        __extends(EmptyValidator, _super);
                        function EmptyValidator() {
                            _super.apply(this, arguments);
                        }
                        EmptyValidator.pack = function () {
                            var attributes = [];
                            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                                attributes[_i] = arguments[_i + 0];
                            }
                            attributes.unshift(EmptyValidator.factory);
                            return Components.Behaviours.Validation.pack.apply(null, attributes);
                        };
                        EmptyValidator.factory = function () {
                            return new EmptyValidator();
                        };
                        EmptyValidator.prototype.validate = function (model, attribute) {
                            var value = model.get(attribute);
                            var valid = typeof value == 'string' && value.length > 0;
                            return new Behaviours.Validation.Result(valid, valid ? EmptyValidator.MESSAGES.OK : EmptyValidator.MESSAGES.MUST_NOT_BE_EMPTY, valid ? Components.Behaviours.Feedback.LEVEL_OK : Components.Behaviours.Feedback.LEVEL_ERROR);
                        };
                        EmptyValidator.MESSAGES = {
                            OK: 'ok',
                            MUST_NOT_BE_EMPTY: 'must not be empty'
                        };
                        return EmptyValidator;
                    })(Behaviours.Validation.BaseValidator);
                    Validators.EmptyValidator = EmptyValidator;

                    var LengthValidator = (function (_super) {
                        __extends(LengthValidator, _super);
                        function LengthValidator() {
                            _super.apply(this, arguments);
                        }
                        LengthValidator.pack = function (minLength, maxLength) {
                            var attributes = [];
                            for (var _i = 0; _i < (arguments.length - 2); _i++) {
                                attributes[_i] = arguments[_i + 2];
                            }
                            attributes.unshift(function () {
                                return LengthValidator.factory(minLength, maxLength);
                            });
                            return Components.Behaviours.Validation.pack.apply(null, attributes);
                        };
                        LengthValidator.factory = function (minLength, maxLength) {
                            var validator = new LengthValidator();
                            validator.minLength = minLength;
                            validator.maxLength = maxLength;
                            return validator;
                        };
                        LengthValidator.prototype.validate = function (model, attribute) {
                            var value = model.get(attribute);
                            var valid = value && value.length >= this.minLength && value.length <= this.maxLength;
                            return new Components.Behaviours.Validation.Result(valid, valid ? LengthValidator.MESSAGES.OK : LengthValidator.MESSAGES.WRONG_LENGTH, valid ? Components.Behaviours.Feedback.LEVEL_INFO : Components.Behaviours.Feedback.LEVEL_ERROR);
                        };
                        LengthValidator.MESSAGES = {
                            OK: 'ok',
                            WRONG_LENGTH: 'wrong length'
                        };
                        return LengthValidator;
                    })(Behaviours.Validation.BaseValidator);
                    Validators.LengthValidator = LengthValidator;
                })(Validation.Validators || (Validation.Validators = {}));
                var Validators = Validation.Validators;
            })(Behaviours.Validation || (Behaviours.Validation = {}));
            var Validation = Behaviours.Validation;
        })(Components.Behaviours || (Components.Behaviours = {}));
        var Behaviours = Components.Behaviours;
    })(Backbone.Components || (Backbone.Components = {}));
    var Components = Backbone.Components;
})(Backbone || (Backbone = {}));
//# sourceMappingURL=/foomo/modules/Foomo.Backbone/js/foomo-backbone.js.map